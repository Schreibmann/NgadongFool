import type { ViewStyle, TextStyle } from "react-native";
import { color, spacing } from "@theme";

const BASE_VIEW: ViewStyle = {
  paddingVertical: spacing[2],
  paddingHorizontal: spacing[2],
  borderRadius: 4,
  justifyContent: "center",
  alignItems: "center",
};

const BASE_TEXT: TextStyle = {
  paddingHorizontal: spacing[3],
};

const primaryView: ViewStyle = {
  ...BASE_VIEW,
  backgroundColor: color.palette.orange,
};

const linkView: ViewStyle = {
  ...BASE_VIEW,
  paddingHorizontal: 0,
  paddingVertical: 0,
  alignItems: "flex-start",
};

const primaryText: TextStyle = {
  ...BASE_TEXT,
  fontSize: 9,
  color: color.palette.white,
};

const linkText: TextStyle = {
  ...BASE_TEXT,
  color: color.text,
  paddingHorizontal: 0,
  paddingVertical: 0,
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
