import { createDeck, createDeck36 } from "../deck";
import { CardRanks, CardSuits, lowestRankOf } from "../cards";
import { canBeat, canPlaceOnTop, firstLegalPrepareTarget } from "../rules";
import { GameEngine } from "../engine";
import { EnginePlayer, Foul, Phase, SeatConfig } from "../types";
import { drainPrepare } from "./prepare-helpers";

const seats3: SeatConfig[] = [
  { id: 1, name: "A", isCPU: true },
  { id: 2, name: "B", isCPU: true },
  { id: 3, name: "C", isCPU: false },
];

function player(
  id: number,
  hand: EnginePlayer["hand"],
  opts?: Partial<EnginePlayer>,
): EnginePlayer {
  return {
    id,
    name: `P${id}`,
    isCPU: id !== 3,
    hand,
    stumps: [],
    huyovye: 0,
    active: true,
    stumpsRevealed: false,
    ...opts,
  };
}

const card = (rank: CardRanks, suit: CardSuits) => ({ rank, suit });

describe("deck 52: composition", () => {
  it("createDeck(52) = 4 suits × 13 ranks (2..ace), no duplicates", () => {
    const deck = createDeck(52);
    expect(deck).toHaveLength(52);
    const keys = deck.map((c) => `${c.suit}-${c.rank}`);
    expect(new Set(keys).size).toBe(52);
    const ranks = new Set(deck.map((c) => c.rank));
    for (let r = CardRanks.two; r <= CardRanks.ace; r++) {
      expect(ranks.has(r)).toBe(true);
    }
  });

  it("createDeck(36) keeps the canonical deck; default is 36", () => {
    expect(createDeck()).toHaveLength(36);
    expect(createDeck36()).toEqual(createDeck(36));
  });

  it("lowestRankOf maps deck size to its pip floor", () => {
    expect(lowestRankOf(36)).toBe(CardRanks.six);
    expect(lowestRankOf(52)).toBe(CardRanks.two);
  });
});

describe("deck 52: rules with lowestRank = two", () => {
  const two = card(CardRanks.two, CardSuits.Clubs);
  const ace = card(CardRanks.ace, CardSuits.Hearts);

  it("two wraps onto ace; three onto two; two not onto king", () => {
    expect(canPlaceOnTop(ace, two, CardRanks.two)).toBe(true);
    expect(canPlaceOnTop(two, card(CardRanks.three, CardSuits.Clubs), CardRanks.two)).toBe(true);
    expect(canPlaceOnTop(card(CardRanks.king, CardSuits.Clubs), two, CardRanks.two)).toBe(false);
    // Default (36-deck) semantics unchanged: a two has no wrap.
    expect(canPlaceOnTop(ace, two)).toBe(false);
  });

  it("two cannot beat an ace in Main; default six rule unchanged", () => {
    expect(canBeat(ace, two, null, CardRanks.two)).toBe(false);
    expect(canBeat(ace, two, null)).toBe(false); // six rule: same shape
    const three = card(CardRanks.three, CardSuits.Clubs);
    expect(canBeat(two, three, null, CardRanks.two)).toBe(true);
  });

  it("firstLegalPrepareTarget honors the 52-deck wrap", () => {
    const players = [
      player(1, [ace], { isCPU: true }),
      player(2, [card(CardRanks.king, CardSuits.Clubs)], { isCPU: true }),
      player(3, [card(CardRanks.seven, CardSuits.Diamonds)], { isCPU: false }),
    ];
    expect(
      firstLegalPrepareTarget(players, 3, two, CardRanks.two)?.id,
    ).toBe(1);
    // Default (36-deck) semantics: no wrap for a two.
    expect(firstLegalPrepareTarget(players, 3, two)).toBeNull();
  });
});

describe("deck 52: engine", () => {
  it("deals 52-deck state: deckSize carried, 43 cards remain", () => {
    const eng = new GameEngine({ seats: seats3, deckSize: 52, seed: 7 });
    const s = eng.getSnapshot();
    expect(s.deckSize).toBe(52);
    expect(s.deck).toHaveLength(52 - 9);
    // Every card of the 52-deck is in play exactly once.
    const all = [
      ...s.players.flatMap((p) => p.stumps),
      ...s.players.flatMap((p) => p.hand),
      ...s.deck,
    ];
    expect(all).toHaveLength(52);
    expect(new Set(all.map((c) => `${c.suit}-${c.rank}`)).size).toBe(52);
    // Low ranks actually enter play.
    expect(all.some((c) => c.rank === CardRanks.two)).toBe(true);
  });

  it("prepare drains fully to Huyovye without errors (3 players)", () => {
    const eng = new GameEngine({ seats: seats3, deckSize: 52, seed: 11 });
    drainPrepare(eng);
    const s = eng.getSnapshot();
    // The helper finishes an empty gift queue → Main; deck must be exhausted.
    expect(s.deck).toHaveLength(0);
    expect([Phase.Huyovye, Phase.Main]).toContain(s.phase);
  });

  it("two on opponent ace awards ReceivedLowestOnHighest", () => {
    const eng = new GameEngine({ seats: seats3, deckSize: 52, seed: 3 });
    const two = card(CardRanks.two, CardSuits.Clubs);
    const ace = card(CardRanks.ace, CardSuits.Hearts);
    eng.loadTestFixture({
      phase: Phase.Prepare,
      activePlayerId: 3,
      prepareHeld: two,
      deck: [card(CardRanks.nine, CardSuits.Diamonds)],
      players: [
        player(1, [ace], { isCPU: true, name: "A" }),
        player(2, [card(CardRanks.king, CardSuits.Clubs)], { isCPU: true, name: "B" }),
        player(3, [card(CardRanks.eight, CardSuits.Spades)], { isCPU: false, name: "C" }),
      ],
    });

    expect(eng.placePrepare(3, 1)).toBe(true);
    const s = eng.getSnapshot();
    expect(s.players.find((p) => p.id === 1)?.hand[0]).toEqual(two);
    expect(s.lastFoul).toEqual({
      playerId: 1,
      foul: Foul.ReceivedLowestOnHighest,
    });
  });

  it("two cannot beat an ace in Main (IllegalBeat)", () => {
    const eng = new GameEngine({ seats: seats3, deckSize: 52, seed: 5 });
    eng.loadTestFixture({
      phase: Phase.Main,
      activePlayerId: 3,
      trump: null,
      current: [card(CardRanks.ace, CardSuits.Hearts)],
      players: [
        player(1, [card(CardRanks.king, CardSuits.Clubs)], { isCPU: true }),
        player(2, [card(CardRanks.ten, CardSuits.Hearts)], { isCPU: true }),
        player(3, [card(CardRanks.two, CardSuits.Hearts)], { isCPU: false }),
      ],
    });

    expect(eng.playMain(3, card(CardRanks.two, CardSuits.Hearts))).toBe(false);
    const s = eng.getSnapshot();
    expect(s.lastFoul?.foul).toBe(Foul.IllegalBeat);
    expect(s.current).toHaveLength(1);
  });
});
