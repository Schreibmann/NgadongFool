import { Card, CardRanks, CardSuits } from "@features/game/components/card/card.props";

export const CardWidth = 96;
export const cardHeight = 150;

const ranks: CardRanks[] = [
  CardRanks.six,
  CardRanks.seven,
  CardRanks.eight,
  CardRanks.nine,
  CardRanks.ten,
  CardRanks.jack,
  CardRanks.queen,
  CardRanks.king,
  CardRanks.ace,
];

function suitCards(suit: CardSuits): Card[] {
  return ranks.map((rank) => ({ rank, suit }));
}

export const CLUBS = suitCards(CardSuits.Clubs);
export const DIAMONDS = suitCards(CardSuits.Diamonds);
export const HEARTS = suitCards(CardSuits.Hearts);
export const SPADES = suitCards(CardSuits.Spades);

export const CardDeck36 = [...SPADES, ...CLUBS, ...DIAMONDS, ...HEARTS];

export const SCREENS: { HOME: "Home"; PLAYGROUND: "Playground" } = {
  HOME: "Home",
  PLAYGROUND: "Playground",
};
