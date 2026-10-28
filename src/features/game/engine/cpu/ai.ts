import { CardSuits } from "../cards";
import { EngineCard, EnginePlayer } from "../types";
import { canBeat } from "../rules";

/** Chance a CPU intentionally fouls / misplays instead of the smart legal move. */
export const CPU_MISTAKE_RATE = 0.1;

/**
 * Lead choice: lowest non-trump card (or lowest overall in a no-trump game).
 * Empty hand → null.
 */
export function pickLead(
  player: EnginePlayer,
  trump: CardSuits | null,
): EngineCard | null {
  if (player.hand.length === 0) return null;
  const nonTrump = player.hand
    .filter((c) => trump === null || c.suit !== trump)
    .sort((a, b) => a.rank - b.rank);
  if (nonTrump[0]) return nonTrump[0];
  return [...player.hand].sort((a, b) => a.rank - b.rank)[0];
}

/**
 * Beat choice: cheapest legal beater, preferring non-trumps (tie by rank).
 * Null when the hand cannot beat the target.
 */
export function pickBeater(
  hand: EngineCard[],
  target: EngineCard,
  trump: CardSuits | null,
): EngineCard | null {
  const beaters = hand
    .filter((c) => canBeat(target, c, trump))
    .sort((a, b) => {
      const aTrump = trump != null && a.suit === trump ? 1 : 0;
      const bTrump = trump != null && b.suit === trump ? 1 : 0;
      if (aTrump !== bTrump) return aTrump - bTrump;
      return a.rank - b.rank;
    });
  return beaters[0] ?? null;
}
