import { type FC, useState } from "react";
import {
  View,
  type ViewStyle,
  type TextStyle,
  type ImageStyle,
  Pressable,
  StyleSheet,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { color, spacing, typography } from "@theme";
import { Screen } from "@shared-components/screen/screen";
import { Button } from "@shared-components/button/button";
import { Text } from "@shared-components/text/text";
import { SCREENS } from "@shared-constants";
import type { RootStackParamList } from "@navigation/types";
import {
  DEFAULT_PLAYER_COUNT,
  MAX_PLAYERS,
  MIN_PLAYERS,
} from "@features/game/players";

const BUTTON_BACKGROUND = require("@assets/images/button-background.png");
const LOGO_TOP = require("@assets/images/logo.png");
const LOGO_TEXT = require("@assets/images/game-title.png");
const LOGO_MAN = require("@assets/images/ng-man.png");

const FULL: ViewStyle = { flex: 1 };

const CONTAINER: ViewStyle = {
  ...FULL,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "space-between",
  backgroundColor: color.transparent,
  paddingHorizontal: spacing[4],
};
const LOGO_CONTAINER: ViewStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
const TEXT: TextStyle = {
  color: color.palette.lighterGrey,
  fontFamily: typography.ngadong,
};
const PLAY: ViewStyle = {
  backgroundColor: "transparent",
  paddingVertical: spacing[4],
  paddingHorizontal: spacing[4],
};
const PLAY_TEXT: TextStyle = {
  ...TEXT,
  fontSize: 24,
  letterSpacing: 1,
  marginTop: 18,
};
const FOOTER: ViewStyle = { backgroundColor: "transparent" };
const FOOTER_CONTENT: ViewStyle = {
  paddingVertical: spacing[4],
  paddingHorizontal: spacing[4],
  alignItems: "center",
};
const IMAGE: ImageStyle = {
  width: 320,
};
const TOP_LOGO_STYLE: ImageStyle = {
  ...IMAGE,
  height: 120,
};
const NGADONG_MAN_STYLE: ImageStyle = {
  ...IMAGE,
  height: 302,
};
const NGADONG_TEXT_STYLE: ImageStyle = {
  ...IMAGE,
  height: 200,
  marginTop: -82,
};
const PLAY_BUTTON_STYLE: ViewStyle = {
  display: "flex",
  alignItems: "center",
  width: 230,
  height: 86,
};
const PLAY_BUTTON_IMAGE: ImageStyle = {
  ...StyleSheet.absoluteFill,
};
const COUNT_ROW: ViewStyle = {
  flexDirection: "row",
  gap: 10,
  marginBottom: spacing[3],
  justifyContent: "center",
};
const COUNT_CHIP: ViewStyle = {
  minWidth: 48,
  paddingVertical: 8,
  paddingHorizontal: 12,
  borderWidth: 1,
  borderColor: color.palette.lighterGrey,
  alignItems: "center",
};
const COUNT_CHIP_ON: ViewStyle = {
  ...COUNT_CHIP,
  backgroundColor: color.palette.orange,
  borderColor: color.palette.orange,
};
const COUNT_LABEL: TextStyle = {
  ...TEXT,
  fontSize: 16,
  marginBottom: spacing[2],
};

type WelcomeNav = NativeStackNavigationProp<RootStackParamList, "Home">;

const COUNTS = Array.from(
  { length: MAX_PLAYERS - MIN_PLAYERS + 1 },
  (_, i) => MIN_PLAYERS + i
);

const DECK_SIZES = [36, 52] as const;

export const WelcomeScreen: FC = () => {
  const navigation = useNavigation<WelcomeNav>();
  const [playerCount, setPlayerCount] = useState(DEFAULT_PLAYER_COUNT);
  const [deckSize, setDeckSize] = useState<36 | 52>(36);

  const navigateToPlayground = () =>
    navigation.navigate(SCREENS.PLAYGROUND, { playerCount, deckSize });

  return (
    <View testID="WelcomeScreen" style={FULL}>
      <Screen
        style={CONTAINER}
        preset="scroll"
        backgroundColor={color.transparent}
      >
        <View style={LOGO_CONTAINER}>
          <Image
            contentFit="contain"
            style={TOP_LOGO_STYLE}
            source={LOGO_TOP}
          />
        </View>
        <View style={LOGO_CONTAINER}>
          <Image
            contentFit="contain"
            style={NGADONG_MAN_STYLE}
            source={LOGO_MAN}
          />
          <Image
            contentFit="contain"
            style={NGADONG_TEXT_STYLE}
            source={LOGO_TEXT}
          />
        </View>
      </Screen>
      <SafeAreaView style={FOOTER}>
        <View style={FOOTER_CONTENT}>
          <Text style={COUNT_LABEL} text="Игроков за столом" />
          <View style={COUNT_ROW}>
            {COUNTS.map((n) => (
              <Pressable
                key={n}
                testID={`player-count-${n}`}
                onPress={() => setPlayerCount(n)}
                style={playerCount === n ? COUNT_CHIP_ON : COUNT_CHIP}
              >
                <Text style={TEXT} text={String(n)} />
              </Pressable>
            ))}
          </View>
          <Text style={COUNT_LABEL} text="Карт в колоде" />
          <View style={COUNT_ROW}>
            {DECK_SIZES.map((n) => (
              <Pressable
                key={n}
                testID={`deck-size-${n}`}
                onPress={() => setDeckSize(n)}
                style={deckSize === n ? COUNT_CHIP_ON : COUNT_CHIP}
              >
                <Text style={TEXT} text={String(n)} />
              </Pressable>
            ))}
          </View>
          <Button
            testID="next-screen-button"
            style={PLAY}
            onPress={navigateToPlayground}
          >
            <View style={PLAY_BUTTON_STYLE}>
              <Image
                contentFit="contain"
                style={PLAY_BUTTON_IMAGE}
                source={BUTTON_BACKGROUND}
              />
              <Text tx="welcomeScreen.play" style={PLAY_TEXT} />
            </View>
          </Button>
        </View>
      </SafeAreaView>
    </View>
  );
};
