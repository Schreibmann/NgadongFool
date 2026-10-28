import { memo } from "react";
import { Pressable, View, type ViewStyle } from "react-native";
import { Image } from "expo-image";
import { Card } from "../card/card";
import type { Card as CardType } from "../card/card.props";
import { DropZone } from "../drag-drop";
import { type EnginePlayer, Phase } from "../../engine";
import { Text } from "@shared-components/text/text";
import { PLAYER, PLAYER_IMAGE, SMALL } from "./common-styles";
import { toUiCard } from "./to-ui-card";

const PREPARE_DROP_HIT: ViewStyle = {
  minWidth: 72,
  minHeight: 120,
  alignItems: "center",
};

export interface OpponentSlotProps {
  player: EnginePlayer;
  avatar?: number;
  phase: Phase;
  prepareDropEnabled: boolean;
  outstanding: number;
  canReceiveHuyovye: boolean;
  onDrop: (card: CardType) => void;
  onHuyovyeTap: () => void;
}

function OpponentSlotComponent({
  player,
  avatar,
  phase,
  prepareDropEnabled,
  outstanding,
  canReceiveHuyovye,
  onDrop,
  onHuyovyeTap,
}: OpponentSlotProps) {
  const top = player.hand[0];
  const stump = player.stumps[0];

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
        <Card
          {...toUiCard(top)}
          opened={phase === Phase.Prepare || phase === Phase.Huyovye}
        />
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
    <View style={PLAYER} testID={`prepare-target-${player.id}`}>
      <DropZone
        disabled={!prepareDropEnabled}
        onDrop={onDrop}
        style={PREPARE_DROP_HIT}
      >
        {body}
      </DropZone>
    </View>
  );
}

export const OpponentSlot = memo(OpponentSlotComponent);
