import { TextStyle } from "react-native";
import { color, typography } from "theme";

const BASE: TextStyle = {
  fontFamily: typography.ngadong,
  color: color.text,
  fontSize: 15,
};

const bold: TextStyle = { ...BASE, fontWeight: "700" };
const header: TextStyle = { ...BASE, fontSize: 24, fontWeight: "700" };
const fieldLabel: TextStyle = { ...BASE, fontSize: 13, color: color.dim };
const secondary: TextStyle = { ...BASE, fontSize: 9, color: color.dim };

export const presets = {
  default: BASE,
  bold,
  header,
  fieldLabel,
  secondary,
};

export type TextPresets = keyof typeof presets;
