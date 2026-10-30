import type { FC } from "react";
import {
  type ImageStyle,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";
import { Image } from "expo-image";
import { Card } from "../card/card";
import type { Card as CardType } from "../card/card.props";
import { Draggable, DropZone } from "../drag-drop";
import { type EngineCard, Phase } from "../../engine";
import { tableAssets } from "@assets/prehistoric-v2/assets";
import type { TableLayout } from "./table-layout";
import { uiCardKey } from "./to-ui-card";

interface PlayerHandProps {
  cards: CardType[];
  phase: Phase;
  isMyTurn: boolean;
  layout: TableLayout;
  pick: EngineCard | null;
  onPick: (card: EngineCard) => void;
  /** Prepare: the human's own top is the first legal target. */
  dropEnabled: boolean;
  onDrop: (card: CardType) => void;
}

/** Selected cards rise by this much; reserved as top padding in the row. */
const LIFT = 10;

const STRIP: ViewStyle = {
  width: "100%",
  justifyContent: "center",
  alignItems: "center",
  overflow: "hidden",
  borderTopWidth: 2,
  borderColor: "rgba(0,0,0,0.45)",
};

const SHADE: ViewStyle = {
  ...StyleSheet.absoluteFill,
  backgroundColor: "rgba(20,13,8,0.62)",
};

const BACKDROP: ImageStyle = {
  ...StyleSheet.absoluteFill,
  width: "100%",
  height: "100%",
};

const BONES_LEFT: ImageStyle = {
  position: "absolute",
  left: -6,
  bottom: -4,
  width: 76,
  height: 50,
};

const BONES_RIGHT: ImageStyle = {
  ...BONES_LEFT,
  left: undefined,
  right: -6,
  transform: [{ scaleX: -1 }],
};

const ZONE: ViewStyle = {
  borderRadius: 12,
  borderWidth: 2,
  borderColor: "transparent",
  padding: 2,
};

const ZONE_TARGET: ViewStyle = {
  ...ZONE,
  borderColor: "#ffb347",
  borderStyle: "dashed",
  backgroundColor: "rgba(255,179,71,0.12)",
};

const SELECTED: ViewStyle = {
  borderRadius: 8,
  borderWidth: 3,
  borderColor: "#ffb347",
  shadowColor: "#ffb347",
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 1,
  shadowRadius: 14,
  elevation: 14,
};

const sameCard = (a: EngineCard | null, b: CardType): boolean =>
  a != null && !b.isStump && a.rank === b.rank && a.suit === b.suit;

export const PlayerHand: FC<PlayerHandProps> = ({
  cards,
  phase,
  isMyTurn,
  layout,
  pick,
  onPick,
  dropEnabled,
  onDrop,
}) => {
  const { handCard, handStride, handOverflow, isWide } = layout;
  const rowWidth =
    cards.length > 0 ? handCard.width + handStride * (cards.length - 1) : 0;
  const rowHeight = handCard.height + LIFT;
  const canDrag = isMyTurn && (phase === Phase.Prepare || phase === Phase.Main);

  const row = (
    <View style={{ width: rowWidth, height: rowHeight }} testID="HandRow">
      {cards.map((card, index) => {
        const selected = phase === Phase.Huyovye && sameCard(pick, card);
        const slot: ViewStyle = {
          position: "absolute",
          left: index * handStride,
          top: selected ? 0 : LIFT,
          zIndex: index,
        };
        const face = (
          <Card
            {...card}
            opened={!card.isStump}
            width={handCard.width}
            height={handCard.height}
          />
        );

        if (phase === Phase.Huyovye && !card.isStump) {
          return (
            <Pressable
              key={uiCardKey(card, index)}
              style={[slot, selected ? SELECTED : null]}
              onPress={() => onPick({ rank: card.rank, suit: card.suit })}
              testID={`hand-card-${index}`}
            >
              {face}
            </Pressable>
          );
        }

        return (
          <View key={uiCardKey(card, index)} style={slot}>
            <Draggable data={card} disabled={!!card.isStump || !canDrag}>
              {face}
            </Draggable>
          </View>
        );
      })}
    </View>
  );

  return (
    <View style={[STRIP, { height: layout.handHeight }]} testID="PlayerHand">
      <Image
        source={tableAssets.backgrounds.earthBlurred}
        style={BACKDROP}
        contentFit="cover"
      />
      <View style={SHADE} />
      {isWide ? (
        <>
          <Image source={tableAssets.decor.bones} style={BONES_LEFT} />
          <Image source={tableAssets.decor.bones} style={BONES_RIGHT} />
        </>
      ) : null}
      <DropZone
        disabled={!dropEnabled}
        onDrop={onDrop}
        style={dropEnabled ? ZONE_TARGET : ZONE}
      >
        {handOverflow ? (
          <ScrollView
            horizontal
            style={{
              maxWidth:
                layout.boardWidth - layout.padding * 2 - layout.handInset * 2,
            }}
            showsHorizontalScrollIndicator
          >
            {row}
          </ScrollView>
        ) : (
          row
        )}
      </DropZone>
    </View>
  );
};
