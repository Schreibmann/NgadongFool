import type { GameState } from "../types";
import { cardKey } from "../deck";

/** Identical Main fingerprints in a row before forcing takeBottom / flip. */
export const MAIN_LOOP_STREAK_LIMIT = 28;

/**
 * Detects Main soft-locks (e.g. two CPUs forever trading the same cards) by
 * fingerprinting the board. The fingerprint excludes activePlayerId so A↔B
 * no-op turn spins still accumulate a streak and trigger a forced takeBottom.
 */
export class MainLoopGuard {
  private fingerprint: string | null = null;
  private streak = 0;

  private static boardFingerprint(state: GameState): string {
    const hands = state.players
      .map((p) => {
        const keys = p.hand.map(cardKey).sort().join(",");
        return `${p.id}:${p.active ? 1 : 0}:${keys}`;
      })
      .join("|");
    const current = state.current.map(cardKey).join(",");
    return [
      state.discardPendingFlip ? 1 : 0,
      state.lastPlayedById ?? "n",
      current,
      hands,
    ].join(";");
  }

  /** Record the current board; true when the loop must be broken. */
  note(state: GameState): boolean {
    const fp = MainLoopGuard.boardFingerprint(state);
    if (fp === this.fingerprint) {
      this.streak += 1;
    } else {
      this.fingerprint = fp;
      this.streak = 1;
    }
    return this.streak >= MAIN_LOOP_STREAK_LIMIT;
  }

  reset(): void {
    this.fingerprint = null;
    this.streak = 0;
  }
}
