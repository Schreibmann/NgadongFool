import { CardRanks, CardSuits } from "../../components/card/card.props";
import { GameEngine } from "../engine";
import { nextClockwiseId } from "../seats";
import {
  EnginePlayer,
  Foul,
  Phase,
  SeatConfig,
} from "../types";

const seats3: SeatConfig[] = [
  { id: 1, name: "A", isCPU: false },
  { id: 2, name: "B", isCPU: false },
  { id: 3, name: "C", isCPU: false },
];

const seatsCpuGivers: SeatConfig[] = [
  { id: 1, name: "Human", isCPU: false },
  { id: 2, name: "B", isCPU: true },
  { id: 3, name: "C", isCPU: true },
];

function player(
  id: number,
  patch: Partial<EnginePlayer> = {},
): EnginePlayer {
  return {
    id,
    name: `P${id}`,
    isCPU: false,
    hand: [],
    stumps: [],
    huyovye: 0,
    active: true,
    stumpsRevealed: false,
    ...patch,
  };
}

describe("interpretation: takeBottom = only bottom card", () => {
  it("shifts a single bottom card; rest of pile remains", () => {
    const eng = new GameEngine({ seats: seats3, seed: 1, watchmanId: 1 });
    const bottom = { rank: CardRanks.six, suit: CardSuits.Clubs };
    const mid = { rank: CardRanks.seven, suit: CardSuits.Clubs };
    const top = { rank: CardRanks.eight, suit: CardSuits.Clubs };
    eng.loadMainFixture({
      players: [
        player(1, {
          name: "A",
          hand: [{ rank: CardRanks.nine, suit: CardSuits.Diamonds }],
        }),
        player(2, {
          name: "B",
          hand: [{ rank: CardRanks.ten, suit: CardSuits.Diamonds }],
        }),
        player(3, {
          name: "C",
          hand: [{ rank: CardRanks.jack, suit: CardSuits.Diamonds }],
        }),
      ],
      trump: CardSuits.Hearts,
      activePlayerId: 2,
      current: [bottom, mid, top],
    });

    expect(eng.takeBottom(2)).toBe(true);
    const s = eng.getSnapshot();
    expect(s.current).toEqual([mid, top]);
    expect(s.players.find((p) => p.id === 2)!.hand[0]).toEqual(bottom);
    expect(s.current).toHaveLength(2);
  });
});

describe("interpretation: круг = discard flip cycle", () => {
  it("claimStumps and exitGame require roundJustEnded from flipDiscard", () => {
    const eng = new GameEngine({ seats: seats3, seed: 2, watchmanId: 1 });
    eng.loadMainFixture({
      players: [
        player(1, {
          name: "A",
          hand: [],
          stumps: [{ rank: CardRanks.six, suit: CardSuits.Clubs }],
        }),
        player(2, { name: "B", hand: [], stumps: [] }),
        player(3, {
          name: "C",
          hand: [{ rank: CardRanks.seven, suit: CardSuits.Clubs }],
        }),
      ],
      trump: null,
      activePlayerId: 3,
      current: [],
      roundJustEnded: false,
    });

    expect(eng.claimStumps(1)).toBe(false);
    expect(eng.exitGame(2)).toBe(false);
    expect(eng.protocolsFor(1)).toEqual([]);
    expect(eng.protocolsFor(2)).toEqual([]);

    eng.loadMainFixture({
      players: [
        player(1, {
          name: "A",
          hand: [{ rank: CardRanks.six, suit: CardSuits.Hearts }],
        }),
        player(2, {
          name: "B",
          hand: [{ rank: CardRanks.seven, suit: CardSuits.Hearts }],
        }),
        player(3, {
          name: "C",
          hand: [{ rank: CardRanks.eight, suit: CardSuits.Hearts }],
        }),
      ],
      trump: CardSuits.Hearts,
      activePlayerId: 1,
      current: [
        { rank: CardRanks.nine, suit: CardSuits.Clubs },
        { rank: CardRanks.ten, suit: CardSuits.Clubs },
        { rank: CardRanks.jack, suit: CardSuits.Clubs },
      ],
      discardPendingFlip: true,
      lastPlayedById: 1,
      roundJustEnded: false,
    });

    expect(eng.flipDiscard(1)).toBe(true);
    const afterFlip = eng.getSnapshot();
    expect(afterFlip.roundJustEnded).toBe(true);
    expect(afterFlip.current).toEqual([]);
  });

  it("after flip, empty-hand seats may claim or exit", () => {
    const eng = new GameEngine({ seats: seats3, seed: 3, watchmanId: 1 });
    eng.loadMainFixture({
      players: [
        player(1, {
          name: "A",
          hand: [],
          stumps: [{ rank: CardRanks.six, suit: CardSuits.Clubs }],
        }),
        player(2, { name: "B", hand: [], stumps: [] }),
        player(3, {
          name: "C",
          hand: [{ rank: CardRanks.seven, suit: CardSuits.Clubs }],
        }),
      ],
      trump: null,
      activePlayerId: 3,
      current: [],
      roundJustEnded: true,
    });

    expect(eng.protocolsFor(1)).toEqual(["claim_stumps"]);
    expect(eng.protocolsFor(2)).toEqual(["exit"]);
    expect(eng.claimStumps(1)).toBe(true);
    expect(eng.exitGame(2)).toBe(true);
  });
});

describe("interpretation: main lead = next after tookLastDeckCardId", () => {
  it("beginMain leads clockwise after tookLastDeckCardId, not last giver", () => {
    const eng = new GameEngine({ seats: seats3, seed: 4, watchmanId: 1 });
    eng.loadHuyovyeFixture({
      players: [
        player(1, {
          name: "A",
          hand: [
            { rank: CardRanks.six, suit: CardSuits.Clubs },
            { rank: CardRanks.seven, suit: CardSuits.Clubs },
          ],
        }),
        player(2, {
          name: "B",
          hand: [
            { rank: CardRanks.eight, suit: CardSuits.Clubs },
            { rank: CardRanks.nine, suit: CardSuits.Clubs },
          ],
        }),
        player(3, {
          name: "C",
          hand: [
            { rank: CardRanks.ten, suit: CardSuits.Clubs },
            { rank: CardRanks.jack, suit: CardSuits.Clubs },
          ],
        }),
      ],
      trump: CardSuits.Hearts,
      // Last giver would be 3 → receiver 1; lead must ignore that.
      queue: [{ giverId: 3, receiverId: 1 }],
      tookLastDeckCardId: 2,
    });

    eng.runCpuHuyovye();
    // Humans must finish remaining gifts if any; force drain via finish path.
    const s0 = eng.getSnapshot();
    if (s0.phase === Phase.Huyovye && s0.huyovyeQueue.length > 0) {
      const q = s0.huyovyeQueue[0];
      const giver = s0.players.find((p) => p.id === q.giverId)!;
      const card = eng.suggestHuyovyeCard(q.giverId) ?? giver.hand[1];
      eng.giveHuyovyeCard(q.giverId, q.receiverId, card);
    }

    const s = eng.getSnapshot();
    expect(s.phase).toBe(Phase.Main);
    expect(s.activePlayerId).toBe(nextClockwiseId(s.players, 2));
    expect(s.activePlayerId).toBe(3);
  });
});

describe("interpretation: main fouls → хуёвые card dumps", () => {
  it("IllegalBeat enqueues gifts, pauses Main, CPU drains, resumes with pile intact", () => {
    const eng = new GameEngine({
      seats: seatsCpuGivers,
      seed: 5,
      watchmanId: 1,
    });
    const pile = [
      { rank: CardRanks.six, suit: CardSuits.Clubs },
      { rank: CardRanks.seven, suit: CardSuits.Clubs },
    ];
    eng.loadMainFixture({
      players: [
        player(1, {
          name: "Human",
          isCPU: false,
          hand: [
            { rank: CardRanks.six, suit: CardSuits.Diamonds },
            { rank: CardRanks.seven, suit: CardSuits.Diamonds },
          ],
        }),
        player(2, {
          name: "B",
          isCPU: true,
          hand: [
            { rank: CardRanks.six, suit: CardSuits.Spades },
            { rank: CardRanks.king, suit: CardSuits.Hearts },
            { rank: CardRanks.ace, suit: CardSuits.Hearts },
          ],
        }),
        player(3, {
          name: "C",
          isCPU: true,
          hand: [
            { rank: CardRanks.seven, suit: CardSuits.Spades },
            { rank: CardRanks.queen, suit: CardSuits.Hearts },
            { rank: CardRanks.ten, suit: CardSuits.Hearts },
          ],
        }),
      ],
      trump: CardSuits.Hearts,
      activePlayerId: 1,
      current: pile,
    });

    // Illegal: try to beat clubs with diamonds (not trump).
    const illegal = { rank: CardRanks.six, suit: CardSuits.Diamonds };
    expect(eng.playMain(1, illegal)).toBe(false);

    const mid = eng.getSnapshot();
    // CPU givers auto-drain in the same pause; should already be back in Main.
    expect(mid.phase).toBe(Phase.Main);
    expect(mid.resumeMainAfterHuyovye).toBe(false);
    expect(mid.huyovyeQueue).toHaveLength(0);
    expect(mid.current).toEqual(pile);
    expect(mid.lastFoul?.foul).toBe(Foul.IllegalBeat);
    expect(mid.activePlayerId).toBe(2);
    // Illegal play keeps the card; receiver also got one gift from each other seat.
    expect(mid.players.find((p) => p.id === 1)!.hand.length).toBe(4);
    expect(mid.players.find((p) => p.id === 1)!.huyovye).toBe(0);
  });

  it("human giver mid-main: queue pauses until gift, never takes last hand card", () => {
    const eng = new GameEngine({ seats: seats3, seed: 6, watchmanId: 1 });
    eng.loadMainFixture({
      players: [
        player(1, {
          name: "A",
          hand: [
            { rank: CardRanks.six, suit: CardSuits.Diamonds },
            { rank: CardRanks.seven, suit: CardSuits.Diamonds },
          ],
        }),
        player(2, {
          name: "B",
          hand: [
            { rank: CardRanks.six, suit: CardSuits.Clubs },
            { rank: CardRanks.seven, suit: CardSuits.Clubs },
          ],
        }),
        player(3, {
          name: "C",
          // Only last card — cannot give; obligation drops.
          hand: [{ rank: CardRanks.ace, suit: CardSuits.Spades }],
        }),
      ],
      trump: CardSuits.Hearts,
      activePlayerId: 1,
      current: [{ rank: CardRanks.nine, suit: CardSuits.Clubs }],
    });

    eng.playMain(1, { rank: CardRanks.six, suit: CardSuits.Diamonds });
    const paused = eng.getSnapshot();
    expect(paused.phase).toBe(Phase.Huyovye);
    expect(paused.resumeMainAfterHuyovye).toBe(true);
    // Obligations: B→A and C→A
    expect(paused.huyovyeQueue).toEqual([
      { giverId: 2, receiverId: 1 },
      { giverId: 3, receiverId: 1 },
    ]);
    expect(paused.current).toEqual([
      { rank: CardRanks.nine, suit: CardSuits.Clubs },
    ]);

    // C drops (last card); B still owes.
    eng.giveHuyovyeCard(3, 1, {
      rank: CardRanks.ace,
      suit: CardSuits.Spades,
    });
    const afterDrop = eng.getSnapshot();
    expect(afterDrop.players.find((p) => p.id === 3)!.hand).toHaveLength(1);
    expect(afterDrop.huyovyeQueue).toEqual([
      { giverId: 2, receiverId: 1 },
    ]);

    eng.giveHuyovyeCard(2, 1, {
      rank: CardRanks.six,
      suit: CardSuits.Clubs,
    });
    const resumed = eng.getSnapshot();
    expect(resumed.phase).toBe(Phase.Main);
    expect(resumed.resumeMainAfterHuyovye).toBe(false);
    expect(resumed.huyovyeQueue).toHaveLength(0);
    expect(resumed.current).toEqual([
      { rank: CardRanks.nine, suit: CardSuits.Clubs },
    ]);
    expect(resumed.activePlayerId).toBe(2);
  });
});
