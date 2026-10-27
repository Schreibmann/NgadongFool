import { FC, useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  ViewStyle,
  TextStyle,
  ImageStyle,
  SafeAreaView,
  FlatList,
  ImageBackground,
  ListRenderItemInfo,
  ScrollView,
  Pressable,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { RouteProp, useRoute } from "@react-navigation/native";
import { Screen } from "@shared-components/screen/screen";
import { Text } from "@shared-components/text/text";
import { Button } from "@shared-components/button/button";
import { Card } from "./components/card/card";
import { Card as CardType } from "./components/card/card.props";
import { DragProvider, Draggable, DropZone } from "./components/drag-drop";
import { Phase, EngineCard, EnginePlayer } from "./engine";
import { useGameEngine } from "./use-game-engine";
import {
  DEFAULT_PLAYER_COUNT,
  HUMAN_ID,
  PLAYER_AVATARS,
  buildSeats,
} from "./players";
import { CardFanStride, CardWidth, cardHeight } from "@shared-constants";
import { color, spacing, typography } from "theme";
import { RootStackParamList } from "../../navigation/types";

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
const PLAYER: ViewStyle = { ...FLEX_CENTER, maxWidth: 120 };
const TURN_CONTAINER: ViewStyle = { ...FULL, ...FLEX_CENTER, minHeight: 200 };
const TEXT: TextStyle = {
  fontSize: 16,
  color: color.palette.lighterGrey,
  fontFamily: typography.ngadong,
  textAlign: "center",
};
const SMALL: TextStyle = { ...TEXT, fontSize: 12 };
const FOOTER: ViewStyle = { backgroundColor: "transparent" };
const FOOTER_CONTENT: ViewStyle = {
  paddingVertical: spacing[2],
  paddingHorizontal: spacing[2],
};
const FLAT_LIST: ViewStyle = { paddingHorizontal: spacing[1] };
const PLAYER_IMAGE: ImageStyle = {
  borderRadius: 18,
  height: 56,
  width: 52,
};
const OPPONENTS_ROW: ViewStyle = {
  flexDirection: "row",
  flexWrap: "wrap",
  justifyContent: "space-around",
  alignItems: "flex-start",
  gap: 8,
  paddingVertical: 8,
};
const STATUS_BOX: ViewStyle = {
  ...FLEX_CENTER,
  paddingHorizontal: 8,
  maxWidth: 220,
  alignSelf: "center",
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
  fontSize: 18,
  lineHeight: 52,
  letterSpacing: 2,
};
const BANNER: ViewStyle = {
  backgroundColor: "rgba(0,0,0,0.55)",
  padding: 12,
  marginHorizontal: 8,
  marginBottom: 8,
  alignItems: "center",
};
const SELECTED_CARD: ViewStyle = {
  borderWidth: 2,
  borderColor: color.palette.orange,
};

/** 50% overlap: each next card covers half of the previous. */
const CARD_FAN_PULL = -CardWidth * 0.5;
const CARD_ITEM_LENGTH = CardFanStride;
const FAN_CARD: ViewStyle = { marginLeft: CARD_FAN_PULL };
const FAN_CARD_FIRST: ViewStyle = { marginLeft: 0 };

function toUiCard(card: EngineCard, isStump = false): CardType {
  return { rank: card.rank, suit: card.suit, isStump };
}

function cardKey(card: CardType, index = 0): string {
  return `${card.rank}-${card.suit}-${card.isStump ? "s" : "h"}-${index}`;
}

function phaseLabel(phase: Phase): string {
  switch (phase) {
    case Phase.Prepare:
      return "Набор";
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

function sameCard(a: EngineCard, b: EngineCard): boolean {
  return a.rank === b.rank && a.suit === b.suit;
}

export const PlaygroundScreen: FC = () => {
  const route = useRoute<RouteProp<RootStackParamList, "Playground">>();
  const playerCount = route.params?.playerCount ?? DEFAULT_PLAYER_COUNT;
  const seats = useMemo(() => buildSeats(playerCount), [playerCount]);
  const { width } = useWindowDimensions();

  const { engine, state } = useGameEngine({
    seats,
    seed: 42 + playerCount,
  });

  const me = state.players.find((p) => p.id === HUMAN_ID);
  const opponents = state.players.filter((p) => p.id !== HUMAN_ID);
  const isMyTurn = state.activePlayerId === HUMAN_ID;
  const active = state.players.find((p) => p.id === state.activePlayerId);
  const watchman = state.players.find((p) => p.id === state.watchmanId);

  const [huyovyePick, setHuyovyePick] = useState<EngineCard | null>(null);

  const myProtocols = me ? engine.protocolsFor(me.id) : [];
  const humanHuyovyeDue = state.huyovyeQueue.filter(
    (q) => q.giverId === HUMAN_ID,
  );

  useEffect(() => {
    if (state.phase === Phase.Huyovye) {
      const cpuPending = state.huyovyeQueue.some((q) => {
        const p = state.players.find((x) => x.id === q.giverId);
        return p?.isCPU === true;
      });
      if (!cpuPending) {
        if (state.huyovyeQueue.length === 0) {
          engine.finishHuyovye();
        }
        return undefined;
      }
      // Interval so a no-op tick cannot permanently stall the phase.
      const t = setInterval(() => engine.runCpuHuyovye(), 450);
      return () => clearInterval(t);
    }

    if (state.phase !== Phase.Prepare && state.phase !== Phase.Main) {
      return undefined;
    }

    // Main: if discard awaits a CPU flipper, keep driving even if active seat drifted.
    const flipper =
      state.phase === Phase.Main && state.discardPendingFlip
        ? state.players.find((p) => p.id === state.lastPlayedById)
        : undefined;
    const cpuShouldAct =
      (active?.isCPU === true && active.active) ||
      (flipper?.isCPU === true && flipper.active === true);
    if (!cpuShouldAct) {
      return undefined;
    }

    // Interval (not one-shot): engine must advance; retries recover soft no-ops.
    const t = setInterval(() => engine.runCpuTurn(), 450);
    return () => clearInterval(t);
  }, [
    active?.id,
    active?.isCPU,
    active?.active,
    state.phase,
    state.prepareHeld,
    state.current.length,
    state.discardPendingFlip,
    state.lastPlayedById,
    state.roundJustEnded,
    state.huyovyeQueue,
    state.players,
    state.message,
    state.activePlayerId,
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

  const giveHuyovye = useCallback(
    (receiverId: number) => {
      if (!huyovyePick) return;
      const ok = engine.giveHuyovyeCard(HUMAN_ID, receiverId, huyovyePick);
      if (ok) setHuyovyePick(null);
    },
    [engine, huyovyePick],
  );

  const handData: CardType[] = me
    ? [
        ...me.hand.map((c) => toUiCard(c)),
        ...me.stumps.map((c) => toUiCard(c, true)),
      ]
    : [];

  const renderHandItem = useCallback(
    ({ item, index }: ListRenderItemInfo<CardType>) => {
      const fanStyle: ViewStyle = {
        ...(index === 0 ? FAN_CARD_FIRST : FAN_CARD),
        zIndex: index,
      };
      if (state.phase === Phase.Huyovye && !item.isStump) {
        const selected =
          huyovyePick != null &&
          sameCard(huyovyePick, { rank: item.rank, suit: item.suit });
        return (
          <Pressable
            onPress={() =>
              setHuyovyePick({ rank: item.rank, suit: item.suit })
            }
            style={[fanStyle, selected ? SELECTED_CARD : undefined]}
          >
            <Card {...item} opened />
          </Pressable>
        );
      }
      return (
        <Draggable
          data={item}
          disabled={
            !!item.isStump ||
            !isMyTurn ||
            (state.phase !== Phase.Prepare && state.phase !== Phase.Main)
          }
          style={fanStyle}
        >
          <Card key={cardKey(item, index)} {...item} opened={!item.isStump} />
        </Draggable>
      );
    },
    [huyovyePick, isMyTurn, state.phase],
  );

  const getItemLayout = useCallback(
    (_data: ArrayLike<CardType> | null | undefined, index: number) => ({
      length: CARD_ITEM_LENGTH,
      offset: CARD_ITEM_LENGTH * index,
      index,
    }),
    [],
  );

  if (!me) {
    return null;
  }

  const trumpLabel = state.trump === null ? "нет" : String(state.trump);
  const seatChipWidth = Math.max(72, Math.min(110, (width - 24) / Math.max(3, opponents.length)));

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
            <View style={STATUS_BOX}>
              <Text
                style={SMALL}
                text={`Стол: ${state.players.length} · Вахта: ${watchman?.name ?? "—"} · Дилер: ${
                  state.players.find((p) => p.id === state.dealerId)?.name ?? "—"
                }`}
              />
              <Text style={TEXT} text={phaseLabel(state.phase)} />
              <Text style={TEXT} text={`Ходит: ${active?.name || ""}`} />
              {state.phase === Phase.Main || state.phase === Phase.Huyovye ? (
                <Text style={TEXT} text={`Козырь: ${trumpLabel}`} />
              ) : null}
              {state.message ? (
                <Text style={SMALL} text={state.message} />
              ) : null}
            </View>

            <View style={OPPONENTS_ROW} testID="OpponentsRow">
              {opponents.map((p) => (
                <View key={p.id} style={[PLAYER, { width: seatChipWidth }]}>
                  <OpponentSlot
                    player={p}
                    phase={state.phase}
                    isMyTurn={isMyTurn}
                    outstanding={engine.huyovyeOutstanding(p.id)}
                    canReceiveHuyovye={
                      state.phase === Phase.Huyovye &&
                      humanHuyovyeDue.some((q) => q.receiverId === p.id) &&
                      huyovyePick != null
                    }
                    onDrop={(card) => onDropToPlayer(p, card)}
                    onHuyovyeTap={() => giveHuyovye(p.id)}
                  />
                </View>
              ))}
            </View>

            <View testID="TurnContainer" style={TURN_CONTAINER}>
              <ImageBackground
                resizeMode="stretch"
                style={MAIN_GAME_TURN_BACKGROUND}
                source={BENCH_BACKGROUND}
              >
                {state.phase === Phase.Prepare && state.prepareHeld ? (
                  <Draggable
                    data={toUiCard(state.prepareHeld)}
                    disabled={!isMyTurn}
                  >
                    <Card {...toUiCard(state.prepareHeld)} opened />
                  </Draggable>
                ) : null}
                {state.phase === Phase.Prepare ? (
                  <View testID="DeckContainer" style={DECK_CONTAINER}>
                    {state.deck.length > 0 || state.beaten.length > 0 ? (
                      <Card
                        {...toUiCard(state.deck[0] || state.beaten[0])}
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
                    {state.current.map((card, i) => (
                      <View
                        key={cardKey(toUiCard(card), i)}
                        style={[
                          i === 0 ? FAN_CARD_FIRST : FAN_CARD,
                          { zIndex: i },
                        ]}
                      >
                        <Card {...toUiCard(card)} opened />
                      </View>
                    ))}
                  </DropZone>
                ) : null}
                {state.phase === Phase.Huyovye ? (
                  <View style={FLEX_CENTER}>
                    {state.resumeMainAfterHuyovye && state.current.length > 0 ? (
                      <View style={MAIN_GAME_TURN_CONTAINER}>
                        {state.current.map((card, i) => (
                          <View
                            key={cardKey(toUiCard(card), i)}
                            style={[
                              i === 0 ? FAN_CARD_FIRST : FAN_CARD,
                              { zIndex: i },
                            ]}
                          >
                            <Card {...toUiCard(card)} opened />
                          </View>
                        ))}
                      </View>
                    ) : null}
                    <Text
                      style={TEXT}
                      text={
                        humanHuyovyeDue.length
                          ? state.resumeMainAfterHuyovye
                            ? "Фол в основной — отдай хуёвую: карта → должник"
                            : "Выбери карту внизу и ткни в должника"
                          : state.resumeMainAfterHuyovye
                            ? "Пауза основной: ждём хуёвые…"
                            : "Ждём раздачу хуёвых…"
                      }
                    />
                    <Text
                      style={SMALL}
                      text={`Осталось обязательств: ${state.huyovyeQueue.length}`}
                    />
                  </View>
                ) : null}
              </ImageBackground>
            </View>
          </Screen>

          {state.pendingWatchmanHandoff ? (
            <View style={BANNER} testID="WatchmanHandoffBanner">
              <Text style={TEXT} text={state.message ?? "Вахту сдал"} />
              <Button
                style={BUTTON_WRAPPER}
                textStyle={TEXT}
                text="ПРИНЯТЬ ВАХТУ"
                onPress={() => engine.acceptWatchmanHandoff()}
              />
              {state.watchmanId != null ? (
                <Button
                  style={BUTTON_WRAPPER}
                  textStyle={SMALL}
                  text="КТО НА ВАХТЕ?"
                  onPress={() => engine.askWhoIsWatchman(HUMAN_ID)}
                />
              ) : null}
            </View>
          ) : null}

          {state.phase === Phase.Ended &&
          !state.pendingWatchmanHandoff &&
          activePlayersStill(state.players).length <= 2 ? (
            <View style={BANNER}>
              <Text style={TEXT} text="Дуэль окончена / вахта назначена" />
              {state.watchmanAskCounts[HUMAN_ID] ? (
                <Button
                  style={BUTTON_WRAPPER}
                  textStyle={SMALL}
                  text="ОТВЕТИТЬ НА «КТО НА ВАХТЕ?»"
                  onPress={() =>
                    state.watchmanId != null &&
                    engine.answerWatchman(state.watchmanId, HUMAN_ID)
                  }
                />
              ) : (
                <Button
                  style={BUTTON_WRAPPER}
                  textStyle={SMALL}
                  text="КТО НА ВАХТЕ?"
                  onPress={() => engine.askWhoIsWatchman(HUMAN_ID)}
                />
              )}
            </View>
          ) : null}

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

          {myProtocols.includes("claim_stumps") ? (
            <View style={BANNER} testID="ClaimStumpsPrompt">
              <Text style={TEXT} text="Беру пни / пеньки / дубки!" />
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
                  <Text
                    tx="playgroundScreen.showStumps"
                    style={BUTTON_TEXT}
                  />
                </ImageBackground>
              </Button>
            </View>
          ) : null}

          {myProtocols.includes("exit") ? (
            <View style={BANNER} testID="ExitPrompt">
              <Text style={TEXT} text="С пидорами не играю!" />
              <Button
                testID="exit-game-button"
                style={BUTTON_WRAPPER}
                textStyle={TEXT}
                text="ВЫЙТИ ИЗ ИГРЫ"
                onPress={() => engine.exitGame(HUMAN_ID)}
              />
            </View>
          ) : null}

          {state.phase === Phase.Main &&
          activePlayersStill(state.players).length === 2 &&
          !state.pendingWatchmanHandoff ? (
            <ScrollView horizontal contentContainerStyle={{ gap: 8, padding: 8 }}>
              {activePlayersStill(state.players).map((p) => (
                <Button
                  key={`duel-lose-${p.id}`}
                  style={BUTTON_WRAPPER}
                  textStyle={SMALL}
                  text={`Вахта → ${p.name}`}
                  onPress={() => engine.setWatchman(p.id)}
                />
              ))}
            </ScrollView>
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
                  keyExtractor={(item, index) => cardKey(item, index)}
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

function activePlayersStill(players: EnginePlayer[]): EnginePlayer[] {
  return players.filter((p) => p.active);
}

function OpponentSlot({
  player,
  phase,
  isMyTurn,
  outstanding,
  canReceiveHuyovye,
  onDrop,
  onHuyovyeTap,
}: {
  player: EnginePlayer;
  phase: Phase;
  isMyTurn: boolean;
  outstanding: number;
  canReceiveHuyovye: boolean;
  onDrop: (card: CardType) => void;
  onHuyovyeTap: () => void;
}) {
  const top = player.hand[0];
  const stump = player.stumps[0];
  const avatar = PLAYER_AVATARS[player.id];

  const body = (
    <>
      {typeof avatar === "number" ? (
        <Image source={avatar} contentFit="contain" style={PLAYER_IMAGE} />
      ) : null}
      <Text style={SMALL} text={player.name} />
      <Text
        style={SMALL}
        text={
          player.active
            ? outstanding > 0
              ? `ждёт ${outstanding}`
              : `карт ${player.hand.length}`
            : "вышел"
        }
      />
      {top ? (
        <Card {...toUiCard(top)} opened={phase === Phase.Prepare || phase === Phase.Huyovye} />
      ) : stump ? (
        <Card {...toUiCard(stump, true)} opened={false} />
      ) : (
        <Text style={SMALL} text="—" />
      )}
    </>
  );

  if (phase === Phase.Huyovye) {
    return (
      <Pressable
        disabled={!canReceiveHuyovye}
        onPress={onHuyovyeTap}
        style={PLAYER}
        testID={`huyovye-target-${player.id}`}
      >
        {body}
      </Pressable>
    );
  }

  return (
    <View style={PLAYER}>
      <DropZone
        disabled={!isMyTurn || phase !== Phase.Prepare || !player.active}
        onDrop={onDrop}
      >
        {body}
      </DropZone>
    </View>
  );
}
