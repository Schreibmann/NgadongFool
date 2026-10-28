import {
  Phase,
  type GameState,
  type EnginePlayer,
  type StartOptions,
} from "../types";
import type { EngineCard } from "../types";
import { createDeck, shuffleDeck } from "../deck";
import { nextClockwiseId } from "../seats";
import { DEFAULT_DECK_SIZE } from "../cards";

/** Find or pick the dealer seat for this deal. */
function resolveDealerId(
  players: EnginePlayer[],
  watchmanId: number | null,
  rng: () => number
): { dealerId: number; watchmanId: number | null } {
  if (watchmanId != null && players.some((p) => p.id === watchmanId)) {
    return { dealerId: watchmanId, watchmanId };
  }
  const idx = Math.floor(rng() * players.length);
  const dealerId = players[idx].id;
  return { dealerId, watchmanId: dealerId };
}

/** Empty pre-deal state (phase Deal) for the given seats. */
export function buildInitialGameState(
  options: StartOptions,
  rng: () => number
): GameState {
  const players: EnginePlayer[] = options.seats.map((s) => ({
    id: s.id,
    name: s.name,
    isCPU: s.isCPU,
    hand: [] as EngineCard[],
    stumps: [] as EngineCard[],
    huyovye: 0,
    active: true,
    stumpsRevealed: false,
  }));

  const { dealerId, watchmanId } = resolveDealerId(
    players,
    options.watchmanId === undefined ? null : options.watchmanId,
    rng
  );

  return {
    phase: Phase.Deal,
    deck: [],
    deckSize: options.deckSize ?? DEFAULT_DECK_SIZE,
    players,
    dealerId,
    watchmanId,
    previousWatchmanId: null,
    activePlayerId: dealerId,
    trump: null,
    current: [],
    beaten: [],
    discardPendingFlip: false,
    lastPlayedById: null,
    tookLastDeckCardId: null,
    prepareHeld: null,
    roundJustEnded: false,
    huyovyeQueue: [],
    resumeMainAfterHuyovye: false,
    pendingWatchmanHandoff: false,
    watchmanAskCounts: {},
    lastFoul: null,
    message: null,
    initialPlayerCount: players.length,
  };
}

/**
 * Full deal: 2 face-down stumps + 1 face-up card each, clockwise after the
 * dealer, remaining deck in the center; first active seat is after the dealer.
 */
export function dealStage(state: GameState, rng: () => number): GameState {
  const deck = shuffleDeck(createDeck(state.deckSize), rng);
  const orderIds: number[] = [];
  let cursor = state.dealerId;
  for (let i = 0; i < state.players.length; i++) {
    cursor = nextClockwiseId(state.players, cursor, { activeOnly: false });
    orderIds.push(cursor);
  }

  const players = state.players.map((p) => ({
    ...p,
    hand: [] as EngineCard[],
    stumps: [] as EngineCard[],
  }));

  let deckIndex = 0;

  const playersById = new Map(players.map((p) => [p.id, p]));
  for (const id of orderIds) {
    const p = playersById.get(id);
    if (!p) continue;
    p.stumps.push(deck[deckIndex++], deck[deckIndex++]);
  }
  for (const id of orderIds) {
    const p = playersById.get(id);
    if (!p) continue;
    p.hand.push(deck[deckIndex++]);
  }

  const firstActive = nextClockwiseId(players, state.dealerId);

  return {
    ...state,
    phase: Phase.Prepare,
    deck: deck.slice(deckIndex),
    players,
    activePlayerId: firstActive,
    prepareHeld: null,
    message: "Раздача завершена. Набор.",
  };
}
