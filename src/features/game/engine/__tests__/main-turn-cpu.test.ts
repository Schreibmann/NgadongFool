import { CardRanks, CardSuits } from "../cards";
import { GameEngine } from "../engine";
import { type EnginePlayer, Phase, type SeatConfig } from "../types";

const seats4: SeatConfig[] = [
  { id: 1, name: "A", isCPU: true },
  { id: 2, name: "B", isCPU: true },
  { id: 3, name: "C", isCPU: true },
  { id: 100, name: "Human", isCPU: false },
];

function player(
  seat: SeatConfig,
  patch: Partial<EnginePlayer> = {}
): EnginePlayer {
  return {
    id: seat.id,
    name: seat.name,
    isCPU: seat.isCPU,
    hand: [
      { rank: CardRanks.six, suit: CardSuits.Clubs },
      { rank: CardRanks.seven, suit: CardSuits.Clubs },
    ],
    stumps: [],
    huyovye: 0,
    active: true,
    stumpsRevealed: false,
    ...patch,
  };
}

describe("main: trump ace beats trump king", () => {
  it("playMain accepts A♥ over K♥ when hearts are trump", () => {
    const eng = new GameEngine({ seats: seats4, seed: 1 });
    eng.loadMainFixture({
      trump: CardSuits.Hearts,
      activePlayerId: 100,
      current: [
        { rank: CardRanks.six, suit: CardSuits.Hearts },
        { rank: CardRanks.jack, suit: CardSuits.Spades },
        { rank: CardRanks.king, suit: CardSuits.Hearts },
      ],
      players: seats4.map((s) =>
        player(s, {
          hand:
            s.id === 100
              ? [
                  { rank: CardRanks.ace, suit: CardSuits.Hearts },
                  { rank: CardRanks.nine, suit: CardSuits.Clubs },
                ]
              : [
                  { rank: CardRanks.six, suit: CardSuits.Clubs },
                  { rank: CardRanks.seven, suit: CardSuits.Diamonds },
                ],
        })
      ),
    });

    const ok = eng.playMain(100, {
      rank: CardRanks.ace,
      suit: CardSuits.Hearts,
    });
    expect(ok).toBe(true);
    const s = eng.getSnapshot();
    expect(s.lastFoul).toBeNull();
    expect(s.current).toHaveLength(4);
    expect(s.current[3]).toEqual({
      rank: CardRanks.ace,
      suit: CardSuits.Hearts,
    });
  });
});

describe("CPU main turn advances", () => {
  it("CPU leads when pile is empty", () => {
    const eng = new GameEngine({ seats: seats4, seed: 2 });
    eng.loadMainFixture({
      trump: CardSuits.Hearts,
      activePlayerId: 1,
      current: [],
      players: seats4.map((s) => player(s)),
    });

    const before = eng.getSnapshot();
    expect(before.activePlayerId).toBe(1);
    expect(before.current).toHaveLength(0);

    eng.runCpuTurn();
    const after = eng.getSnapshot();
    expect(after.current).toHaveLength(1);
    expect(after.activePlayerId).not.toBe(1);
    expect(after.phase).toBe(Phase.Main);
  });

  it("CPU beats or takes when pile has a target", () => {
    const eng = new GameEngine({ seats: seats4, seed: 3 });
    eng.loadMainFixture({
      trump: CardSuits.Hearts,
      activePlayerId: 1,
      current: [{ rank: CardRanks.six, suit: CardSuits.Clubs }],
      players: seats4.map((s) =>
        player(s, {
          hand:
            s.id === 1
              ? [
                  // lowest trump beats non-spade non-trump six
                  { rank: CardRanks.six, suit: CardSuits.Hearts },
                  { rank: CardRanks.nine, suit: CardSuits.Diamonds },
                ]
              : [
                  { rank: CardRanks.eight, suit: CardSuits.Clubs },
                  { rank: CardRanks.nine, suit: CardSuits.Clubs },
                ],
        })
      ),
    });

    eng.runCpuTurn();
    const after = eng.getSnapshot();
    expect(after.current).toHaveLength(2);
    expect(after.current[1]).toEqual({
      rank: CardRanks.six,
      suit: CardSuits.Hearts,
    });
    expect(after.activePlayerId).toBe(2);
  });

  it("CPU with empty hand after discard cycle claims stumps (no soft-lock)", () => {
    const eng = new GameEngine({ seats: seats4, seed: 4 });
    eng.loadMainFixture({
      trump: CardSuits.Hearts,
      activePlayerId: 1,
      current: [],
      // After the flip the table is clear — protocol window is open.
      roundJustEnded: true,
      players: seats4.map((s) =>
        s.id === 1
          ? player(s, {
              hand: [],
              stumps: [
                { rank: CardRanks.ten, suit: CardSuits.Clubs },
                { rank: CardRanks.jack, suit: CardSuits.Clubs },
              ],
            })
          : player(s)
      ),
    });

    eng.runCpuTurn();
    const after = eng.getSnapshot();
    const cpu = after.players.find((p) => p.id === 1)!;
    expect(cpu.hand).toHaveLength(2);
    expect(cpu.stumps).toHaveLength(0);
    expect(cpu.stumpsRevealed).toBe(true);
  });

  it("CPU with empty hand claims stumps when bottom-takes cleared the table", () => {
    const eng = new GameEngine({ seats: seats4, seed: 4 });
    eng.loadMainFixture({
      trump: CardSuits.Hearts,
      activePlayerId: 1,
      current: [],
      // The pile dissolved via takeBottom (R7): no flip happened, so
      // roundJustEnded is false — the protocol window must still open.
      roundJustEnded: false,
      players: seats4.map((s) =>
        s.id === 1
          ? player(s, {
              hand: [],
              stumps: [
                { rank: CardRanks.ten, suit: CardSuits.Clubs },
                { rank: CardRanks.jack, suit: CardSuits.Clubs },
              ],
            })
          : player(s)
      ),
    });

    eng.runCpuTurn();
    const after = eng.getSnapshot();
    const cpu = after.players.find((p) => p.id === 1)!;
    // Claim happened — the game does not stall on the empty hand.
    expect(cpu.hand).toHaveLength(2);
    expect(cpu.stumps).toHaveLength(0);
    expect(cpu.stumpsRevealed).toBe(true);
    expect(after.message).toContain("Беру пни");
  });

  it("CPU with empty hand and no stumps exits when bottom-takes cleared the table", () => {
    const eng = new GameEngine({ seats: seats4, seed: 4 });
    eng.loadMainFixture({
      trump: CardSuits.Hearts,
      activePlayerId: 1,
      current: [],
      roundJustEnded: false,
      players: seats4.map((s) =>
        s.id === 1 ? player(s, { hand: [], stumps: [] }) : player(s)
      ),
    });

    eng.runCpuTurn();
    const after = eng.getSnapshot();
    const cpu = after.players.find((p) => p.id === 1)!;
    expect(cpu.active).toBe(false);
    expect(after.message).toContain("С пидорами не играю");
  });

  it("CPU flips discard when pending and is last player", () => {
    const eng = new GameEngine({ seats: seats4, seed: 5 });
    const pile = [
      { rank: CardRanks.six, suit: CardSuits.Clubs },
      { rank: CardRanks.seven, suit: CardSuits.Clubs },
      { rank: CardRanks.eight, suit: CardSuits.Clubs },
      { rank: CardRanks.nine, suit: CardSuits.Clubs },
    ];
    eng.loadMainFixture({
      trump: CardSuits.Hearts,
      activePlayerId: 1,
      current: pile,
      discardPendingFlip: true,
      lastPlayedById: 1,
      players: seats4.map((s) => player(s)),
    });

    eng.runCpuTurn();
    const after = eng.getSnapshot();
    expect(after.discardPendingFlip).toBe(false);
    expect(after.current).toHaveLength(0);
    expect(after.beaten.length).toBeGreaterThanOrEqual(4);
    expect(after.roundJustEnded).toBe(true);
    // Lead of next trick is next clockwise after the flipper.
    expect(after.activePlayerId).toBe(2);
  });

  it("repeated runCpuTurn does not soft-lock across a full CPU cycle", () => {
    const eng = new GameEngine({ seats: seats4, seed: 6 });
    eng.loadMainFixture({
      trump: CardSuits.Diamonds,
      activePlayerId: 1,
      current: [],
      players: seats4.map((s) =>
        player(s, {
          // give every CPU several cards so turns keep moving
          hand: [
            { rank: CardRanks.six, suit: CardSuits.Clubs },
            { rank: CardRanks.seven, suit: CardSuits.Spades },
            { rank: CardRanks.eight, suit: CardSuits.Hearts },
          ],
          isCPU: s.id !== 100,
        })
      ),
    });

    const seenActive: number[] = [];
    for (let i = 0; i < 12; i++) {
      const snap = eng.getSnapshot();
      if (snap.phase !== Phase.Main) break;
      const seat = snap.players.find((p) => p.id === snap.activePlayerId)!;
      seenActive.push(seat.id);
      if (!seat.isCPU) break;
      const beforeLen = snap.current.length;
      const beforeActive = snap.activePlayerId;
      const beforeFlip = snap.discardPendingFlip;
      const beforeRound = snap.roundJustEnded;
      eng.runCpuTurn();
      const after = eng.getSnapshot();
      const progressed =
        after.current.length !== beforeLen ||
        after.activePlayerId !== beforeActive ||
        after.discardPendingFlip !== beforeFlip ||
        after.roundJustEnded !== beforeRound ||
        after.beaten.length !== snap.beaten.length;
      expect(progressed).toBe(true);
    }
    expect(seenActive.length).toBeGreaterThan(0);
  });

  it("CPU with empty hand takes bottom instead of spinning advanceMainTurn", () => {
    const eng = new GameEngine({ seats: seats4, seed: 7 });
    eng.loadMainFixture({
      trump: CardSuits.Hearts,
      activePlayerId: 1,
      current: [
        { rank: CardRanks.six, suit: CardSuits.Clubs },
        { rank: CardRanks.king, suit: CardSuits.Clubs },
      ],
      players: seats4.map((s) =>
        player(s, {
          hand:
            s.id === 1
              ? []
              : [{ rank: CardRanks.nine, suit: CardSuits.Diamonds }],
          stumps: [],
          isCPU: true,
        })
      ),
    });

    eng.runCpuTurn();
    const after = eng.getSnapshot();
    const cpu = after.players.find((p) => p.id === 1)!;
    expect(cpu.hand).toHaveLength(1);
    expect(cpu.hand[0]).toEqual({
      rank: CardRanks.six,
      suit: CardSuits.Clubs,
    });
    expect(after.current).toHaveLength(1);
    expect(after.current[0]).toEqual({
      rank: CardRanks.king,
      suit: CardSuits.Clubs,
    });
  });

  it("two empty-hand CPUs with a pile both take bottom within a few ticks (no spin)", () => {
    const duelSeats: SeatConfig[] = [
      { id: 1, name: "A", isCPU: true },
      { id: 2, name: "B", isCPU: true },
    ];
    const eng = new GameEngine({ seats: duelSeats, seed: 8 });
    eng.loadMainFixture({
      trump: CardSuits.Hearts,
      activePlayerId: 1,
      current: [
        { rank: CardRanks.six, suit: CardSuits.Clubs },
        { rank: CardRanks.king, suit: CardSuits.Spades },
      ],
      players: [
        player(duelSeats[0], { hand: [], stumps: [] }),
        player(duelSeats[1], { hand: [], stumps: [] }),
      ],
    });

    for (let i = 0; i < 4; i++) {
      const snap = eng.getSnapshot();
      if (snap.phase !== Phase.Main) break;
      if (snap.current.length === 0) break;
      eng.runCpuTurn();
    }

    const after = eng.getSnapshot();
    const handTotal = after.players.reduce((n, p) => n + p.hand.length, 0);
    expect(handTotal).toBeGreaterThan(0);
    expect(after.current.length).toBeLessThan(2);
  });
});
