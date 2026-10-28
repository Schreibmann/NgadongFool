import type { FC } from "react";
import { View, type ViewStyle } from "react-native";
import type { GameState } from "../../engine";
import { Text } from "@shared-components/text/text";
import { Button } from "@shared-components/button/button";
import { SMALL, TEXT, BANNER } from "./common-styles";

const BANNER_BUTTON: ViewStyle = { backgroundColor: "transparent" };

export interface WatchmanHandoffBannerProps {
  state: GameState;
  onAccept: () => void;
  onAskWho: () => void;
}

export const WatchmanHandoffBanner: FC<WatchmanHandoffBannerProps> = ({
  state,
  onAccept,
  onAskWho,
}) => (
  <View style={BANNER} testID="WatchmanHandoffBanner">
    <Text style={TEXT} text={state.message ?? "Вахту сдал"} />
    <Button
      style={BANNER_BUTTON}
      textStyle={TEXT}
      text="ПРИНЯТЬ ВАХТУ"
      onPress={onAccept}
    />
    {state.watchmanId != null ? (
      <Button
        style={BANNER_BUTTON}
        textStyle={SMALL}
        text="КТО НА ВАХТЕ?"
        onPress={onAskWho}
      />
    ) : null}
  </View>
);
