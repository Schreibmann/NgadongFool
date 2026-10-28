import { FC, useCallback, useMemo, useState } from "react";
import {
  FlatList,
  ImageBackground,
  ListRenderItemInfo,
  Pressable,
  SafeAreaView,
  View,
  ViewStyle,
  useWindowDimensions,
} from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import { Screen } from "@shared-components/screen/screen";
import { Card as CardType } from "./components/card/card.props";
import { Card } from "./components/card/card";
import { DragProvider, Draggable, DropZone } from "./components/drag-drop";
import { EngineCard, EnginePlayer, Phase } from "./engine";
import { useGameEngine } from "./use-game-engine";
import { useCpuDriver } from "./hooks/use-cpu-driver";
import { usePrepareTurn } from "./hooks/use-prepare-turn";
import { StatusBox } from "./components/ui/status-box";
import { HuyovyeBanner } from "./components/ui/huyovye-banner";
import { WatchmanHandoffBanner } from "./components/ui/watchman-banner";
import { EndedBanner } from "./components/ui/ended-banner";
import {
  DuelControls,
  ProtocolBanners,
} from "./components/ui/protocol-banners";
import { TurnActionButtons } from "./components/ui/turn-action-buttons";
import { OpponentSlot } from "./components/ui/opponent-slot";
import {
  toUiCard,
  uiCardKey,
} from "./components/ui/to-ui-card";
import {
  FULL,
  PLAYER,
} from "./components/ui/common-styles";
import {
  DEFAULT_PLAYER_COUNT,
  HUMAN_ID,
  PLAYER_AVATARS,
  buildSeats,
} from "./players";
import { CardFanStride, CardWidth, cardHeight } from "@shared-constants";
import { spacing } from "@theme";
import { RootStackParamList } from "@navigation/types";

const BENCH_BACKGROUND = require("@assets/images/bench.png");
const PLAYGROUND_BACKGROUND = require("@assets/images/playground.png");

const MAIN_CONTAINER: ViewStyle = {
  ...FULL,
  paddingHorizontal: spacing[2],
};
const OPPONENTS_ROW: ViewStyle = {
  flexDirection: "row",
  flexWrap: "wrap",
  justifyContent: "space-around",
  alignItems: "flex-start",
  gap: 8,
  paddingVertical: 8,
};
const TURN_CONTAINER: ViewStyle = {
  ...FULL,
  minHeight: 200,
};
const MAIN_TURN_BACKGROUND: ViewStyle = {
  alignItems: "center",
  justifyContent: "center",
  flexDirection: "row",
  width: "100%",
  height: 192,
  padding: 16,
};
const MAIN_TURN_CONTAINER: ViewStyle = {
  flexDirection: "row",
  alignItems: "flex-start",
  width: "100%",
  height: "100%",
};
const DECK_CONTAINER: ViewStyle = {
  width: 102,
  height: 156,
  position: "relative",
};
const FLAT_LIST: ViewStyle = { paddingHorizontal: spacing[1] };
const FOOTER: ViewStyle = { backgroundColor: "transparent" };
const FOOTER_CONTENT: ViewStyle = {
  paddingVertical: spacing[2],
  paddingHorizontal: spacing[2],
};
const SELECTED_CARD: ViewStyle = {
  borderWidth: 2,
  borderColor: "#f9a825",
};
/** 50% overlap: each next card covers half of the previous. */
const CARD_ITEM_LENGTH = CardFanStride;
const FAN_CARD: ViewStyle = { marginLeft: -CardWidth * 0.5 };
const FAN_CARD_FIRST: ViewStyle = { marginLeft: 0 };

export const PlaygroundScreen: FC = () => {
  const route = useRoute<RouteProp<RootStackParamList, "Playground">>();
  const playerCount = route.params?.playerCount ?? DEFAULT_PLAYER_COUNT;
  const seats = useMemo(() => buildSeats(playerCount), [playerCount]);
  const sessionNonce = useMemo(() => Date.now(), []);
  const { width } = useWindowDimensions();

  const { engine, state } = useGameEngine({ seats, sessionNonce });
  useCpuDriver(engine, state);
  const prepareTurn = usePrepareTurn(engine, state);

  const me = state.players.find((p) => p.id === HUMAN_ID);
  const opponents = state.players.filter((p) => p.id !== HUMAN_ID);
  const active = state.players.find((p) => p.id === state.activePlayerId);
  const watchman = state.players.find((p) => p.id === state.watchmanId);
  const activePlayers = state.players.filter((p) => p.active);

  const [huyovyePick, setHuyovyePick] = useState<EngineCard | null>(null);

  const myProtocols = me ? engine.protocolsFor(me.id) : [];
  const humanHuyovyeDue = state.huyovyeQueue.filter(
    (q) => q.giverId === HUMAN_ID,
  );

  const handData: CardType[] = me
    ? [
        ...me.hand.map((c) => toUiCard(c)),
        ...me.stumps.map((c) => toUiCard(c, true)),
      ]
    : [];

  const onDropToPlayer = useCallback(
    (target: EnginePlayer, card: CardType) => {
      if (!prepareTurn.isMyTurn) return;
      if (state.phase === Phase.Prepare) {
        engine.placePrepare(HUMAN_ID, target.id, {
          rank: card.rank,
          suit: card.suit,
        });
      }
    },
    [engine, prepareTurn.isMyTurn, state.phase],
  );

  const onDropMain = useCallback(
    (card: CardType) => {
      if (!prepareTurn.isMyTurn || state.phase !== Phase.Main) return;
      engine.playMain(HUMAN_ID, { rank: card.rank, suit: card.suit });
    },
    [engine, prepareTurn.isMyTurn, state.phase],
  );

  const giveHuyovye = useCallback(
    (receiverId: number) => {
      if (!huyovyePick) return;
      const ok = engine.giveHuyovyeCard(HUMAN_ID, receiverId, huyovyePick);
      if (ok) setHuyovyePick(null);
    },
    [engine, huyovyePick],
  );

  const renderHandItem = useCallback(
    ({ item, index }: ListRenderItemInfo<CardType>) => {
      const fanStyle: ViewStyle =
        index === 0
          ? { ...FAN_CARD_FIRST, zIndex: index }
          : { ...FAN_CARD, zIndex: index };
      if (state.phase === Phase.Huyovye && !item.isStump) {
        const selected =
          huyovyePick != null &&
          huyovyePick.rank === item.rank &&
          huyovyePick.suit === item.suit;
        return (
          <Pressable
            onPress={() => setHuyovyePick({ rank: item.rank, suit: item.suit })}
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
            !prepareTurn.isMyTurn ||
            (state.phase !== Phase.Prepare && state.phase !== Phase.Main)
          }
          style={fanStyle}
        >
          <Card {...item} opened={!item.isStump} />
        </Draggable>
      );
    },
    [huyovyePick, prepareTurn.isMyTurn, state.phase],
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

  const seatChipWidth = Math.max(
    72,
    Math.min(110, (width - 24) / Math.max(3, opponents.length)),
  );

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
            backgroundColor="transparent"
          >
            <StatusBox state={state} watchman={watchman} active={active} />

            <View style={OPPONENTS_ROW} testID="OpponentsRow">
              {opponents.map((p) => (
                <View key={p.id} style={[PLAYER, { width: seatChipWidth }]}>
                  <OpponentSlot
                    player={p}
                    avatar={PLAYER_AVATARS[p.id]}
                    phase={state.phase}
                    prepareDropEnabled={
                      prepareTurn.isMyTurn &&
                      state.phase === Phase.Prepare &&
                      p.active &&
                      prepareTurn.legalPrepareTarget?.id === p.id
                    }
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
                style={{ ...MAIN_TURN_BACKGROUND, flex: 1 }}
                source={BENCH_BACKGROUND}
              >
                {state.phase === Phase.Prepare && state.prepareHeld ? (
                  <Draggable data={toUiCard(state.prepareHeld)} disabled={!prepareTurn.isMyTurn}>
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
                    style={MAIN_TURN_CONTAINER}
                    disabled={!prepareTurn.isMyTurn || state.discardPendingFlip}
                    onDrop={onDropMain}
                  >
                    {state.current.map((card, i) => (
                      <View
                        key={uiCardKey(toUiCard(card), i)}
                        style={[i === 0 ? FAN_CARD_FIRST : FAN_CARD, { zIndex: i }]}
                      >
                        <Card {...toUiCard(card)} opened />
                      </View>
                    ))}
                  </DropZone>
                ) : null}
                {state.phase === Phase.Huyovye &&
                state.resumeMainAfterHuyovye &&
                state.current.length > 0 ? (
                  <View style={MAIN_TURN_CONTAINER}>
                    {state.current.map((card, i) => (
                      <View
                        key={uiCardKey(toUiCard(card), i)}
                        style={[i === 0 ? FAN_CARD_FIRST : FAN_CARD, { zIndex: i }]}
                      >
                        <Card {...toUiCard(card)} opened />
                      </View>
                    ))}
                  </View>
                ) : null}
              </ImageBackground>
            </View>
          </Screen>

          {state.phase === Phase.Huyovye ? (
            <HuyovyeBanner
              state={state}
              humanHuyovyeDueCount={humanHuyovyeDue.length}
            />
          ) : null}

          {state.pendingWatchmanHandoff ? (
            <WatchmanHandoffBanner
              state={state}
              onAccept={() => engine.acceptWatchmanHandoff()}
              onAskWho={() => engine.askWhoIsWatchman(HUMAN_ID)}
            />
          ) : null}

          {state.phase === Phase.Ended &&
          !state.pendingWatchmanHandoff &&
          activePlayers.length <= 2 ? (
            <EndedBanner
              state={state}
              humanId={HUMAN_ID}
              activePlayers={activePlayers}
              onAskWho={() => engine.askWhoIsWatchman(HUMAN_ID)}
              onAnswerWho={() =>
                state.watchmanId != null &&
                engine.answerWatchman(state.watchmanId, HUMAN_ID)
              }
            />
          ) : null}

          <TurnActionButtons
            engine={engine}
            state={state}
            humanId={HUMAN_ID}
            isMyTurn={prepareTurn.isMyTurn}
            canKeepPrepare={prepareTurn.canKeepPrepare}
          />

          <ProtocolBanners
            protocols={myProtocols}
            onClaimStumps={() => engine.claimStumps(HUMAN_ID)}
            onExit={() => engine.exitGame(HUMAN_ID)}
          />

          {state.phase === Phase.Main &&
          activePlayers.length === 2 &&
          !state.pendingWatchmanHandoff ? (
            <DuelControls
              duelists={activePlayers}
              onSetWatchman={(id) => engine.setWatchman(id)}
            />
          ) : null}

          <SafeAreaView style={FOOTER}>
            <View style={FOOTER_CONTENT}>
              <DropZone
                disabled={
                  !prepareTurn.isMyTurn ||
                  state.phase !== Phase.Prepare ||
                  prepareTurn.legalPrepareTarget?.id !== me.id
                }
                onDrop={(card) => onDropToPlayer(me, card)}
              >
                <FlatList
                  horizontal
                  contentContainerStyle={FLAT_LIST}
                  data={handData}
                  keyExtractor={(item, index) => uiCardKey(item, index)}
                  renderItem={renderHandItem}
                  getItemLayout={getItemLayout}
                  windowSize={5}
                  initialNumToRender={8}
                  maxToRenderPerBatch={8}
                  removeClippedSubviews={false}
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
