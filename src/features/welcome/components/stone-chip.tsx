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
import { tableAssets } from "@assets/prehistoric-v2/assets";
import { welcomePalette } from "../welcome-tokens";

interface StoneChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  testID?: string;
  /** Desktop chips are slightly larger. */
  size?: "mobile" | "desktop";
}

export const StoneChip: FC<StoneChipProps> = ({
  label,
  selected,
  onPress,
  testID,
  size = "mobile",
}) => {
  const inactive = size === "desktop" ? DESKTOP_INACTIVE : MOBILE_INACTIVE;
  const activeSize = size === "desktop" ? 64 : 56;
  const digitSize = size === "desktop" ? 22 : 18;

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [
        BASE,
        selected
          ? {
              width: activeSize,
              height: activeSize,
              borderRadius: activeSize,
              ...SELECTED_GLOW,
            }
          : inactive,
        pressed ? PRESSED : null,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Image
        source={
          selected
            ? tableAssets.panels.roundBadge
            : gameAssets.panels.tileSquare
        }
        style={FILL_IMAGE}
        contentFit="cover"
      />
      {selected ? <View style={EMBER_WASH} pointerEvents="none" /> : null}
      {!selected ? <View style={INACTIVE_SHADE} pointerEvents="none" /> : null}
      <Text
        text={label}
        style={[
          DIGIT,
          selected ? DIGIT_ON : DIGIT_OFF,
          { fontSize: digitSize },
        ]}
      />
    </Pressable>
  );
};

const BASE: ViewStyle = {
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
};

const FILL_IMAGE: ImageStyle = {
  ...StyleSheet.absoluteFill,
  width: "100%",
  height: "100%",
};

const MOBILE_INACTIVE: ViewStyle = {
  width: 56,
  height: 44,
  borderRadius: 8,
};

const DESKTOP_INACTIVE: ViewStyle = {
  width: 64,
  height: 52,
  borderRadius: 8,
};

const SELECTED_GLOW: ViewStyle = {
  shadowColor: welcomePalette.emberMid,
  shadowOpacity: 0.55,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 0 },
  elevation: 6,
};

const PRESSED: ViewStyle = {
  transform: [{ translateY: 2 }],
  opacity: 0.92,
};

const EMBER_WASH: ViewStyle = {
  ...StyleSheet.absoluteFill,
  backgroundColor: "rgba(255,138,46,0.55)",
};

const INACTIVE_SHADE: ViewStyle = {
  ...StyleSheet.absoluteFill,
  backgroundColor: "rgba(21,16,9,0.28)",
};

const DIGIT: TextStyle = {
  fontFamily: typography.ngadong,
  textAlign: "center",
  zIndex: 1,
};

const DIGIT_ON: TextStyle = {
  color: welcomePalette.carved,
  textShadowColor: welcomePalette.sandstone,
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 0,
};

const DIGIT_OFF: TextStyle = {
  color: welcomePalette.bone,
};
