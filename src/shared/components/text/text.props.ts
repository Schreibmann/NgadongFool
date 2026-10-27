import {
  StyleProp,
  TextProps as TextProperties,
  TextStyle,
} from "react-native";
import { TranslateOptions } from "i18n-js";
import { TextPresets } from "./text.presets";
import { TxKeyPath } from "i18n";

export interface TextProps extends TextProperties {
  children?: React.ReactNode;
  tx?: TxKeyPath;
  txOptions?: TranslateOptions;
  text?: string;
  style?: StyleProp<TextStyle>;
  preset?: TextPresets;
}
