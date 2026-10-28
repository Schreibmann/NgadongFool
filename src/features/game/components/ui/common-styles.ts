import { ImageStyle, TextStyle, ViewStyle } from "react-native";
import { color, typography } from "@theme";

export const FULL: ViewStyle = { flex: 1 };
export const FLEX_CENTER: ViewStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
export const TEXT: TextStyle = {
  fontSize: 16,
  color: color.palette.lighterGrey,
  fontFamily: typography.ngadong,
  textAlign: "center",
};
export const SMALL: TextStyle = { ...TEXT, fontSize: 12 };
export const BANNER: ViewStyle = {
  backgroundColor: "rgba(0,0,0,0.55)",
  padding: 12,
  marginHorizontal: 8,
  marginBottom: 8,
  alignItems: "center",
};
export const BUTTON_WRAPPER: ViewStyle = { backgroundColor: "transparent" };
export const BUTTON_TEXT: TextStyle = {
  ...TEXT,
  fontSize: 18,
  lineHeight: 52,
  letterSpacing: 2,
};
export const PLAYER: ViewStyle = { ...FLEX_CENTER, maxWidth: 120 };
export const PLAYER_IMAGE: ImageStyle = {
  borderRadius: 18,
  height: 56,
  width: 52,
};
