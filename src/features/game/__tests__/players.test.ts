import { HUMAN_ID, MAX_PLAYERS, MIN_PLAYERS, buildSeats } from "../players";

describe("players: seat composition", () => {
  it("supports the 3-player table (2 CPUs + human)", () => {
    const seats = buildSeats(3);
    expect(seats).toHaveLength(3);
    expect(seats.filter((s) => s.isCPU)).toHaveLength(2);
    expect(seats[seats.length - 1]).toMatchObject({
      id: HUMAN_ID,
      isCPU: false,
    });
    // CPU ids stay unique and never collide with the human seat.
    const ids = seats.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("covers the whole 3–6 range with unique cpu ids", () => {
    for (let n = MIN_PLAYERS; n <= MAX_PLAYERS; n++) {
      const seats = buildSeats(n);
      expect(seats).toHaveLength(n);
      const ids = seats.map((s) => s.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("clamps out-of-range counts", () => {
    expect(buildSeats(2)).toHaveLength(MIN_PLAYERS);
    expect(buildSeats(7)).toHaveLength(MAX_PLAYERS);
  });
});
