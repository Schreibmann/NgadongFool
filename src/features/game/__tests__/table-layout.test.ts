import { computeTableLayout } from "../components/ui/table-layout";

const sectionsHeight = (l: ReturnType<typeof computeTableLayout>) =>
  l.muralHeight + l.tableMinHeight + l.messageMinHeight + l.handHeight;

describe("table layout", () => {
  it("fits a laptop browser viewport without scrolling", () => {
    const l = computeTableLayout({
      width: 1366,
      height: 650,
      opponents: 3,
      handCount: 8,
    });
    expect(l.isWide).toBe(true);
    expect(sectionsHeight(l)).toBeLessThanOrEqual(650);
    // Mockup desktop hand: 8 cards side by side, no overlap.
    expect(l.handStride).toBeGreaterThanOrEqual(l.handCard.width);
    expect(l.handOverflow).toBe(false);
  });

  it("fits a phone portrait viewport", () => {
    const l = computeTableLayout({
      width: 390,
      height: 760,
      opponents: 3,
      handCount: 8,
    });
    expect(l.isWide).toBe(false);
    expect(l.boardWidth).toBe(390);
    expect(sectionsHeight(l)).toBeLessThanOrEqual(760);
    // Phone hand overlaps to fit the width.
    expect(l.handStride).toBeLessThan(l.handCard.width);
    expect(
      l.handCard.width + l.handStride * 7 + l.padding * 2 + l.handInset * 2
    ).toBeLessThanOrEqual(390);
  });

  it("keeps opponent columns clear of the deck/held side slots", () => {
    for (const opponents of [2, 3, 4, 5]) {
      for (const width of [360, 390, 800, 1366]) {
        const l = computeTableLayout({
          width,
          height: 760,
          opponents,
          handCount: 6,
        });
        const columns = l.seatWidth * opponents + l.seatGap * (opponents - 1);
        const sideSlots = l.stackedSlots ? 0 : l.sideSlotWidth * 2;
        expect(columns + sideSlots + l.padding * 2).toBeLessThanOrEqual(
          l.boardWidth
        );
        expect(l.portrait.width).toBeLessThanOrEqual(l.seatWidth);
        expect(l.seatCard.width).toBeLessThanOrEqual(l.seatWidth);
      }
    }
  });

  it("falls back to a scrollable hand only when overlap would hide indices", () => {
    const l = computeTableLayout({
      width: 360,
      height: 700,
      opponents: 5,
      handCount: 40,
    });
    expect(l.handOverflow).toBe(true);
    expect(l.handStride).toBeGreaterThanOrEqual(12);
  });
});
