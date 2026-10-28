# AGENTS.md — "Pidor" Card Game Engine Specification

This document is the single source of truth for implementing the game engine and UI.
It is written so that an AI agent (or a human) can implement the rules without
guessing. Where the original folk rules were ambiguous, a decision is recorded in
the "Resolved Interpretations" section — never silently invent behavior.

Normative TypeScript shapes live in
`src/features/game/engine/types.ts` and
`src/features/game/components/card/card.props.ts`. This file must stay aligned
with those names.

---

## 1. Glossary (slang → code terms)

| Slang (original)  | Code term              | Meaning                                             |
|-------------------|------------------------|-----------------------------------------------------|
| Пеньки / дубки    | `stumps`               | 2 face-down cards of each player; may not be viewed until the player's hand is empty |
| Хуёвая            | `huyovye` / `Foul`     | Violation mark on `EnginePlayer.huyovye`. Converted into bad-card gifts in `Phase.Huyovye` |
| Пидор             | `watchman` / loser     | The player left last; deals next round, "takes the watch" |
| Вахта / вахтёр    | `watchman`             | Current standing loser from the previous round       |
| Набор             | `Phase.Prepare`        | Deck-drawing phase before the main game (`"prepare"`) |
| Козырь            | `trump`                | Suit of the last deck card (`CardSuits \| null`)     |
| Отбой             | `beaten` / flip        | Completed pile moved into `beaten`; out of play      |
| Раздача хуёвых    | `Phase.Huyovye`        | Gift phase (`"huyovye"`); batch after Prepare, interrupt from Main |

---

## 2. Data model (normative)

```ts
// card.props.ts
enum CardRanks {
  six = 6, seven = 7, eight = 8, nine = 9, ten = 10,
  jack = 11, queen = 12, king = 13, ace = 14,
}
enum CardSuits {
  Diamonds = "diamonds",
  Hearts = "hearts",
  Clubs = "clubs",
  Spades = "spades", // special suit in MAIN
}
// Lowest rank in the 36-card deck is CardRanks.six (MIN_RANK conceptually).

// types.ts
interface EngineCard { rank: CardRanks; suit: CardSuits; }

interface EnginePlayer {
  id: number;
  name: string;
  isCPU: boolean;
  hand: EngineCard[];     // face-up; hand[0] is the TOP card
  stumps: EngineCard[];   // face-down
  stumpsRevealed: boolean;
  active: boolean;        // false after exiting
  huyovye: number;        // accumulated fouls awaiting gift conversion
}

enum Phase {
  Deal = "deal",
  Prepare = "prepare",
  Huyovye = "huyovye",
  Main = "main",
  Ended = "ended",
}

interface HuyovyeObligation { giverId: number; receiverId: number; }

interface GameState {
  phase: Phase;
  players: EnginePlayer[];
  deck: EngineCard[];
  /** 36 (default) or 52; defines the deck's lowest rank (six / two). */
  deckSize: DeckSize;
  dealerId: number;
  watchmanId: number | null;
  previousWatchmanId: number | null;
  activePlayerId: number;
  trump: CardSuits | null;          // null = no-trump (бескозырка)
  prepareHeld: EngineCard | null;   // drawn prepare card not yet placed/kept
  current: EngineCard[];            // main pile; index 0 is the BOTTOM
  beaten: EngineCard[];             // discarded piles (flat)
  discardPendingFlip: boolean;
  lastPlayedById: number | null;
  tookLastDeckCardId: number | null;
  roundJustEnded: boolean;
  huyovyeQueue: HuyovyeObligation[];
  /** True when Main paused into Huyovye for foul gifts; resume Main after drain. */
  resumeMainAfterHuyovye: boolean;
  pendingWatchmanHandoff: boolean;
  watchmanAskCounts: Record<number, number>;
  lastFoul: { playerId: number; foul: Foul } | null;
  message: string | null;
  initialPlayerCount: number;
}
```

**Top card invariant:** a player's "top card" is `hand[0]`. Every card added to a
player's hand in prepare placement goes to the front (`unshift`), so the top is
always the most recently received card.

---

## 3. Phase state machine

```
Deal ──► Prepare ──(deck empty)──► Huyovye ──(queue empty)──► Main
Main ──(foul)──► Huyovye ──(queue empty, resumeMainAfterHuyovye)──► Main
Main ──(≤2 active, then 1)──► Ended
```

- `Prepare → Huyovye`: deck becomes empty (including last-card handling, §5).
  Batch distributes all accumulated `huyovye`. `resumeMainAfterHuyovye = false`.
- `Huyovye → Main` (after Prepare): queue empty → fresh Main (`beginMainAfterHuyovye`).
- `Main → Huyovye`: each Main foul immediately opens Huyovye for that foul's
  gifts; `resumeMainAfterHuyovye = true`; pile / `activePlayerId` preserved.
- `Huyovye → Main` (interrupt): queue empty → `resumeMainAfterFoulHuyovye`.

---

## 4. Setup and dealing

1. 2–6 players (UI currently 3–6 via `buildSeats`).
2. The dealer is the previous round's watchman. First round: random or agreed.
3. Dealer deals, **starting with the seat clockwise after himself**:
   2 cards face-down (stumps) + 1 card face-up (hand) to each player. Remaining
   deck is placed in the center.
4. First active player in Prepare is the seat clockwise after the dealer.

---

## 5. Prepare phase (`Phase.Prepare`)

### 5.1 Turn loop

A prepare turn is a repeating cycle "draw → dump":

1. **Cascade obligation (before every draw).** The acting player must repeatedly
   dump cards from his own hand onto legal targets while any legal target exists,
   before drawing a new card (§5.2, §5.3). This is mandatory, not optional.
2. Draw the top deck card into `prepareHeld`.
3. If the deck was already empty at draw time → go to Huyovye (batch).
4. **Last deck card special case** (deck had exactly 1 card):
   - The card is NOT placed on anyone and NOT given away. The drawer takes it.
   - The card's suit becomes the trump. If the card is spades → **no-trump game**
     (resolved interpretation R2).
   - The drawer keeps it (front of hand), phase → Huyovye (batch).
5. Otherwise: find the mandatory placement target (§5.2). If one exists, the card
   MUST be placed on it. Humans place via drag-and-drop only (CPU auto-places).
   If the human keeps instead (`keepPrepare`), award foul P4 and still keep the
   card / pass the turn. If none exists, `keepPrepare` puts it in the drawer's
   hand (front) and the turn passes clockwise.

Fouls during Prepare only increment `huyovye` — they do **not** interrupt into
Huyovye mid-prepare.

### 5.2 Legal placement target (mandatory dump)

A card may be placed ONLY on a top card **exactly one rank lower** (adjacency
chain, resolved interpretation R1). One special exception exists (§5.4).
In the rules below, **six** means the deck's **lowest rank** (`six` for a
36-card deck, `two` for a 52-card deck — config `deckSize`).

```
canPlaceOnTop(top, card):
  if !top: false
  if card.rank == lowestRank: return top.rank == CardRanks.ace
  return top.rank == card.rank - 1
```

Candidates: all **active** players (including the acting player) whose top card
satisfies `canPlaceOnTop`. Ordering: the **first clockwise seat from the acting
player**; the acting player himself is counted **last**
(`firstLegalPrepareTarget` / `peekFirstPrepareTarget`). Placing on anyone else
(or failing to place at all) is a foul (P4, P6).

### 5.3 Cascade from hand (before each new draw)

```
cascade(player):
  loop:
    if hand.length <= 1: break
    top = hand[0]
    target = firstLegalPrepareTarget(players, player.id, top)
    if !target: break
    place top onto target
    restart loop
```

The last card of a hand is never given away (foul P8 if attempted).

### 5.4 Six onto an ace (MANDATORY, with penalty)

`CardRanks.six` placed on an ace is a **mandatory** placement:

- `canPlaceOnTop` accepts six → ace.
- Ace owner receives foul P7 (`Foul.ReceivedLowestOnHighest`) when six is placed
  on **another** player's ace — increments their `huyovye` (batch after Prepare).
- Placing six on **own** ace does not award P7 (engine rule).
- After placement the acting player draws again.
- Last hand card is never given (P8); placing onto another player's last card is OK.

**Resolved interpretation R3:** `sixOnAceRestriction: "off"` (pip-six block not
default).

**UI (Q7 closed):** only the first-clockwise legal `DropZone` is enabled for
drag-and-drop; "ЗАБРАТЬ" remains available — keeping while a dump is mandatory
awards P4. Humans never auto-place; CPU does.

---

## 6. Huyovye phase (`Phase.Huyovye`)

### 6.1 After Prepare (batch)

When the deck is exhausted:

1. Every player with `huyovye > 0` is a **receiver**. For each foul count, every
   other active player owes that receiver one card
   (`buildHuyovyeQueue` → `huyovyeQueue`).
2. Givers choose freely which card to give (UI may suggest via
   `suggestHuyovyeCard` / `pickWorstHuyovyeCard`; engine does not restrict
   suit/rank — R5).
3. CPU givers auto-resolve (`runCpuHuyovye`); humans choose manually
   (`giveHuyovyeCard`).
4. A giver may not give his last hand card (foul P8). If a giver cannot fulfill
   (only 1 card left), the obligation is **dropped**, not fouled (R4) — same for
   humans and CPUs.
5. Sneaky trick (R6, `sneakyLead`, default OFF): with OFF, Main lead is clockwise
   after `tookLastDeckCardId`.
6. Queue empty → reset all `huyovye` to 0 → fresh Main (`resumeMainAfterHuyovye` was false).

### 6.2 During Main (immediate interrupt)

1. Each foul in Main increments the offender's `huyovye` and enqueues gifts, then
   pauses into Huyovye (`resumeMainAfterHuyovye = true` via `pauseMainForHuyovye`).
2. Preserve `current`, `activePlayerId`, `discardPendingFlip`, etc.
3. CPU auto / human manual as above.
4. Queue empty → `resumeMainAfterFoulHuyovye` (counters cleared, table unchanged).
5. Fouls already inside mid-main Huyovye append gifts to the queue tail.

---

## 7. Main phase (`Phase.Main`)

The leader places a card. The next clockwise player must **beat** the current
top of `current` or take it:

### 7.1 Beat rules

```
canBeat(target, card, trump):
  if isUnbeatable(target): false
  if target.suit == Spades: return card.suit == Spades and card.rank > target.rank
  if target is trump:       return card is trump and card.rank > target.rank
  return (card.suit == target.suit and card.rank > target.rank)
         or (card is trump)

isUnbeatable(card):
  card.rank == ace and (card.suit == Spades or card.suit == trump)
```

- Spades beaten only by higher spades (trump does not beat spades).
- Trump beaten only by higher trump.
- Other suits: same suit higher, or trump.
- Spade ace and trump ace are unbeatable.
- Six does not beat ace in Main.
- Naming trump aloud while active is foul P10.

### 7.2 Taking the pile

**Resolved interpretation R7:** `bottom_only`. If the player cannot beat the
**top** of `current`, they take **only the bottom** card (`takeBottom` /
`shift`). The rest of the pile stays on the table. Whole-pile take is rejected.

### 7.3 Discard (отбой)

When `current.length ===` active player count, the player who placed the last
card flips into `beaten` (`flipDiscard`). Premature / foreign flips are fouls
(P15, P11). Size recounts on exit (R8).

### 7.4 Fouls and turn flow

Fouls P12/P13/P15 move the turn clockwise after the offender, then open Huyovye
(§6.2). Unify Prepare foul→turn-move with Main — still open (Q3).

---

## 8. Exit protocol

Phrases are exact strings; paraphrases do not count.

1. Hand empty **and** discard cycle ended (R9) → announce **"Беру пни!"**
   (variants: пеньки / дубки) before revealing stumps. Else foul P16.
2. Hand empty again after stumps **and** another cycle → **"С пидорами не играю!"**
   → `active: false`.
3. Exit requires hand empty, stumps empty, and the round condition.
4. Exited players may name trump / inspect (engine should not foul inactive seats).
5. Discard size recounts (R8).

---

## 9. Duel and the watch

1. Exactly 2 active → duel; discard size 2.
2. One remains → watchman; previous announces handoff; loser accepts (UI).
3. New watchman deals next round.
4. **"Кто на вахте?"** / `askWhoIsWatchman` / `answerWatchman`; P17 deadline still
   open (Q5).
5. Watchman exempt from askers who did not sit that acceptance round.

---

## 10. Full foul table (`Foul` enum)

| #  | `Foul` id                      | Violation                                                                 |
|----|--------------------------------|---------------------------------------------------------------------------|
| P1 | LookedOwnStumpsEarly           | Viewed own stumps while hand not empty (before "Беру пни")                 |
| P2 | LookedNeighborStumps           | Viewed another player's stumps                                             |
| P3 | DrewOutOfTurn                  | Drew from the deck out of turn                                             |
| P4 | FailedToDumpLegal              | Did not place on a mandatory adjacency target / kept while legal existed   |
| P5 | DrewTwoAndSawSecond            | Drew 2 cards from the deck and saw the second                              |
| P6 | DumpedNotFirstClockwise        | Placed on a candidate other than the first clockwise one                   |
| P7 | ReceivedLowestOnHighest        | Your top ace received a six from another player (six-on-ace)               |
| P8 | GaveAwayLastPrepare            | Gave away / placed the last card of your hand                              |
| P9 | PlacedLastDeckCard             | Placed/gave the last deck card to anyone                                   |
| P10| NamedTrumpAloud                | Said the trump suit aloud while still an active player                     |
| P11| FlippedOthersDiscard           | Flipped a discard you did not complete with your own last placement        |
| P12| PlayedOutOfTurn                | Acted (played/led) out of turn in Main                                     |
| P13| IllegalBeat                    | Beat with a wrong card                                                     |
| P14| TookFromUnflippedDiscard       | Took from a pile that was not yet flipped                                  |
| P15| ExtraCardPastN                 | Placed a card beyond the active-player count in a pending pile             |
| P16| LookedStumpsWithoutAnnounce    | Viewed stumps without having said "Беру пни!"                              |
| P17| WatchmanAnswerFail             | Watchman failed to answer "Кто на вахте?" as many times as asked           |

Main fouls convert to immediate Huyovye gifts (§6.2). Prepare fouls batch after
the deck is empty (§6.1).

---

## 11. Resolved interpretations (config)

| Config key             | Default        | Alternatives considered and rejected for default |
|------------------------|----------------|--------------------------------------------------|
| `sixOnAce`             | `mandatory` + P7 to ace owner | optional placement (rejected) |
| `deckSize`             | `36` → lowest rank = six | `52` → lowest rank = two; the lowest card inherits the six's role: wraps onto an ace in Prepare (P7), never beats an ace in Main |
| `sixOnAceRestriction`  | `"off"`        | `"pip_six_blocks_all"` |
| `trumpFromLastCard`    | `"last_card_suit"` | `"previous_card_suit"`, `"none"` |
| `takeAction`           | `"bottom_only"` | `"whole_pile"` (rejected) |
| `sneakyLead`           | `"off"`        | `"after_last_giver"` |
| `discardSizeOnExit`    | `"recount"`    | `"frozen_after_first_exit"` |
| `beatSameSuit`         | `"strictly_higher"` | `"equal_beats"` |
| `roundDefinition`      | `"discard_cycle"` | `"full_turn_circle"` |
| `mainFoulHuyovye`      | `"immediate_interrupt"` | accumulate-until-next-batch (rejected) |

### Explicitly rejected readings

- Equal-rank beating ("валет на валета") — never allowed.
- "Последняя карта ни на что не влияет" — rejected; last deck card defines trump
  (or no-trump if spades).
- Six beats ace of the same suit in Main — rejected.
- Interrupt Huyovye mid-Prepare on each foul — rejected; Prepare only batches.

---

## 12. Engine invariants (non-negotiable)

1. **Server-arbiter:** engine validates every action. UI uses
   `peekFirstPrepareTarget` / `legalPrepareTargets` — does not duplicate rules.
2. **Hidden information:** stumps and deck are not shown until rules allow.
3. **Immutable snapshots:** `emit()` clones arrays; listeners see frozen state.
4. **Mandatory dump:** `keepPrepare` fouls P4 when a legal target exists but
   still completes the keep; UI enables only the first legal DropZone for DnD;
   humans never auto-place (CPU may).
5. **No silent truncation:** cascade ends by emptiness / no targets; guard logs.
6. **Determinism:** RNG seed fixed in tests; actions log legal / foul.

---

## 13. Open questions (must be closed before release)

1. ~~Six on ace: obligation or option?~~ **CLOSED: obligation + P7
   (`ReceivedLowestOnHighest`) to other-player ace owner.**
2. ~~Do MAIN-phase fouls convert into gifts?~~ **CLOSED: immediate Huyovye
   interrupt, then resume Main (`resumeMainAfterHuyovye`).**
3. Unify foul → turn-move semantics between Prepare and Main.
4. ~~`takeBottom` / `takeAction`.~~ **CLOSED: `bottom_only` (take only the
   bottom card when unable to beat the top).**
5. Enforce P17 with a real deadline (timeout) mechanism.
6. Human deadlock in Huyovye when a giver has only one card — obligation dropped
   identically for humans and CPUs (CPU path done; keep human path identical).
7. ~~UI affordance for six-on-ace / mandatory dump.~~ **CLOSED: gate DropZones for
   DnD; "ЗАБРАТЬ" fouls P4 if dump was mandatory.**
