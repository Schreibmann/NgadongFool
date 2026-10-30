/** Pure sizing for the prehistoric table: everything is derived from the
 * window so the board, message bar and hand fit without page scrolling. */

export const WIDE_BREAKPOINT = 700;

/** Card art is 96×150. */
export const CARD_ASPECT = 150 / 96;
/** Avatar art is ~150×189. */
const PORTRAIT_ASPECT = 189 / 150;

export interface Box {
  width: number;
  height: number;
}

export interface TableLayout {
  isWide: boolean;
  boardWidth: number;
  padding: number;
  headerHeight: number;
  muralHeight: number;
  portrait: Box;
  nameplateHeight: number;
  seatWidth: number;
  seatGap: number;
  tableMinHeight: number;
  tableCard: Box;
  /** Opponent top card shown in its column on the table. */
  seatCard: Box;
  /** Deck / held-card slots during Prepare: at the table edges on wide
   * screens, in a second row under the columns when `stackedSlots`. */
  sideSlotWidth: number;
  stackedSlots: boolean;
  messageMinHeight: number;
  handHeight: number;
  handCard: Box;
  handStride: number;
  /** Hand still overflows at the minimum overlap → horizontal scroll. */
  handOverflow: boolean;
  handInset: number;
}

export interface TableLayoutInput {
  width: number;
  height: number;
  opponents: number;
  handCount: number;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const cardBox = (height: number): Box => ({
  width: Math.round(height / CARD_ASPECT),
  height: Math.round(height),
});

export function computeTableLayout({
  width,
  height,
  opponents,
  handCount,
}: TableLayoutInput): TableLayout {
  const isWide = width > WIDE_BREAKPOINT;
  // Tall desktop windows get a wider board so the mural keeps its panorama.
  const boardWidth = isWide
    ? Math.min(width - 16, Math.max(1080, Math.round(height * 1.45)), 1500)
    : width;
  const padding = isWide ? 16 : 8;
  const headerHeight = isWide ? 56 : 88;
  const nameplateHeight = isWide ? 40 : 34;
  const messageMinHeight = isWide ? 84 : 92;
  const seatGap = isWide ? 18 : 6;
  const handInset = isWide ? 44 : 10;

  // Header, nameplates, message bar and section paddings.
  const chrome = isWide ? 272 : 284;
  const rest = Math.max(0, height - chrome);

  const handCardHeight = isWide
    ? clamp(rest * 0.3, 96, 200)
    : clamp(rest * 0.3, 72, 130);
  const tableCardHeight = isWide
    ? clamp(rest * 0.3, 84, 200)
    : clamp(rest * 0.22, 60, 110);
  const portraitHeightWanted = isWide
    ? clamp(rest * 0.27, 64, 230)
    : clamp(rest * 0.2, 52, 96);

  const tableCard = cardBox(tableCardHeight);
  const sideSlotWidth = Math.round(tableCard.width * 1.25) + (isWide ? 16 : 6);

  const stackedSlots = !isWide;
  const seats = Math.max(1, opponents);
  const columnsSpace =
    boardWidth - padding * 2 - (stackedSlots ? 0 : sideSlotWidth * 2);
  const seatWidth = Math.floor(
    Math.min(isWide ? 220 : 120, (columnsSpace - seatGap * (seats - 1)) / seats)
  );

  const portraitWidth = Math.min(
    Math.round(portraitHeightWanted / PORTRAIT_ASPECT),
    seatWidth - 4
  );
  const portrait: Box = {
    width: portraitWidth,
    height: Math.round(portraitWidth * PORTRAIT_ASPECT),
  };

  const seatCardWidth = Math.min(tableCard.width, seatWidth - 6);
  const seatCard: Box = {
    width: seatCardWidth,
    height: Math.round(seatCardWidth * CARD_ASPECT),
  };

  const muralHeight =
    headerHeight + portrait.height + nameplateHeight + (isWide ? 18 : 12);
  const tableMinHeight = stackedSlots
    ? seatCard.height + tableCard.height + 30
    : tableCard.height + 28;

  const handCard = cardBox(handCardHeight);
  const handSpace = boardWidth - padding * 2 - handInset * 2;
  const naturalStride = handCard.width + (isWide ? 8 : 2);
  const minStride = Math.max(12, Math.round(handCard.width * 0.22));
  const fitStride =
    handCount > 1
      ? (handSpace - handCard.width) / (handCount - 1)
      : naturalStride;
  const stride = Math.min(naturalStride, fitStride);
  const handOverflow = stride < minStride;

  return {
    isWide,
    boardWidth,
    padding,
    headerHeight,
    muralHeight,
    portrait,
    nameplateHeight,
    seatWidth,
    seatGap,
    tableMinHeight,
    tableCard,
    seatCard,
    sideSlotWidth,
    stackedSlots,
    messageMinHeight,
    handHeight: handCard.height + (isWide ? 28 : 20),
    handCard,
    handStride: Math.floor(handOverflow ? minStride : stride),
    handOverflow,
    handInset,
  };
}
