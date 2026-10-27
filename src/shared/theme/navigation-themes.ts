import { DarkTheme as NavDark, DefaultTheme as NavLight } from "@react-navigation/native";
import { palette } from "./palette";

export const LightTheme = {
  ...NavLight,
  colors: {
    ...NavLight.colors,
    primary: palette.orange,
    background: palette.white,
    card: palette.white,
    text: palette.black,
    border: palette.offWhite,
    notification: palette.angry,
  },
};

export const DarkTheme = {
  ...NavDark,
  colors: {
    ...NavDark.colors,
    primary: palette.orange,
    background: palette.black,
    card: palette.black,
    text: palette.white,
    border: palette.lightGrey,
    notification: palette.angry,
  },
};
