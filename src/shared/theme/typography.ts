import { Platform } from "react-native";

export const typography = {
  primary: Platform.select({
    ios: "Helvetica",
    android: "sans-serif",
    default: "sans-serif",
  }),
  secondary: Platform.select({
    ios: "Arial",
    android: "sans-serif",
    default: "sans-serif",
  }),
  code: Platform.select({
    ios: "Courier",
    android: "monospace",
    default: "monospace",
  }),
  ngadong: "Ngadong",
};
