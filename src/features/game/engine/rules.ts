import { CardRanks, CardSuits } from "../components/card/card.props";
import { EngineCard, EnginePlayer } from "./types";
import { firstClockwiseWhere } from "./seats";

/** Prepare: six→ace, else rank − 1 on target top. */
export function canPlaceOnTop(
  top: EngineCard | undefined,
  card: EngineCard,
): boolean {
  if (!top) {
    return false;
  }
  if (card.rank === CardRanks.six) {
    return top.rank === CardRanks.ace;
  }
  return top.rank === card.rank - 1;
}

export function topOf(player: EnginePlayer): EngineCard | undefined {
  return player.hand[0];
}

export function legalPrepareTargets(
  players: EnginePlayer[],
  _drawerId: number,
  card: EngineCard,
): EnginePlayer[] {
  return players.filter(
    (p) => p.active && canPlaceOnTop(topOf(p), card),
  );
}

/** First clockwise legal place target from drawer (drawer last). */
export function firstLegalPrepareTarget(
  players: EnginePlayer[],
  drawerId: number,
  card: EngineCard,
): EnginePlayer | null {
  return firstClockwiseWhere(players, drawerId, (p) =>
    canPlaceOnTop(topOf(p), card),
  );
}

export function isUnbeatableMain(
  card: EngineCard,
  trump: CardSuits | null,
): boolean {
  if (card.rank !== CardRanks.ace) {
    return false;
  }
  if (card.suit === CardSuits.Spades) {
    return true;
  }
  return trump !== null && card.suit === trump;
}

/**
 * Main beat rules:
 * - Spades beaten only by higher spades (not trump).
 * - Trump beaten only by higher trump.
 * - Else: same suit higher OR trump.
 * - Spade ace / trump ace unbeatable.
 * - Six does not beat ace.
 */
export function canBeat(
  target: EngineCard,
  card: EngineCard,
  trump: CardSuits | null,
): boolean {
  if (isUnbeatableMain(target, trump)) {
    return false;
  }
  if (card.rank === CardRanks.six && target.rank === CardRanks.ace) {
    return false;
  }

  const targetIsSpade = target.suit === CardSuits.Spades;
  const targetIsTrump = trump !== null && target.suit === trump;
  const cardIsTrump = trump !== null && card.suit === trump;

  if (targetIsSpade) {
    return card.suit === CardSuits.Spades && card.rank > target.rank;
  }

  if (targetIsTrump) {
    return cardIsTrump && card.rank > target.rank;
  }

  const sameSuitHigher =
    card.suit === target.suit && card.rank > target.rank;
  return sameSuitHigher || cardIsTrump;
}

export function trumpFromLastDeckCard(
  card: EngineCard,
): CardSuits | null {
  return card.suit === CardSuits.Spades ? null : card.suit;
}
