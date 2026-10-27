import { FC, useCallback, useEffect } from "react";
import {
  View,
  ViewStyle,
  TextStyle,
  ImageStyle,
  SafeAreaView,
  FlatList,
  ImageBackground,
  ListRenderItemInfo,
} from "react-native";
import { Image } from "expo-image";
import { Screen } from "@shared-components/screen/screen";
import { Text } from "@shared-components/text/text";
import { Button } from "@shared-components/button/button";
import { Card } from "./components/card/card";
import { Card as CardType } from "./components/card/card.props";
import { DragProvider, Draggable, DropZone } from "./components/drag-drop";
import { Phase, EngineCard, EnginePlayer } from "./engine";
import { useGameEngine } from "./use-game-engine";
import { DEFAULT_SEATS, HUMAN_ID, PLAYER_AVATARS } from "./players";
import { CardWidth, cardHeight } from "@shared-constants";
import { color, spacing, typography } from "theme";

const BENCH_BACKGROUND = require("@assets/images/bench.png");
const PLAYGROUND_BACKGROUND = require("@assets/images/playground.png");
const BUTTON_BACKGROUND = require("@assets/images/button-background.png");

const FULL: ViewStyle = { flex: 1 };
const ROW: ViewStyle = { flexDirection: "row" };
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
const PLAYER: ViewStyle = { ...FLEX_CENTER };
const TURN_CONTAINER: ViewStyle = { ...FULL, ...FLEX_CENTER };
const TEXT: TextStyle = {
  fontSize: 20,
  color: color.palette.lighterGrey,
  fontFamily: typography.ngadong,
  textAlign: "center",
};
const FOOTER: ViewStyle = { backgroundColor: "transparent" };
const FOOTER_CONTENT: ViewStyle = {
  paddingVertical: spacing[2],
  paddingHorizontal: spacing[2],
};
const FLAT_LIST: ViewStyle = { paddingHorizontal: spacing[1] };
const PLAYER_IMAGE: ImageStyle = {
  borderRadius: 18,
  height: 89,
  width: 84,
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
const BUTTON_WRAPPER: ViewStyle = { backgroundColor: "transparent" };
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

const CARD_ITEM_LENGTH = CardWidth + 6;

function toUiCard(card: EngineCard, isStump = false): CardType {
  return { rank: card.rank, suit: card.suit, isStump };
}

function cardKey(card: CardType): string {
  return `${card.rank}-${card.suit}-${card.isStump ? "s" : "h"}`;
}

function phaseLabel(phase: Phase): string {
  switch (phase) {
    case Phase.Prepare:
      return "Раздача";
    case Phase.Huyovye:
      return "Хуёвые";
    case Phase.Main:
      return "Игра";
    case Phase.Ended:
      return "Конец";
    default:
      return "Стол";
  }
}

export const PlaygroundScreen: FC = () => {
  const { engine, state } = useGameEngine({
    seats: DEFAULT_SEATS,
    seed: 42,
  });

  const me = state.players.find((p) => p.id === HUMAN_ID);
  const opponents = state.players.filter((p) => p.id !== HUMAN_ID);
  const left = opponents[0];
  const right = opponents[1];
  const isMyTurn = state.activePlayerId === HUMAN_ID;
  const active = state.players.find((p) => p.id === state.activePlayerId);

  useEffect(() => {
    if (!active?.isCPU || !active.active) {
      return undefined;
    }
    if (state.phase !== Phase.Prepare && state.phase !== Phase.Main) {
      return undefined;
    }
    const t = setTimeout(() => engine.runCpuTurn(), 450);
    return () => clearTimeout(t);
  }, [
    active?.id,
    active?.isCPU,
    active?.active,
    state.phase,
    state.prepareHeld,
    state.current.length,
    state.discardPendingFlip,
    state.roundJustEnded,
    engine,
  ]);

  useEffect(() => {
    if (
      isMyTurn &&
      state.phase === Phase.Prepare &&
      !state.prepareHeld &&
      state.deck.length > 0
    ) {
      engine.drawPrepare(HUMAN_ID);
    }
    return undefined;
  }, [
    isMyTurn,
    state.phase,
    state.prepareHeld,
    state.deck.length,
    state.activePlayerId,
    engine,
  ]);

  const onDropToPlayer = useCallback(
    (target: EnginePlayer, card: CardType) => {
      if (!isMyTurn) return;
      if (state.phase === Phase.Prepare) {
        engine.placePrepare(HUMAN_ID, target.id, {
          rank: card.rank,
          suit: card.suit,
        });
        return;
      }
    },
    [engine, isMyTurn, state.phase],
  );

  const onDropMain = useCallback(
    (card: CardType) => {
      if (!isMyTurn || state.phase !== Phase.Main) return;
      engine.playMain(HUMAN_ID, { rank: card.rank, suit: card.suit });
    },
    [engine, isMyTurn, state.phase],
  );

  const handData: CardType[] = me
    ? [
        ...me.hand.map((c) => toUiCard(c)),
        ...me.stumps.map((c) => toUiCard(c, true)),
      ]
    : [];

  const renderHandItem = useCallback(
    ({ item }: ListRenderItemInfo<CardType>) => (
      <Draggable
        data={item}
        disabled={
          !!item.isStump ||
          !isMyTurn ||
          (state.phase !== Phase.Prepare && state.phase !== Phase.Main)
        }
      >
        <Card {...item} opened={!item.isStump} />
      </Draggable>
    ),
    [isMyTurn, state.phase],
  );

  const getItemLayout = useCallback(
    (_data: ArrayLike<CardType> | null | undefined, index: number) => ({
      length: CARD_ITEM_LENGTH,
      offset: CARD_ITEM_LENGTH * index,
      index,
    }),
    [],
  );

  if (!me || !left || !right) {
    return null;
  }

  const trumpLabel =
    state.trump === null ? "нет" : String(state.trump);

  return (
    <DragProvider>
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
              <OpponentSlot
                player={left}
                phase={state.phase}
                isMyTurn={isMyTurn}
                avatar={PLAYER_AVATARS[left.id]}
                onDrop={(card) => onDropToPlayer(left, card)}
              />
              <View style={PLAYER}>
                <Text style={TEXT} text={phaseLabel(state.phase)} />
                <Text
                  style={TEXT}
                  text={`Ходит:\n ${active?.name || ""}`}
                />
                {state.phase === Phase.Main ||
                state.phase === Phase.Huyovye ? (
                  <Text style={TEXT} text={`Козырь:\n ${trumpLabel}`} />
                ) : null}
                {state.message ? (
                  <Text style={TEXT} text={state.message} />
                ) : null}
              </View>
              <OpponentSlot
                player={right}
                phase={state.phase}
                isMyTurn={isMyTurn}
                avatar={PLAYER_AVATARS[right.id]}
                onDrop={(card) => onDropToPlayer(right, card)}
              />
            </View>
            <View testID="TurnContainer" style={TURN_CONTAINER}>
              <ImageBackground
                resizeMode="stretch"
                style={MAIN_GAME_TURN_BACKGROUND}
                source={BENCH_BACKGROUND}
              >
                {state.phase === Phase.Prepare && state.prepareHeld ? (
                  <Draggable data={toUiCard(state.prepareHeld)} disabled={!isMyTurn}>
                    <Card {...toUiCard(state.prepareHeld)} opened />
                  </Draggable>
                ) : null}
                {state.phase === Phase.Prepare ? (
                  <View testID="DeckContainer" style={DECK_CONTAINER}>
                    {state.deck.length > 0 || state.beaten.length > 0 ? (
                      <Card
                        {...toUiCard(
                          state.deck[0] || state.beaten[0],
                        )}
                        opened={false}
                        animation={false}
                      />
                    ) : null}
                  </View>
                ) : null}
                {state.phase === Phase.Main ? (
                  <DropZone
                    style={MAIN_GAME_TURN_CONTAINER}
                    disabled={!isMyTurn || state.discardPendingFlip}
                    onDrop={onDropMain}
                  >
                    {state.current.map((card) => (
                      <Card
                        key={cardKey(toUiCard(card))}
                        {...toUiCard(card)}
                        opened
                      />
                    ))}
                  </DropZone>
                ) : null}
              </ImageBackground>
            </View>
          </Screen>

          {state.phase === Phase.Prepare &&
          isMyTurn &&
          state.prepareHeld ? (
            <Button
              testID="keep-card-button"
              style={BUTTON_WRAPPER}
              textStyle={TEXT}
              text="ЗАБРАТЬ"
              onPress={() => engine.keepPrepare(HUMAN_ID)}
            />
          ) : null}

          {state.phase === Phase.Main &&
          isMyTurn &&
          state.current.length > 0 &&
          !state.discardPendingFlip ? (
            <Button
              testID="take-card-button"
              style={BUTTON_WRAPPER}
              textStyle={TEXT}
              tx="playgroundScreen.take"
              onPress={() => engine.takeBottom(HUMAN_ID)}
            />
          ) : null}

          {state.phase === Phase.Main &&
          state.discardPendingFlip &&
          state.lastPlayedById === HUMAN_ID ? (
            <Button
              testID="flip-discard-button"
              style={BUTTON_WRAPPER}
              textStyle={TEXT}
              text="ОТБОЙ"
              onPress={() => engine.flipDiscard(HUMAN_ID)}
            />
          ) : null}

          {state.phase === Phase.Main &&
          isMyTurn &&
          state.roundJustEnded &&
          me.hand.length === 0 &&
          me.stumps.length > 0 ? (
            <Button
              testID="show-stumps-button"
              style={BUTTON_WRAPPER}
              onPress={() => engine.claimStumps(HUMAN_ID)}
            >
              <ImageBackground
                resizeMode="contain"
                style={BUTTON_STYLE}
                source={BUTTON_BACKGROUND}
              >
                <Text tx="playgroundScreen.showStumps" style={BUTTON_TEXT} />
              </ImageBackground>
            </Button>
          ) : null}

          {state.phase === Phase.Main &&
          state.roundJustEnded &&
          me.hand.length === 0 &&
          me.stumps.length === 0 &&
          me.active ? (
            <Button
              testID="exit-game-button"
              style={BUTTON_WRAPPER}
              textStyle={TEXT}
              text="С ПИДОРАМИ НЕ ИГРАЮ"
              onPress={() => engine.exitGame(HUMAN_ID)}
            />
          ) : null}

          <SafeAreaView style={FOOTER}>
            <View style={FOOTER_CONTENT}>
              <DropZone
                disabled={!isMyTurn || state.phase !== Phase.Prepare}
                onDrop={(card) => onDropToPlayer(me, card)}
              >
                <FlatList
                  horizontal
                  contentContainerStyle={FLAT_LIST}
                  data={handData}
                  keyExtractor={cardKey}
                  renderItem={renderHandItem}
                  getItemLayout={getItemLayout}
                  windowSize={5}
                  initialNumToRender={8}
                  maxToRenderPerBatch={8}
                  removeClippedSubviews
                  style={{ minHeight: cardHeight + 8 }}
                />
              </DropZone>
            </View>
          </SafeAreaView>
        </ImageBackground>
      </View>
    </DragProvider>
  );
};

function OpponentSlot({
  player,
  phase,
  isMyTurn,
  avatar,
  onDrop,
}: {
  player: EnginePlayer;
  phase: Phase;
  isMyTurn: boolean;
  avatar: number;
  onDrop: (card: CardType) => void;
}) {
  const top = player.hand[0];
  const stump = player.stumps[0];
  return (
    <View style={PLAYER}>
      <Image source={avatar} contentFit="contain" style={PLAYER_IMAGE} />
      <Text style={TEXT} text={player.name} />
      <Text
        style={TEXT}
        text={player.active ? `хуёвых: ${player.huyovye}` : "вышел"}
      />
      <DropZone
        disabled={!isMyTurn || phase !== Phase.Prepare || !player.active}
        onDrop={onDrop}
      >
        {top ? (
          <Card {...toUiCard(top)} opened={phase === Phase.Prepare} />
        ) : stump ? (
          <Card {...toUiCard(stump, true)} opened={false} />
        ) : (
          <Text style={TEXT} text="Нет карт" />
        )}
      </DropZone>
    </View>
  );
}
