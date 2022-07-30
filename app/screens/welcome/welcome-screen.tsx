import React, { FC } from "react"
import { View, ViewStyle, TextStyle, SafeAreaView, ImageStyle } from "react-native"
import { StackScreenProps } from "@react-navigation/stack"
import { observer } from "mobx-react-lite"
import {
  Button,
  Header,
  Screen,
  Text,
  GradientBackground,
  AutoImage as Image,
} from "../../components"
import { color, spacing, typography } from "../../theme"
import { NavigatorParamList } from "../../navigators"

const LOGO_RUNGADONG = require("./ng-run.gif")
const LOGO_CARDGADONG = require("./ng-spread.gif")

const FULL: ViewStyle = { flex: 1 }
const LOGO_CONTAINER: ViewStyle = {
  ...FULL,
  alignItems: "center",
  justifyContent: "center",
  marginTop: 20,
  /* shadowColor: "black",
  shadowOffset: {
    width: 2,
    height: -2,
  },
  shadowOpacity: 1,
  shadowRadius: 1, */
}
const CONTAINER: ViewStyle = {
  backgroundColor: color.transparent,
  paddingHorizontal: spacing[4],
}
const TEXT: TextStyle = {
  color: color.palette.white,
  fontFamily: typography.primary,
}
const BOLD: TextStyle = { fontWeight: "bold" }
const HEADER: TextStyle = {
  paddingTop: spacing[4],
  paddingBottom: spacing[4],
  paddingHorizontal: 0,
}
const HEADER_TITLE: TextStyle = {
  ...TEXT,
  ...BOLD,
  fontSize: 12,
  lineHeight: 15,
  textAlign: "center",
  letterSpacing: 3.8,
}
const TITLE_WRAPPER: TextStyle = {
  ...TEXT,
  textAlign: "center",
}
const TITLE: TextStyle = {
  ...TEXT,
  ...BOLD,
  fontSize: 28,
  lineHeight: 32,
  textAlign: "center",
}
const SUBTITLE: TextStyle = {
  ...TITLE,
  fontSize: 20,
  lineHeight: 20,
}
const PLAY: ViewStyle = {
  paddingVertical: spacing[4],
  paddingHorizontal: spacing[4],
  backgroundColor: color.palette.deepPurple,
}
const PLAY_TEXT: TextStyle = {
  ...TEXT,
  ...BOLD,
  fontSize: 13,
  letterSpacing: 5,
}
const FOOTER: ViewStyle = { backgroundColor: "#20162D" }
const FOOTER_CONTENT: ViewStyle = {
  paddingVertical: spacing[4],
  paddingHorizontal: spacing[4],
}
const LOGO_SHAKE_STYLE: ImageStyle = {
  width: 300,
  height: 200,
}
const LOGO_RUN_STYLE: ImageStyle = {
  height: 300,
  width: 212,
  borderRadius: 100,
  backgroundColor: "#c5b09f",
}

export const WelcomeScreen: FC<StackScreenProps<NavigatorParamList, "welcome">> = observer(
  ({ navigation }) => {
    const nextScreen = () => navigation.navigate("playground")

    return (
      <View testID="WelcomeScreen" style={FULL}>
        <GradientBackground colors={["#422443", "#281b34"]} />
        <Screen style={CONTAINER} preset="scroll" backgroundColor={color.transparent}>
          <Header headerTx="welcomeScreen.poweredBy" style={HEADER} titleStyle={HEADER_TITLE} />
          <Text style={TITLE_WRAPPER}>
            <Text style={TITLE} text="NGADONGUS" />
          </Text>
          <Text style={SUBTITLE} preset="header" text="~non sapiens~" />

          <View testID="LogoContainer" style={LOGO_CONTAINER}>
            <Image resizeMode="contain" style={LOGO_SHAKE_STYLE} source={LOGO_CARDGADONG} />
            <Image resizeMode="contain" style={LOGO_RUN_STYLE} source={LOGO_RUNGADONG} />
          </View>
        </Screen>
        <SafeAreaView style={FOOTER}>
          <View style={FOOTER_CONTENT}>
            <Button
              testID="next-screen-button"
              style={PLAY}
              textStyle={PLAY_TEXT}
              tx="welcomeScreen.play"
              onPress={nextScreen}
            />
          </View>
        </SafeAreaView>
      </View>
    )
  },
)
