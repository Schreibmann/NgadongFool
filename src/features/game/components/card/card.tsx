import * as React from "react";
import {
  StyleSheet,
  Text,
  View,
  type ImageStyle,
  type ViewStyle,
} from "react-native";
import { Image } from "expo-image";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
  Easing,
} from "react-native-reanimated";
import type { CardProps } from "./card.props";
import { getCardImageSource } from "./card-images";
import { CardWidth, cardHeight } from "@shared-constants";
import { color, typography } from "@theme";

const SHADOW: ViewStyle = {
  shadowColor: "black",
  shadowOffset: { width: 5, height: 10 },
  shadowOpacity: 0.5,
  shadowRadius: 10,
  elevation: 4,
};

const propsAreEqual = (
  prevProps: Readonly<CardProps>,
  nextProps: Readonly<CardProps>
): boolean =>
  prevProps.rank === nextProps.rank &&
  prevProps.suit === nextProps.suit &&
  prevProps.opened === nextProps.opened &&
  prevProps.isStump === nextProps.isStump &&
  prevProps.animation === nextProps.animation &&
  prevProps.width === nextProps.width &&
  prevProps.height === nextProps.height;

function CardComponent(props: CardProps) {
  const {
    opened,
    isStump,
    rank,
    suit,
    animation = true,
    width,
    height,
  } = props;
  const cardW = width ?? CardWidth;
  const cardH = height ?? cardHeight;
  const flip = useSharedValue(animation ? 0 : 1);

  // Re-run whenever the rendered card identity changes so a recycled
  // component re-plays the flip, not only when `animation` toggles.
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional extra deps
  React.useEffect(() => {
    if (animation) {
      flip.value = 0;
      flip.value = withTiming(1, {
        duration: 500,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      flip.value = 1;
    }
  }, [rank, suit, opened, animation, flip]);

  const animatedStyle = useAnimatedStyle(() => {
    const progress = flip.value;
    const scaleX = interpolate(progress, [0, 0.5, 1], [0.01, 0.01, 1]);
    const opacity = interpolate(progress, [0, 0.45, 1], [0, 0.4, 1]);
    return {
      opacity,
      transform: [{ scaleX }],
    };
  });

  const source = getCardImageSource(suit, rank, opened);

  const containerStyle: ViewStyle = {
    width: cardW,
    height: cardH,
    backgroundColor: "transparent",
    borderRadius: 6,
    overflow: "hidden",
  };
  const imageStyle: ImageStyle = {
    width: cardW,
    height: cardH,
    borderRadius: 6,
  };

  return (
    <Animated.View
      style={[containerStyle, SHADOW, animatedStyle as unknown as ViewStyle]}
    >
      <Image
        source={source}
        style={imageStyle}
        contentFit="cover"
        cachePolicy="memory-disk"
        transition={0}
        draggable={false}
      />
      {isStump ? (
        <View
          style={[
            StyleSheet.absoluteFill,
            { alignItems: "center", justifyContent: "center" },
          ]}
          pointerEvents="none"
        >
          <Text
            style={[
              {
                color: color.palette.black,
                fontFamily: typography.code,
                fontWeight: "700",
                fontSize: 24,
                letterSpacing: 6,
              },
              { transform: [{ rotate: "-64deg" }] },
            ]}
          >
            ПЕНЁК
          </Text>
        </View>
      ) : null}
    </Animated.View>
  );
}

export const Card = React.memo(CardComponent, propsAreEqual);
Card.displayName = "Card";
