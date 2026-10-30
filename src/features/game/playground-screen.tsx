import { type FC, useCallback, useMemo, useState } from "react";
import {
  type ImageStyle,
  StyleSheet,
  type TextStyle,
  View,
  type ViewStyle,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { type RouteProp, useRoute } from "@react-navigation/native";
import { Card } from "./components/card/card";
import type { Card as CardType } from "./components/card/card.props";
import { DragProvider, Draggable, DropZone } from "./components/drag-drop";
import { type EngineCard, type EnginePlayer, Phase } from "./engine";
import { useGameEngine } from "./use-game-engine";
import { useCpuDriver } from "./hooks/use-cpu-driver";
import { usePrepareTurn } from "./hooks/use-prepare-turn";
import { OpponentSeat, SeatCard } from "./components/ui/opponent-slot";
import { toUiCard, uiCardKey } from "./components/ui/to-ui-card";
import { CaveBackground } from "./components/ui/cave-background";
import { TopBar } from "./components/ui/top-bar";
import { MessageBar } from "./components/ui/message-bar";
import { PlayerHand } from "./components/ui/player-hand";
import { StonePanel } from "./components/ui/stone-panel";
import { computeTableLayout } from "./components/ui/table-layout";
import { HUD_TEXT } from "./components/ui/table-text";
import { FULL } from "./components/ui/common-styles";
import {
  DEFAULT_PLAYER_COUNT,
  HUMAN_ID,
  PLAYER_AVATARS,
  buildSeats,
} from "./players";
import { Text } from "@shared-components/text/text";
import { tableAssets } from "@assets/prehistoric-v2/assets";
import type { RootStackParamList } from "@navigation/types";

export const PlaygroundScreen: FC = () => {
  const route = useRoute<RouteProp<RootStackParamList, "Playground">>();
  const playerCount = route.params?.playerCount ?? DEFAULT_PLAYER_COUNT;
  const deckSize = route.params?.deckSize ?? 36;
  const seats = useMemo(() => buildSeats(playerCount), [playerCount]);
  const sessionNonce = useMemo(() => Date.now(), []);
  const window = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const { engine, state } = useGameEngine({ seats, sessionNonce, deckSize });
  useCpuDriver(engine, state);
  const prepareTurn = usePrepareTurn(engine, state);

  const me = state.players.find((p) => p.id === HUMAN_ID);
  const opponents = state.players.filter((p) => p.id !== HUMAN_ID);
  const watchman = state.players.find((p) => p.id === state.watchmanId);
  const activePlayers = state.players.filter((p) => p.active);

  const [huyovyePick, setHuyovyePick] = useState<EngineCard | null>(null);

  const myProtocols = me ? engine.protocolsFor(me.id) : [];
  const humanHuyovyeDue = state.huyovyeQueue.filter(
    (q) => q.giverId === HUMAN_ID
  );

  const handData: CardType[] = me
    ? [
        ...me.hand.map((c) => toUiCard(c)),
        ...me.stumps.map((c) => toUiCard(c, true)),
      ]
    : [];

  const layout = computeTableLayout({
    width: window.width,
    height: window.height - insets.top - insets.bottom,
    opponents: opponents.length,
    handCount: handData.length,
  });

  const onDropToPlayer = useCallback(
    (targetId: number, card: CardType) => {
      if (!prepareTurn.isMyTurn || state.phase !== Phase.Prepare) return;
      engine.placePrepare(HUMAN_ID, targetId, {
        rank: card.rank,
        suit: card.suit,
      });
    },
    [engine, prepareTurn.isMyTurn, state.phase]
  );

  const onDropToTable = useCallback(
    (card: CardType) => {
      if (!prepareTurn.isMyTurn || state.phase !== Phase.Main) return;
      engine.playMain(HUMAN_ID, { rank: card.rank, suit: card.suit });
    },
    [engine, prepareTurn.isMyTurn, state.phase]
  );

  const giveHuyovye = useCallback(
    (receiverId: number) => {
      if (!huyovyePick) return;
      const ok = engine.giveHuyovyeCard(HUMAN_ID, receiverId, huyovyePick);
      if (ok) setHuyovyePick(null);
    },
    [engine, huyovyePick]
  );

  if (!me) {
    return null;
  }

  const canReceiveHuyovye = (p: EnginePlayer): boolean =>
    state.phase === Phase.Huyovye &&
    huyovyePick != null &&
    humanHuyovyeDue.some((q) => q.receiverId === p.id);

  const isPrepareTarget = (p: EnginePlayer): boolean =>
    prepareTurn.isMyTurn &&
    state.phase === Phase.Prepare &&
    p.active &&
    prepareTurn.legalPrepareTarget?.id === p.id;

  // Top cards are public only through the prepare/batch-gift stretch; a
  // mid-main foul pause keeps hands private and the paused pile on the table.
  const showSeatCards =
    state.phase === Phase.Prepare ||
    (state.phase === Phase.Huyovye && !state.resumeMainAfterHuyovye);
  const showPile =
    state.phase === Phase.Main ||
    (state.phase === Phase.Huyovye && state.resumeMainAfterHuyovye);

  const seatsRow = (
    <View style={[SEATS_ROW, { gap: layout.seatGap }]} testID="OpponentsRow">
      {opponents.map((p) => (
        <OpponentSeat
          key={p.id}
          player={p}
          avatar={PLAYER_AVATARS[p.id]}
          width={layout.seatWidth}
          portrait={layout.portrait}
          nameplateHeight={layout.nameplateHeight}
          compact={!layout.isWide}
          isTheirTurn={state.activePlayerId === p.id}
          outstanding={engine.huyovyeOutstanding(p.id)}
          canReceiveHuyovye={canReceiveHuyovye(p)}
          onHuyovyeTap={() => giveHuyovye(p.id)}
        />
      ))}
    </View>
  );

  const seatCards = (
    <View style={[SEATS_ROW, { gap: layout.seatGap }]}>
      {opponents.map((p) => (
        <SeatCard
          key={p.id}
          player={p}
          phase={state.phase}
          width={layout.seatWidth}
          card={layout.seatCard}
          prepareDropEnabled={isPrepareTarget(p)}
          canReceiveHuyovye={canReceiveHuyovye(p)}
          onDrop={(card) => onDropToPlayer(p.id, card)}
          onHuyovyeTap={() => giveHuyovye(p.id)}
        />
      ))}
    </View>
  );

  const deckWidth = layout.sideSlotWidth - (layout.isWide ? 16 : 6);
  const deckSlot =
    state.phase === Phase.Prepare && state.deck.length > 0 ? (
      <View
        style={
          layout.stackedSlots
            ? [INLINE_SLOT, { width: deckWidth }]
            : [SIDE_SLOT, { left: layout.padding, width: deckWidth }]
        }
        testID="PrepareDeck"
      >
        <View>
          <Image
            source={tableAssets.cards.deck}
            style={{ width: deckWidth, height: deckWidth * (276 / 295) }}
            contentFit="contain"
          />
          <StonePanel kind="roundBadge" style={DECK_BADGE}>
            <Text style={BADGE_TEXT} text={String(state.deck.length)} />
          </StonePanel>
        </View>
      </View>
    ) : null;

  const heldSlot =
    state.phase === Phase.Prepare && state.prepareHeld ? (
      <View
        style={
          layout.stackedSlots
            ? INLINE_SLOT
            : [SIDE_SLOT, { right: layout.padding, width: deckWidth }]
        }
        testID="PrepareHeld"
      >
        <View style={prepareTurn.isMyTurn ? HELD_GLOW : null}>
          <Draggable
            data={toUiCard(state.prepareHeld)}
            disabled={!prepareTurn.isMyTurn}
          >
            <Card
              {...toUiCard(state.prepareHeld)}
              opened
              width={layout.tableCard.width}
              height={layout.tableCard.height}
            />
          </Draggable>
        </View>
      </View>
    ) : null;

  const pileStride = Math.round(layout.tableCard.width * 0.55);
  const pileCards = state.current.map((card, i) => (
    <View
      key={uiCardKey(toUiCard(card), i)}
      style={{
        position: "absolute",
        left: i * pileStride,
        top: i % 2 === 0 ? 0 : 6,
        zIndex: i,
      }}
    >
      <Card
        {...toUiCard(card)}
        opened
        width={layout.tableCard.width}
        height={layout.tableCard.height}
      />
    </View>
  ));
  const pileWidth =
    state.current.length > 0
      ? layout.tableCard.width + pileStride * (state.current.length - 1)
      : layout.tableCard.width;
  const pileBox = (
    <View style={{ width: pileWidth, height: layout.tableCard.height + 6 }}>
      {pileCards}
    </View>
  );
  const tableDropEnabled =
    state.phase === Phase.Main &&
    prepareTurn.isMyTurn &&
    !state.discardPendingFlip;

  const pile = showPile ? (
    state.phase === Phase.Main ? (
      <DropZone
        disabled={!tableDropEnabled}
        onDrop={onDropToTable}
        style={[TABLE_DROP, tableDropEnabled ? TABLE_DROP_ACTIVE : null]}
      >
        {pileBox}
      </DropZone>
    ) : (
      <View style={TABLE_DROP}>{pileBox}</View>
    )
  ) : null;

  const sideRoom = (window.width - layout.boardWidth) / 2;

  return (
    <DragProvider>
      <View testID="PlaygroundScreen" style={FULL}>
        <CaveBackground />
        {sideRoom > 70 ? (
          <>
            <Image
              source={tableAssets.decor.torch}
              style={[TORCH, { left: sideRoom / 2 - 20 }]}
              contentFit="contain"
            />
            <Image
              source={tableAssets.decor.torch}
              style={[TORCH, { right: sideRoom / 2 - 20 }]}
              contentFit="contain"
            />
          </>
        ) : null}
        <SafeAreaView style={ROOT} edges={["top", "bottom"]}>
          <View
            style={[
              BOARD,
              layout.isWide ? BOARD_FRAMED : null,
              { width: layout.boardWidth },
            ]}
          >
            <View style={[MURAL, { height: layout.muralHeight }]}>
              <Image
                source={tableAssets.boards.caveMural}
                style={FILL_IMAGE}
                contentFit="cover"
              />
              <View
                style={[MURAL_CONTENT, { paddingHorizontal: layout.padding }]}
              >
                <TopBar
                  state={state}
                  watchman={watchman}
                  isWide={layout.isWide}
                  height={layout.headerHeight}
                />
                {seatsRow}
              </View>
            </View>

            <View
              style={[TABLE, { minHeight: layout.tableMinHeight }]}
              testID="TableSurface"
            >
              <Image
                source={tableAssets.boards.stoneTable}
                style={FILL_IMAGE}
                contentFit="cover"
              />
              {layout.stackedSlots ? (
                <View style={TABLE_STACK}>
                  {showSeatCards ? seatCards : null}
                  {deckSlot || heldSlot ? (
                    <View style={SLOTS_ROW}>
                      {deckSlot}
                      {heldSlot}
                    </View>
                  ) : null}
                </View>
              ) : (
                <>
                  {showSeatCards ? seatCards : null}
                  {deckSlot}
                  {heldSlot}
                </>
              )}
              {pile}
            </View>

            <View
              style={[
                MESSAGE_WRAP,
                { paddingHorizontal: layout.isWide ? 12 : 4 },
              ]}
            >
              <MessageBar
                engine={engine}
                state={state}
                context={{
                  humanId: HUMAN_ID,
                  isMyTurn: prepareTurn.isMyTurn,
                  legalTarget: prepareTurn.legalPrepareTarget,
                  humanHuyovyeDue: humanHuyovyeDue.length,
                  protocols: myProtocols,
                }}
                canKeepPrepare={prepareTurn.canKeepPrepare}
                activePlayers={activePlayers}
                isWide={layout.isWide}
                minHeight={layout.messageMinHeight}
              />
            </View>

            <PlayerHand
              cards={handData}
              phase={state.phase}
              isMyTurn={prepareTurn.isMyTurn}
              layout={layout}
              pick={huyovyePick}
              onPick={setHuyovyePick}
              dropEnabled={isPrepareTarget(me)}
              onDrop={(card) => onDropToPlayer(me.id, card)}
            />
          </View>
        </SafeAreaView>
      </View>
    </DragProvider>
  );
};

const ROOT: ViewStyle = {
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
};

const BOARD: ViewStyle = {
  flex: 1,
  overflow: "hidden",
  backgroundColor: "#24170f",
};

const BOARD_FRAMED: ViewStyle = {
  marginVertical: 8,
  borderRadius: 14,
  borderWidth: 3,
  borderColor: "#3a2618",
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.7,
  shadowRadius: 24,
  elevation: 16,
};

const FILL_IMAGE: ImageStyle = {
  ...StyleSheet.absoluteFill,
  width: "100%",
  height: "100%",
};

const MURAL: ViewStyle = {
  width: "100%",
  overflow: "hidden",
};

const MURAL_CONTENT: ViewStyle = {
  flex: 1,
  paddingTop: 6,
  gap: 4,
};

const SEATS_ROW: ViewStyle = {
  flexDirection: "row",
  justifyContent: "center",
  alignItems: "flex-start",
};

const TABLE: ViewStyle = {
  flex: 1,
  width: "100%",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
};

const SIDE_SLOT: ViewStyle = {
  position: "absolute",
  top: 0,
  bottom: 0,
  alignItems: "center",
  justifyContent: "center",
};

const INLINE_SLOT: ViewStyle = {
  alignItems: "center",
  justifyContent: "center",
};

const TABLE_STACK: ViewStyle = {
  alignItems: "center",
  gap: 10,
};

const SLOTS_ROW: ViewStyle = {
  flexDirection: "row",
  gap: 28,
  alignItems: "center",
};

const DECK_BADGE: ViewStyle = {
  position: "absolute",
  bottom: -8,
  right: -8,
  width: 38,
  height: 38,
};

const BADGE_TEXT: TextStyle = { ...HUD_TEXT, fontSize: 13 };

const HELD_GLOW: ViewStyle = {
  borderRadius: 8,
  shadowColor: "#ffb347",
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 1,
  shadowRadius: 16,
  elevation: 14,
};

const TABLE_DROP: ViewStyle = {
  minWidth: "50%",
  alignSelf: "stretch",
  marginVertical: 10,
  marginHorizontal: "12%",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 16,
  borderWidth: 2,
  borderColor: "transparent",
};

const TABLE_DROP_ACTIVE: ViewStyle = {
  borderColor: "rgba(255,179,71,0.75)",
  borderStyle: "dashed",
  backgroundColor: "rgba(255,179,71,0.08)",
};

const MESSAGE_WRAP: ViewStyle = {
  marginTop: -10,
  marginBottom: -6,
  zIndex: 5,
};

const TORCH: ImageStyle = {
  position: "absolute",
  top: "30%",
  width: 40,
  height: 150,
};
