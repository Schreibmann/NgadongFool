import type {
  StyleProp,
  TextStyle,
  TouchableOpacityProps,
  ViewStyle,
} from "react-native";
import type { ButtonPresetNames } from "./button.presets";
import type { TxKeyPath } from "@i18n";

export interface ButtonProps extends TouchableOpacityProps {
  tx?: TxKeyPath;
  text?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  preset?: ButtonPresetNames;
  children?: React.ReactNode;
}
