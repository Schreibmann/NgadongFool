import { CardRanks, CardSuits } from "./cards";
import type { EngineCard, EnginePlayer } from "./types";
import { firstClockwiseWhere } from "./seats";

/**
 * Prepare: lowest→ace (wrap), else rank − 1 on target top.
 * `lowestRank` is the deck's pip floor: six for a 36-card deck, two for 52.
 */
export function canPlaceOnTop(
  top: EngineCard | undefined,
  card: EngineCard,
  lowestRank: CardRanks = CardRanks.six
): boolean {
  if (!top) {
    return false;
  }
  if (card.rank === lowestRank) {
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
  lowestRank: CardRanks = CardRanks.six
): EnginePlayer[] {
  return players.filter(
    (p) => p.active && canPlaceOnTop(topOf(p), card, lowestRank)
  );
}

/** First clockwise legal place target from drawer (drawer last). */
export function firstLegalPrepareTarget(
  players: EnginePlayer[],
  drawerId: number,
  card: EngineCard,
  lowestRank: CardRanks = CardRanks.six
): EnginePlayer | null {
  return firstClockwiseWhere(players, drawerId, (p) =>
    canPlaceOnTop(topOf(p), card, lowestRank)
  );
}

export function isUnbeatableMain(
  card: EngineCard,
  trump: CardSuits | null
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
 * Main beat rules (target = top of pile; card = beater from hand):
 * - Spades beaten only by higher spades (not trump).
 * - Trump beaten only by higher trump (e.g. trump ace beats trump king).
 * - Else: same suit higher OR trump.
 * - Spade ace / trump ace on the table are unbeatable (check TARGET only —
 *   playing an unbeatable ace as the beater is always allowed when otherwise legal).
 * - The deck's lowest rank (six for 36, two for 52) does not beat ace.
 */
export function canBeat(
  target: EngineCard,
  card: EngineCard,
  trump: CardSuits | null,
  lowestRank: CardRanks = CardRanks.six
): boolean {
  // Only the card being beaten can be "unbeatable". Never reject the beater
  // because it itself is a trump/spade ace.
  if (isUnbeatableMain(target, trump)) {
    return false;
  }
  if (card.rank === lowestRank && target.rank === CardRanks.ace) {
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

  const sameSuitHigher = card.suit === target.suit && card.rank > target.rank;
  return sameSuitHigher || cardIsTrump;
}

export function trumpFromLastDeckCard(card: EngineCard): CardSuits | null {
  return card.suit === CardSuits.Spades ? null : card.suit;
}

/**
 * Huyovye («хуёвая»): how eager we are to give this card away.
 * Higher score = worse to hold into main = prefer dump.
 *
 * Prefer dumping non-trump off-suit junk (low rank). Keep trump,
 * spades (only beaten by higher spades), and unbeatable aces.
 * Ties break by suit name then rank for determinism.
 */
export function huyovyeDumpScore(
  card: EngineCard,
  trump: CardSuits | null
): number {
  if (isUnbeatableMain(card, trump)) {
    return -1000;
  }

  const isTrump = trump !== null && card.suit === trump;
  const isSpade = card.suit === CardSuits.Spades;
  // Low rank → higher dump preference.
  let score = (CardRanks.ace + 1 - card.rank) * 10;

  if (isTrump) {
    score -= 100;
  } else if (isSpade) {
    score -= 30;
  } else {
    score += 20;
  }

  return score;
}

/** Pick the worst-to-keep non-last card; null if hand has ≤1 card. */
export function pickWorstHuyovyeCard(
  hand: EngineCard[],
  trump: CardSuits | null
): EngineCard | null {
  if (hand.length <= 1) {
    return null;
  }

  let best: EngineCard = hand[0];
  let bestScore = huyovyeDumpScore(best, trump);

  for (let i = 1; i < hand.length; i++) {
    const card = hand[i];
    const score = huyovyeDumpScore(card, trump);
    if (score > bestScore) {
      best = card;
      bestScore = score;
      continue;
    }
    if (score < bestScore) {
      continue;
    }
    // Deterministic tie-break: suit name ASC, then rank ASC.
    if (
      card.suit < best.suit ||
      (card.suit === best.suit && card.rank < best.rank)
    ) {
      best = card;
      bestScore = score;
    }
  }

  return best;
}
