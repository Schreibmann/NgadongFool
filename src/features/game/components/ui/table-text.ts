import type { TextStyle } from "react-native";
import { CardSuits } from "../../engine";
import { color } from "@theme";

/** Bold sans on the HUD (mockup), dark shadow so it reads on carved stone. */
const CARVED: TextStyle = {
  color: color.text,
  fontWeight: "800",
  textAlign: "center",
  textShadowColor: "rgba(0,0,0,0.85)",
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 3,
};

export const HUD_TEXT: TextStyle = {
  ...CARVED,
  fontSize: 15,
  letterSpacing: 0.5,
  textTransform: "uppercase",
};

export const HUD_SUB: TextStyle = {
  ...CARVED,
  fontSize: 11,
  fontWeight: "700",
  letterSpacing: 0.5,
  color: color.palette.offWhite,
  textTransform: "uppercase",
};

export const EYEBROW: TextStyle = {
  ...CARVED,
  fontSize: 14,
  fontWeight: "700",
  color: "#f2a33a",
};

export const HEADLINE: TextStyle = {
  ...CARVED,
  fontSize: 22,
  letterSpacing: 0.5,
  textTransform: "uppercase",
};

export const BUTTON_LABEL: TextStyle = {
  ...CARVED,
  fontSize: 14,
  letterSpacing: 1,
  textTransform: "uppercase",
  textShadowColor: "rgba(60,25,5,0.9)",
};

const SUIT_LABELS: Record<CardSuits, string> = {
  [CardSuits.Hearts]: "♥ ЧЕРВИ",
  [CardSuits.Diamonds]: "♦ БУБНЫ",
  [CardSuits.Clubs]: "♣ ТРЕФЫ",
  [CardSuits.Spades]: "♠ ПИКИ",
};

export const suitLabel = (suit: CardSuits): string => SUIT_LABELS[suit];
