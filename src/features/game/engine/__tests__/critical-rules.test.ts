import { CardRanks, CardSuits } from "../cards";
import { GameEngine } from "../engine";
import { canBeat, canPlaceOnTop, firstLegalPrepareTarget } from "../rules";
import { nextClockwiseId } from "../seats";
import { type EnginePlayer, Foul, Phase, type SeatConfig } from "../types";

const seats3: SeatConfig[] = [
  { id: 1, name: "A", isCPU: false },
  { id: 2, name: "B", isCPU: false },
  { id: 3, name: "C", isCPU: false },
];

function player(id: number, patch: Partial<EnginePlayer> = {}): EnginePlayer {
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

describe("critical 1: six-on-ace prepare", () => {
  it("canPlaceOnTop allows six→ace", () => {
    expect(
      canPlaceOnTop(
        { rank: CardRanks.ace, suit: CardSuits.Hearts },
        { rank: CardRanks.six, suit: CardSuits.Clubs }
      )
    ).toBe(true);
  });

  it("awards ReceivedLowestOnHighest to ace owner; drawer keeps turn", () => {
    const eng = new GameEngine({ seats: seats3, seed: 1, watchmanId: 3 });
    const six = { rank: CardRanks.six, suit: CardSuits.Clubs };
    eng.loadTestFixture({
      phase: Phase.Prepare,
      activePlayerId: 1,
      prepareHeld: six,
      deck: [
        { rank: CardRanks.seven, suit: CardSuits.Clubs },
        { rank: CardRanks.eight, suit: CardSuits.Clubs },
      ],
      players: [
        player(1, {
          name: "A",
          hand: [{ rank: CardRanks.king, suit: CardSuits.Clubs }],
        }),
        player(2, {
          name: "B",
          hand: [{ rank: CardRanks.ace, suit: CardSuits.Hearts }],
        }),
        player(3, {
          name: "C",
          hand: [{ rank: CardRanks.ten, suit: CardSuits.Spades }],
        }),
      ],
    });

    expect(eng.placePrepare(1, 2)).toBe(true);
    const s = eng.getSnapshot();
    expect(s.lastFoul).toEqual({
      playerId: 2,
      foul: Foul.ReceivedLowestOnHighest,
    });
    expect(s.players.find((p) => p.id === 2)!.huyovye).toBe(1);
    expect(s.players.find((p) => p.id === 2)!.hand[0]).toEqual(six);
    // Drawer continues — still active, held cleared so they may draw again.
    expect(s.activePlayerId).toBe(1);
    expect(s.prepareHeld).toBeNull();
  });

  it("does not foul when six is placed on own ace", () => {
    const eng = new GameEngine({ seats: seats3, seed: 1, watchmanId: 3 });
    const six = { rank: CardRanks.six, suit: CardSuits.Clubs };
    eng.loadTestFixture({
      phase: Phase.Prepare,
      activePlayerId: 1,
      prepareHeld: six,
      deck: [
        { rank: CardRanks.seven, suit: CardSuits.Clubs },
        { rank: CardRanks.eight, suit: CardSuits.Clubs },
      ],
      players: [
        player(1, {
          name: "A",
          hand: [{ rank: CardRanks.ace, suit: CardSuits.Hearts }],
        }),
        player(2, {
          name: "B",
          hand: [{ rank: CardRanks.king, suit: CardSuits.Clubs }],
        }),
        player(3, {
          name: "C",
          hand: [{ rank: CardRanks.ten, suit: CardSuits.Spades }],
        }),
      ],
    });

    // Only self accepts six→ace
    expect(eng.placePrepare(1, 1)).toBe(true);
    expect(eng.getSnapshot().lastFoul).toBeNull();
    expect(eng.getSnapshot().players.find((p) => p.id === 1)!.huyovye).toBe(0);
  });
});

describe("critical 2: flipDiscard advances turn", () => {
  it("passes activePlayerId to next clockwise after flip", () => {
    const eng = new GameEngine({ seats: seats3, seed: 2, watchmanId: 1 });
    eng.loadTestFixture({
      phase: Phase.Main,
      trump: CardSuits.Hearts,
      activePlayerId: 2,
      lastPlayedById: 2,
      discardPendingFlip: true,
      roundJustEnded: false,
      current: [
        { rank: CardRanks.six, suit: CardSuits.Clubs },
        { rank: CardRanks.seven, suit: CardSuits.Clubs },
        { rank: CardRanks.eight, suit: CardSuits.Clubs },
      ],
      players: [
        player(1, {
          name: "A",
          hand: [{ rank: CardRanks.nine, suit: CardSuits.Clubs }],
        }),
        player(2, {
          name: "B",
          // empty hand flipper must not stick as active
          hand: [],
          stumps: [
            { rank: CardRanks.ten, suit: CardSuits.Clubs },
            { rank: CardRanks.jack, suit: CardSuits.Clubs },
          ],
        }),
        player(3, {
          name: "C",
          hand: [{ rank: CardRanks.queen, suit: CardSuits.Clubs }],
        }),
      ],
    });

    expect(eng.flipDiscard(2)).toBe(true);
    const s = eng.getSnapshot();
    expect(s.discardPendingFlip).toBe(false);
    expect(s.roundJustEnded).toBe(true);
    expect(s.current).toHaveLength(0);
    expect(s.activePlayerId).toBe(3);
  });
});

describe("critical 3: placePrepare hand cascade with 1 deck card", () => {
  it("allows hand cascade when deck has 1 card; no PlacedLastDeckCard foul", () => {
    const eng = new GameEngine({ seats: seats3, seed: 3, watchmanId: 3 });
    const seven = { rank: CardRanks.seven, suit: CardSuits.Clubs };
    eng.loadTestFixture({
      phase: Phase.Prepare,
      activePlayerId: 1,
      prepareHeld: null,
      deck: [{ rank: CardRanks.ace, suit: CardSuits.Spades }],
      players: [
        player(1, {
          name: "A",
          hand: [seven, { rank: CardRanks.king, suit: CardSuits.Hearts }],
        }),
        player(2, {
          name: "B",
          hand: [{ rank: CardRanks.six, suit: CardSuits.Diamonds }],
        }),
        player(3, {
          name: "C",
          hand: [{ rank: CardRanks.ten, suit: CardSuits.Spades }],
        }),
      ],
    });

    expect(eng.placePrepare(1, 2, seven)).toBe(true);
    const s = eng.getSnapshot();
    expect(s.lastFoul).toBeNull();
    expect(s.deck).toHaveLength(1);
    expect(s.phase).toBe(Phase.Prepare);
    expect(s.players.find((p) => p.id === 2)!.hand[0]).toEqual(seven);
  });
});

describe("critical 4: human huyovye last-card drop", () => {
  it("drops obligation when human giver has ≤1 card (no foul stall)", () => {
    const eng = new GameEngine({ seats: seats3, seed: 4, watchmanId: 1 });
    const last = { rank: CardRanks.ace, suit: CardSuits.Hearts };
    eng.loadHuyovyeFixture({
      trump: CardSuits.Clubs,
      tookLastDeckCardId: 1,
      queue: [
        { giverId: 1, receiverId: 2 },
        { giverId: 3, receiverId: 2 },
      ],
      players: [
        player(1, { name: "A", hand: [last] }),
        player(2, {
          name: "B",
          hand: [{ rank: CardRanks.six, suit: CardSuits.Clubs }],
        }),
        player(3, {
          name: "C",
          hand: [
            { rank: CardRanks.seven, suit: CardSuits.Clubs },
            { rank: CardRanks.eight, suit: CardSuits.Clubs },
          ],
        }),
      ],
    });

    expect(eng.giveHuyovyeCard(1, 2, last)).toBe(true);
    const s = eng.getSnapshot();
    expect(s.lastFoul).toBeNull();
    expect(s.players.find((p) => p.id === 1)!.hand).toHaveLength(1);
    // Remaining CPU/human gift can still clear; queue must not stall on P1.
    expect(
      s.huyovyeQueue.every((q) => !(q.giverId === 1 && q.receiverId === 2))
    ).toBe(true);
  });
});

describe("critical 5: prepare out-of-turn advances like main", () => {
  it("requireTurn foul advances activePlayerId to next after fouler", () => {
    const eng = new GameEngine({ seats: seats3, seed: 5, watchmanId: 3 });
    eng.loadTestFixture({
      phase: Phase.Prepare,
      activePlayerId: 1,
      prepareHeld: null,
      deck: [
        { rank: CardRanks.nine, suit: CardSuits.Clubs },
        { rank: CardRanks.ten, suit: CardSuits.Clubs },
      ],
      players: [
        player(1, {
          name: "A",
          hand: [{ rank: CardRanks.king, suit: CardSuits.Clubs }],
        }),
        player(2, {
          name: "B",
          hand: [{ rank: CardRanks.queen, suit: CardSuits.Clubs }],
        }),
        player(3, {
          name: "C",
          hand: [{ rank: CardRanks.jack, suit: CardSuits.Clubs }],
        }),
      ],
    });

    expect(eng.drawPrepare(2)).toBe(false);
    const s = eng.getSnapshot();
    expect(s.lastFoul).toEqual({
      playerId: 2,
      foul: Foul.DrewOutOfTurn,
    });
    expect(s.activePlayerId).toBe(3);
  });

  it("DrewTwoAndSawSecond advances turn to next after fouler", () => {
    const eng = new GameEngine({ seats: seats3, seed: 5, watchmanId: 3 });
    const held = { rank: CardRanks.nine, suit: CardSuits.Clubs };
    eng.loadTestFixture({
      phase: Phase.Prepare,
      activePlayerId: 1,
      prepareHeld: held,
      deck: [
        { rank: CardRanks.ten, suit: CardSuits.Clubs },
        { rank: CardRanks.jack, suit: CardSuits.Clubs },
      ],
      players: [
        player(1, {
          name: "A",
          hand: [{ rank: CardRanks.king, suit: CardSuits.Clubs }],
        }),
        player(2, {
          name: "B",
          hand: [{ rank: CardRanks.queen, suit: CardSuits.Clubs }],
        }),
        player(3, {
          name: "C",
          hand: [{ rank: CardRanks.six, suit: CardSuits.Clubs }],
        }),
      ],
    });

    expect(eng.drawPrepare(1)).toBe(false);
    const s = eng.getSnapshot();
    expect(s.lastFoul?.foul).toBe(Foul.DrewTwoAndSawSecond);
    expect(s.activePlayerId).toBe(2);
    expect(s.prepareHeld).toBeNull();
    expect(
      s.players
        .find((p) => p.id === 1)!
        .hand.some((c) => c.rank === held.rank && c.suit === held.suit)
    ).toBe(true);
  });
});

describe("critical 6: cascadeOwnTops requires turn", () => {
  it("fouls and advances when cascading out of turn", () => {
    const eng = new GameEngine({ seats: seats3, seed: 6, watchmanId: 3 });
    eng.loadTestFixture({
      phase: Phase.Prepare,
      activePlayerId: 1,
      prepareHeld: null,
      deck: [
        { rank: CardRanks.nine, suit: CardSuits.Clubs },
        { rank: CardRanks.ten, suit: CardSuits.Clubs },
      ],
      players: [
        player(1, {
          name: "A",
          hand: [{ rank: CardRanks.king, suit: CardSuits.Clubs }],
        }),
        player(2, {
          name: "B",
          hand: [
            { rank: CardRanks.seven, suit: CardSuits.Clubs },
            { rank: CardRanks.eight, suit: CardSuits.Clubs },
          ],
        }),
        player(3, {
          name: "C",
          hand: [{ rank: CardRanks.six, suit: CardSuits.Clubs }],
        }),
      ],
    });

    expect(eng.cascadeOwnTops(2)).toBe(0);
    const s = eng.getSnapshot();
    expect(s.lastFoul).toEqual({
      playerId: 2,
      foul: Foul.PlayedOutOfTurn,
    });
    expect(s.activePlayerId).toBe(3);
  });
});

describe("critical 7: nameTrumpAloud skips inactive", () => {
  it("does not foul exited players", () => {
    const eng = new GameEngine({ seats: seats3, seed: 7, watchmanId: 1 });
    eng.loadTestFixture({
      phase: Phase.Main,
      trump: CardSuits.Hearts,
      activePlayerId: 2,
      players: [
        player(1, { name: "A", active: false, hand: [] }),
        player(2, {
          name: "B",
          hand: [{ rank: CardRanks.nine, suit: CardSuits.Clubs }],
        }),
        player(3, {
          name: "C",
          hand: [{ rank: CardRanks.ten, suit: CardSuits.Clubs }],
        }),
      ],
    });

    eng.nameTrumpAloud(1);
    expect(eng.getSnapshot().lastFoul).toBeNull();
    expect(eng.getSnapshot().players.find((p) => p.id === 1)!.huyovye).toBe(0);
  });
});

describe("helpers: canBeat / firstLegal / nextClockwise activeOnly", () => {
  it("spades only beaten by higher spades; trump only by higher trump", () => {
    const trump = CardSuits.Hearts;
    expect(
      canBeat(
        { rank: CardRanks.nine, suit: CardSuits.Spades },
        { rank: CardRanks.ace, suit: CardSuits.Hearts },
        trump
      )
    ).toBe(false);
    expect(
      canBeat(
        { rank: CardRanks.nine, suit: CardSuits.Spades },
        { rank: CardRanks.king, suit: CardSuits.Spades },
        trump
      )
    ).toBe(true);
    expect(
      canBeat(
        { rank: CardRanks.nine, suit: CardSuits.Hearts },
        { rank: CardRanks.king, suit: CardSuits.Clubs },
        trump
      )
    ).toBe(false);
    expect(
      canBeat(
        { rank: CardRanks.nine, suit: CardSuits.Hearts },
        { rank: CardRanks.king, suit: CardSuits.Hearts },
        trump
      )
    ).toBe(true);
  });

  it("firstLegalPrepareTarget puts drawer last", () => {
    const players = [
      player(1, {
        hand: [{ rank: CardRanks.ace, suit: CardSuits.Clubs }],
      }),
      player(2, {
        hand: [{ rank: CardRanks.king, suit: CardSuits.Hearts }],
      }),
      player(3, {
        hand: [{ rank: CardRanks.ace, suit: CardSuits.Diamonds }],
      }),
    ];
    const six = { rank: CardRanks.six, suit: CardSuits.Spades };
    // drawer=2 → circle 3,1,2 — both aces legal; first is 3; self last
    expect(firstLegalPrepareTarget(players, 2, six)?.id).toBe(3);
    const onlySelf = [
      player(1, {
        hand: [{ rank: CardRanks.king, suit: CardSuits.Clubs }],
      }),
      player(2, {
        hand: [{ rank: CardRanks.ace, suit: CardSuits.Hearts }],
      }),
      player(3, {
        hand: [{ rank: CardRanks.queen, suit: CardSuits.Clubs }],
      }),
    ];
    expect(firstLegalPrepareTarget(onlySelf, 2, six)?.id).toBe(2);
  });

  it("nextClockwiseId skips exited seats when activeOnly", () => {
    const players = [
      player(1, { active: true }),
      player(2, { active: false }),
      player(3, { active: true }),
    ];
    expect(nextClockwiseId(players, 1)).toBe(3);
    expect(nextClockwiseId(players, 3)).toBe(1);
  });
});

describe("minors", () => {
  it("ExtraCardPastN fires when playing during pending flip", () => {
    const eng = new GameEngine({ seats: seats3, seed: 8, watchmanId: 1 });
    const card = { rank: CardRanks.nine, suit: CardSuits.Clubs };
    eng.loadTestFixture({
      phase: Phase.Main,
      trump: null,
      activePlayerId: 1,
      lastPlayedById: 1,
      discardPendingFlip: true,
      current: [
        { rank: CardRanks.six, suit: CardSuits.Clubs },
        { rank: CardRanks.seven, suit: CardSuits.Clubs },
        { rank: CardRanks.eight, suit: CardSuits.Clubs },
      ],
      players: [
        player(1, { name: "A", hand: [card] }),
        player(2, {
          name: "B",
          hand: [{ rank: CardRanks.ten, suit: CardSuits.Clubs }],
        }),
        player(3, {
          name: "C",
          hand: [{ rank: CardRanks.jack, suit: CardSuits.Clubs }],
        }),
      ],
    });

    expect(eng.playMain(1, card)).toBe(false);
    expect(eng.getSnapshot().lastFoul?.foul).toBe(Foul.ExtraCardPastN);
  });

  it("claimStumps / exitGame require a clear table (flip or takes)", () => {
    const eng = new GameEngine({ seats: seats3, seed: 9, watchmanId: 1 });
    const base = {
      phase: Phase.Main as const,
      trump: null,
      activePlayerId: 1,
      players: [
        player(1, {
          name: "A",
          hand: [],
          stumps: [{ rank: CardRanks.six, suit: CardSuits.Clubs }],
        }),
        player(2, {
          name: "B",
          hand: [],
          stumps: [],
        }),
        player(3, {
          name: "C",
          hand: [{ rank: CardRanks.seven, suit: CardSuits.Clubs }],
        }),
      ],
    };

    // Cards still on the table — no protocol moment yet.
    eng.loadTestFixture({
      ...base,
      roundJustEnded: false,
      current: [{ rank: CardRanks.nine, suit: CardSuits.Clubs }],
    });
    expect(eng.claimStumps(1)).toBe(false);
    expect(eng.exitGame(2)).toBe(false);

    // Table cleared by a flip.
    eng.loadTestFixture({ ...base, roundJustEnded: true, current: [] });
    expect(eng.claimStumps(1)).toBe(true);
    expect(eng.exitGame(2)).toBe(true);

    // Table cleared by bottom-takes (roundJustEnded stays false, R7).
    eng.loadTestFixture({
      ...base,
      roundJustEnded: false,
      current: [],
      discardPendingFlip: false,
    });
    expect(eng.claimStumps(1)).toBe(true);
  });

  it("watchman handoff message works when previous watchman is null", () => {
    const eng = new GameEngine({ seats: seats3, seed: 10, watchmanId: 1 });
    eng.loadTestFixture({ watchmanId: null });
    eng.setWatchman(2);
    const msg = eng.getSnapshot().message ?? "";
    expect(msg.startsWith("Вася-пидор вахту сдал!")).toBe(true);
    expect(msg.includes("P2") || msg.includes("B")).toBe(true);
  });
});
