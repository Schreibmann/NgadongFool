import type { FC } from "react";
import { View, type ImageStyle, type ViewStyle } from "react-native";
import { Image } from "expo-image";
import { tableAssets } from "@assets/prehistoric-v2/assets";

const LOGO = require("@assets/images/logo.png");
const MAN = require("@assets/images/ng-man.png");
const TITLE = require("@assets/images/game-title.png");

interface WelcomeHeroProps {
  layout: "mobile" | "desktop";
  showTorches?: boolean;
}

export const WelcomeHero: FC<WelcomeHeroProps> = ({
  layout,
  showTorches = false,
}) => {
  if (layout === "desktop") {
    return (
      <View style={DESKTOP_ROOT} testID="WelcomeHero">
        <Image source={LOGO} style={DESKTOP_LOGO} contentFit="contain" />
        <View style={DESKTOP_FIGURE}>
          <View style={SHADOW} />
          <Image source={MAN} style={DESKTOP_MAN} contentFit="contain" />
          <Image source={TITLE} style={DESKTOP_TITLE} contentFit="contain" />
        </View>
        {showTorches ? (
          <View style={TORCH_COL} pointerEvents="none">
            <Image
              source={tableAssets.decor.torch}
              style={TORCH}
              contentFit="contain"
            />
            <Image
              source={tableAssets.decor.torch}
              style={TORCH}
              contentFit="contain"
            />
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View style={MOBILE_ROOT} testID="WelcomeHero">
      <Image source={LOGO} style={MOBILE_LOGO} contentFit="contain" />
      <View style={MOBILE_FIGURE}>
        <View style={SHADOW} />
        <Image source={MAN} style={MOBILE_MAN} contentFit="contain" />
        <Image source={TITLE} style={MOBILE_TITLE} contentFit="contain" />
      </View>
    </View>
  );
};

const MOBILE_ROOT: ViewStyle = {
  width: "100%",
  alignItems: "center",
  paddingHorizontal: 16,
};

const MOBILE_LOGO: ImageStyle = {
  width: "100%",
  height: 100,
  marginBottom: 8,
};

const MOBILE_FIGURE: ViewStyle = {
  width: "100%",
  maxWidth: 320,
  alignItems: "center",
  marginBottom: 8,
};

const MOBILE_MAN: ImageStyle = {
  width: "88%",
  aspectRatio: 280 / 302,
  zIndex: 1,
};

const MOBILE_TITLE: ImageStyle = {
  width: "100%",
  height: 150,
  marginTop: -72,
  zIndex: 2,
};

const DESKTOP_ROOT: ViewStyle = {
  flex: 1,
  paddingTop: 28,
  paddingLeft: 40,
  paddingRight: 24,
  paddingBottom: 24,
  justifyContent: "flex-start",
};

const DESKTOP_LOGO: ImageStyle = {
  width: 420,
  maxWidth: "90%",
  height: 140,
  alignSelf: "flex-start",
};

const DESKTOP_FIGURE: ViewStyle = {
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
};

const DESKTOP_MAN: ImageStyle = {
  width: "55%",
  maxWidth: 380,
  aspectRatio: 280 / 302,
  zIndex: 1,
};

const DESKTOP_TITLE: ImageStyle = {
  width: "92%",
  maxWidth: 720,
  height: 200,
  marginTop: -80,
  zIndex: 2,
};

const SHADOW: ViewStyle = {
  position: "absolute",
  bottom: "18%",
  width: "45%",
  height: 28,
  borderRadius: 999,
  backgroundColor: "rgba(0,0,0,0.45)",
  zIndex: 0,
};

const TORCH_COL: ViewStyle = {
  position: "absolute",
  right: 8,
  top: "28%",
  gap: 48,
  alignItems: "center",
};

const TORCH: ImageStyle = {
  width: 48,
  height: 100,
};
