import type { FC } from "react";
import { type ImageStyle, View, type ViewStyle } from "react-native";
import { Image } from "expo-image";
import { type EnginePlayer, type GameState, Phase } from "../../engine";
import { Text } from "@shared-components/text/text";
import { tableAssets } from "@assets/prehistoric-v2/assets";
import { StonePanel } from "./stone-panel";
import { HUD_SUB, HUD_TEXT, suitLabel } from "./table-text";

interface TopBarProps {
  state: GameState;
  watchman: EnginePlayer | undefined;
  isWide: boolean;
  height: number;
}

const ROW: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
};

const CHIP: ViewStyle = { height: 40, minWidth: 96, paddingHorizontal: 18 };

const STRIP: ViewStyle = {
  height: 40,
  paddingHorizontal: 16,
};

const STRIP_ROW: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: 6,
};

const RIGHT: ViewStyle = { flexDirection: "row", alignItems: "center", gap: 6 };

const WATCH_PLATE_WIDE: ViewStyle = {
  height: 52,
  minWidth: 300,
  paddingHorizontal: 40,
};

const WATCH_PLATE_NARROW: ViewStyle = {
  height: 44,
  minWidth: 240,
  paddingHorizontal: 32,
  alignSelf: "center",
};

const WATCH_ROW: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: 6,
};

const ICON: ImageStyle = { width: 26, height: 26 };
const ICON_BIG: ImageStyle = { width: 38, height: 38 };
const CROWN: ImageStyle = { width: 22, height: 22 };

function phaseLine(state: GameState): string {
  switch (state.phase) {
    case Phase.Prepare:
      return `Набор · в колоде ${state.deck.length}`;
    case Phase.Huyovye:
      return state.resumeMainAfterHuyovye ? "Фол · хуёвые" : "Раздача хуёвых";
    case Phase.Main:
      return state.trump ? `Козырь ${suitLabel(state.trump)}` : "Бескозырка";
    case Phase.Ended:
      return "Конец кона";
    default:
      return "Раздача";
  }
}

export const TopBar: FC<TopBarProps> = ({
  state,
  watchman,
  isWide,
  height,
}) => {
  const tableChip = (
    <StonePanel kind="headerSmall" style={CHIP}>
      <Text style={HUD_TEXT} text={`Стол: ${state.players.length}`} />
    </StonePanel>
  );

  const watchPlate = (
    <StonePanel
      kind="headerWide"
      style={isWide ? WATCH_PLATE_WIDE : WATCH_PLATE_NARROW}
      testID="WatchPlate"
    >
      <View style={WATCH_ROW}>
        <Image source={tableAssets.icons.crown} style={CROWN} />
        <Text
          style={HUD_TEXT}
          text={`Вахта: ${watchman?.name ?? "—"}`}
          numberOfLines={1}
        />
      </View>
      <Text style={HUD_SUB} text={phaseLine(state)} numberOfLines={1} />
    </StonePanel>
  );

  const icons = (
    <View style={RIGHT}>
      <StonePanel kind="headerSmall" style={STRIP}>
        <View style={STRIP_ROW}>
          <Image source={tableAssets.icons.players} style={ICON} />
          <Text style={HUD_TEXT} text={String(state.players.length)} />
          <Image source={tableAssets.icons.wifi} style={ICON} />
        </View>
      </StonePanel>
      <Image source={tableAssets.icons.settings} style={ICON_BIG} />
    </View>
  );

  if (isWide) {
    return (
      <View style={[ROW, { height }]} testID="TopBar">
        {tableChip}
        {watchPlate}
        {icons}
      </View>
    );
  }

  return (
    <View style={{ height, justifyContent: "space-between" }} testID="TopBar">
      <View style={ROW}>
        {tableChip}
        {icons}
      </View>
      {watchPlate}
    </View>
  );
};
