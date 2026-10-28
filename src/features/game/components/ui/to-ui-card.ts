import { Card, CardProps } from "../../components/card/card.props";
import { EngineCard } from "../../engine";

/** Engine card → UI card prop shape. */
export function toUiCard(card: EngineCard, isStump = false): Card {
  return { rank: card.rank, suit: card.suit, isStump };
}

export type { CardProps };

/** Deterministic UI key for a hand slot. */
export function uiCardKey(card: Card, index = 0): string {
  return `${card.rank}-${card.suit}-${card.isStump ? "s" : "h"}-${index}`;
}
