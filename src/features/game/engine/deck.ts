import { CardRanks, CardSuits, type DeckSize } from "./cards";
import type { EngineCard } from "./types";

const RANKS_36: CardRanks[] = [
  CardRanks.six,
  CardRanks.seven,
  CardRanks.eight,
  CardRanks.nine,
  CardRanks.ten,
  CardRanks.jack,
  CardRanks.queen,
  CardRanks.king,
  CardRanks.ace,
];

/** 52-card deck adds the pips below six. */
const RANKS_52: CardRanks[] = [
  CardRanks.two,
  CardRanks.three,
  CardRanks.four,
  CardRanks.five,
  ...RANKS_36,
];

const SUITS: CardSuits[] = [
  CardSuits.Spades,
  CardSuits.Clubs,
  CardSuits.Diamonds,
  CardSuits.Hearts,
];

export function createDeck(size: DeckSize = 36): EngineCard[] {
  const ranks = size === 52 ? RANKS_52 : RANKS_36;
  const deck: EngineCard[] = [];
  for (const suit of SUITS) {
    for (const rank of ranks) {
      deck.push({ suit, rank });
    }
  }
  return deck;
}

/** Canonical 36-card folk deck. Kept for existing callers/tests. */
export function createDeck36(): EngineCard[] {
  return createDeck(36);
}

/** Mulberry32 — deterministic shuffle for tests. */
export function createRng(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleDeck(
  deck: EngineCard[],
  rng: () => number = Math.random
): EngineCard[] {
  const copy = [...deck];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}

export function cardsEqual(a: EngineCard, b: EngineCard): boolean {
  return a.rank === b.rank && a.suit === b.suit;
}

export function cardKey(card: EngineCard): string {
  return `${card.suit}-${card.rank}`;
}
