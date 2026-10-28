import { TouchableOpacity } from "react-native";
import { Text } from "../text/text";
import { viewPresets, textPresets } from "./button.presets";
import type { ButtonProps } from "./button.props";

export function Button(props: ButtonProps) {
  const {
    preset = "primary",
    tx,
    text,
    style: styleOverride,
    textStyle: textStyleOverride,
    children,
    ...rest
  } = props;

  const viewStyle = viewPresets[preset] || viewPresets.primary;
  const textStyle = textPresets[preset] || textPresets.primary;
  const content = children || (
    <Text tx={tx} text={text} style={[textStyle, textStyleOverride]} />
  );

  return (
    <TouchableOpacity style={[viewStyle, styleOverride]} {...rest}>
      {content}
    </TouchableOpacity>
  );
}
