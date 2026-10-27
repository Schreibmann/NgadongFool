import { CardRanks, CardSuits } from "../../components/card/card.props";
import {
  canBeat,
  canPlaceOnTop,
  isUnbeatableMain,
  trumpFromLastDeckCard,
} from "../rules";

describe("prepare place rules", () => {
  it("six places on ace", () => {
    expect(
      canPlaceOnTop(
        { rank: CardRanks.ace, suit: CardSuits.Hearts },
        { rank: CardRanks.six, suit: CardSuits.Clubs },
      ),
    ).toBe(true);
  });

  it("places on rank - 1", () => {
    expect(
      canPlaceOnTop(
        { rank: CardRanks.nine, suit: CardSuits.Spades },
        { rank: CardRanks.ten, suit: CardSuits.Hearts },
      ),
    ).toBe(true);
  });

  it("rejects non-adjacent", () => {
    expect(
      canPlaceOnTop(
        { rank: CardRanks.nine, suit: CardSuits.Spades },
        { rank: CardRanks.jack, suit: CardSuits.Hearts },
      ),
    ).toBe(false);
  });
});

describe("trump from last deck card", () => {
  it("spades → no trump", () => {
    expect(
      trumpFromLastDeckCard({
        rank: CardRanks.king,
        suit: CardSuits.Spades,
      }),
    ).toBeNull();
  });

  it("other suit → that trump", () => {
    expect(
      trumpFromLastDeckCard({
        rank: CardRanks.six,
        suit: CardSuits.Diamonds,
      }),
    ).toBe(CardSuits.Diamonds);
  });
});

describe("main beat rules", () => {
  const trump = CardSuits.Hearts;

  it("same suit higher beats", () => {
    expect(
      canBeat(
        { rank: CardRanks.nine, suit: CardSuits.Clubs },
        { rank: CardRanks.jack, suit: CardSuits.Clubs },
        trump,
      ),
    ).toBe(true);
  });

  it("trump beats non-spade non-trump", () => {
    expect(
      canBeat(
        { rank: CardRanks.king, suit: CardSuits.Clubs },
        { rank: CardRanks.six, suit: CardSuits.Hearts },
        trump,
      ),
    ).toBe(true);
  });

  it("trump cannot beat spades", () => {
    expect(
      canBeat(
        { rank: CardRanks.nine, suit: CardSuits.Spades },
        { rank: CardRanks.ace, suit: CardSuits.Hearts },
        trump,
      ),
    ).toBe(false);
  });

  it("higher spade beats spade", () => {
    expect(
      canBeat(
        { rank: CardRanks.nine, suit: CardSuits.Spades },
        { rank: CardRanks.king, suit: CardSuits.Spades },
        trump,
      ),
    ).toBe(true);
  });

  it("spade ace is unbeatable", () => {
    expect(
      isUnbeatableMain(
        { rank: CardRanks.ace, suit: CardSuits.Spades },
        trump,
      ),
    ).toBe(true);
    expect(
      canBeat(
        { rank: CardRanks.ace, suit: CardSuits.Spades },
        { rank: CardRanks.ace, suit: CardSuits.Hearts },
        trump,
      ),
    ).toBe(false);
  });

  it("trump ace is unbeatable", () => {
    expect(
      isUnbeatableMain(
        { rank: CardRanks.ace, suit: CardSuits.Hearts },
        trump,
      ),
    ).toBe(true);
  });

  it("six does not beat ace in main", () => {
    expect(
      canBeat(
        { rank: CardRanks.ace, suit: CardSuits.Clubs },
        { rank: CardRanks.six, suit: CardSuits.Clubs },
        trump,
      ),
    ).toBe(false);
  });
});
