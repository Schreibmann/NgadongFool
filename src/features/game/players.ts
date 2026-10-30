import type { ImageSource } from "expo-image";
import { tableAssets } from "@assets/prehistoric-v2/assets";
import type { SeatConfig } from "./engine";

export const HUMAN_ID = 100;

const { avatars } = tableAssets;

const CPU_ROSTER: Array<{ id: number; name: string; avatar: ImageSource }> = [
  { id: 1, name: "Ivan", avatar: avatars.ivan },
  { id: 2, name: "Sebastian", avatar: avatars.sebastian },
  { id: 3, name: "Gosha", avatar: avatars.gosha },
  { id: 4, name: "Tolya", avatar: avatars.alternate },
  { id: 5, name: "Misha", avatar: avatars.ivan },
];

export const PLAYER_AVATARS: Record<number, ImageSource> = {
  [HUMAN_ID]: avatars.ivan,
  ...Object.fromEntries(CPU_ROSTER.map((c) => [c.id, c.avatar])),
};

export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 6;
export const DEFAULT_PLAYER_COUNT = 4;

/** Build seats: one human + (count-1) CPUs. Count is clamped to 3–6. */
export function buildSeats(playerCount: number): SeatConfig[] {
  const n = Math.min(
    MAX_PLAYERS,
    Math.max(MIN_PLAYERS, Math.floor(playerCount))
  );
  const cpus = CPU_ROSTER.slice(0, n - 1).map((c) => ({
    id: c.id,
    name: c.name,
    isCPU: true,
  }));
  return [...cpus, { id: HUMAN_ID, name: "Ngadong man", isCPU: false }];
}
