import React, { FC } from "react";
import {
  View,
  ViewStyle,
  TextStyle,
  ImageStyle,
  SafeAreaView,
  FlatList,
  ImageBackground,
} from "react-native";
import { observer } from "mobx-react-lite";
import {
  Screen,
  Text,
  Card,
  AutoImage as Image,
  Button,
  Header,
} from "@shared-components/index";
import { Card as CardType } from "@shared-components/card/card.props";
import {
  GameController,
  Player,
  PlaygroundState,
  Stage,
} from "@services/game-controller/index";
import {
  DragContainer,
  Draggable,
  DropZone,
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
} from "react-native-drag-drop-and-swap";
import {
  CPU_IVAN,
  CPU_SEBASTIAN,
  PLAYER_FROM_NGADONG,
} from "@shared-constants";
import { color, spacing, typography } from "theme";

const BENCH_BACKGROUND = require("@assets/images/bench.png");
const PLAYGROUND_BACKGROUND = require("@assets/images/playground.png");
const BUTTON_BACKGROUND = require("@assets/images/button-background.png");

const FULL: ViewStyle = { flex: 1 };
const ROW: ViewStyle = { flexDirection: "row" };
// const COLUMN: ViewStyle = { flexDirection: 'column' }
const FLEX_CENTER: ViewStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
const MAIN_CONTAINER: ViewStyle = {
  ...FULL,
  backgroundColor: color.transparent,
  paddingHorizontal: spacing[2],
};
const PLAYER: ViewStyle = {
  ...FLEX_CENTER,
};
const TURN_CONTAINER: ViewStyle = {
  ...FULL,
  ...FLEX_CENTER,
};
const TEXT: TextStyle = {
  fontSize: 20,
  color: color.palette.lighterGrey,
  fontFamily: typography.ngadong,
  textAlign: "center",
};
// const BOLD: TextStyle = { fontWeight: "bold" }
const FOOTER: ViewStyle = { backgroundColor: "transparent" };
const FOOTER_CONTENT: ViewStyle = {
  paddingVertical: spacing[2],
  paddingHorizontal: spacing[2],
};
const FLAT_LIST: ViewStyle = {
  paddingHorizontal: spacing[1],
};
const PLAYER_IMAGE: ImageStyle = {
  borderRadius: 18,
  height: 89,
  width: 84,
  shadowColor: "black",
  shadowOffset: { width: 5, height: 10 },
  shadowOpacity: 0.5,
  shadowRadius: 10,
  opacity: 1,
};
const TOP_CONTAINER: ViewStyle = {
  display: "flex",
  flexDirection: "row",
  alignItems: "flex-start",
  justifyContent: "space-between",
  padding: 4,
  paddingVertical: 12,
};
const DECK_CONTAINER: ViewStyle = {
  width: 102,
  height: 156,
  position: "relative",
};
const MAIN_GAME_TURN_BACKGROUND: ViewStyle = {
  ...FLEX_CENTER,
  ...ROW,
  width: "100%",
  height: 192,
  padding: 16,
};
const MAIN_GAME_TURN_CONTAINER: ViewStyle = {
  ...ROW,
  alignItems: "flex-start",
  width: "100%",
  height: "100%",
};
const BUTTON_WRAPPER: ViewStyle = {
  backgroundColor: "transparent",
};
const BUTTON_STYLE: ImageStyle = {
  display: "flex",
  alignItems: "center",
  width: 230,
  height: 75,
};
const BUTTON_TEXT: TextStyle = {
  ...TEXT,
  lineHeight: 52,
  letterSpacing: 2,
};

const players: Player[] = [CPU_IVAN, CPU_SEBASTIAN, PLAYER_FROM_NGADONG];

const cardKeyExtractor = (card: CardType) => `${card.rank}${card.suit}`;

interface PlaygroundScreenProps {}

export const PlaygroundScreen: FC<PlaygroundScreenProps> = observer(() => {
  const [state, setState] = React.useState<PlaygroundState>();

  const ctrlRef = React.useRef<GameController>(null);

  const me = state?.players?.find(
    (player) => player.id === PLAYER_FROM_NGADONG.id,
  );
  const isMyTurn = state?.activePlayer?.id === PLAYER_FROM_NGADONG.id;

  const skip = () => ctrlRef.current.setNextPlayer();
  const take = () => ctrlRef.current.mainGameTakeCard();
  const showStumps = () => ctrlRef.current.showStumps();

  const prepareCPUturn = async () => {
    await ctrlRef.current.prepareTurnCPU(state.activePlayer.id);
  };

  const mainGameCpuTurn = async () => {
    await ctrlRef.current.mainGameCpuTurn();
  };

  const init = React.useCallback(async () => {
    const controller = new GameController(players, setState);
    ctrlRef.current = controller;
    await ctrlRef.current.init();
  }, []);

  React.useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (!isMyTurn) {
      if (state?.stage === Stage.prepare) {
        prepareCPUturn();
      }
      if (state?.stage === Stage.mainGame) {
        mainGameCpuTurn();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.activePlayer?.id]);

  if (!me) {
    return null;
  }

  return (
    <DragContainer>
      <View testID="PlaygroundScreen" style={FULL}>
        <ImageBackground
          resizeMode="stretch"
          style={FULL}
          source={PLAYGROUND_BACKGROUND}
        >
          <Screen
            style={MAIN_CONTAINER}
            preset="scroll"
            backgroundColor={color.transparent}
          >
            <View testID="TopContainer" style={TOP_CONTAINER}>
              <View style={PLAYER}>
                <Image
                  source={state?.players[0].avatar}
                  resizeMode="contain"
                  style={PLAYER_IMAGE}
                />
                <Text style={TEXT} text={state?.players[0].name} />
                <DropZone
                  useNativeDriver={true}
                  disabled={!isMyTurn || state.players[0].cards.length <= 0}
                  onDrop={(card: CardType) =>
                    ctrlRef.current.prepareTurnPlayer({
                      target: state?.players[0],
                      card,
                    })
                  }
                >
                  {state.players[0].cards.length > 0 ? (
                    <Card
                      {...state.players[0].cards[0]}
                      opened={state.stage === Stage.prepare}
                    />
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
                <Text
                  style={TEXT}
                  text={`Ходит:\n ${state?.activePlayer?.name || ""}`}
                />
                {state.stage === Stage.mainGame && (
                  <Text
                    style={TEXT}
                    text={`Козырь:\n ${state?.trump || "нет"}`}
                  />
                )}
              </View>
              <View style={PLAYER}>
                <Image
                  source={state?.players[1].avatar}
                  resizeMode="contain"
                  style={PLAYER_IMAGE}
                />
                <Text style={TEXT} text={state?.players[1].name} />
                <DropZone
                  useNativeDriver={true}
                  disabled={!isMyTurn || state.players[1].cards.length <= 0}
                  onDrop={(card: CardType) =>
                    ctrlRef.current.prepareTurnPlayer({
                      target: state?.players[1],
                      card,
                    })
                  }
                >
                  {state.players[1].cards.length > 0 ? (
                    <Card
                      {...state.players[1].cards[0]}
                      opened={state.stage === Stage.prepare}
                    />
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
                <ImageBackground
                  resizeMode="stretch"
                  style={MAIN_GAME_TURN_BACKGROUND}
                  source={BENCH_BACKGROUND}
                >
                  {state.stage === Stage.prepare && (
                    <Draggable
                      useNativeDriver={true}
                      dragOn="onPressIn"
                      data={{ ...state.deck[0] }}
                      disabled={!isMyTurn}
                    >
                      <Card {...state.deck[0]} opened />
                    </Draggable>
                  )}
                  {state.stage === Stage.prepare && (
                    <View testID="DeckContainer" style={DECK_CONTAINER}>
                      {(!!state.deck.length || !!state.beaten.length) && (
                        <Card
                          {...(state.deck[0] || state.beaten[0])}
                          opened={false}
                          animation={false}
                        />
                      )}
                    </View>
                  )}
                  {state.stage === Stage.mainGame && (
                    <DropZone
                      style={MAIN_GAME_TURN_CONTAINER}
                      useNativeDriver={true}
                      disabled={!isMyTurn}
                      onDrop={(card: CardType) =>
                        ctrlRef.current.mainGamePlayerPassCard(card)
                      }
                    >
                      {state.current.map((card) => (
                        <Card key={cardKeyExtractor(card)} {...card} opened />
                      ))}
                    </DropZone>
                  )}
                </ImageBackground>
              </View>
            )}
          </Screen>
          {state.activePlayer?.canContinueTurn && isMyTurn && (
            <Button
              testID="skip-move-button"
              style={BUTTON_WRAPPER}
              textStyle={TEXT}
              tx="playgroundScreen.skip"
              onPress={skip}
            />
          )}
          {state.stage === Stage.mainGame &&
            isMyTurn &&
            !!state.current.length && (
              <Button
                testID="take-card-button"
                style={BUTTON_WRAPPER}
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
                testID="next-screen-button"
                style={BUTTON_WRAPPER}
                onPress={showStumps}
              >
                <ImageBackground
                  resizeMode="contain"
                  style={BUTTON_STYLE}
                  source={BUTTON_BACKGROUND}
                >
                  <Text tx="playgroundScreen.showStumps" style={BUTTON_TEXT} />
                </ImageBackground>
              </Button>
            )}
          <SafeAreaView style={FOOTER}>
            <View style={FOOTER_CONTENT}>
              {state && (
                <DropZone
                  useNativeDriver={true}
                  disabled={!isMyTurn || state.stage !== Stage.prepare}
                  onDrop={(card: CardType) => {
                    ctrlRef.current.prepareTurnPlayer({ target: me, card });
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
                        useNativeDriver={true}
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
        </ImageBackground>
      </View>
    </DragContainer>
  );
});
