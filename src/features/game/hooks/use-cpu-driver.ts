import { useEffect } from "react";
import { type GameEngine, type GameState, Phase } from "../engine";

/** Cadence between CPU steps so moves stay readable. */
const CPU_STEP_MS = 450;

/**
 * Drives CPU seats from the UI (no throttling/animation yet).
 * CPU obligations are seat-based: huyovye drains by giver, so a run is needed
 * whenever that phase is active regardless of whose "turn" it is.
 */
export function useCpuDriver(engine: GameEngine, state: GameState): void {
  useEffect(() => {
    if (state.phase !== Phase.Huyovye) {
      return undefined;
    }
    const cpuPending = state.huyovyeQueue.some((q) => {
      const giver = state.players.find((p) => p.id === q.giverId);
      return giver?.isCPU === true;
    });
    if (!cpuPending) {
      if (state.huyovyeQueue.length === 0) {
        engine.finishHuyovye();
      }
      return undefined;
    }
    // Interval recovers a soft no-op that would otherwise stall the phase.
    const t = setInterval(() => engine.runCpuHuyovye(), CPU_STEP_MS);
    return () => clearInterval(t);
  }, [engine, state.phase, state.huyovyeQueue, state.players]);

  useEffect(() => {
    if (state.phase !== Phase.Prepare && state.phase !== Phase.Main) {
      return undefined;
    }
    // Minimal deps: one interval per phase entry; the engine itself is the
    // guard (runCpuTurn no-ops when the active seat is not a playable CPU).
    const t = setInterval(() => engine.runCpuTurn(), CPU_STEP_MS);
    return () => clearInterval(t);
  }, [engine, state.phase]);
}
