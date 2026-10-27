import { EnginePlayer } from "../types";
import {
  clockwiseFromExclusive,
  firstClockwiseWhere,
  nextClockwiseId,
} from "../seats";
import { canPlaceOnTop, topOf } from "../rules";
import { CardRanks, CardSuits } from "../../components/card/card.props";

function p(
  id: number,
  hand: EnginePlayer["hand"] = [],
): EnginePlayer {
  return {
    id,
    name: `P${id}`,
    isCPU: true,
    hand,
    stumps: [],
    huyovye: 0,
    active: true,
    stumpsRevealed: false,
  };
}

describe("clockwise helpers", () => {
  const players = [p(1), p(2), p(3), p(4)];

  it("next clockwise wraps", () => {
    expect(nextClockwiseId(players, 4)).toBe(1);
    expect(nextClockwiseId(players, 1)).toBe(2);
  });

  it("circle from drawer ends with drawer", () => {
    const ordered = clockwiseFromExclusive(players, 2).map((x) => x.id);
    expect(ordered).toEqual([3, 4, 1, 2]);
  });

  it("first clockwise legal target prefers earlier seats", () => {
    const table = [
      p(1, [{ rank: CardRanks.ace, suit: CardSuits.Clubs }]),
      p(2, [{ rank: CardRanks.king, suit: CardSuits.Hearts }]),
      p(3, [{ rank: CardRanks.ace, suit: CardSuits.Diamonds }]),
    ];
    const six = { rank: CardRanks.six, suit: CardSuits.Spades };
    // drawer = 2; circle: 3, 1, 2 — both 3 and 1 accept six→ace; first is 3
    const first = firstClockwiseWhere(table, 2, (pl) =>
      canPlaceOnTop(topOf(pl), six),
    );
    expect(first?.id).toBe(3);
  });

  it("nextClockwiseId skips inactive seats after exit", () => {
    const table = [p(1), p(2), p(3), p(4)];
    table[1].active = false; // seat 2 exited
    expect(nextClockwiseId(table, 1)).toBe(3);
    expect(nextClockwiseId(table, 3)).toBe(4);
    expect(nextClockwiseId(table, 4)).toBe(1);
  });
});
