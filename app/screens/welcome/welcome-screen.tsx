import React, { FC } from "react"
import { View, ViewStyle, TextStyle, SafeAreaView, ImageStyle, ImageBackground } from "react-native"
import { StackScreenProps } from "@react-navigation/stack"
import { observer } from "mobx-react-lite"
import { Text, Button, Screen, GradientBackground, AutoImage as Image } from "../../components"
import { color, spacing, typography } from "../../theme"
import { NavigatorParamList } from "../../navigators"

const LOGO_TOP = require("../../assets/images/logo.png")
const LOGO_TEXT = require("../../assets/images/game-title.png")
const LOGO_MAN = require("../../assets/images/ng-man.png")
const BUTTON_BACKGROUND = require("../../assets/images/button-background.png")

const FULL: ViewStyle = { flex: 1 }

const CONTAINER: ViewStyle = {
  ...FULL,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "space-between",
  backgroundColor: color.transparent,
  paddingHorizontal: spacing[4],
}
const LOGO_CONTAINER: ViewStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}
const TEXT: TextStyle = {
  color: color.palette.lighterGrey,
  fontFamily: typography.ngadong,
}
// const BOLD: TextStyle = { fontWeight: "bold" }
const PLAY: ViewStyle = {
  backgroundColor: "transparent",
  paddingVertical: spacing[4],
  paddingHorizontal: spacing[4],
}
const PLAY_TEXT: TextStyle = {
  ...TEXT,
  fontSize: 24,
  letterSpacing: 1,
  marginTop: 18,
}
const FOOTER: ViewStyle = { backgroundColor: "transparent" }
const FOOTER_CONTENT: ViewStyle = {
  paddingVertical: spacing[4],
  paddingHorizontal: spacing[4],
}
const IMAGE: ImageStyle = {
  width: 320,
}
const TOP_LOGO_STYLE: ImageStyle = {
  ...IMAGE,
  height: 120,
}
const NGADONG_MAN_STYLE: ImageStyle = {
  ...IMAGE,
  height: 302,
}
const NGADONG_TEXT_STYLE: ImageStyle = {
  ...IMAGE,
  height: 200,
  marginTop: -82,
}
const PLAY_BUTTON_STYLE: ImageStyle = {
  display: "flex",
  alignItems: "center",
  width: 230,
  height: 86,
}

export const WelcomeScreen: FC<StackScreenProps<NavigatorParamList, "welcome">> = observer(
  ({ navigation }) => {
    const nextScreen = () => navigation.navigate("playground")

    return (
      <View testID="WelcomeScreen" style={FULL}>
        <GradientBackground colors={["#546645", "#351c09"]} />
        <Screen style={CONTAINER} preset="scroll" backgroundColor={color.transparent}>
          <View style={LOGO_CONTAINER}>
            <Image resizeMode="contain" style={TOP_LOGO_STYLE} source={LOGO_TOP} />
          </View>
          <View style={LOGO_CONTAINER}>
            <Image resizeMode="contain" style={NGADONG_MAN_STYLE} source={LOGO_MAN} />
            <Image resizeMode="contain" style={NGADONG_TEXT_STYLE} source={LOGO_TEXT} />
          </View>
        </Screen>
        <SafeAreaView style={FOOTER}>
          <View style={FOOTER_CONTENT}>
            <Button testID="next-screen-button" style={PLAY} onPress={nextScreen}>
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
    )
  },
)
