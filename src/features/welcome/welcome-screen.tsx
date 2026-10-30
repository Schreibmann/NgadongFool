import { type FC, useState } from "react";
import {
  View,
  type ViewStyle,
  type TextStyle,
  type ImageStyle,
  Pressable,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { color, spacing } from "@theme";
import { Screen } from "@shared-components/screen/screen";
import { Text } from "@shared-components/text/text";
import { SCREENS } from "@shared-constants";
import type { RootStackParamList } from "@navigation/types";
import {
  DEFAULT_PLAYER_COUNT,
  MAX_PLAYERS,
  MIN_PLAYERS,
} from "@features/game/players";
import { tableAssets } from "@assets/prehistoric-v2/assets";
import { CaveBackground } from "@features/game/components/ui/cave-background";
import { StonePanel } from "@features/game/components/ui/stone-panel";
import { WoodButton } from "@features/game/components/ui/wood-button";
import {
  EYEBROW,
  HEADLINE,
  HUD_TEXT,
} from "@features/game/components/ui/table-text";

const FULL: ViewStyle = { flex: 1 };

const CONTAINER: ViewStyle = {
  ...FULL,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: color.transparent,
  paddingHorizontal: spacing[4],
  paddingTop: spacing[5],
  gap: spacing[3],
};

const TITLE_PLATE: ViewStyle = {
  height: 70,
  minWidth: 280,
  paddingHorizontal: 60,
  flexDirection: "row",
  gap: 10,
};

const CROWN: ImageStyle = { width: 34, height: 26 };

const TITLE: TextStyle = { ...HEADLINE, fontSize: 26 };

const PORTRAIT_FRAME: ViewStyle = {
  borderRadius: 18,
  borderWidth: 3,
  borderColor: "#5a4030",
  overflow: "hidden",
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.7,
  shadowRadius: 18,
  elevation: 12,
};

const PORTRAIT: ImageStyle = { width: 220, height: 220 };

const FOOTER: ViewStyle = { backgroundColor: "transparent" };

const FOOTER_CONTENT: ViewStyle = {
  paddingVertical: spacing[4],
  paddingHorizontal: spacing[4],
  alignItems: "center",
  gap: 6,
};

const COUNT_ROW: ViewStyle = {
  flexDirection: "row",
  gap: 8,
  marginBottom: spacing[2],
  justifyContent: "center",
};

const CHIP: ViewStyle = {
  width: 64,
  height: 46,
  borderRadius: 10,
  borderWidth: 2,
  borderColor: "transparent",
};

const CHIP_ON: ViewStyle = {
  ...CHIP,
  borderColor: "#ffb347",
  shadowColor: "#ffb347",
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.9,
  shadowRadius: 10,
};

const CHIP_TEXT: TextStyle = { ...HUD_TEXT, fontSize: 17 };

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
      <CaveBackground />
      <Screen
        style={CONTAINER}
        preset="scroll"
        backgroundColor={color.transparent}
      >
        <StonePanel kind="headerWide" style={TITLE_PLATE}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Image
              source={tableAssets.icons.crown}
              style={CROWN}
              contentFit="contain"
            />
            <Text style={TITLE} text="Пидор" />
          </View>
        </StonePanel>
        <View style={PORTRAIT_FRAME}>
          <Image
            contentFit="cover"
            style={PORTRAIT}
            source={tableAssets.avatars.ivan}
          />
        </View>
      </Screen>
      <SafeAreaView style={FOOTER}>
        <View style={FOOTER_CONTENT}>
          <Text style={EYEBROW} text="Игроков за столом" />
          <View style={COUNT_ROW}>
            {COUNTS.map((n) => (
              <Pressable
                key={n}
                testID={`player-count-${n}`}
                onPress={() => setPlayerCount(n)}
              >
                <StonePanel
                  kind="headerSmall"
                  style={playerCount === n ? CHIP_ON : CHIP}
                >
                  <Text style={CHIP_TEXT} text={String(n)} />
                </StonePanel>
              </Pressable>
            ))}
          </View>
          <Text style={EYEBROW} text="Карт в колоде" />
          <View style={COUNT_ROW}>
            {DECK_SIZES.map((n) => (
              <Pressable
                key={n}
                testID={`deck-size-${n}`}
                onPress={() => setDeckSize(n)}
              >
                <StonePanel
                  kind="headerSmall"
                  style={deckSize === n ? CHIP_ON : CHIP}
                >
                  <Text style={CHIP_TEXT} text={String(n)} />
                </StonePanel>
              </Pressable>
            ))}
          </View>
          <WoodButton
            testID="next-screen-button"
            tx="welcomeScreen.play"
            onPress={navigateToPlayground}
          />
        </View>
      </SafeAreaView>
    </View>
  );
};
