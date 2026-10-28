import { CardRanks, lowestRankOf } from "./cards";
import {
  type EngineCard,
  type EnginePlayer,
  Foul,
  type GameState,
  type Listener,
  Phase,
  type StartOptions,
} from "./types";
import { cardsEqual, createRng } from "./deck";
import { activePlayers, firstClockwiseWhere, nextClockwiseId } from "./seats";
import {
  canBeat,
  canPlaceOnTop,
  firstLegalPrepareTarget,
  pickWorstHuyovyeCard,
  topOf,
  trumpFromLastDeckCard,
} from "./rules";
import { buildInitialGameState, dealStage } from "./phases/dealing";
import { CpuDirector, type GameCpuHost } from "./cpu/director";

/*
 * Owner-confirmed interpretations (2026-10-27):
 * - takeBottom: only the bottom card of the pile (`shift`), never the whole pile.
 * - «Круг» for stumps/exit: discard flip cycle — claim/exit require roundJustEnded
 *   set by flipDiscard (not a full turn orbit).
 * - First main lead after huyovye: next clockwise after tookLastDeckCardId (fixed;
 *   not last huyovye giver/receiver).
 * - Main-phase fouls convert to хуёвые card dumps: enqueue obligations and pause
 *   Main → Huyovye until drained, then resume Main (never orphan counters).
 */

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
  private readonly cpu: CpuDirector;
  /** Batched-emit bookkeeping (see emit/batched). */
  private emitDepth = 0;
  private emitScheduled = false;

  constructor(options: StartOptions) {
    if (options.seats.length < 2) {
      throw new Error("need at least 2 players");
    }
    this.rng =
      options.seed !== undefined ? createRng(options.seed) : Math.random;
    this.cpu = new CpuDirector(this.buildCpuHost(), this.rng);
    this.state = buildInitialGameState(options, this.rng);
    this.state = dealStage(this.state, this.rng);
    this.emit();
  }

  /**
   * Host adapter: the CPU director acts only through the engine's rule-checked
   * API; the engine stays the single arbiter of fouls and turn advancement.
   */
  private buildCpuHost(): GameCpuHost {
    return {
      findPlayer: (playerId) => findPlayer(this.state, playerId),
      getState: () => this.state,
      updateState: (patch, message) => {
        this.state = { ...this.state, ...patch };
        if (message !== undefined) {
          this.state = { ...this.state, message };
        }
        this.emit();
      },
      cascadeOwnTops: (playerId) => this.cascadeOwnTops(playerId),
      drawPrepare: (playerId) => this.drawPrepare(playerId),
      placePrepare: (playerId, targetId) =>
        this.placePrepare(playerId, targetId),
      keepPrepare: (playerId) => this.keepPrepare(playerId),
      playMain: (playerId, card) => this.playMain(playerId, card),
      takeBottom: (playerId) => this.takeBottom(playerId),
      flipDiscard: (playerId) => this.flipDiscard(playerId),
      claimStumps: (playerId) => this.claimStumps(playerId),
      exitGame: (playerId) => this.exitGame(playerId),
      giveHuyovyeCard: (giverId, receiverId, card) =>
        this.giveHuyovyeCard(giverId, receiverId, card),
      dropHuyovyeObligation: (giverId, receiverId) =>
        this.dropHuyovyeObligation(giverId, receiverId),
      finishHuyovye: () => this.finishHuyovye(),
      skipMainTurn: (fromPlayerId) => this.skipMainTurn(fromPlayerId),
      parkMainFlipper: (flipperId) => this.parkMainFlipper(flipperId),
    };
  }

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = (): GameState => this.state;

  /**
   * Publish one snapshot: clone state, notify listeners. Emits made inside a
   * `batched()` window are coalesced into a single publish at window exit, so
   * composite actions (cascade + draw) never flood subscribers.
   */
  private emit(): void {
    if (this.emitDepth > 0) {
      this.emitScheduled = true;
      return;
    }
    this.flushNow();
  }

  /** Run `fn` in one emit window; the exit publishes at most one snapshot. */
  private batched<T>(fn: () => T): T {
    this.emitDepth++;
    try {
      return fn();
    } finally {
      this.emitDepth--;
      if (this.emitDepth === 0 && this.emitScheduled) {
        this.emitScheduled = false;
        this.flushNow();
      }
    }
  }

  private flushNow(): void {
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
      huyovyeQueue: frozen.huyovyeQueue.map((q) => ({ ...q })),
      watchmanAskCounts: { ...frozen.watchmanAskCounts },
    };
    this.listeners.forEach((l) => {
      l();
    });
  }

  private awardFoul(playerId: number, foul: Foul): void {
    const players = this.state.players.map((p) =>
      p.id === playerId ? { ...p, huyovye: p.huyovye + 1 } : p
    );
    this.state = {
      ...this.state,
      players,
      lastFoul: { playerId, foul },
      message: `Хуёвая: ${foul}`,
    };
    // Main fouls (and mid-main gift pauses) convert to card dumps, not orphan counters.
    if (this.shouldConvertFoulToCards()) {
      this.enqueueFoulCardGifts(playerId);
    }
  }

  /** True when a foul must become worst-card gifts from other seats. */
  private shouldConvertFoulToCards(): boolean {
    return (
      this.state.phase === Phase.Main ||
      (this.state.phase === Phase.Huyovye && this.state.resumeMainAfterHuyovye)
    );
  }

  /**
   * One huyovaya → one worst-to-keep gift from each other active seat
   * (same scoring as prepare huyovye phase).
   */
  private enqueueFoulCardGifts(receiverId: number): void {
    const active = activePlayers(this.state.players);
    const additions: { giverId: number; receiverId: number }[] = [];
    for (const giver of active) {
      if (giver.id === receiverId) continue;
      additions.push({ giverId: giver.id, receiverId });
    }
    if (additions.length === 0) return;
    this.state = {
      ...this.state,
      huyovyeQueue: [...this.state.huyovyeQueue, ...additions],
    };
  }

  /**
   * After a Main foul mutates state (and usually advances the turn): if gifts
   * were enqueued, pause into Huyovye; otherwise emit as usual.
   */
  private settleAfterPossibleMainFoul(): void {
    if (this.state.phase === Phase.Main && this.state.huyovyeQueue.length > 0) {
      this.pauseMainForHuyovye();
      return;
    }
    this.emit();
  }

  /** Pause Main into Huyovye until foul gifts drain; preserve table/lead. */
  private pauseMainForHuyovye(): void {
    this.state = {
      ...this.state,
      phase: Phase.Huyovye,
      resumeMainAfterHuyovye: true,
      message: `Хуёвые в основной: раздайте плохие карты (${this.state.huyovyeQueue.length})`,
    };
    this.emit();
    this.runCpuHuyovye();
  }

  /** Queue empty: first-entry → begin Main; mid-main pause → resume Main. */
  private onHuyovyeDrained(): void {
    if (this.state.resumeMainAfterHuyovye) {
      this.resumeMainAfterFoulHuyovye();
    } else {
      this.beginMainAfterHuyovye();
    }
  }

  /** Restore Main after mid-foul gifts; keep pile, flip state, and active seat. */
  private resumeMainAfterFoulHuyovye(): void {
    const players = this.state.players.map((p) => ({ ...p, huyovye: 0 }));
    this.state = {
      ...this.state,
      players,
      huyovyeQueue: [],
      phase: Phase.Main,
      resumeMainAfterHuyovye: false,
      message: "Основная игра",
    };
    this.emit();
  }

  // ——— Prepare ———

  /** Cascade: repeatedly dump own top onto first-clockwise legal lower tops. */
  cascadeOwnTops(playerId: number): number {
    this.assertActive(playerId);
    if (this.state.phase !== Phase.Prepare) {
      return 0;
    }
    if (!this.requireTurn(playerId)) {
      return 0;
    }
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
        this.lowestRank()
      );
      // Self-as-target is a no-op for cascade (own top cannot land on itself).
      if (!target || target.id === playerId) {
        break;
      }
      this.placePrepareCard(playerId, target.id, top, true);
      moves++;
    }
    this.emit();
    return moves;
  }

  /** Draw top of deck into prepareHeld (or take last card → trump + huyovye).
   *  Composite action (cascade + draw): single snapshot publish via batched. */
  drawPrepare(playerId: number): boolean {
    return this.batched(() => this.drawPrepareInner(playerId));
  }

  private drawPrepareInner(playerId: number): boolean {
    if (this.state.phase !== Phase.Prepare) return false;
    if (!this.requireTurn(playerId, Foul.DrewOutOfTurn)) return false;

    if (this.state.prepareHeld) {
      // Saw a second card without placing the first — foul and pass turn.
      const held = this.state.prepareHeld;
      this.awardFoul(playerId, Foul.DrewTwoAndSawSecond);
      const players = this.state.players.map((p) =>
        p.id === playerId ? { ...p, hand: [cloneCard(held), ...p.hand] } : p
      );
      this.state = {
        ...this.state,
        players,
        prepareHeld: null,
        activePlayerId: nextClockwiseId(players, playerId),
      };
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
        trump === null ? "Последняя — пика. Бескозырка." : `Козырь: ${trump}`,
    };
    this.enterHuyovye();
  }

  /**
   * Place held (or specified hand top) onto target.
   * `fromCascade` skips held-card requirement.
   */
  placePrepare(playerId: number, targetId: number, card?: EngineCard): boolean {
    if (this.state.phase !== Phase.Prepare) return false;
    if (!this.requireTurn(playerId)) return false;

    // Hand cascade is legal when the deck has one card left and nothing is held.
    // That is NOT PlacedLastDeckCard — the last deck card is never placed on anyone
    // (drawPrepare takes it via takeLastDeckCard).
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
      this.lowestRank()
    );
    if (!first) {
      return false;
    }
    if (first.id !== targetId) {
      this.awardFoul(playerId, Foul.DumpedNotFirstClockwise);
      this.emit();
      return false;
    }
    if (
      !canPlaceOnTop(
        topOf(findPlayer(this.state, targetId)),
        held,
        this.lowestRank()
      )
    ) {
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
      this.lowestRank()
    );
    // Skipping a mandatory dump is a foul, but the keep still happens
    // (player chose not to place — turn passes with хуёвая).
    if (first) {
      this.awardFoul(playerId, Foul.FailedToDumpLegal);
    }
    const players = this.state.players.map((p) =>
      p.id === playerId ? { ...p, hand: [cloneCard(held), ...p.hand] } : p
    );
    this.state = {
      ...this.state,
      players,
      prepareHeld: null,
      activePlayerId: nextClockwiseId(players, playerId),
      message: first
        ? `${findPlayer(this.state, playerId).name} забирает (фол: не положил)`
        : `${findPlayer(this.state, playerId).name} забирает`,
    };
    this.emit();
    return true;
  }

  private placePrepareCard(
    fromId: number,
    toId: number,
    card: EngineCard,
    fromHand: boolean
  ): void {
    const players = this.state.players.map((p) => ({
      ...p,
      hand: [...p.hand],
      stumps: [...p.stumps],
    }));
    const from = players.find((p) => p.id === fromId);
    const to = players.find((p) => p.id === toId);
    if (!from || !to) return;

    const targetTop = to.hand[0];
    const lowestOnAce =
      card.rank === this.lowestRank() &&
      targetTop !== undefined &&
      targetTop.rank === CardRanks.ace;

    if (fromHand) {
      const idx = from.hand.findIndex((c) => cardsEqual(c, card));
      if (idx < 0) return;
      from.hand.splice(idx, 1);
    }
    to.hand.unshift(cloneCard(card));
    this.state = { ...this.state, players };

    // Lowest→ace awards huyovaya to the ace owner (not when placing on own ace).
    if (lowestOnAce && fromId !== toId) {
      this.awardFoul(toId, Foul.ReceivedLowestOnHighest);
    }
  }

  // ——— Huyovye ———

  private enterHuyovye(): void {
    const queue = this.buildHuyovyeQueue();
    this.state = {
      ...this.state,
      phase: Phase.Huyovye,
      prepareHeld: null,
      huyovyeQueue: queue,
      resumeMainAfterHuyovye: false,
      message:
        queue.length === 0
          ? "Хуёвых нет — к основной"
          : `Фаза хуёвых: раздайте плохие карты (${queue.length})`,
    };
    this.emit();
    if (queue.length === 0) {
      this.beginMainAfterHuyovye();
      return;
    }
    // CPU givers auto-play their obligations; humans choose manually.
    this.runCpuHuyovye();
  }

  private buildHuyovyeQueue(): { giverId: number; receiverId: number }[] {
    const active = activePlayers(this.state.players);
    const queue: { giverId: number; receiverId: number }[] = [];
    for (const receiver of active) {
      for (let n = 0; n < receiver.huyovye; n++) {
        for (const giver of active) {
          if (giver.id === receiver.id) continue;
          queue.push({ giverId: giver.id, receiverId: receiver.id });
        }
      }
    }
    return queue;
  }

  /** Remaining gifts owed to a receiver in the current huyovye queue. */
  huyovyeOutstanding(receiverId: number): number {
    return this.state.huyovyeQueue.filter((q) => q.receiverId === receiverId)
      .length;
  }

  /**
   * Suggested хуёвая for a giver (worst-to-keep under main rules).
   * Null when the last-card rule forbids giving.
   */
  suggestHuyovyeCard(giverId: number): EngineCard | null {
    const giver = findPlayer(this.state, giverId);
    return pickWorstHuyovyeCard(giver.hand, this.state.trump);
  }

  giveHuyovyeCard(
    giverId: number,
    receiverId: number,
    card: EngineCard
  ): boolean {
    if (this.state.phase !== Phase.Huyovye) return false;
    const qi = this.state.huyovyeQueue.findIndex(
      (q) => q.giverId === giverId && q.receiverId === receiverId
    );
    if (qi < 0) return false;

    const giver = findPlayer(this.state, giverId);
    // Last card in hand is never given — drop obligation for humans like CPU
    // so the queue cannot stall permanently.
    if (giver.hand.length <= 1) {
      const queue = this.state.huyovyeQueue.filter((_, i) => i !== qi);
      this.state = {
        ...this.state,
        huyovyeQueue: queue,
        message: `${giver.name} не может отдать хуёвую (последняя)`,
      };
      this.emit();
      if (queue.length === 0) {
        this.onHuyovyeDrained();
      } else {
        this.runCpuHuyovye();
      }
      return true;
    }

    const idx = giver.hand.findIndex((c) => cardsEqual(c, card));
    if (idx < 0) return false;

    const queue = this.state.huyovyeQueue.filter((_, i) => i !== qi);
    const players = this.state.players.map((p) => {
      if (p.id === giverId) {
        return { ...p, hand: p.hand.filter((_, i) => i !== idx) };
      }
      if (p.id === receiverId) {
        return { ...p, hand: [...p.hand, cloneCard(card)] };
      }
      return p;
    });
    this.state = {
      ...this.state,
      players,
      huyovyeQueue: queue,
      message: `${giver.name} → ${findPlayer(this.state, receiverId).name}`,
    };
    this.emit();
    if (queue.length === 0) {
      this.onHuyovyeDrained();
      return true;
    }
    // After a human gift, finish any remaining CPU obligations.
    this.runCpuHuyovye();
    return true;
  }

  /**
   * CPU seats fulfill pending huyovye gifts with the worst-to-keep heuristic
   * (delegated to the CPU director; engine stays the rules arbiter).
   * Whole drain publishes a single snapshot.
   */
  runCpuHuyovye(): void {
    this.batched(() => this.cpu.runHuyovye());
  }

  /** Drop one owed gift: giver holds only his last card (never given, R4). */
  dropHuyovyeObligation(giverId: number, receiverId: number): void {
    const giver = findPlayer(this.state, giverId);
    const queue = this.state.huyovyeQueue.filter((q) => {
      return !(q.giverId === giverId && q.receiverId === receiverId);
    });
    if (queue.length === this.state.huyovyeQueue.length) return;
    this.state = {
      ...this.state,
      huyovyeQueue: queue,
      message: `${giver.name} не может отдать хуёвую (последняя)`,
    };
    this.emit();
  }

  /** Start / resume main once the huyovye queue is empty (no-op if gifts remain). */
  finishHuyovye(): boolean {
    if (this.state.phase !== Phase.Huyovye) return false;
    if (this.state.huyovyeQueue.length > 0) return false;
    this.onHuyovyeDrained();
    return true;
  }

  /**
   * Test seam: jump into huyovye with explicit hands/queue/trump.
   * Production UI never calls this.
   */
  loadHuyovyeFixture(fixture: {
    players: EnginePlayer[];
    trump: GameState["trump"];
    queue: GameState["huyovyeQueue"];
    tookLastDeckCardId?: number | null;
  }): void {
    this.state = {
      ...this.state,
      phase: Phase.Huyovye,
      prepareHeld: null,
      deck: [],
      players: fixture.players.map((p) => ({
        ...p,
        hand: p.hand.map(cloneCard),
        stumps: p.stumps.map(cloneCard),
      })),
      trump: fixture.trump,
      huyovyeQueue: fixture.queue.map((q) => ({ ...q })),
      tookLastDeckCardId:
        fixture.tookLastDeckCardId === undefined
          ? this.state.tookLastDeckCardId
          : fixture.tookLastDeckCardId,
      resumeMainAfterHuyovye: false,
      message: "huyovye fixture",
    };
  }

  /**
   * Test seam: overlay arbitrary state fields for unit tests.
   * Production UI never calls this.
   */
  loadTestFixture(patch: Partial<GameState>): void {
    const players =
      patch.players !== undefined
        ? patch.players.map((p) => ({
            ...p,
            hand: p.hand.map(cloneCard),
            stumps: p.stumps.map(cloneCard),
          }))
        : this.state.players;
    this.state = {
      ...this.state,
      ...patch,
      players,
      deck:
        patch.deck !== undefined ? patch.deck.map(cloneCard) : this.state.deck,
      current:
        patch.current !== undefined
          ? patch.current.map(cloneCard)
          : this.state.current,
      beaten:
        patch.beaten !== undefined
          ? patch.beaten.map(cloneCard)
          : this.state.beaten,
      prepareHeld:
        patch.prepareHeld === undefined
          ? this.state.prepareHeld
          : patch.prepareHeld === null
            ? null
            : cloneCard(patch.prepareHeld),
      huyovyeQueue:
        patch.huyovyeQueue !== undefined
          ? patch.huyovyeQueue.map((q) => ({ ...q }))
          : this.state.huyovyeQueue,
      watchmanAskCounts:
        patch.watchmanAskCounts !== undefined
          ? { ...patch.watchmanAskCounts }
          : this.state.watchmanAskCounts,
    };
  }

  /**
   * Test seam: jump into main with explicit table/hands/trump.
   * Production UI never calls this.
   */
  loadMainFixture(fixture: {
    players: EnginePlayer[];
    trump: GameState["trump"];
    activePlayerId: number;
    current?: EngineCard[];
    discardPendingFlip?: boolean;
    lastPlayedById?: number | null;
    roundJustEnded?: boolean;
  }): void {
    const current = (fixture.current ?? []).map(cloneCard);
    this.state = {
      ...this.state,
      phase: Phase.Main,
      prepareHeld: null,
      deck: [],
      huyovyeQueue: [],
      resumeMainAfterHuyovye: false,
      players: fixture.players.map((p) => ({
        ...p,
        hand: p.hand.map(cloneCard),
        stumps: p.stumps.map(cloneCard),
      })),
      trump: fixture.trump,
      activePlayerId: fixture.activePlayerId,
      current,
      discardPendingFlip: fixture.discardPendingFlip ?? false,
      lastPlayedById:
        fixture.lastPlayedById === undefined ? null : fixture.lastPlayedById,
      roundJustEnded: fixture.roundJustEnded ?? false,
      message: "main fixture",
    };
  }

  /**
   * First entry into Main after prepare huyovye.
   * Lead is fixed: next clockwise after tookLastDeckCardId (not last giver).
   */
  private beginMainAfterHuyovye(): void {
    const players = this.state.players.map((p) => ({ ...p, huyovye: 0 }));
    const leadFrom = this.state.tookLastDeckCardId ?? this.state.dealerId;
    const next = nextClockwiseId(players, leadFrom);
    this.state = {
      ...this.state,
      players,
      huyovyeQueue: [],
      resumeMainAfterHuyovye: false,
      phase: Phase.Main,
      activePlayerId: next,
      current: [],
      discardPendingFlip: false,
      roundJustEnded: false,
      message: "Основная игра",
    };
    this.emit();
  }

  // ——— Main ———

  playMain(playerId: number, card: EngineCard): boolean {
    if (this.state.phase !== Phase.Main) return false;
    // Pile already at N awaiting flip — playing another card is ExtraCardPastN.
    if (this.state.discardPendingFlip) {
      this.awardFoul(playerId, Foul.ExtraCardPastN);
      this.state = {
        ...this.state,
        activePlayerId: nextClockwiseId(this.state.players, playerId),
      };
      this.settleAfterPossibleMainFoul();
      return false;
    }
    if (this.state.activePlayerId !== playerId) {
      this.awardFoul(playerId, Foul.PlayedOutOfTurn);
      this.state = {
        ...this.state,
        activePlayerId: nextClockwiseId(this.state.players, playerId),
      };
      this.settleAfterPossibleMainFoul();
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
    if (!canBeat(target, card, this.state.trump, this.lowestRank())) {
      this.awardFoul(playerId, Foul.IllegalBeat);
      this.state = {
        ...this.state,
        activePlayerId: nextClockwiseId(this.state.players, playerId),
      };
      this.settleAfterPossibleMainFoul();
      return false;
    }

    if (this.state.current.length >= activeCount) {
      this.awardFoul(playerId, Foul.ExtraCardPastN);
      this.state = {
        ...this.state,
        activePlayerId: nextClockwiseId(this.state.players, playerId),
      };
      this.settleAfterPossibleMainFoul();
      return false;
    }

    return this.applyMainPlay(playerId, idx, card, activeCount);
  }

  private applyMainPlay(
    playerId: number,
    cardIndex: number,
    card: EngineCard,
    activeCount: number
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
      activePlayerId: pending ? playerId : nextClockwiseId(players, playerId),
      message: pending
        ? "Отбой — переверни"
        : `${findPlayer(this.state, playerId).name} ходит`,
    };
    this.emit();
    return true;
  }

  /**
   * Cannot / won't beat → take **only the bottom** card of the current pile
   * (`shift`). The rest of the pile stays on the table.
   */
  takeBottom(playerId: number): boolean {
    if (this.state.phase !== Phase.Main) return false;
    if (!this.requireTurn(playerId)) return false;
    if (this.state.discardPendingFlip || this.state.current.length === 0) {
      return false;
    }
    const [bottom, ...rest] = this.state.current;
    const players = this.state.players.map((p) =>
      p.id === playerId ? { ...p, hand: [cloneCard(bottom), ...p.hand] } : p
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
        activePlayerId: nextClockwiseId(this.state.players, playerId),
      };
      this.settleAfterPossibleMainFoul();
      return false;
    }

    // Lead of next trick is next clockwise after the flipper (empty-hand
    // flipper must not remain stuck as activePlayerId).
    const nextLead = nextClockwiseId(this.state.players, playerId);
    this.state = {
      ...this.state,
      beaten: [...this.state.beaten, ...this.state.current],
      current: [],
      discardPendingFlip: false,
      roundJustEnded: true,
      activePlayerId: nextLead,
      message: "Отбой",
    };
    this.afterRoundEnd();
    return true;
  }

  private afterRoundEnd(): void {
    // flipDiscard advances activePlayerId, so empty-hand CPU flippers are no
    // longer the active seat — settle their claim/exit here.
    const ids = activePlayers(this.state.players).map((p) => p.id);
    for (const id of ids) {
      const p = findPlayer(this.state, id);
      if (!p.isCPU) continue;
      if (p.hand.length === 0 && p.stumps.length > 0) {
        this.claimStumps(id);
      } else if (p.hand.length === 0 && p.stumps.length === 0) {
        this.exitGame(id);
      }
    }
    this.emit();
  }

  /**
   * Protocol window (§8): hand-empty seats may claim stumps / exit when the
   * table is clear. The table clears either via flipDiscard (roundJustEnded)
   * or because bottom-takes absorbed the whole pile (R7) — both count.
   */
  private protocolWindow(): boolean {
    return !this.state.discardPendingFlip && this.state.current.length === 0;
  }

  /**
   * «Круг» = discard flip cycle: only legal after flipDiscard sets roundJustEnded.
   */
  claimStumps(playerId: number): boolean {
    if (this.state.phase !== Phase.Main) return false;
    if (!this.protocolWindow()) {
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
    // Keep roundJustEnded so other seats can still claim/exit before the next lead.
    this.state = {
      ...this.state,
      players,
      message: `${self.name}: Беру пни!`,
    };
    this.emit();
    return true;
  }

  /** Peek stumps without announce → foul (main → card gifts). */
  peekStumps(playerId: number): void {
    const self = findPlayer(this.state, playerId);
    if (!self.stumpsRevealed && self.stumps.length > 0) {
      this.awardFoul(playerId, Foul.LookedStumpsWithoutAnnounce);
      this.settleAfterPossibleMainFoul();
    }
  }

  /**
   * «Круг» = discard flip cycle: only legal after flipDiscard sets roundJustEnded.
   */
  exitGame(playerId: number): boolean {
    if (this.state.phase !== Phase.Main) return false;
    const self = findPlayer(this.state, playerId);
    if (self.hand.length > 0 || self.stumps.length > 0) {
      return false;
    }
    if (!this.protocolWindow()) {
      return false;
    }

    const players = this.state.players.map((p) =>
      p.id === playerId ? { ...p, active: false } : p
    );
    const still = activePlayers(players);
    // Keep roundJustEnded so remaining seats can still claim/exit before next lead.
    this.state = {
      ...this.state,
      players,
      message: `${self.name}: С пидорами не играю!`,
    };

    if (still.length === 2) {
      this.state = {
        ...this.state,
        message: `Дуэль: ${still[0].name} vs ${still[1].name}`,
      };
    }
    if (still.length === 1) {
      this.applyWatchmanHandoff(still[0].id);
    }
    if (still.length === 0) {
      this.state = { ...this.state, phase: Phase.Ended };
    }

    if (
      this.state.phase === Phase.Main &&
      !findPlayer(this.state, this.state.activePlayerId).active
    ) {
      this.state = {
        ...this.state,
        activePlayerId: nextClockwiseId(this.state.players, playerId),
      };
    }
    this.emit();
    return true;
  }

  /** Which protocol buttons apply for a seat after a discard cycle. */
  protocolsFor(playerId: number): Array<"claim_stumps" | "exit"> {
    if (this.state.phase !== Phase.Main) return [];
    if (!this.protocolWindow()) {
      return [];
    }
    const self = findPlayer(this.state, playerId);
    if (!self.active) return [];
    if (self.hand.length === 0 && self.stumps.length > 0) {
      return ["claim_stumps"];
    }
    if (self.hand.length === 0 && self.stumps.length === 0) {
      return ["exit"];
    }
    return [];
  }

  private applyWatchmanHandoff(loserId: number): void {
    const prev = this.state.watchmanId;
    const loser = findPlayer(this.state, loserId);
    const handoff =
      prev != null
        ? `${findPlayer(this.state, prev).name}: Вася-пидор вахту сдал! ${loser.name}, принимай вахту.`
        : `Вася-пидор вахту сдал! ${loser.name}, принимай вахту.`;
    this.state = {
      ...this.state,
      phase: Phase.Ended,
      previousWatchmanId: prev,
      watchmanId: loserId,
      dealerId: loserId,
      pendingWatchmanHandoff: true,
      message: handoff,
    };
  }

  acceptWatchmanHandoff(): boolean {
    if (!this.state.pendingWatchmanHandoff) return false;
    const w = this.state.watchmanId;
    const name = w != null ? findPlayer(this.state, w).name : "вахтёр";
    this.state = {
      ...this.state,
      pendingWatchmanHandoff: false,
      message: `${name} на вахте. Спроси: «Кто на вахте?»`,
    };
    this.emit();
    return true;
  }

  nameTrumpAloud(playerId: number): void {
    // Exited / inactive players may name trump without foul.
    if (!findPlayer(this.state, playerId).active) {
      return;
    }
    this.awardFoul(playerId, Foul.NamedTrumpAloud);
    if (this.state.phase === Phase.Main) {
      this.state = {
        ...this.state,
        activePlayerId: nextClockwiseId(this.state.players, playerId),
      };
      this.settleAfterPossibleMainFoul();
      return;
    }
    // Extra foul while draining mid-main gifts: enqueue more, let CPU continue.
    if (this.state.resumeMainAfterHuyovye) {
      this.emit();
      this.runCpuHuyovye();
      return;
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

  /** End duel: mark loser as watchman and prompt handoff. */
  setWatchman(loserId: number): void {
    this.applyWatchmanHandoff(loserId);
    this.emit();
  }

  // ——— CPU ———

  runCpuTurn(): void {
    // Whole CPU turn (cascade + draw + place / beat + take) publishes one
    // snapshot; nested huyovye drain re-enters batched harmlessly.
    this.batched(() => {
      // Huyovye gifts are by seat obligation, not by activePlayerId — always
      // drain CPU givers even when the prepare/main "active" seat is human.
      if (this.state.phase === Phase.Huyovye) {
        this.runCpuHuyovye();
        return;
      }

      const id = this.state.activePlayerId;
      const player = findPlayer(this.state, id);
      if (!player.isCPU || !player.active) return;

      if (this.state.phase === Phase.Prepare) {
        this.cpu.runPrepareTurn(id);
        return;
      }
      if (this.state.phase === Phase.Main) {
        this.cpu.runMainTurn(id);
      }
    });
  }

  /** Pass main turn to next active seat (CPU must never soft-lock). */
  skipMainTurn(fromPlayerId: number): void {
    this.state = {
      ...this.state,
      activePlayerId: nextClockwiseId(this.state.players, fromPlayerId),
      message: `${findPlayer(this.state, fromPlayerId).name} пропускает`,
    };
    this.emit();
  }

  /** Park the active seat on the human who must flip the discard. */
  parkMainFlipper(flipperId: number): void {
    if (this.state.activePlayerId === flipperId) {
      return;
    }
    this.state = {
      ...this.state,
      activePlayerId: flipperId,
      message: "Отбой — переверни",
    };
    this.emit();
  }

  // ——— guards ———

  /** Out-of-turn: foul + advance to next after fouler (prepare and main). */
  private requireTurn(
    playerId: number,
    foul: Foul = Foul.PlayedOutOfTurn
  ): boolean {
    if (this.state.activePlayerId === playerId) {
      return true;
    }
    this.awardFoul(playerId, foul);
    this.state = {
      ...this.state,
      activePlayerId: nextClockwiseId(this.state.players, playerId),
    };
    this.settleAfterPossibleMainFoul();
    return false;
  }

  private assertActive(playerId: number): void {
    if (!findPlayer(this.state, playerId).active) {
      throw new Error("inactive player");
    }
  }

  /** Lowest rank in play — the card that wraps onto an ace (six / two). */
  private lowestRank(): CardRanks {
    return lowestRankOf(this.state.deckSize);
  }
}

/** Test helper: legal prepare target without mutating. */
export function peekFirstPrepareTarget(
  state: GameState,
  drawerId: number,
  card: EngineCard
) {
  return firstLegalPrepareTarget(
    state.players,
    drawerId,
    card,
    lowestRankOf(state.deckSize)
  );
}

export function peekFirstClockwiseLegal(
  state: GameState,
  drawerId: number,
  pred: (p: EnginePlayer) => boolean
) {
  return firstClockwiseWhere(state.players, drawerId, pred);
}
