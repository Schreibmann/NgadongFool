/* eslint-disable react-native/no-color-literals */
import React, { FC } from "react"
import { View, ViewStyle, TextStyle, ImageStyle, SafeAreaView, FlatList } from "react-native"
import { StackScreenProps } from "@react-navigation/stack"
import { observer } from "mobx-react-lite"
import {
  Screen,
  Text,
  GradientBackground,
  Card,
  AutoImage as Image,
  Button,
} from "../../components"
import { Card as CardType, CardSuits } from "../../components/card/card.props"
import { color, spacing, typography } from "../../theme"
import { NavigatorParamList } from "../../navigators"
import {
  GameController,
  Player,
  PlaygroundState,
  Stage,
} from "../../services/game-controller/index"
import { DragContainer, Draggable, DropZone } from "react-native-drag-drop-and-swap"

const PLAYER_ONE_AVATAR = require("./ng-drum.gif")
const PLAYER_TWO_AVATAR = require("./ng-scull.png")

const CPU_IVAN: Player = {
  id: 1,
  name: "Ivan",
  avatar: PLAYER_ONE_AVATAR,
  isCPU: true,
  cards: [],
  stumps: [],
  strikes: 0,
}

const CPU_SEBASTIAN: Player = {
  id: 2,
  name: "Sebastian",
  avatar: PLAYER_TWO_AVATAR,
  isCPU: true,
  cards: [],
  stumps: [],
  strikes: 0,
}

const PLAYER_FROM_NGADONG: Player = {
  id: 3,
  name: "Ngadong man",
  avatar: null,
  isCPU: false,
  cards: [],
  stumps: [],
  strikes: 0,
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
const TOP_CONTAINER: ViewStyle = {
  display: "flex",
  flexDirection: "row",
  alignItems: "flex-start",
  justifyContent: "space-between",
  padding: 4,
  paddingVertical: 12,
}
const DECK_CONTAINER: ViewStyle = {
  width: 102,
  height: 156,
  position: "relative",
}
const NEXT: ViewStyle = {
  paddingVertical: spacing[4],
  paddingHorizontal: spacing[4],
  backgroundColor: color.palette.deepPurple,
}

const players: Player[] = [CPU_IVAN, CPU_SEBASTIAN, PLAYER_FROM_NGADONG]

const cardKeyExtractor = (card: CardType) => `${card.rank}${card.suit}`

export const PlaygroundScreen: FC<StackScreenProps<NavigatorParamList, "playground">> = observer(
  ({ navigation }) => {
    const [state, setState] = React.useState<PlaygroundState>(undefined)

    const ctrlRef = React.useRef<GameController>(null)

    const me = state?.players?.find((player) => player.isCPU === false)
    const isMyTurn = state?.activePlayer?.id === PLAYER_FROM_NGADONG.id

    const init = React.useCallback(async () => {
      const controller = new GameController(players, setState)
      ctrlRef.current = controller
      await ctrlRef.current.init()
    }, [])

    React.useEffect(() => {
      init()
    }, [])

    React.useEffect(() => {
      if (state?.stage === Stage.prepare && state?.activePlayer?.id && !isMyTurn) {
        ctrlRef.current.prepareTurnCPU(state.activePlayer.id)
      }
    }, [state?.activePlayer?.id, state?.stage, isMyTurn])

    if (!me) {
      return null
    }

    console.log(state)

    return (
      <DragContainer>
        <View testID="PlaygroundScreen" style={FULL}>
          <GradientBackground colors={["#422443", "#281b34"]} />
          <Screen style={MAIN_CONTAINER} preset="scroll" backgroundColor={color.transparent}>
            <View testID="TopContainer" style={TOP_CONTAINER}>
              <View style={PLAYER}>
                <Image
                  source={{ uri: state?.players[0].avatar }}
                  resizeMode="contain"
                  style={PLAYER_IMAGE}
                />
                <Text style={TEXT} text={state?.players[0].name} />
                <DropZone
                  useNativeDriver={false}
                  disabled={!isMyTurn || state.players[0].cards.length <= 0}
                  onDrop={(card: CardType) =>
                    ctrlRef.current.prepareTurnPlayer({ target: state?.players[0], card })
                  }
                >
                  {state.players[0].cards.length > 0 ? (
                    <Card {...state.players[0].cards[0]} opened={state.stage === Stage.prepare} />
                  ) : state.players[0].stumps.length > 0 ? (
                    <Card {...state.players[0].stumps[0]} opened={false} />
                  ) : (
                    <Text style={TEXT} text="Нет карт" />
                  )}
                </DropZone>
              </View>
              <View style={PLAYER}>
                <Text
                  style={TEXT}
                  text={
                    state.stage === Stage.prepare
                      ? "Раздача"
                      : state.stage === Stage.stumps
                      ? "Сдаю пеньки"
                      : "Игра"
                  }
                />
                <Text style={TEXT} text={`Ходит:\n ${state?.activePlayer?.name || ""}`} />
                {state.stage === Stage.mainGame && (
                  <Text style={TEXT} text={`Козырь:\n ${state?.trump || "нет"}`} />
                )}
              </View>
              <View style={PLAYER}>
                <Image
                  source={{ uri: state?.players[1].avatar }}
                  resizeMode="contain"
                  style={PLAYER_IMAGE}
                />
                <Text style={TEXT} text={state?.players[1].name} />
                <DropZone
                  useNativeDriver={false}
                  disabled={!isMyTurn || state.players[1].cards.length <= 0}
                  onDrop={(card: CardType) =>
                    ctrlRef.current.prepareTurnPlayer({ target: state?.players[1], card })
                  }
                >
                  {state.players[1].cards.length > 0 ? (
                    <Card {...state.players[1].cards[0]} opened={state.stage === Stage.prepare} />
                  ) : state.players[1].stumps.length > 0 ? (
                    <Card {...state.players[0].stumps[0]} opened={false} />
                  ) : (
                    <Text style={TEXT} text="Нет карт" />
                  )}
                </DropZone>
              </View>
            </View>
            {state && (
              <View testID="TurnContainer" style={TURN_CONTAINER}>
                {state.stage === Stage.mainGame &&
                  state.current.map((card) => (
                    <Card key={cardKeyExtractor(card)} {...card} opened />
                  ))}
                {state.stage === Stage.prepare && (
                  <Draggable
                  useNativeDriver={false}
                    dragOn="onPressIn"
                    data={{ ...state.deck[0] }}
                    disabled={state.activePlayer?.id !== me.id}
                  >
                    <Card {...state.deck[0]} opened={state.stage === Stage.prepare} />
                  </Draggable>
                )}
                {state.stage !== Stage.mainGame && (
                  <View testID="DeckContainer" style={DECK_CONTAINER}>
                    {state.deck.map((card, index) =>
                      index ? (
                        <View
                          testID="CardWrapper"
                          // eslint-disable-next-line react-native/no-inline-styles
                          style={{ position: "absolute", top: index + 0.7, left: index + 0.7, zIndex: 1000 - index }}
                        >
                          <Card key={cardKeyExtractor(card)} {...card} opened={false} animation={false} />
                        </View>
                      ) : null,
                    )}
                  </View>
                )}
              </View>
            )}
          </Screen>
          {state.activePlayer?.canContinueTurn && state.activePlayer?.id === me.id && (
            <Button
              testID="skip-move-button"
              style={NEXT}
              textStyle={TEXT}
              tx="playgroundScreen.skip"
              onPress={ctrlRef.current.setNextPlayer}
            />
          )}
          <SafeAreaView style={FOOTER}>
            <View style={FOOTER_CONTENT}>
              {state && (
                <DropZone
                useNativeDriver={false}
                  disabled={!isMyTurn}
                  onDrop={(card: CardType) =>
                    ctrlRef.current.prepareTurnPlayer({ target: me, card })
                  }
                >
                  <FlatList
                    horizontal
                    contentContainerStyle={FLAT_LIST}
                    data={[...me.cards, ...me.stumps]}
                    keyExtractor={cardKeyExtractor}
                    renderItem={({ item }) => (
                      <Draggable
                        data={{ ...item }}
                        useNativeDriver={false}
                        disabled={
                          item.isStump ||
                          state.activePlayer.id !== me.id ||
                          (state.stage === Stage.prepare && !state.activePlayer?.canContinueTurn)
                        }
                      >
                        <Card {...item} opened={!item.isStump} />
                      </Draggable>
                    )}
                  />
                </DropZone>
              )}
            </View>
          </SafeAreaView>
        </View>
      </DragContainer>
    )
  },
)
