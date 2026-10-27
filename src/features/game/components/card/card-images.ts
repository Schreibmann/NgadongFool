import { CardRanks, CardSuits } from "./card.props";

const BACK = require("@assets/cards/back.png");

type LocalImage = number;

const FACE: Record<CardSuits, Record<CardRanks, LocalImage>> = {
  [CardSuits.Clubs]: {
    [CardRanks.ace]: require("@assets/cards/clubs-ace.png"),
    [CardRanks.six]: require("@assets/cards/clubs-six.png"),
    [CardRanks.seven]: require("@assets/cards/clubs-seven.png"),
    [CardRanks.eight]: require("@assets/cards/clubs-eight.png"),
    [CardRanks.nine]: require("@assets/cards/clubs-nine.png"),
    [CardRanks.ten]: require("@assets/cards/clubs-ten.png"),
    [CardRanks.jack]: require("@assets/cards/clubs-jack.png"),
    [CardRanks.queen]: require("@assets/cards/clubs-queen.png"),
    [CardRanks.king]: require("@assets/cards/clubs-king.png"),
  },
  [CardSuits.Diamonds]: {
    [CardRanks.ace]: require("@assets/cards/diamonds-ace.png"),
    [CardRanks.six]: require("@assets/cards/diamonds-six.png"),
    [CardRanks.seven]: require("@assets/cards/diamonds-seven.png"),
    [CardRanks.eight]: require("@assets/cards/diamonds-eight.png"),
    [CardRanks.nine]: require("@assets/cards/diamonds-nine.png"),
    [CardRanks.ten]: require("@assets/cards/diamonds-ten.png"),
    [CardRanks.jack]: require("@assets/cards/diamonds-jack.png"),
    [CardRanks.queen]: require("@assets/cards/diamonds-queen.png"),
    [CardRanks.king]: require("@assets/cards/diamonds-king.png"),
  },
  [CardSuits.Hearts]: {
    [CardRanks.ace]: require("@assets/cards/hearts-ace.png"),
    [CardRanks.six]: require("@assets/cards/hearts-six.png"),
    [CardRanks.seven]: require("@assets/cards/hearts-seven.png"),
    [CardRanks.eight]: require("@assets/cards/hearts-eight.png"),
    [CardRanks.nine]: require("@assets/cards/hearts-nine.png"),
    [CardRanks.ten]: require("@assets/cards/hearts-ten.png"),
    [CardRanks.jack]: require("@assets/cards/hearts-jack.png"),
    [CardRanks.queen]: require("@assets/cards/hearts-queen.png"),
    [CardRanks.king]: require("@assets/cards/hearts-king.png"),
  },
  [CardSuits.Spades]: {
    [CardRanks.ace]: require("@assets/cards/spades-ace.png"),
    [CardRanks.six]: require("@assets/cards/spades-six.png"),
    [CardRanks.seven]: require("@assets/cards/spades-seven.png"),
    [CardRanks.eight]: require("@assets/cards/spades-eight.png"),
    [CardRanks.nine]: require("@assets/cards/spades-nine.png"),
    [CardRanks.ten]: require("@assets/cards/spades-ten.png"),
    [CardRanks.jack]: require("@assets/cards/spades-jack.png"),
    [CardRanks.queen]: require("@assets/cards/spades-queen.png"),
    [CardRanks.king]: require("@assets/cards/spades-king.png"),
  },
};

export function getCardImageSource(
  suit: CardSuits,
  rank: CardRanks,
  opened: boolean,
): LocalImage {
  if (!opened) {
    return BACK;
  }
  return FACE[suit][rank];
}
