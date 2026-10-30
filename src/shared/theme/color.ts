import { palette } from "./palette";

export const color = {
  palette,
  transparent: "rgba(0, 0, 0, 0)",
  background: palette.black, // cave background
  surface: palette.white, // parchment panels / cards
  primary: palette.orange, // rusty accent
  primaryDarker: palette.orangeDarker,
  line: palette.offWhite,
  text: palette.white, // cream text on dark cave
  textDark: palette.black, // dark text on parchment
  dim: palette.lightGrey,
  error: palette.angry,
};
