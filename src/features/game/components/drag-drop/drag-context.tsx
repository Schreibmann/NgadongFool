import * as React from "react";
import { Platform, StyleSheet, View, type ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from "react-native-reanimated";
import { Card as CardView } from "../card/card";
import type { Card } from "../card/card.props";

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
}

interface DragContextValue {
  registerDropZone: (zone: DropZoneRegistration) => () => void;
  findDropZoneAt: (
    pageX: number,
    pageY: number
  ) => Promise<DropZoneRegistration | null>;
  beginOverlayDrag: (state: OverlayDragState) => void;
  moveOverlayDrag: (dx: number, dy: number) => void;
  endOverlayDrag: () => void;
}

const HIT_PAD = 16;

const DragContext = React.createContext<DragContextValue | null>(null);

export function DragProvider({ children }: { children: React.ReactNode }) {
  const zonesRef = React.useRef(new Map<string, DropZoneRegistration>());
  const [overlay, setOverlay] = React.useState<OverlayDragState | null>(null);
  // Ghost offsets live on shared values: pointermove updates never re-render
  // React (the ghost transform is driven on the UI thread).
  const dx = useSharedValue(0);
  const dy = useSharedValue(0);

  const registerDropZone = React.useCallback((zone: DropZoneRegistration) => {
    zonesRef.current.set(zone.id, zone);
    return () => {
      zonesRef.current.delete(zone.id);
    };
  }, []);

  const findDropZoneAt = React.useCallback(
    async (pageX: number, pageY: number) => {
      const zones = Array.from(zonesRef.current.values()).filter(
        (zone) => !zone.disabled
      );
      const layouts = await Promise.all(zones.map((zone) => zone.measure()));
      let best: DropZoneRegistration | null = null;
      let bestArea = Number.POSITIVE_INFINITY;
      for (let i = 0; i < zones.length; i++) {
        const layout = layouts[i];
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
          best = zones[i];
        }
      }
      return best;
    },
    []
  );

  const beginOverlayDrag = React.useCallback(
    (state: OverlayDragState) => {
      dx.value = 0;
      dy.value = 0;
      setOverlay(state);
    },
    [dx, dy]
  );

  const moveOverlayDrag = React.useCallback(
    (nextDx: number, nextDy: number) => {
      dx.value = nextDx;
      dy.value = nextDy;
    },
    [dx, dy]
  );

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
    ]
  );

  return (
    <DragContext.Provider value={value}>
      <View style={styles.host}>
        {children}
        <GhostOverlay overlay={overlay} dx={dx} dy={dy} />
      </View>
    </DragContext.Provider>
  );
}

interface GhostOverlayProps {
  overlay: OverlayDragState | null;
  dx: SharedValue<number>;
  dy: SharedValue<number>;
}

const GhostOverlay = React.memo(function GhostOverlay({
  overlay,
  dx,
  dy,
}: GhostOverlayProps) {
  // One sweet spot: React renders only on drag begin/end; pointermove updates
  // mutate shared values consumed by this animated transform on the UI thread.
  const transformStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: dx.value }, { translateY: dy.value }] as const,
  }));
  if (overlay == null) {
    return null;
  }
  const placement =
    Platform.OS === "web"
      ? ghostPlacementWeb(overlay)
      : ghostPlacementNative(overlay);
  return (
    <View pointerEvents="none" style={styles.overlayRoot}>
      <Animated.View style={[placement, transformStyle]}>
        <CardView
          rank={overlay.data.rank}
          suit={overlay.data.suit}
          isStump={overlay.data.isStump}
          opened={!overlay.data.isStump}
          animation={false}
          dragging
          width={overlay.width}
          height={overlay.height}
        />
      </Animated.View>
    </View>
  );
});

/** react-native-web accepts `position: "fixed"` even though RN types do not. */
function ghostPlacementWeb(overlay: OverlayDragState): ViewStyle {
  return {
    ...({ position: "fixed" } as unknown as ViewStyle),
    // Viewport coords from getBoundingClientRect / pageX.
    left: overlay.originX,
    top: overlay.originY,
    width: overlay.width,
    height: overlay.height,
  };
}

function ghostPlacementNative(overlay: OverlayDragState): ViewStyle {
  return {
    position: "absolute",
    left: overlay.originX,
    top: overlay.originY,
    width: overlay.width,
    height: overlay.height,
  };
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
    position: "absolute",
  } as ViewStyle,
});
