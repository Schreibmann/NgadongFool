import { useCallback, useRef, useSyncExternalStore } from "react";
import { GameEngine, StartOptions } from "./engine";

export function useGameEngine(options: StartOptions): {
  engine: GameEngine;
  state: ReturnType<GameEngine["getSnapshot"]>;
} {
  const engineRef = useRef<GameEngine | null>(null);
  if (engineRef.current === null) {
    engineRef.current = new GameEngine(options);
  }
  const engine = engineRef.current;

  const subscribe = useCallback(
    (onStoreChange: () => void) => engine.subscribe(onStoreChange),
    [engine],
  );

  const state = useSyncExternalStore(
    subscribe,
    engine.getSnapshot,
    engine.getSnapshot,
  );

  return { engine, state };
}
