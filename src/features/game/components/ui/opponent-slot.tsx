import { memo } from "react";
import {
  type ImageStyle,
  Pressable,
  type TextStyle,
  View,
  type ViewStyle,
} from "react-native";
import { Image, type ImageSource } from "expo-image";
import { Card } from "../card/card";
import type { Card as CardType } from "../card/card.props";
import { DropZone } from "../drag-drop";
import { type EnginePlayer, Phase } from "../../engine";
import { Text } from "@shared-components/text/text";
import { StonePanel } from "./stone-panel";
import type { Box } from "./table-layout";
import { HUD_SUB, HUD_TEXT } from "./table-text";
import { toUiCard } from "./to-ui-card";

const GLOW: ViewStyle = {
  shadowColor: "#ffb347",
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.95,
  shadowRadius: 14,
  elevation: 12,
};

const SEAT: ViewStyle = { alignItems: "center" };

const PORTRAIT_WRAP: ViewStyle = { borderRadius: 10 };

const PORTRAIT_ACTIVE: ViewStyle = {
  ...PORTRAIT_WRAP,
  ...GLOW,
  borderWidth: 2,
  borderColor: "#ffb347",
};

const NAMEPLATE: ViewStyle = {
  marginTop: -6,
  paddingHorizontal: 10,
};

const NAME: TextStyle = { ...HUD_TEXT, fontSize: 13 };
const NAME_COMPACT: TextStyle = { ...HUD_TEXT, fontSize: 11 };
const STATUS_TURN: TextStyle = { ...HUD_SUB, color: "#ffb347" };

function statusLabel(
  player: EnginePlayer,
  outstanding: number,
  isTheirTurn: boolean
): string {
  if (!player.active) return "Вышел";
  if (outstanding > 0) return `Ждёт ${outstanding}`;
  if (isTheirTurn) return "Ходит";
  return `Карт ${player.hand.length}`;
}

export interface OpponentSeatProps {
  player: EnginePlayer;
  avatar?: ImageSource;
  width: number;
  portrait: Box;
  nameplateHeight: number;
  compact: boolean;
  isTheirTurn: boolean;
  outstanding: number;
  canReceiveHuyovye: boolean;
  onHuyovyeTap: () => void;
}

/** Portrait + stone nameplate, drawn on the cave mural. */
function OpponentSeatComponent({
  player,
  avatar,
  width,
  portrait,
  nameplateHeight,
  compact,
  isTheirTurn,
  outstanding,
  canReceiveHuyovye,
  onHuyovyeTap,
}: OpponentSeatProps) {
  const portraitStyle: ImageStyle = {
    width: portrait.width,
    height: portrait.height,
  };
  return (
    <Pressable
      disabled={!canReceiveHuyovye}
      onPress={onHuyovyeTap}
      style={[SEAT, { width, opacity: player.active ? 1 : 0.45 }]}
      testID={`seat-${player.id}`}
    >
      <View style={isTheirTurn ? PORTRAIT_ACTIVE : PORTRAIT_WRAP}>
        {avatar != null ? (
          <Image source={avatar} style={portraitStyle} contentFit="contain" />
        ) : (
          <View style={portraitStyle} />
        )}
      </View>
      <StonePanel
        kind="nameplate"
        style={[NAMEPLATE, { height: nameplateHeight, minWidth: width }]}
      >
        <Text
          style={compact ? NAME_COMPACT : NAME}
          text={player.name}
          numberOfLines={1}
        />
        <Text
          style={isTheirTurn ? STATUS_TURN : HUD_SUB}
          text={statusLabel(player, outstanding, isTheirTurn)}
          numberOfLines={1}
        />
      </StonePanel>
    </Pressable>
  );
}

export const OpponentSeat = memo(OpponentSeatComponent);

const COLUMN: ViewStyle = {
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 10,
  borderWidth: 2,
  borderColor: "transparent",
  paddingVertical: 4,
};

const COLUMN_TARGET: ViewStyle = {
  ...COLUMN,
  ...GLOW,
  borderColor: "#ffb347",
  borderStyle: "dashed",
  backgroundColor: "rgba(255,179,71,0.12)",
};

const EMPTY: ViewStyle = {
  borderRadius: 8,
  borderWidth: 2,
  borderStyle: "dashed",
  borderColor: "rgba(245,239,228,0.25)",
};

export interface SeatCardProps {
  player: EnginePlayer;
  phase: Phase;
  width: number;
  card: Box;
  prepareDropEnabled: boolean;
  canReceiveHuyovye: boolean;
  onDrop: (card: CardType) => void;
  onHuyovyeTap: () => void;
}

/** The seat's top card on the stone table, aligned under its portrait. */
function SeatCardComponent({
  player,
  phase,
  width,
  card,
  prepareDropEnabled,
  canReceiveHuyovye,
  onDrop,
  onHuyovyeTap,
}: SeatCardProps) {
  const top = player.hand[0];
  const stump = player.stumps[0];
  const highlighted = prepareDropEnabled || canReceiveHuyovye;
  const columnStyle = [highlighted ? COLUMN_TARGET : COLUMN, { width }];

  const face = top ? (
    <Card
      {...toUiCard(top)}
      opened={phase === Phase.Prepare || phase === Phase.Huyovye}
      width={card.width}
      height={card.height}
    />
  ) : stump ? (
    <Card
      {...toUiCard(stump, true)}
      opened={false}
      width={card.width}
      height={card.height}
    />
  ) : (
    <View style={[EMPTY, { width: card.width, height: card.height }]} />
  );

  if (phase === Phase.Huyovye) {
    return (
      <Pressable
        disabled={!canReceiveHuyovye}
        onPress={onHuyovyeTap}
        style={columnStyle}
        testID={`huyovye-target-${player.id}`}
      >
        {face}
      </Pressable>
    );
  }

  return (
    <View testID={`prepare-target-${player.id}`}>
      <DropZone
        disabled={!prepareDropEnabled}
        onDrop={onDrop}
        style={columnStyle}
      >
        {face}
      </DropZone>
    </View>
  );
}

export const SeatCard = memo(SeatCardComponent);
