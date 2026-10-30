import type { FC } from "react";
import {
  Pressable,
  StyleSheet,
  View,
  type ImageStyle,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { Image } from "expo-image";
import { Text } from "@shared-components/text/text";
import { typography } from "@theme";
import { gameAssets } from "@assets/prehistoric/assets";
import { welcomePalette } from "../welcome-tokens";

interface BoulderCtaProps {
  onPress: () => void;
  testID?: string;
  /** Wider / taller plate on desktop. */
  size?: "mobile" | "desktop";
}

export const BoulderCta: FC<BoulderCtaProps> = ({
  onPress,
  testID,
  size = "mobile",
}) => {
  const plate = size === "desktop" ? DESKTOP_PLATE : MOBILE_PLATE;
  const label = size === "desktop" ? DESKTOP_LABEL : MOBILE_LABEL;

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [plate, pressed ? PRESSED : null]}
      accessibilityRole="button"
    >
      <Image
        source={gameAssets.panels.tileSquare}
        style={FILL}
        contentFit="cover"
      />
      <View style={STONE_WASH} pointerEvents="none" />
      <Text tx="welcomeScreen.play" style={[LABEL, label]} />
    </Pressable>
  );
};

const FILL: ImageStyle = {
  ...StyleSheet.absoluteFill,
  width: "100%",
  height: "100%",
};

const STONE_WASH: ViewStyle = {
  ...StyleSheet.absoluteFill,
  backgroundColor: "rgba(90,58,34,0.4)",
};

const MOBILE_PLATE: ViewStyle = {
  width: "82%",
  maxWidth: 360,
  height: 64,
  borderRadius: 12,
  overflow: "hidden",
  alignItems: "center",
  justifyContent: "center",
  alignSelf: "center",
};

const DESKTOP_PLATE: ViewStyle = {
  width: "100%",
  height: 88,
  borderRadius: 12,
  overflow: "hidden",
  alignItems: "center",
  justifyContent: "center",
  shadowColor: welcomePalette.emberMid,
  shadowOpacity: 0.35,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 0 },
  elevation: 4,
};

const PRESSED: ViewStyle = {
  transform: [{ translateY: 3 }],
  opacity: 0.95,
};

const LABEL: TextStyle = {
  fontFamily: typography.ngadong,
  color: welcomePalette.carved,
  textAlign: "center",
  letterSpacing: 1.2,
  textShadowColor: welcomePalette.sandstone,
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 0,
  zIndex: 1,
};

const MOBILE_LABEL: TextStyle = {
  fontSize: 22,
};

const DESKTOP_LABEL: TextStyle = {
  fontSize: 28,
};
