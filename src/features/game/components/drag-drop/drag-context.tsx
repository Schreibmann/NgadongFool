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
      const zones = Array.from(zonesRef.current.values()).filter(
        (zone) => !zone.disabled,
      );
      for (const zone of zones) {
        const layout = await zone.measure();
        if (!layout) {
          continue;
        }
        const hit =
          pageX >= layout.x &&
          pageX <= layout.x + layout.width &&
          pageY >= layout.y &&
          pageY <= layout.y + layout.height;
        if (hit) {
          return zone;
        }
      }
      return null;
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
