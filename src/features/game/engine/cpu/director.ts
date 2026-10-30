import {
  type EngineCard,
  type EnginePlayer,
  type GameState,
  Phase,
  type PlayerId,
} from "../types";
import { firstLegalPrepareTarget, pickWorstHuyovyeCard } from "../rules";
import { lowestRankOf } from "../cards";
import { MainLoopGuard } from "./loop-guard";
import { CPU_MISTAKE_RATE, pickBeater, pickLead } from "./ai";

/**
 * Actions the CPU director may perform. Everything goes through the host's
 * rule-checking entry points; the director never mutates state itself, so
 * fouls / turn advancement stay properties of the engine.
 */
export interface GameCpuHost {
  findPlayer(playerId: PlayerId): EnginePlayer;
  /** Board read; returns the current internal snapshot. */
  getState(): GameState;
  /** Engine-driven state patch; the engine emits after applying. */
  updateState(patch: Partial<GameState>, message?: string | null): void;

  cascadeOwnTops(playerId: PlayerId): number;
  drawPrepare(playerId: PlayerId): boolean;
  placePrepare(playerId: PlayerId, targetId: PlayerId): boolean;
  keepPrepare(playerId: PlayerId): boolean;

  playMain(playerId: PlayerId, card: EngineCard): boolean;
  takeBottom(playerId: PlayerId): boolean;
  flipDiscard(playerId: PlayerId): boolean;

  claimStumps(playerId: PlayerId): boolean;
  exitGame(playerId: PlayerId): boolean;

  giveHuyovyeCard(
    giverId: PlayerId,
    receiverId: PlayerId,
    card: EngineCard
  ): boolean;
  /** Remove one owed gift: giver holds only his last card. */
  dropHuyovyeObligation(giverId: PlayerId, receiverId: PlayerId): void;
  /** Drain finished — begin/resume Main from Huyovye. */
  finishHuyovye(): boolean;

  /** Pass main turn to next active seat without a foul (CPU soft-guard). */
  skipMainTurn(fromPlayerId: PlayerId): void;
  /** Park the active seat on the human who must flip the discard. */
  parkMainFlipper(flipperId: PlayerId): void;
}

/**
 * CPU seats play solely via the host's legal API. Loop breaking, mistakes and
 * decision heuristics all live here so the engine stays a rules arbiter.
 */
export class CpuDirector {
  private readonly host: GameCpuHost;
  private readonly rng: () => number;
  private readonly mistakeRate: number;
  private readonly loopGuard = new MainLoopGuard();
  /** Re-entrancy guard so giveHuyovyeCard → runHuyovye cannot nest. */
  private huyovyeRunning = false;

  constructor(
    host: GameCpuHost,
    rng: () => number,
    mistakeRate: number = CPU_MISTAKE_RATE
  ) {
    this.host = host;
    this.rng = rng;
    this.mistakeRate = mistakeRate;
  }

  private shouldMistake(): boolean {
    return this.rng() < this.mistakeRate;
  }

  // ——— Prepare ———

  runPrepareTurn(playerId: PlayerId): void {
    this.host.cascadeOwnTops(playerId);

    if (!this.host.getState().prepareHeld) {
      if (this.host.getState().deck.length === 0) return;
      this.host.drawPrepare(playerId);
    }

    const held = this.host.getState().prepareHeld;
    if (!held) return;

    const target = firstLegalPrepareTarget(
      this.host.getState().players,
      playerId,
      held,
      lowestRankOf(this.host.getState().deckSize)
    );
    if (target) {
      // Rare mistake: keep while a mandatory dump exists (P4).
      if (this.shouldMistake()) {
        this.host.keepPrepare(playerId);
        return;
      }
      this.host.placePrepare(playerId, target.id);
      const phase = this.host.getState();
      if (phase.phase === Phase.Prepare && phase.activePlayerId === playerId) {
        this.runPrepareTurn(playerId);
      }
      return;
    }
    this.host.keepPrepare(playerId);
  }

  // ——— Main ———

  runMainTurn(playerId: PlayerId): void {
    const state = this.host.getState();
    if (this.loopGuard.note(state)) {
      // Anti-loop: force take even when a beater exists.
      this.loopGuard.reset();
      this.host.takeBottom(playerId);
      return;
    }

    if (state.discardPendingFlip) {
      const flipperId = state.lastPlayedById;
      if (flipperId == null) {
        this.host.skipMainTurn(playerId);
        this.loopGuard.reset();
        return;
      }
      const flipper = this.host.findPlayer(flipperId);
      if (flipper.isCPU && flipper.active) {
        this.host.flipDiscard(flipperId);
        this.loopGuard.reset();
        return;
      }
      // Human must flip — park active seat on them so UI scheduling unblocks.
      if (state.activePlayerId !== flipperId) {
        this.host.parkMainFlipper(flipperId);
      }
      return;
    }

    const player = this.host.findPlayer(playerId);

    // Empty hand + pile: cannot beat → take bottom (never spin skipMainTurn).
    if (player.hand.length === 0) {
      if (state.current.length === 0) {
        // Protocol moment (§8): claim stumps, or exit with none left. The
        // engine's protocol window guarantees one of these succeeds while the
        // table is clear; the skip fallback only guards against stalls.
        const settled = player.stumps.length
          ? this.host.claimStumps(playerId)
          : this.host.exitGame(playerId);
        if (!settled) {
          this.host.skipMainTurn(playerId);
        }
        this.loopGuard.reset();
        return;
      }
      this.host.takeBottom(playerId);
      this.loopGuard.reset();
      return;
    }

    if (state.current.length === 0) {
      const lead = pickLead(player, state.trump);
      if (lead) {
        this.host.playMain(playerId, lead);
        return;
      }
      this.host.skipMainTurn(playerId);
      return;
    }

    const target = state.current[state.current.length - 1];
    const lowest = lowestRankOf(state.deckSize);
    const beater = pickBeater(player.hand, target, state.trump, lowest);

    if (beater) {
      // Rare mistake: take or play a non-beater instead of the smart beat.
      if (this.shouldMistake()) {
        const nonBeaters = player.hand.filter(
          (c) => !pickBeater([c], target, state.trump, lowest)
        );
        if (nonBeaters.length > 0 && this.rng() < 0.5) {
          const bad = nonBeaters[Math.floor(this.rng() * nonBeaters.length)];
          this.host.playMain(playerId, bad);
          return;
        }
        this.host.takeBottom(playerId);
        return;
      }
      this.host.playMain(playerId, beater);
      return;
    }
    this.host.takeBottom(playerId);
  }

  // ——— Huyovye ———

  /**
   * CPU seats fulfill pending huyovye gifts with the worst-to-keep heuristic.
   * Obligations a giver cannot legally fill (only last card left) are dropped
   * so the phase cannot deadlock (same rule for humans via giveHuyovyeCard).
   */
  runHuyovye(): void {
    const state = this.host.getState();
    if (state.phase !== Phase.Huyovye) return;
    if (this.huyovyeRunning) return;
    this.huyovyeRunning = true;
    try {
      let guard = 200;
      while (guard-- > 0) {
        const snapshot = this.host.getState();
        const next = snapshot.huyovyeQueue.find((q) => {
          const giver = this.host.findPlayer(q.giverId);
          return giver.isCPU;
        });
        if (!next) break;

        const giver = this.host.findPlayer(next.giverId);
        const card = pickWorstHuyovyeCard(giver.hand, snapshot.trump);
        if (!card) {
          // Cannot give without last card — drop this queue entry only.
          this.host.dropHuyovyeObligation(next.giverId, next.receiverId);
          continue;
        }
        this.host.giveHuyovyeCard(next.giverId, next.receiverId, card);
      }

      const drained = this.host.getState();
      if (
        drained.phase === Phase.Huyovye &&
        drained.huyovyeQueue.length === 0
      ) {
        this.host.finishHuyovye();
      }
    } finally {
      this.huyovyeRunning = false;
    }
  }
}
