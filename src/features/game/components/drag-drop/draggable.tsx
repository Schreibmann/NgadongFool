import * as React from "react";
import { Platform, StyleSheet, type ViewStyle } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import type { Card } from "../card/card.props";
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

const ZERO_POINT: PagePoint = { pageX: 0, pageY: 0 };

function readPagePoint(value: unknown): PagePoint {
  if (!isRecord(value)) {
    return ZERO_POINT;
  }
  if (typeof value.pageX === "number" && typeof value.pageY === "number") {
    return { pageX: value.pageX, pageY: value.pageY };
  }
  if (isEvent(value) && isRecord(value.nativeEvent)) {
    const native = value.nativeEvent;
    if (typeof native.pageX === "number" && typeof native.pageY === "number") {
      return { pageX: native.pageX, pageY: native.pageY };
    }
  }
  return ZERO_POINT;
}

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function isEventTarget(value: unknown): value is EventTarget {
  return isRecord(value) && typeof value.addEventListener === "function";
}

function isEvent(node: unknown): node is { nativeEvent: unknown } {
  return isRecord(node) && "nativeEvent" in node;
}

function readPointerId(event: unknown): number | null {
  if (!isRecord(event)) {
    return null;
  }
  if (typeof event.pointerId === "number") {
    return event.pointerId;
  }
  if (isEvent(event)) {
    const native = event.nativeEvent;
    if (isRecord(native) && typeof native.pointerId === "number") {
      return native.pointerId;
    }
  }
  return null;
}

function readDomTarget(event: unknown): EventTarget | null {
  if (!isRecord(event)) {
    return null;
  }
  if (isEventTarget(event.currentTarget)) {
    return event.currentTarget;
  }
  if (isEventTarget(event.target)) {
    return event.target;
  }
  if (isEvent(event)) {
    const native = event.nativeEvent;
    if (isRecord(native) && isEventTarget(native.target)) {
      return native.target;
    }
  }
  return null;
}

function canCapturePointer(target: unknown): target is EventTarget & {
  setPointerCapture: (id: number) => void;
  releasePointerCapture: (id: number) => void;
} {
  return (
    isRecord(target) &&
    typeof target.setPointerCapture === "function" &&
    typeof target.releasePointerCapture === "function"
  );
}

function isDomElement(node: unknown): node is Element & {
  style: CSSStyleDeclaration;
  addEventListener: EventTarget["addEventListener"];
  removeEventListener: EventTarget["removeEventListener"];
  getBoundingClientRect: () => DOMRect;
} {
  return (
    typeof node === "object" &&
    node !== null &&
    "addEventListener" in node &&
    typeof node.addEventListener === "function" &&
    "removeEventListener" in node &&
    typeof node.removeEventListener === "function" &&
    "style" in node &&
    "getBoundingClientRect" in node &&
    typeof node.getBoundingClientRect === "function"
  );
}

type MeasureInWindowFn = (
  callback: (x: number, y: number, width: number, height: number) => void
) => void;

function readMeasureInWindow(node: unknown): MeasureInWindowFn | null {
  if (typeof node !== "object" || node === null) {
    return null;
  }
  if (!("measureInWindow" in node)) {
    return null;
  }
  const candidate = node.measureInWindow;
  if (typeof candidate !== "function") {
    return null;
  }
  return candidate.bind(node);
}

export function Draggable({
  data,
  disabled = false,
  children,
  style,
}: DraggableProps) {
  const { findDropZoneAt, beginOverlayDrag, moveOverlayDrag, endOverlayDrag } =
    useDragContext();
  const hidden = useSharedValue(0);
  const dataRef = React.useRef(data);
  dataRef.current = data;

  const dragOriginRef = React.useRef<{ x: number; y: number } | null>(null);
  const webDraggingRef = React.useRef(false);
  const hostRef = React.useRef<unknown>(null);
  const dragStartCleanupRef = React.useRef<(() => void) | null>(null);
  const docDragGuardCleanupRef = React.useRef<(() => void) | null>(null);
  const capturedPointerIdRef = React.useRef<number | null>(null);

  const clearDocDragGuard = React.useCallback(() => {
    docDragGuardCleanupRef.current?.();
    docDragGuardCleanupRef.current = null;
  }, []);

  const measureHost = React.useCallback((): Promise<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null> => {
    return new Promise((resolve) => {
      const node = hostRef.current;
      if (isDomElement(node)) {
        const rect = node.getBoundingClientRect();
        resolve({
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height,
        });
        return;
      }
      const measureInWindow = readMeasureInWindow(node);
      if (!measureInWindow) {
        resolve(null);
        return;
      }
      measureInWindow((x, y, width, height) => {
        resolve({ x, y, width, height });
      });
    });
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
    endOverlayDrag();
    hidden.value = 0;
    dragOriginRef.current = null;
    webDraggingRef.current = false;
  }, [clearDocDragGuard, endOverlayDrag, hidden]);

  const startOverlay = React.useCallback(async () => {
    const layout = await measureHost();
    if (layout == null) {
      return false;
    }
    beginOverlayDrag({
      data: dataRef.current,
      originX: layout.x,
      originY: layout.y,
      width: layout.width,
      height: layout.height,
    });
    hidden.value = 1;
    return true;
  }, [beginOverlayDrag, hidden, measureHost]);

  const handleDrop = React.useCallback(
    async (pageX: number, pageY: number) => {
      const zone = await findDropZoneAt(pageX, pageY);
      if (zone) {
        zone.onDrop(dataRef.current);
      }
      reset();
    },
    [findDropZoneAt, reset]
  );

  const onNativeBegin = React.useCallback(() => {
    void startOverlay();
  }, [startOverlay]);

  const onNativeUpdate = React.useCallback(
    (dx: number, dy: number) => {
      moveOverlayDrag(dx, dy);
    },
    [moveOverlayDrag]
  );

  const gesture = React.useMemo(
    () =>
      Gesture.Pan()
        .enabled(!disabled && Platform.OS !== "web")
        .onBegin(() => {
          runOnJS(onNativeBegin)();
        })
        .onUpdate((event) => {
          runOnJS(onNativeUpdate)(event.translationX, event.translationY);
        })
        .onEnd((event) => {
          runOnJS(handleDrop)(event.absoluteX, event.absoluteY);
        }),
    [disabled, handleDrop, onNativeBegin, onNativeUpdate]
  );

  React.useEffect(
    () => () => {
      dragStartCleanupRef.current?.();
      dragStartCleanupRef.current = null;
      clearDocDragGuard();
    },
    [clearDocDragGuard]
  );

  const bindHostNode = React.useCallback((node: unknown) => {
    dragStartCleanupRef.current?.();
    dragStartCleanupRef.current = null;
    hostRef.current = node;

    if (!isDomElement(node)) {
      return;
    }

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
    (event: unknown) => {
      const point = readPagePoint(event);
      if (disabled) return;
      webDraggingRef.current = true;
      dragOriginRef.current = { x: point.pageX, y: point.pageY };

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

      clearDocDragGuard();
      const onDocDragStart = (dragEvent: Event) => {
        dragEvent.preventDefault();
      };
      document.addEventListener("dragstart", onDocDragStart, true);
      docDragGuardCleanupRef.current = () => {
        document.removeEventListener("dragstart", onDocDragStart, true);
      };

      void startOverlay();
    },
    [clearDocDragGuard, disabled, startOverlay]
  );

  const onWebPointerMove = React.useCallback(
    (event: unknown) => {
      if (!webDraggingRef.current || !dragOriginRef.current) return;
      const point = readPagePoint(event);
      moveOverlayDrag(
        point.pageX - dragOriginRef.current.x,
        point.pageY - dragOriginRef.current.y
      );
    },
    [moveOverlayDrag]
  );

  const onWebPointerUp = React.useCallback(
    (event: unknown) => {
      if (!webDraggingRef.current) return;
      const point = readPagePoint(event);
      void handleDrop(point.pageX, point.pageY);
    },
    [handleDrop]
  );

  const onWebPointerCancel = React.useCallback(() => {
    reset();
  }, [reset]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: hidden.value === 1 ? 0 : 1,
  }));

  // Avoid type assertion on releasePointerCapture — fix reset helper properly.
  const animatedView = (
    <Animated.View
      ref={
        Platform.OS === "web"
          ? bindHostNode
          : (node: unknown) => {
              hostRef.current = node;
            }
      }
      collapsable={false}
      style={[styles.wrap, style, animatedStyle, styles.webGrab]}
      {...(Platform.OS === "web"
        ? {
            onPointerDown: onWebPointerDown,
            onPointerMove: onWebPointerMove,
            onPointerUp: onWebPointerUp,
            onPointerCancel: onWebPointerCancel,
          }
        : {})}
    >
      {children}
    </Animated.View>
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
  webGrab:
    Platform.OS === "web"
      ? ({ userSelect: "none" } as unknown as ViewStyle)
      : {},
});
