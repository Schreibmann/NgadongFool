import { FC } from "react";
import { View } from "react-native";
import { GameState, EnginePlayer } from "../../engine";
import { Text } from "@shared-components/text/text";
import { Button } from "@shared-components/button/button";
import { SMALL, TEXT, BANNER, BUTTON_WRAPPER } from "./common-styles";

export interface EndedBannerProps {
  state: GameState;
  humanId: number;
  activePlayers: EnginePlayer[];
  onAskWho: () => void;
  onAnswerWho: () => void;
}

/** Финал: «дуэль окончена / вахта назначена» + КТО НА ВАХТЕ? протоколы. */
export const EndedBanner: FC<EndedBannerProps> = ({
  state,
  humanId,
  onAskWho,
  onAnswerWho,
}) => (
  <View style={BANNER}>
    <Text style={TEXT} text="Дуэль окончена / вахта назначена" />
    {state.watchmanAskCounts[humanId] ? (
      <Button
        style={BUTTON_WRAPPER}
        textStyle={SMALL}
        text="ОТВЕТИТЬ НА «КТО НА ВАХТЕ?»"
        onPress={onAnswerWho}
      />
    ) : (
      <Button
        style={BUTTON_WRAPPER}
        textStyle={SMALL}
        text="КТО НА ВАХТЕ?"
        onPress={onAskWho}
      />
    )}
  </View>
);
