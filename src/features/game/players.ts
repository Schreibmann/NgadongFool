import { Player } from "./game-controller";

const PLAYER_ONE_AVATAR = require("@assets/avatars/cpu_avatar_1.png");
const PLAYER_TWO_AVATAR = require("@assets/avatars/cpu_avatar_2.png");
const PLAYER_AVATAR = require("@assets/avatars/ng-scull.png");

export const CPU_IVAN: Player = {
  id: 1,
  name: "Ivan",
  avatar: PLAYER_ONE_AVATAR,
  isCPU: true,
  cards: [],
  stumps: [],
  strikes: 0,
};

export const CPU_SEBASTIAN: Player = {
  id: 2,
  name: "Sebastian",
  avatar: PLAYER_TWO_AVATAR,
  isCPU: true,
  cards: [],
  stumps: [],
  strikes: 0,
};

export const PLAYER_FROM_NGADONG: Player = {
  id: 3,
  name: "Ngadong man",
  avatar: PLAYER_AVATAR,
  isCPU: false,
  cards: [],
  stumps: [],
  strikes: 0,
};
