import { EnginePlayer, PlayerId } from "./types";

/** Seats ordered as stored; clockwise means increasing index, wrapping. */
export function playerIndex(
  players: EnginePlayer[],
  id: PlayerId,
): number {
  return players.findIndex((p) => p.id === id);
}

export function activePlayers(players: EnginePlayer[]): EnginePlayer[] {
  return players.filter((p) => p.active);
}

export function nextClockwiseId(
  players: EnginePlayer[],
  fromId: PlayerId,
  opts?: { activeOnly?: boolean },
): PlayerId {
  const activeOnly = opts?.activeOnly ?? true;
  const list = activeOnly ? activePlayers(players) : players;
  if (list.length === 0) {
    throw new Error("no players");
  }
  const idx = list.findIndex((p) => p.id === fromId);
  if (idx < 0) {
    return list[0].id;
  }
  return list[(idx + 1) % list.length].id;
}

/**
 * Ordered circle starting at the seat clockwise after `fromId`,
 * ending with `fromId` last (drawer is last when placing).
 */
export function clockwiseFromExclusive(
  players: EnginePlayer[],
  fromId: PlayerId,
  opts?: { activeOnly?: boolean },
): EnginePlayer[] {
  const activeOnly = opts?.activeOnly ?? true;
  const list = activeOnly ? activePlayers(players) : players;
  const start = list.findIndex((p) => p.id === fromId);
  if (start < 0 || list.length === 0) {
    return list;
  }
  const ordered: EnginePlayer[] = [];
  for (let i = 1; i <= list.length; i++) {
    ordered.push(list[(start + i) % list.length]);
  }
  return ordered;
}

/** First clockwise target (from drawer) whose predicate is true. */
export function firstClockwiseWhere(
  players: EnginePlayer[],
  fromId: PlayerId,
  pred: (p: EnginePlayer) => boolean,
): EnginePlayer | null {
  for (const p of clockwiseFromExclusive(players, fromId)) {
    if (pred(p)) {
      return p;
    }
  }
  return null;
}
