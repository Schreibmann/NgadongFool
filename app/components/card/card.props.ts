import { ViewStyle } from "react-native"
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
  /**
   * Card rank
   */
  rank: CardRanks

  /**
   * Card suit
   */
  suit: CardSuits

  /**
   * Offset to cut image sprite
   */
  offset: {
    top: number
    left: number
  }

  isStump?: boolean
}

export interface CardProps extends Card {
  /**
   * Condition to show face or jacket
   */
   opened: boolean
  /**
   * Component is being dragged flag
   */
  dragging?: boolean
  /**
   * No animation if false
   */
  animation?: boolean
}
