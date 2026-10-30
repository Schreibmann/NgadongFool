import type { ImageStyle, TextStyle, ViewStyle } from "react-native";
import { color, typography } from "@theme";

export const FULL: ViewStyle = { flex: 1 };
export const FLEX_CENTER: ViewStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

export const TEXT: TextStyle = {
  fontSize: 15,
  color: color.text,
  fontFamily: typography.ngadong,
  textAlign: "center",
};
export const SMALL: TextStyle = { ...TEXT, fontSize: 11 };
export const HEADER: TextStyle = {
  ...TEXT,
  fontSize: 22,
  fontWeight: "800",
};
export const BANNER: ViewStyle = {
  backgroundColor: "rgba(26,20,16,0.85)",
  padding: 12,
  marginHorizontal: 8,
  marginBottom: 8,
  borderRadius: 8,
  alignItems: "center",
  borderWidth: 1,
  borderColor: color.line,
};
export const BUTTON_WRAPPER: ViewStyle = { backgroundColor: "transparent" };
export const BUTTON_TEXT: TextStyle = {
  ...TEXT,
  fontSize: 11,
  lineHeight: 52,
  letterSpacing: 1,
  fontWeight: "700",
};
export const PLAYER: ViewStyle = { ...FLEX_CENTER, maxWidth: 120 };
export const PLAYER_IMAGE: ImageStyle = {
  borderRadius: 18,
  height: 72,
  width: 64,
};
