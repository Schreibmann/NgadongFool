import * as React from "react";
import { Platform, StyleSheet, View, ViewStyle } from "react-native";
import { Card as CardView } from "../card/card";
import { Card } from "../card/card.props";

export type DropHandler = (card: Card) => void;

export interface DropZoneRegistration {
  id: string;
  disabled: boolean;
  onDrop: DropHandler;
  measure: () => Promise<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>;
}

export interface OverlayDragState {
  data: Card;
  /** Page/window coords of the source top-left at drag start. */
  originX: number;
  originY: number;
  width: number;
  height: number;
  dx: number;
  dy: number;
}

interface DragContextValue {
  registerDropZone: (zone: DropZoneRegistration) => () => void;
  findDropZoneAt: (
    pageX: number,
    pageY: number,
  ) => Promise<DropZoneRegistration | null>;
  beginOverlayDrag: (state: Omit<OverlayDragState, "dx" | "dy">) => void;
  moveOverlayDrag: (dx: number, dy: number) => void;
  endOverlayDrag: () => void;
}

const HIT_PAD = 16;

const DragContext = React.createContext<DragContextValue | null>(null);

export function DragProvider({ children }: { children: React.ReactNode }) {
  const zonesRef = React.useRef(new Map<string, DropZoneRegistration>());
  const [overlay, setOverlay] = React.useState<OverlayDragState | null>(null);

  const registerDropZone = React.useCallback((zone: DropZoneRegistration) => {
    zonesRef.current.set(zone.id, zone);
    return () => {
      zonesRef.current.delete(zone.id);
    };
  }, []);

  const findDropZoneAt = React.useCallback(
    async (pageX: number, pageY: number) => {
      const all = Array.from(zonesRef.current.values());
      let best: DropZoneRegistration | null = null;
      let bestArea = Number.POSITIVE_INFINITY;

      for (const zone of all) {
        if (zone.disabled) {
          continue;
        }
        const layout = await zone.measure();
        if (
          layout == null ||
          layout.width <= 0 ||
          layout.height <= 0 ||
          pageX < layout.x - HIT_PAD ||
          pageX > layout.x + layout.width + HIT_PAD ||
          pageY < layout.y - HIT_PAD ||
          pageY > layout.y + layout.height + HIT_PAD
        ) {
          continue;
        }
        const area = layout.width * layout.height;
        if (area < bestArea) {
          bestArea = area;
          best = zone;
        }
      }
      return best;
    },
    [],
  );

  const beginOverlayDrag = React.useCallback(
    (state: Omit<OverlayDragState, "dx" | "dy">) => {
      setOverlay({ ...state, dx: 0, dy: 0 });
    },
    [],
  );

  const moveOverlayDrag = React.useCallback((dx: number, dy: number) => {
    setOverlay((prev) => (prev == null ? null : { ...prev, dx, dy }));
  }, []);

  const endOverlayDrag = React.useCallback(() => {
    setOverlay(null);
  }, []);

  const value = React.useMemo(
    () => ({
      registerDropZone,
      findDropZoneAt,
      beginOverlayDrag,
      moveOverlayDrag,
      endOverlayDrag,
    }),
    [
      registerDropZone,
      findDropZoneAt,
      beginOverlayDrag,
      moveOverlayDrag,
      endOverlayDrag,
    ],
  );

  const ghostLeft = overlay == null ? 0 : overlay.originX + overlay.dx;
  const ghostTop = overlay == null ? 0 : overlay.originY + overlay.dy;

  /** react-native-web accepts `position: "fixed"` even though RN types do not. */
  const webGhostPlacement = {
    position: "fixed",
  } as unknown as ViewStyle;

  return (
    <DragContext.Provider value={value}>
      <View style={styles.host}>
        {children}
        {overlay != null ? (
          <View pointerEvents="none" style={styles.overlayRoot}>
            <View
              style={[
                styles.ghost,
                Platform.OS === "web"
                  ? {
                      // Viewport coords from getBoundingClientRect / pageX.
                      ...webGhostPlacement,
                      left: ghostLeft,
                      top: ghostTop,
                      width: overlay.width,
                      height: overlay.height,
                    }
                  : {
                      position: "absolute",
                      left: ghostLeft,
                      top: ghostTop,
                      width: overlay.width,
                      height: overlay.height,
                    },
              ]}
            >
              <CardView
                rank={overlay.data.rank}
                suit={overlay.data.suit}
                isStump={overlay.data.isStump}
                opened={!overlay.data.isStump}
                animation={false}
                dragging
              />
            </View>
          </View>
        ) : null}
      </View>
    </DragContext.Provider>
  );
}

export function useDragContext() {
  const ctx = React.useContext(DragContext);
  if (!ctx) {
    throw new Error("useDragContext must be used within DragProvider");
  }
  return ctx;
}

const styles = StyleSheet.create({
  host: {
    flex: 1,
  },
  overlayRoot: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    elevation: 9999,
  } as ViewStyle,
  ghost: {
    zIndex: 9999,
    elevation: 9999,
  },
});
