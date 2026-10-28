import { CardRanks, CardSuits } from "../cards";
import {
  canBeat,
  canPlaceOnTop,
  huyovyeDumpScore,
  isUnbeatableMain,
  pickWorstHuyovyeCard,
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

  it("ace-beats-king-trump: A♥ beats K♥ when hearts are trump", () => {
    expect(
      canBeat(
        { rank: CardRanks.king, suit: CardSuits.Hearts },
        { rank: CardRanks.ace, suit: CardSuits.Hearts },
        trump,
      ),
    ).toBe(true);
  });

  it("playing trump ace as beater is not blocked by unbeatable-ace check", () => {
    // Regression: unbeatable applies to TARGET only, never the beater.
    expect(
      canBeat(
        { rank: CardRanks.six, suit: CardSuits.Clubs },
        { rank: CardRanks.ace, suit: CardSuits.Hearts },
        trump,
      ),
    ).toBe(true);
    expect(
      canBeat(
        { rank: CardRanks.jack, suit: CardSuits.Hearts },
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

describe("huyovye dump heuristic", () => {
  const trump = CardSuits.Hearts;

  it("prefers low off-suit junk over trump and unbeatable ace", () => {
    const junk = { rank: CardRanks.six, suit: CardSuits.Clubs };
    const trumpKing = { rank: CardRanks.king, suit: CardSuits.Hearts };
    const trumpAce = { rank: CardRanks.ace, suit: CardSuits.Hearts };
    expect(huyovyeDumpScore(junk, trump)).toBeGreaterThan(
      huyovyeDumpScore(trumpKing, trump),
    );
    expect(huyovyeDumpScore(trumpKing, trump)).toBeGreaterThan(
      huyovyeDumpScore(trumpAce, trump),
    );
  });

  it("pickWorstHuyovyeCard returns null for last card", () => {
    expect(
      pickWorstHuyovyeCard(
        [{ rank: CardRanks.six, suit: CardSuits.Clubs }],
        trump,
      ),
    ).toBeNull();
  });

  it("pickWorstHuyovyeCard dumps lowest off-suit, deterministic on ties", () => {
    const pick = pickWorstHuyovyeCard(
      [
        { rank: CardRanks.ace, suit: CardSuits.Spades },
        { rank: CardRanks.six, suit: CardSuits.Diamonds },
        { rank: CardRanks.six, suit: CardSuits.Clubs },
        { rank: CardRanks.king, suit: CardSuits.Hearts },
      ],
      trump,
    );
    // Both sixes score equal; clubs < diamonds → clubs wins tie-break
    expect(pick).toEqual({
      rank: CardRanks.six,
      suit: CardSuits.Clubs,
    });
  });
});

