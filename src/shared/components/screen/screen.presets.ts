import type { ViewStyle } from "react-native";
import { color } from "@theme";

export const offsets = {
  none: 0,
};

export type KeyboardOffsets = keyof typeof offsets;

const fixedOuter: ViewStyle = {
  backgroundColor: color.background,
  flex: 1,
  height: "100%",
};

const fixedInner: ViewStyle = {
  justifyContent: "flex-start",
  alignItems: "stretch",
  height: "100%",
  width: "100%",
};

const scrollOuter: ViewStyle = {
  backgroundColor: color.background,
  flex: 1,
  height: "100%",
};

const scrollInner: ViewStyle = {
  justifyContent: "flex-start",
  alignItems: "stretch",
};

export const presets = {
  fixed: {
    outer: fixedOuter,
    inner: fixedInner,
  },
  scroll: {
    outer: scrollOuter,
    inner: scrollInner,
  },
  auto: {
    offset: {
      percent: 0.92,
      point: 0,
    },
  },
};

export type ScreenPresets = keyof typeof presets;

export function isNonScrolling(preset?: ScreenPresets) {
  return !preset || !presets[preset] || preset === "fixed";
}
