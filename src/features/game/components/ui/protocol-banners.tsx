import type { FC } from "react";
import {
  type ImageStyle,
  ScrollView,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";
import { Image } from "expo-image";
import type { EnginePlayer } from "../../engine";
import { Button } from "@shared-components/button/button";
import { Text } from "@shared-components/text/text";
import {
  SMALL,
  TEXT,
  BANNER,
  BUTTON_WRAPPER,
  BUTTON_TEXT,
} from "./common-styles";

const BUTTON_BACKGROUND = require("@assets/images/button-background.png");

const STUMP_BUTTON_STYLE: ViewStyle = {
  display: "flex",
  alignItems: "center",
  width: 230,
  height: 75,
};
const STUMP_BUTTON_IMAGE: ImageStyle = { ...StyleSheet.absoluteFill };

/** «Беру пни!» + «С пидорами не играю!» banners after a discard cycle. */
export const ProtocolBanners: FC<{
  protocols: Array<"claim_stumps" | "exit">;
  onClaimStumps: () => void;
  onExit: () => void;
}> = ({ protocols, onClaimStumps, onExit }) => (
  <>
    {protocols.includes("claim_stumps") ? (
      <View style={BANNER} testID="ClaimStumpsPrompt">
        <Text style={TEXT} text="Беру пни / пеньки / дубки!" />
        <Button
          testID="show-stumps-button"
          style={BUTTON_WRAPPER}
          onPress={onClaimStumps}
        >
          <View style={STUMP_BUTTON_STYLE}>
            <Image
              contentFit="contain"
              style={STUMP_BUTTON_IMAGE}
              source={BUTTON_BACKGROUND}
            />
            <Text tx="playgroundScreen.showStumps" style={BUTTON_TEXT} />
          </View>
        </Button>
      </View>
    ) : null}

    {protocols.includes("exit") ? (
      <View style={BANNER} testID="ExitPrompt">
        <Text style={TEXT} text="С пидорами не играю!" />
        <Button
          testID="exit-game-button"
          style={BUTTON_WRAPPER}
          textStyle={TEXT}
          text="ВЫЙТИ ИЗ ИГРЫ"
          onPress={onExit}
        />
      </View>
    ) : null}
  </>
);

/** Дуэль: кнопки пере-назначения вахты между двумя активными местами. */
export const DuelControls: FC<{
  duelists: EnginePlayer[];
  onSetWatchman: (loserId: number) => void;
}> = ({ duelists, onSetWatchman }) => (
  <ScrollView horizontal contentContainerStyle={{ gap: 8, padding: 8 }}>
    {duelists.map((p) => (
      <Button
        key={`duel-lose-${p.id}`}
        style={BUTTON_WRAPPER}
        textStyle={SMALL}
        text={`Вахта → ${p.name}`}
        onPress={() => onSetWatchman(p.id)}
      />
    ))}
  </ScrollView>
);
