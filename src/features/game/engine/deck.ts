import { CardRanks, CardSuits } from "./cards";
import { EngineCard } from "./types";

const RANKS: CardRanks[] = [
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

const SUITS: CardSuits[] = [
  CardSuits.Spades,
  CardSuits.Clubs,
  CardSuits.Diamonds,
  CardSuits.Hearts,
];

export function createDeck36(): EngineCard[] {
  const deck: EngineCard[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank });
    }
  }
  return deck;
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
  rng: () => number = Math.random,
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
