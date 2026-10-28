import type { FC } from "react";
import { View, type ViewStyle } from "react-native";
import type { GameState } from "../../engine";
import { Text } from "@shared-components/text/text";
import { color } from "@theme";
import { SMALL, TEXT } from "./common-styles";

const HUYOVYE_BANNER: ViewStyle = {
  backgroundColor: "rgba(90,20,20,0.85)",
  padding: 12,
  marginHorizontal: 8,
  marginBottom: 8,
  alignItems: "center",
  borderWidth: 1,
  borderColor: color.palette.orange,
};

export interface HuyovyeBannerProps {
  state: GameState;
  humanHuyovyeDueCount: number;
}

export const HuyovyeBanner: FC<HuyovyeBannerProps> = ({
  state,
  humanHuyovyeDueCount,
}) => {
  const sublabel = state.resumeMainAfterHuyovye
    ? state.lastFoul
      ? `Фол: ${state.lastFoul.foul}`
      : "Фол в основной игре"
    : "После набора";
  const hint = humanHuyovyeDueCount
    ? state.resumeMainAfterHuyovye
      ? "Фол в основной — отдай хуёвую: карта → должник"
      : "Выбери карту внизу и ткни в получателя"
    : state.resumeMainAfterHuyovye
      ? "Пауза основной: ждём хуёвые…"
      : "Ждём раздачу хуёвых…";
  return (
    <View style={HUYOVYE_BANNER} testID="HuyovyeBanner">
      <Text style={TEXT} text="Хуёвые" />
      <Text style={SMALL} text={sublabel} />
      <Text
        style={SMALL}
        text={`Осталось обязательств: ${state.huyovyeQueue.length}`}
      />
      <Text style={TEXT} text={hint} />
    </View>
  );
};
