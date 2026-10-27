import { translate } from "i18n";
import { Text as ReactNativeText } from "react-native";
import { presets } from "./text.presets";
import { TextProps } from "./text.props";

export function Text(props: TextProps) {
  const {
    preset = "default",
    tx,
    txOptions,
    text,
    children,
    style: styleOverride,
    ...rest
  } = props;

  const i18nText = tx ? translate(tx, txOptions) : null;
  const content = i18nText || text || children;
  const style = presets[preset] || presets.default;

  return (
    <ReactNativeText {...rest} style={[style, styleOverride]}>
      {content}
    </ReactNativeText>
  );
}
