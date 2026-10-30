import type { FC, ReactElement } from "react";
import { type TextStyle, View, type ViewStyle } from "react-native";
import {
  type EnginePlayer,
  type GameEngine,
  type GameState,
  Phase,
} from "../../engine";
import { Text } from "@shared-components/text/text";
import { StonePanel } from "./stone-panel";
import { describeTable, type TableMessageContext } from "./table-message";
import { EYEBROW, HEADLINE, HUD_SUB } from "./table-text";
import { WoodButton } from "./wood-button";

interface MessageBarProps {
  engine: GameEngine;
  state: GameState;
  context: TableMessageContext;
  canKeepPrepare: boolean;
  activePlayers: EnginePlayer[];
  isWide: boolean;
  minHeight: number;
}

const PANEL_WIDE: ViewStyle = {
  paddingHorizontal: 44,
  paddingVertical: 12,
};

const PANEL_NARROW: ViewStyle = {
  paddingHorizontal: 26,
  paddingVertical: 12,
};

const ROW: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: 16,
  width: "100%",
};

const COLUMN: ViewStyle = {
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  width: "100%",
};

const TEXTS: ViewStyle = { alignItems: "center", flexShrink: 1, gap: 2 };

const ACTIONS: ViewStyle = {
  flexDirection: "row",
  flexWrap: "wrap",
  justifyContent: "center",
  gap: 8,
};

const HEADLINE_NARROW: TextStyle = { ...HEADLINE, fontSize: 17 };
const EYEBROW_NARROW: TextStyle = { ...EYEBROW, fontSize: 12 };

/** Bone-framed status bar between the table and the hand (mockup). */
export const MessageBar: FC<MessageBarProps> = ({
  engine,
  state,
  context,
  canKeepPrepare,
  activePlayers,
  isWide,
  minHeight,
}) => {
  const { humanId, isMyTurn, protocols } = context;
  const message = describeTable(state, context);

  const actions: ReactElement[] = [];
  const compact = !isWide;

  if (state.pendingWatchmanHandoff) {
    actions.push(
      <WoodButton
        key="accept"
        text="Принять вахту"
        compact={compact}
        onPress={() => engine.acceptWatchmanHandoff()}
      />
    );
    if (state.watchmanId != null) {
      actions.push(
        <WoodButton
          key="ask"
          text="Кто на вахте?"
          compact={compact}
          onPress={() => engine.askWhoIsWatchman(humanId)}
        />
      );
    }
  } else if (state.phase === Phase.Ended && activePlayers.length <= 2) {
    const watchmanId = state.watchmanId;
    actions.push(
      state.watchmanAskCounts[humanId] && watchmanId != null ? (
        <WoodButton
          key="answer"
          text="Ответить вахте"
          compact={compact}
          onPress={() => engine.answerWatchman(watchmanId, humanId)}
        />
      ) : (
        <WoodButton
          key="ask"
          text="Кто на вахте?"
          compact={compact}
          onPress={() => engine.askWhoIsWatchman(humanId)}
        />
      )
    );
  }

  if (canKeepPrepare) {
    actions.push(
      <WoodButton
        key="keep"
        testID="keep-card-button"
        text="Забрать"
        compact={compact}
        onPress={() => engine.keepPrepare(humanId)}
      />
    );
  }

  if (
    state.phase === Phase.Main &&
    isMyTurn &&
    state.current.length > 0 &&
    !state.discardPendingFlip
  ) {
    actions.push(
      <WoodButton
        key="take"
        testID="take-card-button"
        tx="playgroundScreen.take"
        compact={compact}
        onPress={() => engine.takeBottom(humanId)}
      />
    );
  }

  if (
    state.phase === Phase.Main &&
    state.discardPendingFlip &&
    state.lastPlayedById === humanId
  ) {
    actions.push(
      <WoodButton
        key="flip"
        testID="flip-discard-button"
        text="Отбой"
        compact={compact}
        onPress={() => engine.flipDiscard(humanId)}
      />
    );
  }

  if (protocols.includes("claim_stumps")) {
    actions.push(
      <WoodButton
        key="stumps"
        testID="show-stumps-button"
        text="Беру пни!"
        compact={compact}
        onPress={() => engine.claimStumps(humanId)}
      />
    );
  }

  if (protocols.includes("exit")) {
    actions.push(
      <WoodButton
        key="exit"
        testID="exit-game-button"
        text="С пидорами не играю!"
        compact={compact}
        onPress={() => engine.exitGame(humanId)}
      />
    );
  }

  if (
    state.phase === Phase.Main &&
    activePlayers.length === 2 &&
    !state.pendingWatchmanHandoff
  ) {
    for (const p of activePlayers) {
      actions.push(
        <WoodButton
          key={`duel-${p.id}`}
          text={`Вахта → ${p.name}`}
          compact
          onPress={() => engine.setWatchman(p.id)}
        />
      );
    }
  }

  const texts = (
    <View style={TEXTS}>
      {message.eyebrow ? (
        <Text
          style={isWide ? EYEBROW : EYEBROW_NARROW}
          text={message.eyebrow}
          numberOfLines={1}
        />
      ) : null}
      <Text
        style={isWide ? HEADLINE : HEADLINE_NARROW}
        text={message.headline}
        numberOfLines={2}
      />
      {message.note ? (
        <Text style={HUD_SUB} text={message.note} numberOfLines={1} />
      ) : null}
    </View>
  );

  return (
    <StonePanel
      kind="boneFrame"
      style={[isWide ? PANEL_WIDE : PANEL_NARROW, { minHeight }]}
      testID="MessageBar"
    >
      <View style={isWide ? ROW : COLUMN}>
        {texts}
        {actions.length > 0 ? <View style={ACTIONS}>{actions}</View> : null}
      </View>
    </StonePanel>
  );
};
