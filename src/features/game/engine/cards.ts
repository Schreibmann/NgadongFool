/**
 * Card domain primitives. This module owns the canonical rank/suit enums;
 * UI files re-export them (`components/card/card.props`). Nothing here may
 * import from UI (`components/**`, React Native, etc.).
 */

export enum CardRanks {
  six = 6,
  seven = 7,
  eight = 8,
  nine = 9,
  ten = 10,
  jack = 11,
  queen = 12,
  king = 13,
  ace = 14,
}

export enum CardSuits {
  Diamonds = "diamonds",
  Hearts = "hearts",
  Clubs = "clubs",
  Spades = "spades",
}
