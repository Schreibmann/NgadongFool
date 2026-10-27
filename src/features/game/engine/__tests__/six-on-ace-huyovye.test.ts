import { CardRanks, CardSuits } from "../../components/card/card.props";
import { GameEngine } from "../engine";
import { EnginePlayer, Foul, Phase, SeatConfig } from "../types";

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

describe("six on ace in prepare", () => {
  it("places six on opponent ace, awards AceGotLowest, stays in Prepare", () => {
    const eng = new GameEngine({ seats: seats3, seed: 1 });
    const six = { rank: CardRanks.six, suit: CardSuits.Clubs };
    const ace = { rank: CardRanks.ace, suit: CardSuits.Hearts };
    eng.loadPrepareFixture({
      activePlayerId: 3,
      prepareHeld: six,
      deck: [
        { rank: CardRanks.nine, suit: CardSuits.Diamonds },
        { rank: CardRanks.ten, suit: CardSuits.Spades },
      ],
      players: [
        player(1, [ace], { isCPU: true, name: "A" }),
        player(2, [{ rank: CardRanks.king, suit: CardSuits.Clubs }], {
          isCPU: true,
          name: "B",
        }),
        player(3, [{ rank: CardRanks.eight, suit: CardSuits.Spades }], {
          isCPU: false,
          name: "C",
        }),
      ],
    });

    expect(eng.placePrepare(3, 1)).toBe(true);
    const s = eng.getSnapshot();
    expect(s.phase).toBe(Phase.Prepare);
    expect(s.prepareHeld).toBeNull();
    expect(s.players.find((p) => p.id === 1)?.hand[0]).toEqual(six);
    expect(s.players.find((p) => p.id === 1)?.huyovye).toBe(1);
    expect(s.lastFoul).toEqual({
      playerId: 1,
      foul: Foul.AceGotLowest,
    });
  });

  it("rejects keepPrepare when a legal dump target exists", () => {
    const eng = new GameEngine({ seats: seats3, seed: 2 });
    const six = { rank: CardRanks.six, suit: CardSuits.Diamonds };
    eng.loadPrepareFixture({
      activePlayerId: 3,
      prepareHeld: six,
      deck: [{ rank: CardRanks.seven, suit: CardSuits.Clubs }],
      players: [
        player(1, [{ rank: CardRanks.ace, suit: CardSuits.Spades }], {
          isCPU: true,
        }),
        player(2, [{ rank: CardRanks.queen, suit: CardSuits.Hearts }], {
          isCPU: true,
        }),
        player(3, [{ rank: CardRanks.nine, suit: CardSuits.Clubs }], {
          isCPU: false,
        }),
      ],
    });

    expect(eng.keepPrepare(3)).toBe(false);
    const s = eng.getSnapshot();
    expect(s.prepareHeld).toEqual(six);
    expect(s.lastFoul?.foul).toBe(Foul.FailedToDumpLegal);
    expect(s.phase).toBe(Phase.Prepare);
  });
});

describe("huyovye timing", () => {
  it("prepare fouls batch into Huyovye after deck empties then enter Main", () => {
    const eng = new GameEngine({ seats: seats3, seed: 3 });
    eng.loadPrepareFixture({
      activePlayerId: 3,
      prepareHeld: null,
      deck: [],
      players: [
        player(1, [{ rank: CardRanks.king, suit: CardSuits.Hearts }], {
          isCPU: true,
          huyovye: 1,
        }),
        player(
          2,
          [
            { rank: CardRanks.six, suit: CardSuits.Clubs },
            { rank: CardRanks.seven, suit: CardSuits.Clubs },
          ],
          { isCPU: true },
        ),
        player(
          3,
          [
            { rank: CardRanks.eight, suit: CardSuits.Diamonds },
            { rank: CardRanks.nine, suit: CardSuits.Diamonds },
          ],
          { isCPU: false },
        ),
      ],
    });

    // Draw with empty deck → enterHuyovye batch
    eng.drawPrepare(3);
    const mid = eng.getSnapshot();
    expect([Phase.Huyovye, Phase.Main]).toContain(mid.phase);
    if (mid.phase === Phase.Huyovye) {
      expect(mid.phaseResume).toBeNull();
      eng.runCpuHuyovye();
      // human may still owe gifts
      const humanDue = eng
        .getSnapshot()
        .huyovyeQueue.filter((q) => q.giverId === 3);
      for (const q of humanDue) {
        const hand = eng.getSnapshot().players.find((p) => p.id === 3)!.hand;
        if (hand.length <= 1) break;
        eng.giveHuyovyeCard(3, q.receiverId, hand[0]);
      }
      if (eng.getSnapshot().huyovyeQueue.length === 0) {
        eng.finishHuyovye();
      }
    }
    expect(eng.getSnapshot().phase).toBe(Phase.Main);
    expect(eng.getSnapshot().phaseResume).toBeNull();
  });

  it("Main foul interrupts into Huyovye then resumes same pile", () => {
    const eng = new GameEngine({ seats: seats3, seed: 4 });
    const pile = [
      { rank: CardRanks.nine, suit: CardSuits.Clubs },
      { rank: CardRanks.ten, suit: CardSuits.Clubs },
    ];
    eng.loadMainFixture({
      activePlayerId: 3,
      trump: CardSuits.Hearts,
      current: pile,
      players: [
        player(
          1,
          [
            { rank: CardRanks.six, suit: CardSuits.Diamonds },
            { rank: CardRanks.seven, suit: CardSuits.Diamonds },
          ],
          { isCPU: true },
        ),
        player(
          2,
          [
            { rank: CardRanks.eight, suit: CardSuits.Spades },
            { rank: CardRanks.nine, suit: CardSuits.Spades },
          ],
          { isCPU: true },
        ),
        player(
          3,
          [
            { rank: CardRanks.six, suit: CardSuits.Clubs },
            { rank: CardRanks.jack, suit: CardSuits.Hearts },
          ],
          { isCPU: false },
        ),
      ],
    });

    // Illegal beat: six of clubs does not beat ten of clubs when hearts are trump
    // (same suit would need higher; six < ten)
    eng.playMain(3, { rank: CardRanks.six, suit: CardSuits.Clubs });

    // CPU gifts auto-resolve; may briefly be Huyovye or already resumed
    let s = eng.getSnapshot();
    if (s.phase === Phase.Huyovye) {
      expect(s.phaseResume).toBe(Phase.Main);
      expect(s.lastFoul?.foul).toBe(Foul.IllegalBeat);
      eng.runCpuHuyovye();
      const humanDue = eng
        .getSnapshot()
        .huyovyeQueue.filter((q) => q.giverId === 3);
      for (const q of [...humanDue]) {
        const hand = eng.getSnapshot().players.find((p) => p.id === 3)!.hand;
        if (hand.length <= 1) break;
        eng.giveHuyovyeCard(3, q.receiverId, hand[0]);
      }
      if (
        eng.getSnapshot().phase === Phase.Huyovye &&
        eng.getSnapshot().huyovyeQueue.length === 0
      ) {
        eng.finishHuyovye();
      }
      s = eng.getSnapshot();
    }

    expect(s.phase).toBe(Phase.Main);
    expect(s.current).toEqual(pile);
    expect(s.phaseResume).toBeNull();
    expect(s.lastFoul?.foul).toBe(Foul.IllegalBeat);
  });
});
