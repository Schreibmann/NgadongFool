import * as React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { Image } from "expo-image";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
  Easing,
} from "react-native-reanimated";
import { CardProps } from "./card.props";
import { getCardImageSource } from "./card-images";
import { CardWidth, cardHeight } from "@shared-constants";
import { color, typography } from "theme";

const SHADOW: ViewStyle = {
  shadowColor: "black",
  shadowOffset: { width: 5, height: 10 },
  shadowOpacity: 0.5,
  shadowRadius: 10,
  elevation: 4,
};

const propsAreEqual = (
  prevProps: Readonly<CardProps>,
  nextProps: Readonly<CardProps>,
): boolean =>
  prevProps.rank === nextProps.rank &&
  prevProps.suit === nextProps.suit &&
  prevProps.opened === nextProps.opened &&
  prevProps.isStump === nextProps.isStump &&
  prevProps.animation === nextProps.animation;

function CardComponent(props: CardProps) {
  const { opened, isStump, rank, suit, animation = true } = props;
  const flip = useSharedValue(animation ? 0 : 1);

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

  return (
    <Animated.View style={[styles.container, SHADOW, animatedStyle]}>
      <Image
        source={source}
        style={styles.image}
        contentFit="cover"
        cachePolicy="memory-disk"
        transition={0}
      />
      {isStump ? (
        <View style={styles.stumpOverlay} pointerEvents="none">
          <Text style={styles.stumpText}>ПЕНЁК</Text>
        </View>
      ) : null}
    </Animated.View>
  );
}

export const Card = React.memo(CardComponent, propsAreEqual);
Card.displayName = "Card";

const styles = StyleSheet.create({
  container: {
    width: CardWidth,
    height: cardHeight,
    backgroundColor: "transparent",
    margin: 3,
    borderRadius: 6,
    overflow: "hidden",
  },
  image: {
    width: CardWidth,
    height: cardHeight,
    borderRadius: 6,
  },
  stumpOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
  stumpText: {
    color: color.palette.black,
    fontFamily: typography.code,
    fontWeight: "700",
    fontSize: 24,
    letterSpacing: 6,
    transform: [{ rotate: "-64deg" }],
  },
});
