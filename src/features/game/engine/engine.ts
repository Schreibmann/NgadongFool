import {
  EngineCard,
  EnginePlayer,
  Foul,
  GameState,
  Listener,
  Phase,
  SeatConfig,
} from "./types";
import {
  cardsEqual,
  createDeck36,
  createRng,
  shuffleDeck,
} from "./deck";
import {
  activePlayers,
  firstClockwiseWhere,
  nextClockwiseId,
} from "./seats";
import {
  canBeat,
  canPlaceOnTop,
  firstLegalPrepareTarget,
  topOf,
  trumpFromLastDeckCard,
} from "./rules";

export interface StartOptions {
  seats: SeatConfig[];
  /** Previous watchman becomes dealer; omit to pick randomly. */
  watchmanId?: number | null;
  seed?: number;
}

function cloneCard(card: EngineCard): EngineCard {
  return { rank: card.rank, suit: card.suit };
}

function findPlayer(state: GameState, id: number): EnginePlayer {
  const p = state.players.find((x) => x.id === id);
  if (!p) {
    throw new Error(`player ${id} not found`);
  }
  return p;
}

export class GameEngine {
  private state: GameState;
  private listeners = new Set<Listener>();
  private rng: () => number;

  constructor(options: StartOptions) {
    if (options.seats.length < 2) {
      throw new Error("need at least 2 players");
    }
    this.rng =
      options.seed !== undefined
        ? createRng(options.seed)
        : Math.random;
    this.state = this.buildInitial(options);
    this.deal();
  }

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = (): GameState => this.state;

  private emit(): void {
    const frozen = this.state;
    this.state = {
      ...frozen,
      players: frozen.players.map((p) => ({
        ...p,
        hand: [...p.hand],
        stumps: [...p.stumps],
      })),
      deck: [...frozen.deck],
      current: [...frozen.current],
      beaten: [...frozen.beaten],
      watchmanAskCounts: { ...frozen.watchmanAskCounts },
    };
    this.listeners.forEach((l) => l());
  }

  private buildInitial(options: StartOptions): GameState {
    const players: EnginePlayer[] = options.seats.map((s) => ({
      id: s.id,
      name: s.name,
      isCPU: s.isCPU,
      hand: [] as EngineCard[],
      stumps: [] as EngineCard[],
      huyovye: 0,
      active: true,
      stumpsRevealed: false,
    }));

    let dealerId: number;
    let watchmanId: number | null =
      options.watchmanId === undefined ? null : options.watchmanId;

    if (watchmanId != null && players.some((p) => p.id === watchmanId)) {
      dealerId = watchmanId;
    } else {
      const idx = Math.floor(this.rng() * players.length);
      dealerId = players[idx].id;
      watchmanId = dealerId;
    }

    return {
      phase: Phase.Deal,
      deck: [],
      players,
      dealerId,
      watchmanId,
      activePlayerId: dealerId,
      trump: null,
      current: [],
      beaten: [],
      discardPendingFlip: false,
      lastPlayedById: null,
      tookLastDeckCardId: null,
      prepareHeld: null,
      roundJustEnded: false,
      watchmanAskCounts: {},
      lastFoul: null,
      message: null,
      initialPlayerCount: players.length,
    };
  }

  /** Full deal: 2 stumps + 1 face-up each, starting clockwise after dealer. */
  private deal(): void {
    let deck = shuffleDeck(createDeck36(), this.rng);
    const orderIds: number[] = [];
    let cursor = this.state.dealerId;
    for (let i = 0; i < this.state.players.length; i++) {
      cursor = nextClockwiseId(this.state.players, cursor, {
        activeOnly: false,
      });
      orderIds.push(cursor);
    }

    const players = this.state.players.map((p) => ({
      ...p,
      hand: [] as EngineCard[],
      stumps: [] as EngineCard[],
    }));

    const take = (): EngineCard => {
      const card = deck[0];
      deck = deck.slice(1);
      return card;
    };

    for (const id of orderIds) {
      const p = players.find((x) => x.id === id);
      if (!p) continue;
      p.stumps.push(take(), take());
    }
    for (const id of orderIds) {
      const p = players.find((x) => x.id === id);
      if (!p) continue;
      p.hand.push(take());
    }

    const firstActive = nextClockwiseId(players, this.state.dealerId);

    this.state = {
      ...this.state,
      phase: Phase.Prepare,
      deck,
      players,
      activePlayerId: firstActive,
      prepareHeld: null,
      message: "Раздача завершена. Набор.",
    };
    this.emit();
  }

  private awardFoul(playerId: number, foul: Foul): void {
    const players = this.state.players.map((p) =>
      p.id === playerId ? { ...p, huyovye: p.huyovye + 1 } : p,
    );
    this.state = {
      ...this.state,
      players,
      lastFoul: { playerId, foul },
      message: `Хуёвая: ${foul}`,
    };
  }

  // ——— Prepare ———

  /** Cascade: repeatedly dump own top onto first-clockwise legal lower tops. */
  cascadeOwnTops(playerId: number): number {
    this.assertActive(playerId);
    let moves = 0;
    let guard = 64;
    while (guard-- > 0) {
      const self = findPlayer(this.state, playerId);
      const top = topOf(self);
      if (!top || self.hand.length <= 1) {
        break;
      }
      const target = firstLegalPrepareTarget(
        this.state.players,
        playerId,
        top,
      );
      if (!target || target.id === playerId) {
        // placing on self doesn't reduce "cascade to others"; allow self only if others none
        if (target && target.id === playerId && self.hand.length > 1) {
          this.placePrepareCard(playerId, playerId, top, true);
          moves++;
          continue;
        }
        break;
      }
      this.placePrepareCard(playerId, target.id, top, true);
      moves++;
    }
    this.emit();
    return moves;
  }

  /** Draw top of deck into prepareHeld (or take last card → trump + huyovye). */
  drawPrepare(playerId: number): boolean {
    if (this.state.phase !== Phase.Prepare) return false;
    if (!this.requireTurn(playerId)) return false;

    if (this.state.prepareHeld) {
      this.awardFoul(playerId, Foul.DrewTwoAndSawSecond);
      this.emit();
      return false;
    }

    this.cascadeOwnTops(playerId);

    if (this.state.deck.length === 0) {
      this.enterHuyovye();
      return true;
    }

    if (this.state.deck.length === 1) {
      this.takeLastDeckCard(playerId);
      return true;
    }

    const [card, ...rest] = this.state.deck;
    this.state = {
      ...this.state,
      deck: rest,
      prepareHeld: card,
      message: `${findPlayer(this.state, playerId).name} тянет`,
    };
    this.emit();
    return true;
  }

  private takeLastDeckCard(playerId: number): void {
    const [card] = this.state.deck;
    const trump = trumpFromLastDeckCard(card);
    const players = this.state.players.map((p) => {
      if (p.id !== playerId) return p;
      return { ...p, hand: [cloneCard(card), ...p.hand] };
    });
    this.state = {
      ...this.state,
      deck: [],
      players,
      trump,
      prepareHeld: null,
      tookLastDeckCardId: playerId,
      message:
        trump === null
          ? "Последняя — пика. Бескозырка."
          : `Козырь: ${trump}`,
    };
    this.enterHuyovye();
  }

  /**
   * Place held (or specified hand top) onto target.
   * `fromCascade` skips held-card requirement.
   */
  placePrepare(
    playerId: number,
    targetId: number,
    card?: EngineCard,
  ): boolean {
    if (this.state.phase !== Phase.Prepare) return false;
    if (!this.requireTurn(playerId)) return false;

    if (this.state.deck.length === 1 && this.state.prepareHeld === null) {
      this.awardFoul(playerId, Foul.PlacedLastDeckCard);
      this.takeLastDeckCard(playerId);
      return false;
    }

    const held = card ?? this.state.prepareHeld;
    if (!held) {
      return false;
    }

    const usingHeld =
      this.state.prepareHeld !== null &&
      (card === undefined || cardsEqual(card, this.state.prepareHeld));
    const fromHand = !usingHeld;

    const self = findPlayer(this.state, playerId);
    if (fromHand && self.hand.length <= 1) {
      this.awardFoul(playerId, Foul.GaveAwayLastPrepare);
      this.emit();
      return false;
    }

    const first = firstLegalPrepareTarget(
      this.state.players,
      playerId,
      held,
    );
    if (!first) {
      return false;
    }
    if (first.id !== targetId) {
      this.awardFoul(playerId, Foul.DumpedNotFirstClockwise);
      this.emit();
      return false;
    }
    if (!canPlaceOnTop(topOf(findPlayer(this.state, targetId)), held)) {
      return false;
    }

    this.placePrepareCard(playerId, targetId, held, fromHand);
    if (usingHeld) {
      this.state = { ...this.state, prepareHeld: null };
    }
    this.emit();
    return true;
  }

  /** Keep held card into own hand and pass turn. */
  keepPrepare(playerId: number): boolean {
    if (this.state.phase !== Phase.Prepare) return false;
    if (!this.requireTurn(playerId)) return false;
    const held = this.state.prepareHeld;
    if (!held) {
      return false;
    }
    const first = firstLegalPrepareTarget(
      this.state.players,
      playerId,
      held,
    );
    if (first) {
      this.awardFoul(playerId, Foul.FailedToDumpLegal);
    }
    const players = this.state.players.map((p) =>
      p.id === playerId
        ? { ...p, hand: [cloneCard(held), ...p.hand] }
        : p,
    );
    this.state = {
      ...this.state,
      players,
      prepareHeld: null,
      activePlayerId: nextClockwiseId(players, playerId),
      message: `${findPlayer(this.state, playerId).name} забирает`,
    };
    this.emit();
    return true;
  }

  private placePrepareCard(
    fromId: number,
    toId: number,
    card: EngineCard,
    fromHand: boolean,
  ): void {
    const players = this.state.players.map((p) => ({
      ...p,
      hand: [...p.hand],
      stumps: [...p.stumps],
    }));
    const from = players.find((p) => p.id === fromId);
    const to = players.find((p) => p.id === toId);
    if (!from || !to) return;

    if (fromHand) {
      const idx = from.hand.findIndex((c) => cardsEqual(c, card));
      if (idx < 0) return;
      from.hand.splice(idx, 1);
    }
    to.hand.unshift(cloneCard(card));
    this.state = { ...this.state, players };
  }

  // ——— Huyovye ———

  private enterHuyovye(): void {
    this.state = {
      ...this.state,
      phase: Phase.Huyovye,
      prepareHeld: null,
      message: "Фаза хуёвых",
    };
    this.emit();
    this.resolveHuyovyeDeals();
  }

  /**
   * For each huyovye point on a player, every other active player who can
   * (hand.length > 1) gives one card (AI: highest rank non-essential).
   */
  private resolveHuyovyeDeals(): void {
    const players = this.state.players.map((p) => ({
      ...p,
      hand: [...p.hand],
    }));

    for (const receiver of [...players]) {
      if (!receiver.active || receiver.huyovye <= 0) continue;
      let remaining = receiver.huyovye;
      while (remaining > 0) {
        let given = false;
        for (const giver of players) {
          if (!giver.active || giver.id === receiver.id) continue;
          if (giver.hand.length <= 1) continue;
          const card = this.pickBadCard(giver);
          if (!card) continue;
          const idx = giver.hand.findIndex((c) => cardsEqual(c, card));
          if (idx < 0) continue;
          giver.hand.splice(idx, 1);
          const recv = players.find((p) => p.id === receiver.id);
          if (recv) recv.hand.push(cloneCard(card));
          given = true;
        }
        if (!given) break;
        remaining--;
      }
      const recv = players.find((p) => p.id === receiver.id);
      if (recv) recv.huyovye = 0;
    }

    const leadFrom =
      this.state.tookLastDeckCardId ?? this.state.dealerId;
    const next = nextClockwiseId(players, leadFrom);

    this.state = {
      ...this.state,
      players,
      phase: Phase.Main,
      activePlayerId: next,
      current: [],
      discardPendingFlip: false,
      roundJustEnded: false,
      message: "Основная игра",
    };
    this.emit();
  }

  private pickBadCard(giver: EnginePlayer): EngineCard | null {
    if (giver.hand.length <= 1) return null;
    const sorted = [...giver.hand].sort((a, b) => b.rank - a.rank);
    return sorted[0] ?? null;
  }

  giveHuyovyeCard(
    giverId: number,
    receiverId: number,
    card: EngineCard,
  ): boolean {
    if (this.state.phase !== Phase.Huyovye) return false;
    const giver = findPlayer(this.state, giverId);
    const receiver = findPlayer(this.state, receiverId);
    if (giver.hand.length <= 1) {
      this.awardFoul(giverId, Foul.GaveAwayLastPrepare);
      this.emit();
      return false;
    }
    if (receiver.huyovye <= 0) return false;
    const idx = giver.hand.findIndex((c) => cardsEqual(c, card));
    if (idx < 0) return false;

    const players = this.state.players.map((p) => {
      if (p.id === giverId) {
        return {
          ...p,
          hand: p.hand.filter((_, i) => i !== idx),
        };
      }
      if (p.id === receiverId) {
        return {
          ...p,
          hand: [...p.hand, cloneCard(card)],
          huyovye: Math.max(0, p.huyovye - 1),
        };
      }
      return p;
    });
    this.state = { ...this.state, players };
    this.emit();
    return true;
  }

  // ——— Main ———

  playMain(playerId: number, card: EngineCard): boolean {
    if (this.state.phase !== Phase.Main) return false;
    if (this.state.discardPendingFlip) {
      return false;
    }
    if (this.state.activePlayerId !== playerId) {
      this.awardFoul(playerId, Foul.PlayedOutOfTurn);
      this.state = {
        ...this.state,
        activePlayerId: nextClockwiseId(
          this.state.players,
          playerId,
        ),
      };
      this.emit();
      return false;
    }

    const self = findPlayer(this.state, playerId);
    const idx = self.hand.findIndex((c) => cardsEqual(c, card));
    if (idx < 0) return false;

    const activeCount = activePlayers(this.state.players).length;

    if (this.state.current.length === 0) {
      return this.applyMainPlay(playerId, idx, card, activeCount);
    }

    const target = this.state.current[this.state.current.length - 1];
    if (!canBeat(target, card, this.state.trump)) {
      this.awardFoul(playerId, Foul.IllegalBeat);
      this.state = {
        ...this.state,
        activePlayerId: nextClockwiseId(
          this.state.players,
          playerId,
        ),
      };
      this.emit();
      return false;
    }

    if (this.state.current.length >= activeCount) {
      this.awardFoul(playerId, Foul.ExtraCardPastN);
      this.state = {
        ...this.state,
        activePlayerId: nextClockwiseId(
          this.state.players,
          playerId,
        ),
      };
      this.emit();
      return false;
    }

    return this.applyMainPlay(playerId, idx, card, activeCount);
  }

  private applyMainPlay(
    playerId: number,
    cardIndex: number,
    card: EngineCard,
    activeCount: number,
  ): boolean {
    const players = this.state.players.map((p) => {
      if (p.id !== playerId) return p;
      return {
        ...p,
        hand: p.hand.filter((_, i) => i !== cardIndex),
      };
    });
    const current = [...this.state.current, cloneCard(card)];
    const pending = current.length === activeCount;

    this.state = {
      ...this.state,
      players,
      current,
      lastPlayedById: playerId,
      discardPendingFlip: pending,
      roundJustEnded: false,
      activePlayerId: pending
        ? playerId
        : nextClockwiseId(players, playerId),
      message: pending
        ? "Отбой — переверни"
        : `${findPlayer(this.state, playerId).name} ходит`,
    };
    this.emit();
    return true;
  }

  /** Take bottom of current pile. */
  takeBottom(playerId: number): boolean {
    if (this.state.phase !== Phase.Main) return false;
    if (!this.requireTurn(playerId)) return false;
    if (this.state.discardPendingFlip || this.state.current.length === 0) {
      return false;
    }
    const [bottom, ...rest] = this.state.current;
    const players = this.state.players.map((p) =>
      p.id === playerId
        ? { ...p, hand: [cloneCard(bottom), ...p.hand] }
        : p,
    );
    this.state = {
      ...this.state,
      players,
      current: rest,
      activePlayerId: nextClockwiseId(players, playerId),
      message: `${findPlayer(this.state, playerId).name} берёт`,
    };
    this.emit();
    return true;
  }

  flipDiscard(playerId: number): boolean {
    if (this.state.phase !== Phase.Main) return false;
    if (!this.state.discardPendingFlip) {
      return false;
    }
    if (this.state.lastPlayedById !== playerId) {
      this.awardFoul(playerId, Foul.FlippedOthersDiscard);
      this.state = {
        ...this.state,
        activePlayerId: nextClockwiseId(
          this.state.players,
          playerId,
        ),
      };
      this.emit();
      return false;
    }

    this.state = {
      ...this.state,
      beaten: [...this.state.beaten, ...this.state.current],
      current: [],
      discardPendingFlip: false,
      roundJustEnded: true,
      message: "Отбой",
    };
    this.afterRoundEnd();
    return true;
  }

  private afterRoundEnd(): void {
    // empty-hand players may claim stumps or exit (must announce)
    this.emit();
  }

  claimStumps(playerId: number): boolean {
    if (this.state.phase !== Phase.Main) return false;
    if (!this.state.roundJustEnded && this.state.current.length > 0) {
      return false;
    }
    const self = findPlayer(this.state, playerId);
    if (self.hand.length > 0) return false;
    if (self.stumps.length === 0) return false;

    const players = this.state.players.map((p) => {
      if (p.id !== playerId) return p;
      return {
        ...p,
        hand: p.stumps.map(cloneCard),
        stumps: [],
        stumpsRevealed: true,
      };
    });
    this.state = {
      ...this.state,
      players,
      message: `${self.name}: Беру пни!`,
      roundJustEnded: false,
    };
    this.emit();
    return true;
  }

  /** Peek stumps without announce → foul. */
  peekStumps(playerId: number): void {
    const self = findPlayer(this.state, playerId);
    if (!self.stumpsRevealed && self.stumps.length > 0) {
      this.awardFoul(playerId, Foul.LookedStumpsWithoutAnnounce);
      this.emit();
    }
  }

  exitGame(playerId: number): boolean {
    if (this.state.phase !== Phase.Main) return false;
    const self = findPlayer(this.state, playerId);
    if (self.hand.length > 0 || self.stumps.length > 0) {
      return false;
    }
    if (!this.state.roundJustEnded && this.state.current.length > 0) {
      return false;
    }

    const players = this.state.players.map((p) =>
      p.id === playerId ? { ...p, active: false } : p,
    );
    const still = activePlayers(players);
    this.state = {
      ...this.state,
      players,
      roundJustEnded: false,
      message: `${self.name}: С пидорами не играю!`,
    };

    if (still.length <= 2) {
      this.state = {
        ...this.state,
        message:
          still.length === 2
            ? "Дуэль"
            : this.state.message,
      };
    }
    if (still.length === 1) {
      const loser = still[0];
      this.state = {
        ...this.state,
        phase: Phase.Ended,
        watchmanId: loser.id,
        dealerId: loser.id,
        message: `${loser.name} на вахте`,
      };
    }
    if (still.length === 0) {
      this.state = { ...this.state, phase: Phase.Ended };
    }

    // Pass turn if active left
    if (
      this.state.phase === Phase.Main &&
      !findPlayer(this.state, this.state.activePlayerId).active
    ) {
      this.state = {
        ...this.state,
        activePlayerId: nextClockwiseId(
          this.state.players,
          playerId,
        ),
      };
    }
    this.emit();
    return true;
  }

  nameTrumpAloud(playerId: number): void {
    this.awardFoul(playerId, Foul.NamedTrumpAloud);
    if (this.state.phase === Phase.Main) {
      this.state = {
        ...this.state,
        activePlayerId: nextClockwiseId(
          this.state.players,
          playerId,
        ),
      };
    }
    this.emit();
  }

  askWhoIsWatchman(askerId: number): void {
    const counts = { ...this.state.watchmanAskCounts };
    counts[askerId] = (counts[askerId] ?? 0) + 1;
    this.state = { ...this.state, watchmanAskCounts: counts };
    this.emit();
  }

  answerWatchman(watchmanId: number, askerId: number): boolean {
    if (this.state.watchmanId !== watchmanId) return false;
    const owed = this.state.watchmanAskCounts[askerId] ?? 0;
    if (owed <= 0) return false;
    const counts = { ...this.state.watchmanAskCounts };
    counts[askerId] = owed - 1;
    this.state = { ...this.state, watchmanAskCounts: counts };
    this.emit();
    return true;
  }

  /** End duel: mark loser as watchman. */
  setWatchman(loserId: number): void {
    this.state = {
      ...this.state,
      phase: Phase.Ended,
      watchmanId: loserId,
      dealerId: loserId,
      message: "Вахту сдал",
    };
    this.emit();
  }

  // ——— CPU ———

  runCpuTurn(): void {
    const id = this.state.activePlayerId;
    const player = findPlayer(this.state, id);
    if (!player.isCPU || !player.active) return;

    if (this.state.phase === Phase.Prepare) {
      this.cpuPrepare(id);
      return;
    }
    if (this.state.phase === Phase.Main) {
      this.cpuMain(id);
    }
  }

  private cpuPrepare(playerId: number): void {
    this.cascadeOwnTops(playerId);

    if (!this.state.prepareHeld) {
      if (this.state.deck.length === 0) return;
      this.drawPrepare(playerId);
    }

    const held = this.state.prepareHeld;
    if (!held) return;

    const target = firstLegalPrepareTarget(
      this.state.players,
      playerId,
      held,
    );
    if (target) {
      this.placePrepare(playerId, target.id);
      // after place, draw again if still this player's prepare turn
      if (
        this.state.phase === Phase.Prepare &&
        this.state.activePlayerId === playerId &&
        !this.state.prepareHeld
      ) {
        this.cpuPrepare(playerId);
      }
      return;
    }
    this.keepPrepare(playerId);
  }

  private cpuMain(playerId: number): void {
    if (this.state.discardPendingFlip) {
      if (this.state.lastPlayedById === playerId) {
        this.flipDiscard(playerId);
      }
      return;
    }

    const player = findPlayer(this.state, playerId);

    if (
      this.state.roundJustEnded &&
      player.hand.length === 0 &&
      player.stumps.length > 0
    ) {
      this.claimStumps(playerId);
      return;
    }
    if (
      this.state.roundJustEnded &&
      player.hand.length === 0 &&
      player.stumps.length === 0
    ) {
      this.exitGame(playerId);
      return;
    }

    if (this.state.current.length === 0) {
      const lead = this.pickLead(player);
      if (lead) this.playMain(playerId, lead);
      return;
    }

    const target = this.state.current[this.state.current.length - 1];
    const beaters = player.hand
      .filter((c) => canBeat(target, c, this.state.trump))
      .sort((a, b) => a.rank - b.rank);
    if (beaters[0]) {
      this.playMain(playerId, beaters[0]);
      return;
    }
    this.takeBottom(playerId);
  }

  private pickLead(player: EnginePlayer): EngineCard | null {
    if (player.hand.length === 0) return null;
    const trump = this.state.trump;
    const nonTrump = player.hand
      .filter((c) => trump === null || c.suit !== trump)
      .sort((a, b) => a.rank - b.rank);
    if (nonTrump[0]) return nonTrump[0];
    return [...player.hand].sort((a, b) => a.rank - b.rank)[0];
  }

  // ——— guards ———

  private requireTurn(playerId: number): boolean {
    if (this.state.activePlayerId === playerId) {
      return true;
    }
    this.awardFoul(playerId, Foul.PlayedOutOfTurn);
    this.emit();
    return false;
  }

  private assertActive(playerId: number): void {
    if (!findPlayer(this.state, playerId).active) {
      throw new Error("inactive player");
    }
  }
}

/** Test helper: legal prepare target without mutating. */
export function peekFirstPrepareTarget(
  state: GameState,
  drawerId: number,
  card: EngineCard,
) {
  return firstLegalPrepareTarget(state.players, drawerId, card);
}

export function peekFirstClockwiseLegal(
  state: GameState,
  drawerId: number,
  pred: (p: EnginePlayer) => boolean,
) {
  return firstClockwiseWhere(state.players, drawerId, pred);
}
