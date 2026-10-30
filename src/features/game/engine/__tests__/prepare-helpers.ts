import { type GameEngine, peekFirstPrepareTarget } from "../engine";
import { Phase } from "../types";

/** Draw if needed, then place on first legal target or keep when none. */
export function resolvePrepareHeld(eng: GameEngine, playerId: number): void {
  const s = eng.getSnapshot();
  if (s.phase !== Phase.Prepare) return;
  if (!s.prepareHeld) {
    eng.drawPrepare(playerId);
  }
  const after = eng.getSnapshot();
  if (after.phase !== Phase.Prepare || !after.prepareHeld) return;
  const target = peekFirstPrepareTarget(after, playerId, after.prepareHeld);
  if (target) {
    eng.placePrepare(playerId, target.id);
  } else {
    eng.keepPrepare(playerId);
  }
}

export function drainPrepare(eng: GameEngine): void {
  let guard = 150;
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
  guard = 80;
  while (guard-- > 0 && eng.getSnapshot().phase === Phase.Huyovye) {
    eng.runCpuHuyovye();
    const q = eng.getSnapshot().huyovyeQueue;
    if (q.length === 0) {
      eng.finishHuyovye();
      break;
    }
    const humanGift = q.find((x) => {
      const g = eng.getSnapshot().players.find((p) => p.id === x.giverId);
      return g?.isCPU === false;
    });
    if (!humanGift) {
      break;
    }
    const giver = eng
      .getSnapshot()
      .players.find((p) => p.id === humanGift.giverId);
    if (!giver || giver.hand.length <= 1) {
      break;
    }
    eng.giveHuyovyeCard(humanGift.giverId, humanGift.receiverId, giver.hand[0]);
  }
}
