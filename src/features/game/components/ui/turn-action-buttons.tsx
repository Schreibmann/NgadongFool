import { FC } from "react";
import { GameEngine, GameState, Phase } from "../../engine";
import { Button } from "@shared-components/button/button";
import { BUTTON_WRAPPER, TEXT } from "./common-styles";

export interface TurnActionButtonsProps {
  engine: GameEngine;
  state: GameState;
  humanId: number;
  isMyTurn: boolean;
  canKeepPrepare: boolean;
}

/** ЗАБРАТЬ / ВЗЯТЬ (не могу бить) / ОТБОЙ (перевернуть отбой). */
export const TurnActionButtons: FC<TurnActionButtonsProps> = ({
  engine,
  state,
  humanId,
  isMyTurn,
  canKeepPrepare,
}) => (
  <>
    {canKeepPrepare ? (
      <Button
        testID="keep-card-button"
        style={BUTTON_WRAPPER}
        textStyle={TEXT}
        text="ЗАБРАТЬ"
        onPress={() => engine.keepPrepare(humanId)}
      />
    ) : null}

    {state.phase === Phase.Main &&
    isMyTurn &&
    state.current.length > 0 &&
    !state.discardPendingFlip ? (
      <Button
        testID="take-card-button"
        style={BUTTON_WRAPPER}
        textStyle={TEXT}
        tx="playgroundScreen.take"
        onPress={() => engine.takeBottom(humanId)}
      />
    ) : null}

    {state.phase === Phase.Main &&
    state.discardPendingFlip &&
    state.lastPlayedById === humanId ? (
      <Button
        testID="flip-discard-button"
        style={BUTTON_WRAPPER}
        textStyle={TEXT}
        text="ОТБОЙ"
        onPress={() => engine.flipDiscard(humanId)}
      />
    ) : null}
  </>
);
