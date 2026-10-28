import { SeatConfig } from "./engine";

const PLAYER_ONE_AVATAR = require("@assets/avatars/cpu_avatar_1.png");
const PLAYER_TWO_AVATAR = require("@assets/avatars/cpu_avatar_2.png");
const PLAYER_AVATAR = require("@assets/avatars/ng-scull.png");

export const HUMAN_ID = 100;

const CPU_ROSTER: Array<{ id: number; name: string; avatar: number }> = [
  { id: 1, name: "Ivan", avatar: PLAYER_ONE_AVATAR },
  { id: 2, name: "Sebastian", avatar: PLAYER_TWO_AVATAR },
  { id: 3, name: "Gosha", avatar: PLAYER_ONE_AVATAR },
  { id: 4, name: "Tolya", avatar: PLAYER_TWO_AVATAR },
  { id: 5, name: "Misha", avatar: PLAYER_ONE_AVATAR },
];

export const PLAYER_AVATARS: Record<number, number> = {
  [HUMAN_ID]: PLAYER_AVATAR,
  1: PLAYER_ONE_AVATAR,
  2: PLAYER_TWO_AVATAR,
  3: PLAYER_ONE_AVATAR,
  4: PLAYER_TWO_AVATAR,
  5: PLAYER_ONE_AVATAR,
};

export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 6;
export const DEFAULT_PLAYER_COUNT = 4;

/** Build seats: one human + (count-1) CPUs. Count is clamped to 3–6. */
export function buildSeats(playerCount: number): SeatConfig[] {
  const n = Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, Math.floor(playerCount)));
  const cpus = CPU_ROSTER.slice(0, n - 1).map((c) => ({
    id: c.id,
    name: c.name,
    isCPU: true,
  }));
  return [
    ...cpus,
    { id: HUMAN_ID, name: "Ngadong man", isCPU: false },
  ];
}
