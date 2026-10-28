import { useEffect, useMemo } from "react";
import {
  type EngineCard,
  type GameEngine,
  type GameState,
  Phase,
} from "../engine";
import { peekFirstPrepareTarget } from "../engine";
import { HUMAN_ID } from "../players";

export interface PrepareTurn {
  /** Card the seat must dump or keep (held card, else own top). */
  prepareDumpCard: EngineCard | null;
  /** First clockwise legal target for the dump card (engine peek). */
  legalPrepareTarget: { id: number; name: string } | null;
  /** ЗАБРАТЬ button availability (keeping with a mandatory dump is a foul). */
  canKeepPrepare: boolean;
  isMyTurn: boolean;
}

/**
 * Prepare-phase selectors + the human auto-draw effect. UI never duplicates
 * rules: legality always comes from the engine via peekFirstPrepareTarget.
 */
export function usePrepareTurn(
  engine: GameEngine,
  state: GameState
): PrepareTurn {
  const me = state.players.find((p) => p.id === HUMAN_ID);
  const isMyTurn = state.activePlayerId === HUMAN_ID;

  const prepareDumpCard: EngineCard | null = useMemo(() => {
    if (state.phase !== Phase.Prepare) {
      return null;
    }
    return state.prepareHeld ?? (me && me.hand.length > 1 ? me.hand[0] : null);
  }, [state.phase, state.prepareHeld, me]);

  const legalPrepareTarget = useMemo(() => {
    if (state.phase !== Phase.Prepare || !prepareDumpCard) {
      return null;
    }
    return peekFirstPrepareTarget(state, HUMAN_ID, prepareDumpCard);
    // `state` is an immutable snapshot by design.
  }, [state, prepareDumpCard]);

  const canKeepPrepare =
    state.phase === Phase.Prepare && isMyTurn && state.prepareHeld != null;

  useEffect(() => {
    if (
      isMyTurn &&
      state.phase === Phase.Prepare &&
      !state.prepareHeld &&
      state.deck.length > 0
    ) {
      engine.drawPrepare(HUMAN_ID);
    }
  }, [engine, isMyTurn, state.phase, state.prepareHeld, state.deck.length]);

  return { prepareDumpCard, legalPrepareTarget, canKeepPrepare, isMyTurn };
}
