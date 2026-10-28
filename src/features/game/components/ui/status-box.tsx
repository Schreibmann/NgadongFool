import { FC } from "react";
import { View } from "react-native";
import { EnginePlayer, GameState, Phase } from "../../engine";
import { Text } from "@shared-components/text/text";
import { TEXT, SMALL } from "./common-styles";

const STATUS_BOX = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  paddingHorizontal: 8,
  maxWidth: 220,
  alignSelf: "center",
} as const;

const trumpLabelOf = (trump: GameState["trump"]): string =>
  trump === null ? "нет" : String(trump);

interface StatusBoxProps {
  state: GameState;
  watchman: EnginePlayer | undefined;
  active: EnginePlayer | undefined;
}

export const StatusBox: FC<StatusBoxProps> = ({ state, watchman, active }) => {
  const dealer = state.players.find((p) => p.id === state.dealerId);
  return (
    <View style={STATUS_BOX}>
      <Text
        style={SMALL}
        text={`Стол: ${state.players.length} · Вахта: ${watchman?.name ?? "—"} · Дилер: ${
          dealer?.name ?? "—"
        }`}
      />
      <Text
        style={TEXT}
        text={
          state.phase === Phase.Prepare
            ? "Набор"
            : state.phase === Phase.Huyovye
              ? "Хуёвые"
              : state.phase === Phase.Main
                ? "Игра"
                : state.phase === Phase.Ended
                  ? "Конец"
                  : "Стол"
        }
      />
      <Text style={TEXT} text={`Ходит: ${active?.name || ""}`} />
      {state.phase === Phase.Main || state.phase === Phase.Huyovye ? (
        <Text style={TEXT} text={`Козырь: ${trumpLabelOf(state.trump)}`} />
      ) : null}
      {state.message ? <Text style={SMALL} text={state.message} /> : null}
    </View>
  );
};
