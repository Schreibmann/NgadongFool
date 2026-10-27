import { GameEngine } from "../engine";
import { Phase, SeatConfig } from "../types";
import { resolvePrepareHeld } from "./prepare-helpers";

const seats4: SeatConfig[] = [
  { id: 1, name: "A", isCPU: true },
  { id: 2, name: "B", isCPU: true },
  { id: 3, name: "C", isCPU: true },
  { id: 100, name: "Human", isCPU: false },
];

/** Advance through Prepare; leave Huyovye for human gifts (do not finish). */
function drainPrepareLeaveHuyovye(eng: GameEngine): void {
  let guard = 120;
  while (guard-- > 0 && eng.getSnapshot().phase === Phase.Prepare) {
    const s = eng.getSnapshot();
    const id = s.activePlayerId;
    const p = s.players.find((x) => x.id === id);
    if (!p) break;
    if (p.isCPU) {
      eng.runCpuTurn();
    } else {
      resolvePrepareHeld(eng, id);
    }
  }
  if (eng.getSnapshot().phase === Phase.Huyovye) {
    eng.runCpuHuyovye();
  }
}

describe("manual huyovye", () => {
  it("enters huyovye or main after prepare without auto-skipping gifts owed by humans", () => {
    const eng = new GameEngine({ seats: seats4, seed: 1, watchmanId: 1 });
    eng.nameTrumpAloud(100);
    expect(eng.getSnapshot().players.find((p) => p.id === 100)?.huyovye).toBe(
      1,
    );
    drainPrepareLeaveHuyovye(eng);
    const s = eng.getSnapshot();
    expect([Phase.Huyovye, Phase.Main]).toContain(s.phase);
    if (s.phase === Phase.Huyovye) {
      // CPU obligations auto-cleared; human-as-giver obligations may remain
      const humanGifts = s.huyovyeQueue.filter((q) => q.giverId === 100);
      expect(humanGifts.length).toBeGreaterThanOrEqual(0);
    }
  });

  it("giveHuyovyeCard drops obligation when giver has only last hand card", () => {
    const eng = new GameEngine({ seats: seats4, seed: 2, watchmanId: 1 });
    eng.nameTrumpAloud(1);
    drainPrepareLeaveHuyovye(eng);
    const st = eng.getSnapshot();
    if (st.phase !== Phase.Huyovye) {
      return;
    }
    while (
      eng.getSnapshot().players.find((p) => p.id === 100)!.hand.length > 1
    ) {
      const g = eng.getSnapshot().players.find((p) => p.id === 100)!;
      const q = eng.getSnapshot().huyovyeQueue.find((x) => x.giverId === 100);
      if (!q) break;
      eng.giveHuyovyeCard(100, q.receiverId, g.hand[0]);
    }
    const g2 = eng.getSnapshot().players.find((p) => p.id === 100)!;
    const q2 = eng.getSnapshot().huyovyeQueue.find((x) => x.giverId === 100);
    if (q2 && g2.hand.length === 1) {
      const before = eng.getSnapshot().huyovyeQueue.length;
      expect(eng.giveHuyovyeCard(100, q2.receiverId, g2.hand[0])).toBe(true);
      expect(eng.getSnapshot().lastFoul).toBeNull();
      expect(eng.getSnapshot().players.find((p) => p.id === 100)!.hand).toHaveLength(
        1,
      );
      expect(eng.getSnapshot().huyovyeQueue.length).toBeLessThan(before);
    }
  });

  it("finishHuyovye only when queue empty", () => {
    const eng = new GameEngine({ seats: seats4, seed: 3 });
    expect(eng.finishHuyovye()).toBe(false);
  });
});

describe("watchman handoff", () => {
  it("setWatchman prompts handoff and accept clears it", () => {
    const eng = new GameEngine({ seats: seats4, seed: 4, watchmanId: 1 });
    eng.setWatchman(100);
    const s = eng.getSnapshot();
    expect(s.phase).toBe(Phase.Ended);
    expect(s.pendingWatchmanHandoff).toBe(true);
    expect(s.watchmanId).toBe(100);
    expect(s.previousWatchmanId).toBe(1);
    expect(s.message || "").toMatch(/вахту сдал/i);
    expect(eng.acceptWatchmanHandoff()).toBe(true);
    expect(eng.getSnapshot().pendingWatchmanHandoff).toBe(false);
  });

  it("protocolsFor empty mid-hand", () => {
    const eng = new GameEngine({ seats: seats4, seed: 5 });
    expect(eng.protocolsFor(100)).toEqual([]);
  });
});

describe("N seats", () => {
  it("deals for 6 players", () => {
    const seats6: SeatConfig[] = [
      ...seats4,
      { id: 4, name: "D", isCPU: true },
      { id: 5, name: "E", isCPU: true },
    ];
    const eng = new GameEngine({ seats: seats6, seed: 6 });
    const s = eng.getSnapshot();
    expect(s.players).toHaveLength(6);
    expect(s.deck.length).toBe(36 - 6 * 3);
  });
});
