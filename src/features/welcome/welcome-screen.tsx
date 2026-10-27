import { FC } from "react";
import {
  View,
  ViewStyle,
  TextStyle,
  SafeAreaView,
  ImageStyle,
  ImageBackground,
} from "react-native";
import { Image } from "expo-image";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { color, spacing, typography } from "theme";
import { Screen } from "@shared-components/screen/screen";
import { Button } from "@shared-components/button/button";
import { Text } from "@shared-components/text/text";
import { SCREENS } from "@shared-constants";
import { RootStackParamList } from "../../navigation/types";

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
const PLAY_BUTTON_STYLE: ImageStyle = {
  display: "flex",
  alignItems: "center",
  width: 230,
  height: 86,
};

type WelcomeNav = NativeStackNavigationProp<RootStackParamList, "Home">;

export const WelcomeScreen: FC = () => {
  const navigation = useNavigation<WelcomeNav>();
  const navigateToPlayground = () => navigation.navigate(SCREENS.PLAYGROUND);

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
          <Button
            testID="next-screen-button"
            style={PLAY}
            onPress={navigateToPlayground}
          >
            <ImageBackground
              resizeMode="contain"
              style={PLAY_BUTTON_STYLE}
              source={BUTTON_BACKGROUND}
            >
              <Text tx="welcomeScreen.play" style={PLAY_TEXT} />
            </ImageBackground>
          </Button>
        </View>
      </SafeAreaView>
    </View>
  );
};
