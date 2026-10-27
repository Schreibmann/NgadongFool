import { SeatConfig } from "./engine";

const PLAYER_ONE_AVATAR = require("@assets/avatars/cpu_avatar_1.png");
const PLAYER_TWO_AVATAR = require("@assets/avatars/cpu_avatar_2.png");
const PLAYER_AVATAR = require("@assets/avatars/ng-scull.png");

export const HUMAN_ID = 3;

export const DEFAULT_SEATS: SeatConfig[] = [
  { id: 1, name: "Ivan", isCPU: true },
  { id: 2, name: "Sebastian", isCPU: true },
  { id: HUMAN_ID, name: "Ngadong man", isCPU: false },
];

export const PLAYER_AVATARS: Record<number, number> = {
  1: PLAYER_ONE_AVATAR,
  2: PLAYER_TWO_AVATAR,
  [HUMAN_ID]: PLAYER_AVATAR,
};
