import * as React from "react";
import { Platform, StyleSheet, ViewStyle } from "react-native";
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

interface PagePoint {
  pageX: number;
  pageY: number;
}

function readPointerId(event: unknown): number | null {
  if (typeof event !== "object" || event === null) {
    return null;
  }
  if ("pointerId" in event && typeof event.pointerId === "number") {
    return event.pointerId;
  }
  if ("nativeEvent" in event) {
    const native = event.nativeEvent;
    if (
      typeof native === "object" &&
      native !== null &&
      "pointerId" in native &&
      typeof native.pointerId === "number"
    ) {
      return native.pointerId;
    }
  }
  return null;
}

function readDomTarget(event: unknown): EventTarget | null {
  if (typeof event !== "object" || event === null) {
    return null;
  }
  if ("currentTarget" in event && event.currentTarget != null) {
    return event.currentTarget;
  }
  if ("target" in event && event.target != null) {
    return event.target;
  }
  if ("nativeEvent" in event) {
    const native = event.nativeEvent;
    if (
      typeof native === "object" &&
      native !== null &&
      "target" in native &&
      native.target != null
    ) {
      return native.target;
    }
  }
  return null;
}

function canCapturePointer(
  target: EventTarget | null,
): target is EventTarget & {
  setPointerCapture: (id: number) => void;
  releasePointerCapture: (id: number) => void;
} {
  return (
    typeof target === "object" &&
    target !== null &&
    "setPointerCapture" in target &&
    typeof target.setPointerCapture === "function" &&
    "releasePointerCapture" in target &&
    typeof target.releasePointerCapture === "function"
  );
}

function isDomElement(
  node: unknown,
): node is Element & {
  style: CSSStyleDeclaration;
  addEventListener: EventTarget["addEventListener"];
  removeEventListener: EventTarget["removeEventListener"];
} {
  return (
    typeof node === "object" &&
    node !== null &&
    "addEventListener" in node &&
    typeof node.addEventListener === "function" &&
    "removeEventListener" in node &&
    typeof node.removeEventListener === "function" &&
    "style" in node
  );
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

  const dragOriginRef = React.useRef<{ x: number; y: number } | null>(null);
  const webDraggingRef = React.useRef(false);
  const hostRef = React.useRef<EventTarget | null>(null);
  const dragStartCleanupRef = React.useRef<(() => void) | null>(null);
  const docDragGuardCleanupRef = React.useRef<(() => void) | null>(null);
  const capturedPointerIdRef = React.useRef<number | null>(null);

  const clearDocDragGuard = React.useCallback(() => {
    docDragGuardCleanupRef.current?.();
    docDragGuardCleanupRef.current = null;
  }, []);

  const reset = React.useCallback(() => {
    const pointerId = capturedPointerIdRef.current;
    const host = hostRef.current;
    if (pointerId != null && canCapturePointer(host)) {
      try {
        host.releasePointerCapture(pointerId);
      } catch {
        // already released
      }
    }
    capturedPointerIdRef.current = null;
    clearDocDragGuard();
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    elev.value = 0;
    dragOriginRef.current = null;
    webDraggingRef.current = false;
  }, [clearDocDragGuard, translateX, translateY, elev]);

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
        .enabled(!disabled && Platform.OS !== "web")
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

  React.useEffect(
    () => () => {
      dragStartCleanupRef.current?.();
      dragStartCleanupRef.current = null;
      clearDocDragGuard();
    },
    [clearDocDragGuard],
  );

  const bindHostNode = React.useCallback((node: unknown) => {
    dragStartCleanupRef.current?.();
    dragStartCleanupRef.current = null;

    if (!isDomElement(node)) {
      hostRef.current = null;
      return;
    }

    hostRef.current = node;
    node.style.userSelect = "none";
    node.style.setProperty("-webkit-user-drag", "none");
    node.style.cursor = "grab";

    const onDragStart = (event: Event) => {
      event.preventDefault();
    };
    node.addEventListener("dragstart", onDragStart, true);
    dragStartCleanupRef.current = () => {
      node.removeEventListener("dragstart", onDragStart, true);
    };
  }, []);

  const onWebPointerDown = React.useCallback(
    (event: PagePoint) => {
      if (disabled) return;
      webDraggingRef.current = true;
      dragOriginRef.current = { x: event.pageX, y: event.pageY };
      elev.value = 100;

      const pointerId = readPointerId(event);
      const target = readDomTarget(event);
      if (target != null) {
        hostRef.current = target;
      }
      if (pointerId != null && canCapturePointer(target)) {
        try {
          target.setPointerCapture(pointerId);
          capturedPointerIdRef.current = pointerId;
        } catch {
          capturedPointerIdRef.current = null;
        }
      }

      // Document capture: img native drag cancels pointer before host handlers.
      clearDocDragGuard();
      const onDocDragStart = (dragEvent: Event) => {
        dragEvent.preventDefault();
      };
      document.addEventListener("dragstart", onDocDragStart, true);
      docDragGuardCleanupRef.current = () => {
        document.removeEventListener("dragstart", onDocDragStart, true);
      };
    },
    [clearDocDragGuard, disabled, elev],
  );

  const onWebPointerMove = React.useCallback(
    (event: PagePoint) => {
      if (!webDraggingRef.current || !dragOriginRef.current) return;
      translateX.value = event.pageX - dragOriginRef.current.x;
      translateY.value = event.pageY - dragOriginRef.current.y;
    },
    [translateX, translateY],
  );

  const onWebPointerUp = React.useCallback(
    (event: PagePoint) => {
      if (!webDraggingRef.current) return;
      void handleDrop(event.pageX, event.pageY);
    },
    [handleDrop],
  );

  const onWebPointerCancel = React.useCallback(() => {
    reset();
  }, [reset]);

  const animatedStyle = useAnimatedStyle(() => ({
    zIndex: elev.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  const animatedView = React.createElement(
    Animated.View,
    {
      ref: Platform.OS === "web" ? bindHostNode : undefined,
      style: [styles.wrap, style, animatedStyle, styles.webGrab],
      ...(Platform.OS === "web"
        ? {
            onPointerDown: onWebPointerDown,
            onPointerMove: onWebPointerMove,
            onPointerUp: onWebPointerUp,
            onPointerCancel: onWebPointerCancel,
          }
        : {}),
    },
    children,
  );

  if (Platform.OS === "web") {
    return animatedView;
  }

  return <GestureDetector gesture={gesture}>{animatedView}</GestureDetector>;
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: "flex-start",
  },
  webGrab: Platform.OS === "web" ? { userSelect: "none" } : {},
});
