import type { FC } from "react";
import {
  StyleSheet,
  View,
  type ImageStyle,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { Image } from "expo-image";
import { Text } from "@shared-components/text/text";
import { spacing, typography } from "@theme";
import { tableAssets } from "@assets/prehistoric-v2/assets";
import { welcomePalette } from "../welcome-tokens";
import { StoneChip } from "./stone-chip";
import { BoulderCta } from "./boulder-cta";

interface SettingsControlsProps {
  playerCount: number;
  deckSize: 36 | 52;
  playerOptions: readonly number[];
  onPlayerCount: (n: number) => void;
  onDeckSize: (n: 36 | 52) => void;
  onPlay: () => void;
  layout: "mobile" | "desktop";
}

const DECK_SIZES = [36, 52] as const;

export const SettingsControls: FC<SettingsControlsProps> = ({
  playerCount,
  deckSize,
  playerOptions,
  onPlayerCount,
  onDeckSize,
  onPlay,
  layout,
}) => {
  const chipSize = layout === "desktop" ? "desktop" : "mobile";
  const withBoard = layout === "desktop";

  return (
    <View
      style={layout === "desktop" ? DESKTOP_STACK : MOBILE_STACK}
      testID="WelcomeSettings"
    >
      <SectionLabel text="ИГРОКОВ ЗА СТОЛОМ" withBoard={withBoard} />
      <View style={ROW}>
        {playerOptions.map((n) => (
          <StoneChip
            key={n}
            label={String(n)}
            selected={playerCount === n}
            onPress={() => onPlayerCount(n)}
            testID={`player-count-${n}`}
            size={chipSize}
          />
        ))}
      </View>

      <SectionLabel text="КАРТ В КОЛОДЕ" withBoard={withBoard} />
      <View style={ROW}>
        {DECK_SIZES.map((n) => (
          <StoneChip
            key={n}
            label={String(n)}
            selected={deckSize === n}
            onPress={() => onDeckSize(n)}
            testID={`deck-size-${n}`}
            size={chipSize}
          />
        ))}
      </View>

      {layout === "desktop" ? <View style={GROW} /> : null}

      <BoulderCta
        onPress={onPlay}
        testID="next-screen-button"
        size={chipSize}
      />
    </View>
  );
};

interface SectionLabelProps {
  text: string;
  withBoard: boolean;
}

const SectionLabel: FC<SectionLabelProps> = ({ text, withBoard }) => {
  if (!withBoard) {
    return <Text text={text} style={LABEL} />;
  }

  return (
    <View style={BOARD_WRAP}>
      <Image
        source={tableAssets.panels.woodButton}
        style={BOARD_IMAGE}
        contentFit="cover"
      />
      <Text text={text} style={LABEL_ON_BOARD} />
    </View>
  );
};

const MOBILE_STACK: ViewStyle = {
  width: "100%",
  alignItems: "center",
  gap: spacing[2],
  paddingHorizontal: spacing[4],
};

const DESKTOP_STACK: ViewStyle = {
  flex: 1,
  width: "100%",
  alignItems: "center",
  gap: spacing[3],
  paddingHorizontal: spacing[3],
  paddingTop: spacing[4],
  paddingBottom: spacing[4],
};

const ROW: ViewStyle = {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: 10,
  justifyContent: "center",
  marginBottom: spacing[2],
};

const GROW: ViewStyle = {
  flexGrow: 1,
  minHeight: 24,
};

const LABEL: TextStyle = {
  fontFamily: typography.ngadong,
  fontSize: 12,
  letterSpacing: 1.4,
  color: welcomePalette.bone,
  textTransform: "uppercase",
  marginBottom: spacing[1],
  textAlign: "center",
};

const BOARD_WRAP: ViewStyle = {
  width: "100%",
  maxWidth: 324,
  height: 48,
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
  borderRadius: 6,
  marginBottom: spacing[1],
};

const BOARD_IMAGE: ImageStyle = {
  ...StyleSheet.absoluteFill,
  width: "100%",
  height: "100%",
};

const LABEL_ON_BOARD: TextStyle = {
  ...LABEL,
  fontSize: 14,
  marginBottom: 0,
  zIndex: 1,
};
