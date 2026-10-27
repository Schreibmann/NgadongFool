import * as React from "react";
import { StyleSheet, ViewStyle } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Card } from "../card/card.props";
import { useDragContext } from "./drag-context";

interface DraggableProps {
  data: Card;
  disabled?: boolean;
  children: React.ReactNode;
  style?: ViewStyle;
}

export function Draggable({
  data,
  disabled = false,
  children,
  style,
}: DraggableProps) {
  const { findDropZoneAt } = useDragContext();
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const elev = useSharedValue(0);
  const dataRef = React.useRef(data);
  dataRef.current = data;

  const reset = React.useCallback(() => {
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    elev.value = 0;
  }, [translateX, translateY, elev]);

  const handleDrop = React.useCallback(
    async (pageX: number, pageY: number) => {
      const zone = await findDropZoneAt(pageX, pageY);
      if (zone) {
        zone.onDrop(dataRef.current);
      }
      reset();
    },
    [findDropZoneAt, reset],
  );

  const gesture = React.useMemo(
    () =>
      Gesture.Pan()
        .enabled(!disabled)
        .onBegin(() => {
          elev.value = 100;
        })
        .onUpdate((event) => {
          translateX.value = event.translationX;
          translateY.value = event.translationY;
        })
        .onEnd((event) => {
          runOnJS(handleDrop)(event.absoluteX, event.absoluteY);
        }),
    [disabled, handleDrop, translateX, translateY, elev],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    zIndex: elev.value,
    transform: [{ translate: [translateX.value, translateY.value] }],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.wrap, style, animatedStyle]}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: "flex-start",
  },
});
