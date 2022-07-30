import React, { FC } from "react"
import { View, ViewStyle, TextStyle, ImageStyle, SafeAreaView, FlatList } from "react-native"
import { StackScreenProps } from "@react-navigation/stack"
import { observer } from "mobx-react-lite"
import { Header, Screen, Text, GradientBackground, Card, AutoImage as Image } from "../../components"
import { color, spacing, typography } from "../../theme"
import { NavigatorParamList } from "../../navigators"
import { CLUBS, DIAMONDS, HEARTS, SPADES } from "../../config/constants"

const PLAYER_ONE_AVATAR = require("./ng-drum.gif")
const PLAYER_TWO_AVATAR = require("./ng-scull.png")

const FULL: ViewStyle = { flex: 1 }
const MAIN_CONTAINER: ViewStyle = {
  ...FULL,
  backgroundColor: color.transparent,
  paddingHorizontal: spacing[2],
}
const TURN_CONTAINER: ViewStyle = {
  ...FULL,
  alignItems: "center",
  justifyContent: "center",
}
const TEXT: TextStyle = {
  color: color.palette.white,
  fontFamily: typography.primary,
}
const BOLD: TextStyle = { fontWeight: "bold" }

const FOOTER: ViewStyle = { backgroundColor: "#20162D" }
const FOOTER_CONTENT: ViewStyle = {
  paddingVertical: spacing[2],
  paddingHorizontal: spacing[2],
}
const FLAT_LIST: ViewStyle = {
  paddingHorizontal: spacing[1],
}
const PLAYER_IMAGE: ImageStyle = {
  backgroundColor: "white",
  borderColor: '#deb887',
  borderWidth: 4,
  borderRadius: 50,
  height: 90,
  width: 90,
}

const TOP_CONTAINERE: ViewStyle = {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: 4,
  paddingVertical: 12
}

export const PlaygroundScreen: FC<StackScreenProps<NavigatorParamList, "playground">> = observer(
  ({ navigation }) => {
    return (
      <View testID="PlaygroundScreen" style={FULL}>
        <GradientBackground colors={["#422443", "#281b34"]} />
        <Screen style={MAIN_CONTAINER} preset="scroll" backgroundColor={color.transparent}>
        <View testID="TopContainer" style={TOP_CONTAINERE}>
        <Image source={{ uri: PLAYER_ONE_AVATAR }} resizeMode="contain" style={PLAYER_IMAGE} />
          <Image source={{ uri: PLAYER_TWO_AVATAR }} resizeMode="contain" style={PLAYER_IMAGE} />
          </View>
          
          <View testID="TurnContainer" style={TURN_CONTAINER}>
            <Card {...SPADES[0]} opened={false} />
          </View>
        </Screen>
        <SafeAreaView style={FOOTER}>
          <View style={FOOTER_CONTENT}>
            <FlatList
              horizontal
              contentContainerStyle={FLAT_LIST}
              data={[HEARTS[0]]}
              keyExtractor={(item) => `${item.rank}${item.suit}`}
              renderItem={({ item }) => <Card {...item} opened />}
            />
          </View>
        </SafeAreaView>
      </View>
    )
  },
)
