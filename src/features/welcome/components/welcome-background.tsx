import type { FC } from "react";
import {
  StyleSheet,
  View,
  type ViewStyle,
  type ImageStyle,
} from "react-native";
import { Image } from "expo-image";
import { gameAssets } from "@assets/prehistoric/assets";
import { tableAssets } from "@assets/prehistoric-v2/assets";
import { welcomePalette } from "../welcome-tokens";

const ROOT: ViewStyle = {
  ...StyleSheet.absoluteFill,
  backgroundColor: welcomePalette.caveDeep,
};

const TILE: ImageStyle = {
  ...StyleSheet.absoluteFill,
  width: "100%",
  height: "100%",
};

const MURAL: ImageStyle = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: "40%",
  opacity: 0.42,
};

const VIGNETTE: ViewStyle = {
  ...StyleSheet.absoluteFill,
  backgroundColor: "rgba(21,16,9,0.45)",
};

interface WelcomeBackgroundProps {
  /** Wider cave mural strip for desktop. */
  showMural?: boolean;
}

export const WelcomeBackground: FC<WelcomeBackgroundProps> = ({
  showMural = false,
}) => (
  <View style={ROOT} pointerEvents="none" testID="WelcomeBackground">
    <Image
      source={gameAssets.backgrounds.caveRockTexture}
      style={TILE}
      contentFit="cover"
    />
    {showMural ? (
      <Image
        source={tableAssets.boards.caveMural}
        style={MURAL}
        contentFit="cover"
      />
    ) : null}
    <View style={VIGNETTE} />
  </View>
);
