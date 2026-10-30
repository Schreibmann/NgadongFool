import type { FC } from "react";
import {
  StyleSheet,
  View,
  type ViewStyle,
  type ImageStyle,
} from "react-native";
import { Image } from "expo-image";
import { tableAssets } from "@assets/prehistoric-v2/assets";

const CONTAINER: ViewStyle = {
  ...StyleSheet.absoluteFill,
  backgroundColor: "#1a1410",
};

const TILE: ImageStyle = {
  ...StyleSheet.absoluteFill,
  width: "100%",
  height: "100%",
};

const SHADE: ViewStyle = {
  ...StyleSheet.absoluteFill,
  backgroundColor: "rgba(12,8,5,0.35)",
};

export const CaveBackground: FC = () => (
  <View style={CONTAINER} testID="CaveBackground">
    <Image
      source={tableAssets.backgrounds.earthBlurred}
      style={TILE}
      contentFit="cover"
    />
    <View style={SHADE} />
  </View>
);

/** Full-screen solid cave backdrop used when the board mural should sit on a
 * dark surface rather than a rock texture. */
export const CaveBackdrop: FC = () => (
  <View style={CONTAINER} testID="CaveBackdrop" />
);
