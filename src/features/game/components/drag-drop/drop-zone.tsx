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
