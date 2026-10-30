import type {
  StyleProp,
  TextProps as TextProperties,
  TextStyle,
} from "react-native";
import type { TranslateOptions } from "i18n-js";
import type { TextPresets } from "./text.presets";
import type { TxKeyPath } from "@i18n";

export interface TextProps extends TextProperties {
  children?: React.ReactNode;
  tx?: TxKeyPath;
  txOptions?: TranslateOptions;
  text?: string;
  style?: StyleProp<TextStyle>;
  preset?: TextPresets;
}
