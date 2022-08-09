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
  Header,
} from "../../components"
import { Card as CardType } from "../../components/card/card.props"
import { color, spacing, typography } from "../../theme"
import { NavigatorParamList } from "../../navigators"
import {
  GameController,
  Player,
  PlaygroundState,
  Stage,
} from "../../services/game-controller/index"
import { DragContainer, Draggable, DropZone } from "react-native-drag-drop-and-swap"
import { CPU_IVAN, CPU_SEBASTIAN, PLAYER_FROM_NGADONG } from "../../config/constants"


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
const MAIN_GAME_TURN_CONTAINER: ViewStyle = {
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "flex-start",
  minWidth: 320,
  minHeight: 162,
  borderWidth: 0.5,
  borderColor: "lightgray",
  borderStyle: "dashed",
  borderRadius: 8,
}
const HEADER: TextStyle = {
  paddingBottom: spacing[5] - 1,
  paddingHorizontal: spacing[4],
  paddingTop: spacing[3],
}
const HEADER_TITLE: TextStyle = {
  fontSize: 12,
  fontWeight: "bold",
  letterSpacing: 1.5,
  lineHeight: 15,
  textAlign: "center",
}

const players: Player[] = [CPU_IVAN, CPU_SEBASTIAN, PLAYER_FROM_NGADONG]

const cardKeyExtractor = (card: CardType) => `${card.rank}${card.suit}`

export const PlaygroundScreen: FC<StackScreenProps<NavigatorParamList, "playground">> = observer(
  ({ navigation }) => {
    const [state, setState] = React.useState<PlaygroundState>(undefined)

    const ctrlRef = React.useRef<GameController>(null)

    const me = state?.players?.find((player) => player.id === PLAYER_FROM_NGADONG.id)
    const isMyTurn = state?.activePlayer?.id === PLAYER_FROM_NGADONG.id

    const goBack = () => navigation.goBack()
    const skip = () => ctrlRef.current.setNextPlayer()
    const take = () => ctrlRef.current.mainGameTakeCard()
    const showStumps = () => ctrlRef.current.showStumps()

    const prepareCPUturn = async () => {
      await ctrlRef.current.prepareTurnCPU(state.activePlayer.id)
    }

    const mainGameCpuTurn = async () => {
      await ctrlRef.current.mainGameCpuTurn()
    }

    const init = React.useCallback(async () => {
      const controller = new GameController(players, setState)
      ctrlRef.current = controller
      await ctrlRef.current.init()
    }, [])

    React.useEffect(() => {
      init()
    }, [])

    React.useEffect(() => {
      if (!isMyTurn) {
        if (state?.stage === Stage.prepare) {
          prepareCPUturn()
        }
        if (state?.stage === Stage.mainGame) {
          mainGameCpuTurn()
        }
      }
    }, [state?.activePlayer?.id, isMyTurn])

    if (!me) {
      return null
    }

    return (
      <DragContainer>
        <View testID="PlaygroundScreen" style={FULL}>
          <GradientBackground colors={["#422443", "#281b34"]} />
          <Screen style={MAIN_CONTAINER} preset="scroll" backgroundColor={color.transparent}>
            <Header
            headerTx="demoListScreen.title"
            leftIcon="back"
            onLeftPress={goBack}
            style={HEADER}
            titleStyle={HEADER_TITLE}
          />
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
                {state.stage === Stage.prepare && (
                  <Draggable
                    useNativeDriver={false}
                    dragOn="onPressIn"
                    data={{ ...state.deck[0] }}
                    disabled={!isMyTurn}
                  >
                    <Card {...state.deck[0]} opened />
                  </Draggable>
                )}
                {state.stage === Stage.mainGame && (
                  <DropZone
                    style={MAIN_GAME_TURN_CONTAINER}
                    useNativeDriver={false}
                    disabled={!isMyTurn}
                    onDrop={(card: CardType) => ctrlRef.current.mainGamePlayerPassCard(card)}
                  >
                    {state.current.map((card) => (
                      <Card key={cardKeyExtractor(card)} {...card} opened />
                    ))}
                  </DropZone>
                )}
                {!!state.stage && (
                  <View testID="DeckContainer" style={DECK_CONTAINER}>
                    {[...state.deck, ...state.beaten].map((card, index) =>
                      index ? (
                        <View
                          testID="CardWrapper"
                          // eslint-disable-next-line react-native/no-inline-styles
                          style={{
                            position: "absolute",
                            top: index + 0.1,
                            left: index + 0.1,
                            zIndex: 1000 - index,
                          }}
                        >
                          <Card
                            key={cardKeyExtractor(card)}
                            {...card}
                            opened={false}
                            animation={false}
                          />
                        </View>
                      ) : null,
                    )}
                  </View>
                )}
              </View>
            )}
          </Screen>
          {state.activePlayer?.canContinueTurn && isMyTurn && (
            <Button
              testID="skip-move-button"
              style={NEXT}
              textStyle={TEXT}
              tx="playgroundScreen.skip"
              onPress={skip}
            />
          )}
          {state.stage === Stage.mainGame && isMyTurn && !!state.current.length && (
            <Button
              testID="take-card-button"
              style={NEXT}
              textStyle={TEXT}
              tx="playgroundScreen.take"
              onPress={take}
            />
          )}
          {state.stage === Stage.mainGame &&
            isMyTurn &&
            !state.activePlayer.cards.length &&
            !!state.activePlayer.stumps.length && (
              <Button
                testID="show-stumps-button"
                style={NEXT}
                textStyle={TEXT}
                tx="playgroundScreen.showStumps"
                onPress={showStumps}
              />
            )}
          <SafeAreaView style={FOOTER}>
            <View style={FOOTER_CONTENT}>
              {state && (
                <DropZone
                  useNativeDriver={false}
                  disabled={!isMyTurn || state.stage !== Stage.prepare}
                  onDrop={(card: CardType) => {
                    ctrlRef.current.prepareTurnPlayer({ target: me, card })
                  }}
                >
                  <FlatList
                    horizontal
                    contentContainerStyle={FLAT_LIST}
                    data={[...me.cards, ...me.stumps]}
                    keyExtractor={cardKeyExtractor}
                    renderItem={({ item }) => (
                      <Draggable
                        data={{ ...item }}
                        dragOn="onPressIn"
                        useNativeDriver={false}
                        disabled={item.isStump || !isMyTurn}
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
