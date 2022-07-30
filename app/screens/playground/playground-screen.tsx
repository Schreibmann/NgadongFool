import React, { FC } from "react"
import { View, ViewStyle, TextStyle, ImageStyle, SafeAreaView, FlatList } from "react-native"
import { StackScreenProps } from "@react-navigation/stack"
import { observer } from "mobx-react-lite"
import {
  Header,
  Screen,
  Text,
  GradientBackground,
  Card,
} from "../../components"
import { color, spacing, typography } from "../../theme"
import { NavigatorParamList } from "../../navigators"
import { CLUBS, DIAMONDS, HEARTS, SPADES } from "../../config/constants"

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
  paddingVertical: spacing[4],
  paddingHorizontal: spacing[4],
}
const FLAT_LIST: ViewStyle = {
  paddingHorizontal: spacing[4],
}

export const PlaygroundScreen: FC<StackScreenProps<NavigatorParamList, "playground">> = observer(
  ({ navigation }) => {

    return (
      <View testID="PlaygroundScreen" style={FULL}>
        <GradientBackground colors={["#422443", "#281b34"]} />
        <Screen style={MAIN_CONTAINER} preset="scroll" backgroundColor={color.transparent}>
        <View testID="TurnContainer" style={TURN_CONTAINER}>
        <Card {...SPADES[0]} opened={false} />
          </View>
        </Screen>
        <SafeAreaView style={FOOTER}>
          <View style={FOOTER_CONTENT}>
          <FlatList
            horizontal
            contentContainerStyle={FLAT_LIST}
            data={[...HEARTS]}
            keyExtractor={(item) => `${item.rank}${item.suit}`}
            renderItem={({ item }) => <Card {...item} opened />}
          />
          </View>
        </SafeAreaView>
      </View>
    )
  },
)
