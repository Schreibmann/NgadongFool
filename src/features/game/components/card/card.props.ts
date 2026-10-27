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

export interface Card {
  rank: CardRanks;
  suit: CardSuits;
  isStump?: boolean;
}

export interface CardProps extends Card {
  opened: boolean;
  dragging?: boolean;
  animation?: boolean;
}
