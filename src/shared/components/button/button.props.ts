import {
  StyleProp,
  TextStyle,
  TouchableOpacityProps,
  ViewStyle,
} from "react-native";
import { ButtonPresetNames } from "./button.presets";
import { TxKeyPath } from "i18n";

export interface ButtonProps extends TouchableOpacityProps {
  tx?: TxKeyPath;
  text?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  preset?: ButtonPresetNames;
  children?: React.ReactNode;
}
