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
  AutoImage as Image,
} from "../../components"
import { color, spacing, typography } from "../../theme"
import { NavigatorParamList } from "../../navigators"
import {
  GameController,
  Player,
  PlaygroundState,
  Stage,
} from "../../services/game-controller/index"

const PLAYER_ONE_AVATAR = require("./ng-drum.gif")
const PLAYER_TWO_AVATAR = require("./ng-scull.png")

const CPU_IVAN: Player = {
  id: 1,
  name: "Ivan",
  avatar: PLAYER_ONE_AVATAR,
  isCPU: true,
  cards: [],
  stumps: [],
}

const CPU_SEBASTIAN: Player = {
  id: 2,
  name: "Sebastian",
  avatar: PLAYER_TWO_AVATAR,
  isCPU: true,
  cards: [],
  stumps: [],
}

const PLAYER_FROM_NGADONG: Player = {
  id: 3,
  name: "Ngadong man",
  avatar: null,
  isCPU: true,
  cards: [],
  stumps: [],
}

const FULL: ViewStyle = { flex: 1 }
const MAIN_CONTAINER: ViewStyle = {
  ...FULL,
  backgroundColor: color.transparent,
  paddingHorizontal: spacing[2],
}
const PLAYER: ViewStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}
const TURN_CONTAINER: ViewStyle = {
  ...FULL,
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
}
const TEXT: TextStyle = {
  color: color.palette.white,
  fontFamily: typography.primary,
  textAlign: "center",
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
  borderColor: "#deb887",
  borderWidth: 4,
  borderRadius: 50,
  height: 90,
  width: 90,
}
const TOP_CONTAINERE: ViewStyle = {
  display: "flex",
  flexDirection: "row",
  alignItems: "flex-start",
  justifyContent: "space-between",
  padding: 4,
  paddingVertical: 12,
}

const players: Player[] = [CPU_IVAN, CPU_SEBASTIAN, PLAYER_FROM_NGADONG]

export const PlaygroundScreen: FC<StackScreenProps<NavigatorParamList, "playground">> = observer(
  ({ navigation }) => {
    const [state, setState] = React.useState<PlaygroundState>(undefined)

    const ctrlRef = React.useRef<GameController>(null)

    const init = React.useCallback(async () => {
      const controller = new GameController(players, setState)
      ctrlRef.current = controller
      await ctrlRef.current.init()
    }, [])

    React.useEffect(() => {
      init()
    }, [])

    React.useEffect(() => {
      if (
        state?.stage === Stage.prepare &&
        state?.activePlayer?.id /* && state.activePlayer.id !== PLAYER_FROM_NGADONG.id */
      ) {
        ctrlRef.current.prepareTurnCPU(state.activePlayer.id)
      }
    }, [state?.activePlayer?.id])

    const me = state?.players?.[2] // find((player) => player.isCPU === false)

    if (!me) {
      return null
    }

    return (
      <View testID="PlaygroundScreen" style={FULL}>
        <GradientBackground colors={["#422443", "#281b34"]} />
        <Screen style={MAIN_CONTAINER} preset="scroll" backgroundColor={color.transparent}>
          <View testID="TopContainer" style={TOP_CONTAINERE}>
            <View style={PLAYER}>
              <Image
                source={{ uri: state?.players[0].avatar }}
                resizeMode="contain"
                style={PLAYER_IMAGE}
              />
              <Text style={TEXT} text={state?.players[0].name} />
              {state.players[0].cards.length > 0 ? (
                <Card {...state.players[0].cards[0]} opened={state.stage === Stage.prepare} />
              ) : state.players[0].stumps.length > 0 ? (
                <Card {...state.players[0].stumps[0]} opened={false} />
              ) : (
                <Text style={TEXT} text="Нет карт" />
              )}
            </View>
            <View style={PLAYER}>
              <Text
                style={TEXT}
                text={
                  state?.activePlayer?.name
                    ? `Ходит:\n ${state?.activePlayer?.name}`
                    : "Сдаю пеньки"
                }
              />
            </View>
            <View style={PLAYER}>
              <Image
                source={{ uri: state?.players[1].avatar }}
                resizeMode="contain"
                style={PLAYER_IMAGE}
              />
              <Text style={TEXT} text={state?.players[1].name} />
              {state.players[1].cards.length > 0 ? (
                <Card {...state.players[1].cards[0]} opened={state.stage === Stage.prepare} />
              ) : state.players[1].stumps.length > 0 ? (
                <Card {...state.players[0].stumps[0]} opened={false} />
              ) : (
                <Text style={TEXT} text="Нет карт" />
              )}
            </View>
          </View>
          {state && (
            <View testID="TurnContainer" style={TURN_CONTAINER}>
              {state.current.length > 0 && <Card {...state.current.at(-1)} opened />}
              <Card
                {...state.deck.at(-1)}
                opened={state.activePlayer?.id === PLAYER_FROM_NGADONG.id}
              />
            </View>
          )}
        </Screen>
        <SafeAreaView style={FOOTER}>
          <View style={FOOTER_CONTENT}>
            {state && (
              <FlatList
                horizontal
                contentContainerStyle={FLAT_LIST}
                data={[...me.cards, ...me.stumps]}
                keyExtractor={(item) => `${item.rank}${item.suit}`}
                renderItem={({ item }) => <Card {...item} opened={!item.isStump} />}
              />
            )}
          </View>
        </SafeAreaView>
      </View>
    )
  },
)
