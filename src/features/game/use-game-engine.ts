import { useCallback, useRef, useSyncExternalStore } from "react";
import { GameEngine, StartOptions } from "./engine";

function seatsKey(options: StartOptions): string {
  return `${options.seed ?? "r"}:${options.sessionNonce ?? "0"}:${options.deckSize ?? 36}:${options.watchmanId ?? "x"}:${options.seats
    .map((s) => s.id)
    .join(",")}`;
}

export function useGameEngine(options: StartOptions): {
  engine: GameEngine;
  state: ReturnType<GameEngine["getSnapshot"]>;
} {
  const key = seatsKey(options);
  const keyRef = useRef(key);
  const engineRef = useRef<GameEngine | null>(null);

  if (engineRef.current === null || keyRef.current !== key) {
    engineRef.current = new GameEngine(options);
    keyRef.current = key;
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
