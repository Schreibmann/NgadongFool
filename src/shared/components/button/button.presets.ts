import type { ViewStyle, TextStyle } from "react-native";
import { color, spacing, typography } from "@theme";

const BASE_VIEW: ViewStyle = {
  paddingVertical: spacing[2],
  paddingHorizontal: spacing[2],
  borderRadius: 6,
  justifyContent: "center",
  alignItems: "center",
};

const BASE_TEXT: TextStyle = {
  paddingHorizontal: spacing[3],
  fontFamily: typography.ngadong,
};

const primaryView: ViewStyle = {
  ...BASE_VIEW,
  backgroundColor: color.primary,
};

const linkView: ViewStyle = {
  ...BASE_VIEW,
  paddingHorizontal: 0,
  paddingVertical: 0,
  alignItems: "flex-start",
  backgroundColor: "transparent",
};

const primaryText: TextStyle = {
  ...BASE_TEXT,
  fontSize: 11,
  color: color.textDark,
  fontWeight: "700",
  letterSpacing: 1,
};

const linkText: TextStyle = {
  ...BASE_TEXT,
  color: color.text,
  paddingHorizontal: 0,
  paddingVertical: 0,
  fontSize: 11,
  fontWeight: "700",
};

export const viewPresets = {
  primary: primaryView,
  link: linkView,
};

export const textPresets = {
  primary: primaryText,
  link: linkText,
};

export type ButtonPresetNames = keyof typeof viewPresets;
