import {
  CardRanks,
  CardSuits,
  type EngineCard,
  Foul,
  type GameState,
  Phase,
} from "../../engine";
import { suitLabel } from "./table-text";

export interface TableMessage {
  eyebrow: string | null;
  headline: string;
  note: string | null;
}

export interface TableMessageContext {
  humanId: number;
  isMyTurn: boolean;
  /** First clockwise legal prepare target for the human's dump card. */
  legalTarget: { id: number; name: string } | null;
  humanHuyovyeDue: number;
  protocols: ReadonlyArray<"claim_stumps" | "exit">;
}

const FOUL_LABELS: Record<Foul, string> = {
  [Foul.LookedOwnStumpsEarly]: "подсмотрел свои пни",
  [Foul.LookedNeighborStumps]: "подсмотрел чужие пни",
  [Foul.DrewOutOfTurn]: "тянул не в свой ход",
  [Foul.DrewTwoAndSawSecond]: "вытянул две карты",
  [Foul.FailedToDumpLegal]: "не скинул, хотя было куда",
  [Foul.DumpedNotFirstClockwise]: "скинул не первому по часовой",
  [Foul.GaveAwayLastPrepare]: "отдал последнюю карту",
  [Foul.PlacedLastDeckCard]: "положил последнюю карту колоды",
  [Foul.ReceivedLowestOnHighest]: "получил шестёрку на туза",
  [Foul.NamedTrumpAloud]: "назвал козырь вслух",
  [Foul.FlippedOthersDiscard]: "перевернул чужой отбой",
  [Foul.PlayedOutOfTurn]: "сходил не в свой ход",
  [Foul.IllegalBeat]: "побил не той картой",
  [Foul.TookFromUnflippedDiscard]: "взял из неперевёрнутого отбоя",
  [Foul.ExtraCardPastN]: "положил лишнюю карту",
  [Foul.LookedStumpsWithoutAnnounce]: "открыл пни без «Беру пни!»",
  [Foul.WatchmanAnswerFail]: "вахтёр не ответил",
};

const RANK_LABELS: Partial<Record<CardRanks, string>> = {
  [CardRanks.jack]: "вальта",
  [CardRanks.queen]: "даму",
  [CardRanks.king]: "короля",
  [CardRanks.ace]: "туза",
};

const SUIT_SYMBOLS: Record<CardSuits, string> = {
  [CardSuits.Hearts]: "♥",
  [CardSuits.Diamonds]: "♦",
  [CardSuits.Clubs]: "♣",
  [CardSuits.Spades]: "♠",
};

export const cardName = (card: EngineCard): string =>
  `${RANK_LABELS[card.rank] ?? String(card.rank)} ${SUIT_SYMBOLS[card.suit]}`;

const nameOf = (state: GameState, id: number | null): string =>
  state.players.find((p) => p.id === id)?.name ?? "—";

/** What the bone-framed bar says for the human seat in the current state. */
export function describeTable(
  state: GameState,
  ctx: TableMessageContext
): TableMessage {
  const active = nameOf(state, state.activePlayerId);
  const activeCount = state.players.filter((p) => p.active).length;

  if (state.pendingWatchmanHandoff) {
    return {
      eyebrow: `На вахте: ${nameOf(state, state.watchmanId)}`,
      headline: state.message ?? "Вахту сдал",
      note: null,
    };
  }

  if (state.phase === Phase.Ended) {
    return {
      eyebrow: `На вахте: ${nameOf(state, state.watchmanId)}`,
      headline: "Кон окончен",
      note: null,
    };
  }

  if (ctx.protocols.includes("exit")) {
    return {
      eyebrow: "Пни сыграны, стол чист",
      headline: "Скажи «С пидорами не играю!»",
      note: null,
    };
  }

  if (ctx.protocols.includes("claim_stumps")) {
    return {
      eyebrow: "Рука пуста, стол чист",
      headline: "Скажи «Беру пни!»",
      note: null,
    };
  }

  if (state.phase === Phase.Huyovye) {
    const foul =
      state.resumeMainAfterHuyovye && state.lastFoul
        ? `${nameOf(state, state.lastFoul.playerId)}: ${FOUL_LABELS[state.lastFoul.foul]}`
        : null;
    return {
      eyebrow: `Обязательств осталось: ${state.huyovyeQueue.length}`,
      headline:
        ctx.humanHuyovyeDue > 0
          ? "Выбери карту → укажи получателя"
          : "Ждём раздачу хуёвых…",
      note: foul,
    };
  }

  if (state.phase === Phase.Prepare) {
    const eyebrow = `Набор · в колоде ${state.deck.length}`;
    if (!ctx.isMyTurn) {
      return { eyebrow, headline: `Ходит ${active}`, note: null };
    }
    const target = ctx.legalTarget;
    if (state.prepareHeld) {
      return {
        eyebrow,
        headline: target
          ? target.id === ctx.humanId
            ? "Клади себе на руку"
            : `Положи на ${target.name}`
          : "Некуда класть — забирай",
        note: cardName(state.prepareHeld),
      };
    }
    return {
      eyebrow,
      headline: target ? `Сбрось верхнюю на ${target.name}` : "Тяни карту",
      note: null,
    };
  }

  if (state.phase === Phase.Main) {
    const trump = state.trump
      ? `Козырь ${suitLabel(state.trump)}`
      : "Бескозырка";
    const eyebrow = `${trump} · на столе ${state.current.length} из ${activeCount}`;
    const top = state.current[state.current.length - 1];
    const lastBy = state.players.find((p) => p.id === state.lastPlayedById);
    const lastMove =
      top && lastBy ? `${lastBy.name} положил ${cardName(top)}` : null;
    if (!ctx.isMyTurn) {
      return {
        eyebrow,
        headline: state.discardPendingFlip
          ? `${active} переворачивает отбой`
          : `Ходит ${active}`,
        note: lastMove,
      };
    }
    if (state.discardPendingFlip) {
      return { eyebrow, headline: "Переверни отбой", note: null };
    }
    return {
      eyebrow,
      headline: top
        ? `Побей ${cardName(top)} или возьми`
        : "Заходи — перетащи карту на стол",
      note: null,
    };
  }

  return { eyebrow: null, headline: "Раздача…", note: null };
}
