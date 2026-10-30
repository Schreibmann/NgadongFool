import { type FC, useState } from "react";
import {
  View,
  useWindowDimensions,
  type ImageStyle,
  type ViewStyle,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { color } from "@theme";
import { Screen } from "@shared-components/screen/screen";
import { SCREENS } from "@shared-constants";
import type { RootStackParamList } from "@navigation/types";
import {
  DEFAULT_PLAYER_COUNT,
  MAX_PLAYERS,
  MIN_PLAYERS,
} from "@features/game/players";
import { gameAssets } from "@assets/prehistoric/assets";
import { WELCOME_DESKTOP_MIN_WIDTH, welcomePalette } from "./welcome-tokens";
import { WelcomeBackground } from "./components/welcome-background";
import { WelcomeHero } from "./components/welcome-hero";
import { SettingsControls } from "./components/settings-controls";

type WelcomeNav = NativeStackNavigationProp<RootStackParamList, "Home">;

const COUNTS = Array.from(
  { length: MAX_PLAYERS - MIN_PLAYERS + 1 },
  (_, i) => MIN_PLAYERS + i
);

export const WelcomeScreen: FC = () => {
  const navigation = useNavigation<WelcomeNav>();
  const { width } = useWindowDimensions();
  const isDesktop = width >= WELCOME_DESKTOP_MIN_WIDTH;

  const [playerCount, setPlayerCount] = useState(DEFAULT_PLAYER_COUNT);
  const [deckSize, setDeckSize] = useState<36 | 52>(36);

  const navigateToPlayground = () =>
    navigation.navigate(SCREENS.PLAYGROUND, { playerCount, deckSize });

  if (isDesktop) {
    return (
      <View testID="WelcomeScreen" style={FULL}>
        <WelcomeBackground showMural />
        <SafeAreaView style={FULL}>
          <View style={DESKTOP_ROW}>
            <View style={DESKTOP_LEFT}>
              <WelcomeHero layout="desktop" showTorches />
            </View>
            <View style={DESKTOP_RIGHT}>
              <View style={PANEL}>
                <Image
                  source={gameAssets.backgrounds.caveRockTexture}
                  style={PANEL_TEXTURE}
                  contentFit="cover"
                />
                <View style={PANEL_WASH} pointerEvents="none" />
                <SettingsControls
                  layout="desktop"
                  playerCount={playerCount}
                  deckSize={deckSize}
                  playerOptions={COUNTS}
                  onPlayerCount={setPlayerCount}
                  onDeckSize={setDeckSize}
                  onPlay={navigateToPlayground}
                />
              </View>
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View testID="WelcomeScreen" style={FULL}>
      <WelcomeBackground />
      <Screen
        style={MOBILE_SCREEN}
        preset="scroll"
        backgroundColor={color.transparent}
      >
        <WelcomeHero layout="mobile" />
        <SafeAreaView edges={["bottom"]} style={MOBILE_FOOTER}>
          <SettingsControls
            layout="mobile"
            playerCount={playerCount}
            deckSize={deckSize}
            playerOptions={COUNTS}
            onPlayerCount={setPlayerCount}
            onDeckSize={setDeckSize}
            onPlay={navigateToPlayground}
          />
        </SafeAreaView>
      </Screen>
    </View>
  );
};

const FULL: ViewStyle = { flex: 1 };

const MOBILE_SCREEN: ViewStyle = {
  flex: 1,
  alignItems: "center",
  backgroundColor: color.transparent,
  paddingTop: 8,
};

const MOBILE_FOOTER: ViewStyle = {
  width: "100%",
  paddingBottom: 16,
  marginTop: 12,
};

const DESKTOP_ROW: ViewStyle = {
  flex: 1,
  flexDirection: "row",
};

const DESKTOP_LEFT: ViewStyle = {
  flex: 0.6,
  minWidth: 0,
};

const DESKTOP_RIGHT: ViewStyle = {
  flex: 0.4,
  minWidth: 320,
  maxWidth: 440,
  paddingVertical: 48,
  paddingRight: 40,
  paddingLeft: 16,
  justifyContent: "center",
};

const PANEL: ViewStyle = {
  flex: 1,
  maxHeight: 720,
  borderRadius: 18,
  overflow: "hidden",
  backgroundColor: welcomePalette.wood,
  shadowColor: "#000",
  shadowOpacity: 0.65,
  shadowRadius: 30,
  shadowOffset: { width: 0, height: 20 },
  elevation: 12,
};

const PANEL_TEXTURE: ImageStyle = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  width: "100%",
  height: "100%",
  opacity: 0.85,
};

const PANEL_WASH: ViewStyle = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(43,29,18,0.55)",
};
