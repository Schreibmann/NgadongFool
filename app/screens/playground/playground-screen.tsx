import React, { FC } from "react"
import { View, ViewStyle, TextStyle, ImageStyle, SafeAreaView, FlatList } from "react-native"
import { StackScreenProps } from "@react-navigation/stack"
import { observer } from "mobx-react-lite"
import { Header, Screen, Text, GradientBackground, Card, AutoImage as Image } from "../../components"
import { color, spacing, typography } from "../../theme"
import { NavigatorParamList } from "../../navigators"
import { GameController, Player } from '../../services/game-controller/index';

const PLAYER_ONE_AVATAR = require("./ng-drum.gif")
const PLAYER_TWO_AVATAR = require("./ng-scull.png")

const CPU_IVAN: Player = {
  id: 1,
  name: 'Ivan',
  avatar: PLAYER_ONE_AVATAR,
  isCPU: true,
  cards: [],
  stumps: []
}

const CPU_SEBASTIAN: Player = {
  id: 2,
  name: 'Sebastian',
  avatar: PLAYER_TWO_AVATAR,
  isCPU: true,
  cards: [],
  stumps: []
}

const PLAYER_FROM_NGADONG: Player = {
  id: 3,
  name: 'Ngadong man',
  avatar: null,
  isCPU: false,
  cards: [],
  stumps: []
}

const FULL: ViewStyle = { flex: 1 }
const MAIN_CONTAINER: ViewStyle = {
  ...FULL,
  backgroundColor: color.transparent,
  paddingHorizontal: spacing[2],
}
const PLAYER: ViewStyle = {
  display: 'flex',
  alignItems: "center",
  justifyContent: "center",
}
const TURN_CONTAINER: ViewStyle = {
  ...FULL,
  display: 'flex',
  flexDirection: 'row',
  alignItems: "center",
  justifyContent: "center",
}
const TEXT: TextStyle = {
  color: color.palette.white,
  fontFamily: typography.primary,
}
// const BOLD: TextStyle = { fontWeight: "bold" }
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
    const [gameController, setGameController] = React.useState<GameController>(null);

    React.useEffect(() => { 
      const players: Player[] = [
        CPU_IVAN,
        CPU_SEBASTIAN,
        PLAYER_FROM_NGADONG
      ]
      const controller = new GameController(players)
      controller.init();
      setGameController(controller)
    }, [])

    const me = gameController?.players.find(player => player.isCPU === false)

    console.log(gameController)

    return (
      <View testID="PlaygroundScreen" style={FULL}>
        <GradientBackground colors={["#422443", "#281b34"]} />
        <Screen style={MAIN_CONTAINER} preset="scroll" backgroundColor={color.transparent}>
          <View testID="TopContainer" style={TOP_CONTAINERE}>
            <View style={PLAYER}>
              <Image source={{ uri: gameController?.players[0].avatar }} resizeMode="contain" style={PLAYER_IMAGE} />
              <Text style={TEXT} text={gameController?.players[0].name} />
              <Card {...gameController.players[0].cards.at(-1)} opened />
            </View>
            <View style={PLAYER}>
              <Image source={{ uri: gameController?.players[1].avatar }} resizeMode="contain" style={PLAYER_IMAGE} />
              <Text style={TEXT} text={gameController?.players[1].name} />
            </View>
        </View>
          {gameController && <View testID="TurnContainer" style={TURN_CONTAINER}>
          <Card {...gameController.current.at(-1)} opened />
          <Card {...gameController.deck.at(-1)} opened={false} />
        </View>}
        </Screen>
        <SafeAreaView style={FOOTER}>
          <View style={FOOTER_CONTENT}>
            {gameController && <FlatList
              horizontal
              contentContainerStyle={FLAT_LIST}
              data={[...me.cards, ...me.stumps]}
              keyExtractor={(item) => `${item.rank}${item.suit}`}
              renderItem={({ item }) => <Card {...item} opened={!item.isStump} />}
            />}
          </View>
        </SafeAreaView>
      </View>
    )
  },
)
