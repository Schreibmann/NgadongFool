import type { FC } from "react";
import { Pressable, type TextStyle, type ViewStyle } from "react-native";
import { Text } from "@shared-components/text/text";
import type { TxKeyPath } from "@i18n";
import { StonePanel } from "./stone-panel";
import { BUTTON_LABEL } from "./table-text";

interface WoodButtonProps {
  text?: string;
  tx?: TxKeyPath;
  onPress: () => void;
  testID?: string;
  compact?: boolean;
}

const PANEL: ViewStyle = {
  minWidth: 150,
  height: 50,
  paddingHorizontal: 26,
};

const PANEL_COMPACT: ViewStyle = {
  minWidth: 110,
  height: 42,
  paddingHorizontal: 18,
};

const LABEL_COMPACT: TextStyle = { ...BUTTON_LABEL, fontSize: 12 };

export const WoodButton: FC<WoodButtonProps> = ({
  text,
  tx,
  onPress,
  testID,
  compact = false,
}) => (
  <Pressable
    testID={testID}
    onPress={onPress}
    accessibilityRole="button"
    style={({ pressed }) => ({
      opacity: pressed ? 0.8 : 1,
      transform: [{ translateY: pressed ? 1 : 0 }],
    })}
  >
    <StonePanel kind="woodButton" style={compact ? PANEL_COMPACT : PANEL}>
      <Text
        text={text}
        tx={tx}
        style={compact ? LABEL_COMPACT : BUTTON_LABEL}
        numberOfLines={1}
      />
    </StonePanel>
  </Pressable>
);
