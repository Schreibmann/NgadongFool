import * as React from "react";
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

interface DragContextValue {
  registerDropZone: (zone: DropZoneRegistration) => () => void;
  findDropZoneAt: (
    pageX: number,
    pageY: number,
  ) => Promise<DropZoneRegistration | null>;
}

const HIT_PAD = 16;

const DragContext = React.createContext<DragContextValue | null>(null);

export function DragProvider({ children }: { children: React.ReactNode }) {
  const zonesRef = React.useRef(new Map<string, DropZoneRegistration>());

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

  const value = React.useMemo(
    () => ({ registerDropZone, findDropZoneAt }),
    [registerDropZone, findDropZoneAt],
  );

  return <DragContext.Provider value={value}>{children}</DragContext.Provider>;
}

export function useDragContext() {
  const ctx = React.useContext(DragContext);
  if (!ctx) {
    throw new Error("useDragContext must be used within DragProvider");
  }
  return ctx;
}
