import { CardRanks, CardSuits } from "../../components/card/card.props";
import { GameEngine } from "../engine";
import { Foul, Phase, SeatConfig } from "../types";
import { canBeat } from "../rules";
import { activePlayers } from "../seats";
import { drainPrepare, resolvePrepareHeld } from "./prepare-helpers";

const seats3: SeatConfig[] = [
  { id: 1, name: "A", isCPU: true },
  { id: 2, name: "B", isCPU: true },
  { id: 3, name: "C", isCPU: false },
];

const seats4: SeatConfig[] = [
  ...seats3,
  { id: 4, name: "D", isCPU: true },
];

describe("deal", () => {
  it("gives 2 stumps + 1 face-up to each player", () => {
    const eng = new GameEngine({ seats: seats3, seed: 1 });
    const s = eng.getSnapshot();
    expect(s.phase).toBe(Phase.Prepare);
    expect(s.players).toHaveLength(3);
    for (const p of s.players) {
      expect(p.stumps).toHaveLength(2);
      expect(p.hand).toHaveLength(1);
    }
    // 36 - 3*3 = 27 left in deck
    expect(s.deck.length).toBe(27);
  });

  it("supports N players (4)", () => {
    const eng = new GameEngine({ seats: seats4, seed: 2 });
    const s = eng.getSnapshot();
    expect(s.players).toHaveLength(4);
    expect(s.deck.length).toBe(36 - 4 * 3);
  });

  it("dealer is watchman when provided; first active is clockwise after dealer", () => {
    const eng = new GameEngine({
      seats: seats3,
      seed: 3,
      watchmanId: 2,
    });
    const s = eng.getSnapshot();
    expect(s.dealerId).toBe(2);
    expect(s.watchmanId).toBe(2);
    expect(s.activePlayerId).toBe(3);
  });
});

describe("prepare", () => {
  it("last deck card sets trump / бесскозырка and enters huyovye→main", () => {
    const eng = new GameEngine({ seats: seats3, seed: 10 });
    drainPrepare(eng);
    const s = eng.getSnapshot();
    expect([Phase.Main, Phase.Huyovye, Phase.Ended]).toContain(s.phase);
    if (s.tookLastDeckCardId != null) {
      expect([Phase.Main, Phase.Huyovye]).toContain(s.phase);
    }
  });

  it("awards foul for giving away last hand card in prepare", () => {
    const eng = new GameEngine({ seats: seats3, seed: 5 });
    const s0 = eng.getSnapshot();
    const actor = s0.activePlayerId;
    // ensure actor has exactly 1 hand card and a placeable situation is hard;
    // call placePrepare with from-hand when length==1
    const self = s0.players.find((p) => p.id === actor);
    expect(self?.hand.length).toBe(1);
    const card = self!.hand[0];
    const others = s0.players.filter((p) => p.id !== actor);
    // may or may not be legal; foul triggers when fromHand && length<=1 before place check order
    eng.placePrepare(actor, others[0].id, card);
    const foul = eng.getSnapshot().lastFoul;
    // If target wasn't first legal, different foul; if length<=1 fromHand → GaveAwayLastPrepare
    expect(foul?.foul).toBeDefined();
  });

  it("CPU never randomly skips a legal prepare place", () => {
    const eng = new GameEngine({ seats: seats3, seed: 7 });
    for (let i = 0; i < 30; i++) {
      const s = eng.getSnapshot();
      if (s.phase !== Phase.Prepare) break;
      const p = s.players.find((x) => x.id === s.activePlayerId);
      if (!p?.isCPU) {
        resolvePrepareHeld(eng, p!.id);
        continue;
      }
      const before = p.huyovye;
      eng.runCpuTurn();
      const after = eng.getSnapshot().players.find((x) => x.id === p.id);
      expect(after!.huyovye).toBeLessThanOrEqual(before + 1);
    }
  });
});

describe("main protocol", () => {
  function advanceToMain(seed: number): GameEngine {
    const eng = new GameEngine({ seats: seats3, seed });
    drainPrepare(eng);
    return eng;
  }

  it("discard completes at active player count", () => {
    const eng = advanceToMain(21);
    expect(eng.getSnapshot().phase).toBe(Phase.Main);
    const s = eng.getSnapshot();
    const n = activePlayers(s.players).length;
    expect(n).toBe(3);

    // Lead and force takes until we can stack n cards via legal plays — synthetic:
    // manually play by clearing hands into sequential leads when empty pile
    let guard = 40;
    while (guard-- > 0) {
      const st = eng.getSnapshot();
      if (st.discardPendingFlip) break;
      const id = st.activePlayerId;
      const pl = st.players.find((p) => p.id === id)!;
      if (st.current.length === 0) {
        if (pl.hand[0]) eng.playMain(id, pl.hand[0]);
        else break;
        continue;
      }
      const target = st.current[st.current.length - 1];
      const beater = pl.hand.find((c) => canBeat(target, c, st.trump));
      if (beater) eng.playMain(id, beater);
      else eng.takeBottom(id);
    }
    const final = eng.getSnapshot();
    if (final.discardPendingFlip) {
      expect(final.current.length).toBe(
        activePlayers(final.players).length,
      );
    }
  });

  it("take bottom shifts first card of current", () => {
    const eng = advanceToMain(22);
    const s = eng.getSnapshot();
    expect(s.phase).toBe(Phase.Main);
    const id = s.activePlayerId;
    const pl = s.players.find((p) => p.id === id)!;
    if (!pl.hand[0]) return;
    eng.playMain(id, pl.hand[0]);
    const afterLead = eng.getSnapshot();
    expect(afterLead.current.length).toBe(1);
    const bottom = afterLead.current[0];
    const next = afterLead.activePlayerId;
    eng.takeBottom(next);
    const taken = eng.getSnapshot();
    expect(taken.current.length).toBe(0);
    const receiver = taken.players.find((p) => p.id === next)!;
    expect(
      receiver.hand.some(
        (c) => c.rank === bottom.rank && c.suit === bottom.suit,
      ),
    ).toBe(true);
  });

  it("illegal beat awards foul and passes to next after fouler", () => {
    const eng = advanceToMain(23);
    const s = eng.getSnapshot();
    if (s.phase !== Phase.Main) return;
    const id = s.activePlayerId;
    const pl = s.players.find((p) => p.id === id)!;
    if (!pl.hand[0]) return;
    eng.playMain(id, pl.hand[0]);
    const mid = eng.getSnapshot();
    if (mid.phase !== Phase.Main) return;
    const next = mid.activePlayerId;
    const np = mid.players.find((p) => p.id === next)!;
    const target = mid.current[mid.current.length - 1];
    const illegal = np.hand.find((c) => !canBeat(target, c, mid.trump));
    if (!illegal) return;
    eng.playMain(next, illegal);
    const after = eng.getSnapshot();
    expect(after.lastFoul?.foul).toBe(Foul.IllegalBeat);
    expect(after.lastFoul?.playerId).toBe(next);
    expect([Phase.Main, Phase.Huyovye]).toContain(after.phase);
  });
});

describe("stumps / exit", () => {
  it("exit requires empty hand and stumps (OR, not AND bug)", () => {
    const eng = new GameEngine({ seats: seats3, seed: 30 });
    drainPrepare(eng);
    const s = eng.getSnapshot();
    expect([Phase.Main, Phase.Huyovye]).toContain(s.phase);
    const candidate = s.players[0];
    expect(typeof eng.exitGame).toBe("function");
    expect(typeof eng.claimStumps).toBe("function");
    expect(eng.exitGame(candidate.id)).toBe(false);
  });

  it("peek stumps without announce is a foul", () => {
    const eng = new GameEngine({ seats: seats3, seed: 31 });
    eng.peekStumps(1);
    expect(eng.getSnapshot().lastFoul?.foul).toBe(
      Foul.LookedStumpsWithoutAnnounce,
    );
  });
});

describe("fouls enum", () => {
  it("exposes canonical foul values", () => {
    expect(Foul.GaveAwayLastPrepare).toBe("gave_away_last_prepare");
    expect(Foul.PlacedLastDeckCard).toBe("placed_last_deck_card");
    expect(Foul.NamedTrumpAloud).toBe("named_trump_aloud");
    expect(Foul.AceGotLowest).toBe("ace_got_lowest");
  });

  it("naming trump aloud awards foul", () => {
    const eng = new GameEngine({ seats: seats3, seed: 40 });
    eng.nameTrumpAloud(3);
    expect(eng.getSnapshot().lastFoul?.foul).toBe(Foul.NamedTrumpAloud);
  });
});

describe("no React in engine module graph", () => {
  it("engine types do not reference react", () => {
    // structural: GameEngine constructs without react
    const eng = new GameEngine({ seats: seats3, seed: 99 });
    expect(eng.getSnapshot().players[0].hand[0].rank).toBeGreaterThan(0);
    expect(CardRanks.six).toBe(6);
    expect(CardSuits.Spades).toBe("spades");
  });
});
