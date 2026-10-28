import type { StyleProp, ViewStyle } from "react-native";
import type { KeyboardOffsets, ScreenPresets } from "./screen.presets";

export interface ScreenProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  preset?: ScreenPresets;
  backgroundColor?: string;
  statusBar?: "light-content" | "dark-content";
  unsafe?: boolean;
  keyboardOffset?: KeyboardOffsets;
  keyboardShouldPersistTaps?: "handled" | "always" | "never";
}
