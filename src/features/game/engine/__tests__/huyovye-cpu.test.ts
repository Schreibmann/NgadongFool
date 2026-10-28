import { CardRanks, CardSuits } from "../cards";
import { GameEngine } from "../engine";
import { type EnginePlayer, Phase, type SeatConfig } from "../types";

const seats4: SeatConfig[] = [
  { id: 1, name: "A", isCPU: true },
  { id: 2, name: "B", isCPU: true },
  { id: 3, name: "C", isCPU: true },
  { id: 100, name: "Human", isCPU: false },
];

function basePlayers(
  overrides: Partial<Record<number, Partial<EnginePlayer>>> = {}
): EnginePlayer[] {
  return seats4.map((s): EnginePlayer => {
    const base: EnginePlayer = {
      id: s.id,
      name: s.name,
      isCPU: s.isCPU,
      hand: [
        { rank: CardRanks.six, suit: CardSuits.Clubs },
        { rank: CardRanks.seven, suit: CardSuits.Clubs },
        { rank: CardRanks.eight, suit: CardSuits.Clubs },
      ],
      stumps: [],
      huyovye: 0,
      active: true,
      stumpsRevealed: false,
    };
    const patch = overrides[s.id];
    if (!patch) {
      return base;
    }
    return { ...base, ...patch };
  });
}

describe("CPU huyovye completion", () => {
  it("0 huyovye: enterHuyovye advances straight to main", () => {
    const eng = new GameEngine({ seats: seats4, seed: 10 });
    eng.loadHuyovyeFixture({
      players: basePlayers(),
      trump: CardSuits.Hearts,
      queue: [],
      tookLastDeckCardId: 1,
    });
    // Mimic empty-queue enter path
    expect(eng.finishHuyovye()).toBe(true);
    expect(eng.getSnapshot().phase).toBe(Phase.Main);
  });

  it("1 huyovye: CPU givers auto-clear and reach main when only CPUs owe gifts", () => {
    const eng = new GameEngine({ seats: seats4, seed: 11 });
    // Human fouled once → each of 3 CPUs owes one gift to human
    eng.loadHuyovyeFixture({
      players: basePlayers(),
      trump: CardSuits.Hearts,
      queue: [
        { giverId: 1, receiverId: 100 },
        { giverId: 2, receiverId: 100 },
        { giverId: 3, receiverId: 100 },
      ],
      tookLastDeckCardId: 1,
    });
    eng.runCpuHuyovye();
    const s = eng.getSnapshot();
    expect(s.phase).toBe(Phase.Main);
    expect(s.huyovyeQueue).toHaveLength(0);
    expect(s.players.find((p) => p.id === 100)!.hand.length).toBe(6);
  });

  it("N huyovye: CPU drains many gifts then advances to main", () => {
    const eng = new GameEngine({ seats: seats4, seed: 12 });
    const queue: { giverId: number; receiverId: number }[] = [];
    for (let n = 0; n < 3; n++) {
      queue.push(
        { giverId: 1, receiverId: 100 },
        { giverId: 2, receiverId: 100 },
        { giverId: 3, receiverId: 100 }
      );
    }
    eng.loadHuyovyeFixture({
      players: basePlayers({
        1: {
          hand: [
            { rank: CardRanks.six, suit: CardSuits.Clubs },
            { rank: CardRanks.seven, suit: CardSuits.Diamonds },
            { rank: CardRanks.eight, suit: CardSuits.Clubs },
            { rank: CardRanks.nine, suit: CardSuits.Clubs },
            { rank: CardRanks.ten, suit: CardSuits.Clubs },
          ],
        },
        2: {
          hand: [
            { rank: CardRanks.six, suit: CardSuits.Diamonds },
            { rank: CardRanks.seven, suit: CardSuits.Hearts },
            { rank: CardRanks.eight, suit: CardSuits.Diamonds },
            { rank: CardRanks.nine, suit: CardSuits.Diamonds },
            { rank: CardRanks.ten, suit: CardSuits.Diamonds },
          ],
        },
        3: {
          hand: [
            { rank: CardRanks.six, suit: CardSuits.Spades },
            { rank: CardRanks.seven, suit: CardSuits.Spades },
            { rank: CardRanks.eight, suit: CardSuits.Hearts },
            { rank: CardRanks.nine, suit: CardSuits.Hearts },
            { rank: CardRanks.ten, suit: CardSuits.Hearts },
          ],
        },
      }),
      trump: CardSuits.Hearts,
      queue,
      tookLastDeckCardId: 2,
    });
    eng.runCpuHuyovye();
    const s = eng.getSnapshot();
    expect(s.phase).toBe(Phase.Main);
    expect(s.huyovyeQueue).toHaveLength(0);
  });

  it("does not deadlock when CPU has only last card left", () => {
    const eng = new GameEngine({ seats: seats4, seed: 13 });
    eng.loadHuyovyeFixture({
      players: basePlayers({
        1: {
          hand: [{ rank: CardRanks.ace, suit: CardSuits.Hearts }],
        },
        2: {
          hand: [
            { rank: CardRanks.six, suit: CardSuits.Clubs },
            { rank: CardRanks.seven, suit: CardSuits.Clubs },
          ],
        },
      }),
      trump: CardSuits.Diamonds,
      queue: [
        { giverId: 1, receiverId: 100 },
        { giverId: 1, receiverId: 100 },
        { giverId: 2, receiverId: 100 },
      ],
      tookLastDeckCardId: 100,
    });
    eng.runCpuHuyovye();
    const s = eng.getSnapshot();
    expect(s.phase).toBe(Phase.Main);
    expect(s.huyovyeQueue).toHaveLength(0);
    // CPU 1 kept their last card; CPU 2 gave one
    expect(s.players.find((p) => p.id === 1)!.hand).toHaveLength(1);
    expect(s.players.find((p) => p.id === 2)!.hand).toHaveLength(1);
  });

  it("leaves human giver obligations for manual selection", () => {
    const eng = new GameEngine({ seats: seats4, seed: 14 });
    eng.loadHuyovyeFixture({
      players: basePlayers(),
      trump: CardSuits.Clubs,
      queue: [
        { giverId: 1, receiverId: 2 },
        { giverId: 100, receiverId: 2 },
        { giverId: 100, receiverId: 3 },
      ],
      tookLastDeckCardId: 1,
    });
    eng.runCpuHuyovye();
    const s = eng.getSnapshot();
    expect(s.phase).toBe(Phase.Huyovye);
    expect(s.huyovyeQueue.every((q) => q.giverId === 100)).toBe(true);
    expect(s.huyovyeQueue).toHaveLength(2);
  });

  it("runCpuTurn drains CPU huyovye even when active seat is human", () => {
    const eng = new GameEngine({ seats: seats4, seed: 15 });
    eng.loadHuyovyeFixture({
      players: basePlayers(),
      trump: null,
      queue: [{ giverId: 1, receiverId: 100 }],
      tookLastDeckCardId: 100,
    });
    // activePlayerId may still be human after last-deck take; huyovye ignores it
    eng.runCpuTurn();
    expect(eng.getSnapshot().phase).toBe(Phase.Main);
  });

  it("suggestHuyovyeCard dumps non-trump junk, keeps trump ace", () => {
    const eng = new GameEngine({ seats: seats4, seed: 16 });
    eng.loadHuyovyeFixture({
      players: basePlayers({
        100: {
          hand: [
            { rank: CardRanks.ace, suit: CardSuits.Hearts },
            { rank: CardRanks.six, suit: CardSuits.Clubs },
            { rank: CardRanks.king, suit: CardSuits.Hearts },
          ],
        },
      }),
      trump: CardSuits.Hearts,
      queue: [{ giverId: 100, receiverId: 1 }],
    });
    const pick = eng.suggestHuyovyeCard(100);
    expect(pick).toEqual({
      rank: CardRanks.six,
      suit: CardSuits.Clubs,
    });
  });
});
