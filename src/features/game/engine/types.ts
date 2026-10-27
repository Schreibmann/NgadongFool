import { CardRanks, CardSuits } from "../components/card/card.props";

export type PlayerId = number;

export enum Phase {
  Deal = "deal",
  Prepare = "prepare",
  Huyovye = "huyovye",
  Main = "main",
  Ended = "ended",
}

/** Canonical foul taxonomy (хуёвые). */
export enum Foul {
  LookedOwnStumpsEarly = "looked_own_stumps_early",
  LookedNeighborStumps = "looked_neighbor_stumps",
  DrewOutOfTurn = "drew_out_of_turn",
  DrewTwoAndSawSecond = "drew_two_and_saw_second",
  FailedToDumpLegal = "failed_to_dump_legal",
  DumpedNotFirstClockwise = "dumped_not_first_clockwise",
  GaveAwayLastPrepare = "gave_away_last_prepare",
  PlacedLastDeckCard = "placed_last_deck_card",
  NamedTrumpAloud = "named_trump_aloud",
  FlippedOthersDiscard = "flipped_others_discard",
  PlayedOutOfTurn = "played_out_of_turn",
  IllegalBeat = "illegal_beat",
  TookFromUnflippedDiscard = "took_from_unflipped_discard",
  ExtraCardPastN = "extra_card_past_n",
  LookedStumpsWithoutAnnounce = "looked_stumps_without_announce",
  WatchmanAnswerFail = "watchman_answer_fail",
}

export interface EngineCard {
  rank: CardRanks;
  suit: CardSuits;
}

export interface EnginePlayer {
  id: PlayerId;
  name: string;
  isCPU: boolean;
  /** Face-up stack; index 0 is the top card. */
  hand: EngineCard[];
  stumps: EngineCard[];
  huyovye: number;
  active: boolean;
  /** True after announcing «Беру пни» and revealing. */
  stumpsRevealed: boolean;
}

export interface SeatConfig {
  id: PlayerId;
  name: string;
  isCPU: boolean;
}

/** One bad-card gift owed during huyovye (one huyovaya → one gift from each other seat). */
export interface HuyovyeObligation {
  giverId: PlayerId;
  receiverId: PlayerId;
}

export type ProtocolKind = "claim_stumps" | "exit" | "watchman_handoff";

export interface GameState {
  phase: Phase;
  deck: EngineCard[];
  players: EnginePlayer[];
  dealerId: PlayerId;
  watchmanId: PlayerId | null;
  /** Previous watchman before the latest handoff (for «вахту сдал»). */
  previousWatchmanId: PlayerId | null;
  activePlayerId: PlayerId;
  trump: CardSuits | null;
  /** Main-game pile (bottom at index 0). */
  current: EngineCard[];
  beaten: EngineCard[];
  /** True when pile hit active-count and awaits flip by last player. */
  discardPendingFlip: boolean;
  lastPlayedById: PlayerId | null;
  /** Player who took the last deck card (sets prepare→huyovye lead). */
  tookLastDeckCardId: PlayerId | null;
  /** Drawn prepare card waiting to be placed or kept; null if need to draw/cascade. */
  prepareHeld: EngineCard | null;
  /** After a discard cycle completes (flipped). */
  roundJustEnded: boolean;
  /** Pending manual huyovye gifts (giver → receiver). */
  huyovyeQueue: HuyovyeObligation[];
  /** True while UI should confirm watchman handoff. */
  pendingWatchmanHandoff: boolean;
  /** Watchman asks remaining for this deal. */
  watchmanAskCounts: Record<PlayerId, number>;
  lastFoul: { playerId: PlayerId; foul: Foul } | null;
  message: string | null;
  initialPlayerCount: number;
}

export type Listener = () => void;
