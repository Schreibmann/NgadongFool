import { Card, CardRanks, CardSuits } from "../components/card/card.props"

export const CardWidth = 96
export const cardHeight = 150

export const CLUBS: Card[] = [
  {
    rank: CardRanks.six,
    suit: CardSuits.Clubs,
    offset: {
      top: 0,
      left: CardWidth * -5,
    },
  },
  {
    rank: CardRanks.seven,
    suit: CardSuits.Clubs,
    offset: {
      top: 0,
      left: CardWidth * -6,
    },
  },
  {
    rank: CardRanks.eight,
    suit: CardSuits.Clubs,
    offset: {
      top: 0,
      left: CardWidth * -7 - 1,
    },
  },
  {
    rank: CardRanks.nine,
    suit: CardSuits.Clubs,
    offset: {
      top: 0,
      left: CardWidth * -8 - 1,
    },
  },
  {
    rank: CardRanks.ten,
    suit: CardSuits.Clubs,
    offset: {
      top: 0,
      left: CardWidth * -9 - 1,
    },
  },
  {
    rank: CardRanks.jack,
    suit: CardSuits.Clubs,
    offset: {
      top: 0,
      left: CardWidth * -10 - 2,
    },
  },
  {
    rank: CardRanks.queen,
    suit: CardSuits.Clubs,
    offset: {
      top: 0,
      left: CardWidth * -11 - 2,
    },
  },
  {
    rank: CardRanks.king,
    suit: CardSuits.Clubs,
    offset: {
      top: 0,
      left: CardWidth * -12 - 2,
    },
  },
  {
    rank: CardRanks.ace,
    suit: CardSuits.Clubs,
    offset: {
      top: 0,
      left: 0,
    },
  },
]

export const DIAMONDS: Card[] = [
  {
    rank: CardRanks.six,
    suit: CardSuits.Diamonds,
    offset: {
      top: cardHeight * -1,
      left: CardWidth * -5,
    },
  },
  {
    rank: CardRanks.seven,
    suit: CardSuits.Diamonds,
    offset: {
      top: cardHeight * -1,
      left: CardWidth * -6,
    },
  },
  {
    rank: CardRanks.eight,
    suit: CardSuits.Diamonds,
    offset: {
      top: cardHeight * -1,
      left: CardWidth * -7 - 1,
    },
  },
  {
    rank: CardRanks.nine,
    suit: CardSuits.Diamonds,
    offset: {
      top: cardHeight * -1,
      left: CardWidth * -8 - 1,
    },
  },
  {
    rank: CardRanks.ten,
    suit: CardSuits.Diamonds,
    offset: {
      top: cardHeight * -1,
      left: CardWidth * -9 - 1,
    },
  },
  {
    rank: CardRanks.jack,
    suit: CardSuits.Diamonds,
    offset: {
      top: cardHeight * -1,
      left: CardWidth * -10 - 2,
    },
  },
  {
    rank: CardRanks.queen,
    suit: CardSuits.Diamonds,
    offset: {
      top: cardHeight * -1,
      left: CardWidth * -11 - 2,
    },
  },
  {
    rank: CardRanks.king,
    suit: CardSuits.Diamonds,
    offset: {
      top: cardHeight * -1,
      left: CardWidth * -12 - 2,
    },
  },
  {
    rank: CardRanks.ace,
    suit: CardSuits.Diamonds,
    offset: {
      top: cardHeight * -1,
      left: 0,
    },
  },
]

export const HEARTS: Card[] = [
  {
    rank: CardRanks.six,
    suit: CardSuits.Hearts,
    offset: {
      top: cardHeight * -2,
      left: CardWidth * -5,
    },
  },
  {
    rank: CardRanks.seven,
    suit: CardSuits.Hearts,
    offset: {
      top: cardHeight * -2,
      left: CardWidth * -6,
    },
  },
  {
    rank: CardRanks.eight,
    suit: CardSuits.Hearts,
    offset: {
      top: cardHeight * -2,
      left: CardWidth * -7 - 1,
    },
  },
  {
    rank: CardRanks.nine,
    suit: CardSuits.Hearts,
    offset: {
      top: cardHeight * -2,
      left: CardWidth * -8 - 1,
    },
  },
  {
    rank: CardRanks.ten,
    suit: CardSuits.Hearts,
    offset: {
      top: cardHeight * -2,
      left: CardWidth * -9 - 1,
    },
  },
  {
    rank: CardRanks.jack,
    suit: CardSuits.Hearts,
    offset: {
      top: cardHeight * -2,
      left: CardWidth * -10 - 2,
    },
  },
  {
    rank: CardRanks.queen,
    suit: CardSuits.Hearts,
    offset: {
      top: cardHeight * -2,
      left: CardWidth * -11 - 2,
    },
  },
  {
    rank: CardRanks.king,
    suit: CardSuits.Hearts,
    offset: {
      top: cardHeight * -2,
      left: CardWidth * -12 - 2,
    },
  },
  {
    rank: CardRanks.ace,
    suit: CardSuits.Hearts,
    offset: {
      top: cardHeight * -2,
      left: 0,
    },
  },
]

export const SPADES: Card[] = [
  {
    rank: CardRanks.six,
    suit: CardSuits.Spades,
    offset: {
      top: cardHeight * -3,
      left: CardWidth * -5,
    },
  },
  {
    rank: CardRanks.seven,
    suit: CardSuits.Spades,
    offset: {
      top: cardHeight * -3,
      left: CardWidth * -6,
    },
  },
  {
    rank: CardRanks.eight,
    suit: CardSuits.Spades,
    offset: {
      top: cardHeight * -3,
      left: CardWidth * -7 - 1,
    },
  },
  {
    rank: CardRanks.nine,
    suit: CardSuits.Spades,
    offset: {
      top: cardHeight * -3,
      left: CardWidth * -8 - 1,
    },
  },
  {
    rank: CardRanks.ten,
    suit: CardSuits.Spades,
    offset: {
      top: cardHeight * -3,
      left: CardWidth * -9 - 1,
    },
  },
  {
    rank: CardRanks.jack,
    suit: CardSuits.Spades,
    offset: {
      top: cardHeight * -3,
      left: CardWidth * -10 - 2,
    },
  },
  {
    rank: CardRanks.queen,
    suit: CardSuits.Spades,
    offset: {
      top: cardHeight * -3,
      left: CardWidth * -11 - 2,
    },
  },
  {
    rank: CardRanks.king,
    suit: CardSuits.Spades,
    offset: {
      top: cardHeight * -3,
      left: CardWidth * -12 - 2,
    },
  },
  {
    rank: CardRanks.ace,
    suit: CardSuits.Spades,
    offset: {
      top: cardHeight * -3,
      left: 0,
    },
  },
]

export const CardDeck36 = [...SPADES, ...CLUBS, ...DIAMONDS, ...HEARTS]
