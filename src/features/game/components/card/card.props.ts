/**
 * UI-facing card props. The canonical `CardRanks` / `CardSuits` enums live in
 * the engine domain (`features/game/engine/cards`) and are re-exported here so
 * UI code keeps one comfortable import surface.
 */
export { CardRanks, CardSuits } from "../../engine/cards";

import type { CardRanks, CardSuits } from "../../engine/cards";

export interface Card {
  rank: CardRanks;
  suit: CardSuits;
  isStump?: boolean;
}

export interface CardProps extends Card {
  opened: boolean;
  dragging?: boolean;
  animation?: boolean;
  /** Override default card width (CardWidth). */
  width?: number;
  /** Override default card height (cardHeight). */
  height?: number;
}
