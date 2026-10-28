/**
 * Card domain primitives. This module owns the canonical rank/suit enums;
 * UI files re-export them (`components/card/card.props`). Nothing here may
 * import from UI (`components/**`, React Native, etc.).
 */

export enum CardRanks {
  two = 2,
  three = 3,
  four = 4,
  five = 5,
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

/** Deck sizes the engine supports. 36 is the canonical folk deck. */
export type DeckSize = 36 | 52;

export const DEFAULT_DECK_SIZE: DeckSize = 36;

/**
 * Lowest rank present in a deck of the given size. The lowest card carries
 * the "wrap onto ace" semantics of the folk six (see rules.canPlaceOnTop):
 * 36-card deck → six, 52-card deck → two.
 */
export function lowestRankOf(deckSize: DeckSize): CardRanks {
  return deckSize === 52 ? CardRanks.two : CardRanks.six;
}
