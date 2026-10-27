import * as React from "react";
import { StyleProp, View, ViewStyle } from "react-native";
import { DropHandler, useDragContext } from "./drag-context";

interface DropZoneProps {
  onDrop: DropHandler;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

type MeasureFn = (
  callback: (x: number, y: number, width: number, height: number) => void,
) => void;

function readMeasureInWindow(node: unknown): MeasureFn | null {
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

/** Prefer DOM rect on web — matches pointer pageX/pageY under scroll. */
function readBoundingClientRect(
  node: unknown,
): { x: number; y: number; width: number; height: number } | null {
  if (typeof node !== "object" || node === null) {
    return null;
  }
  if (!("getBoundingClientRect" in node)) {
    return null;
  }
  const candidate = node.getBoundingClientRect;
  if (typeof candidate !== "function") {
    return null;
  }
  const rect = candidate.call(node);
  if (typeof rect !== "object" || rect === null) {
    return null;
  }
  if (
    !("left" in rect) ||
    !("top" in rect) ||
    !("width" in rect) ||
    !("height" in rect)
  ) {
    return null;
  }
  const left = rect.left;
  const top = rect.top;
  const width = rect.width;
  const height = rect.height;
  if (
    typeof left !== "number" ||
    typeof top !== "number" ||
    typeof width !== "number" ||
    typeof height !== "number"
  ) {
    return null;
  }
  return { x: left, y: top, width, height };
}

let dropZoneSeq = 0;

export function DropZone({
  onDrop,
  disabled = false,
  style,
  children,
}: DropZoneProps) {
  const { registerDropZone } = useDragContext();
  const hostRef = React.useRef<unknown>(null);
  const idRef = React.useRef(`drop-zone-${++dropZoneSeq}`);

  const setHostRef = React.useCallback(
    (node: React.ElementRef<typeof View> | null) => {
      hostRef.current = node;
    },
    [],
  );

  React.useEffect(() => {
    return registerDropZone({
      id: idRef.current,
      disabled,
      onDrop,
      measure: () =>
        new Promise((resolve) => {
          const dom = readBoundingClientRect(hostRef.current);
          if (dom) {
            resolve(dom);
            return;
          }
          const measureInWindow = readMeasureInWindow(hostRef.current);
          if (!measureInWindow) {
            resolve(null);
            return;
          }
          measureInWindow((x, y, width, height) => {
            resolve({ x, y, width, height });
          });
        }),
    });
  }, [registerDropZone, disabled, onDrop]);

  return (
    <View ref={setHostRef} style={style} collapsable={false}>
      {children}
    </View>
  );
}
