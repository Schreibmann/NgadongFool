import { type FC, type ReactNode, useCallback, useState } from "react";
import {
  type LayoutChangeEvent,
  type StyleProp,
  View,
  type ViewStyle,
} from "react-native";
import { Image, type ImageSource } from "expo-image";
import {
  type PanelKind,
  panelSlices,
  tableAssets,
} from "@assets/prehistoric-v2/assets";

interface StonePanelProps {
  kind: PanelKind;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  children?: ReactNode;
  testID?: string;
}

interface Size {
  width: number;
  height: number;
}

const BASE: ViewStyle = { position: "relative" };

const CONTENT: ViewStyle = {
  flexGrow: 1,
  alignItems: "center",
  justifyContent: "center",
};

/**
 * Panel art drawn as three horizontal slices: both caps keep their aspect at
 * the measured height, only the middle strip stretches. Plain `stretch` smears
 * the bone/stone corners on wide bars.
 */
export const StonePanel: FC<StonePanelProps> = ({
  kind,
  style,
  contentStyle,
  children,
  testID,
}) => {
  const [size, setSize] = useState<Size | null>(null);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize((prev) =>
      prev && prev.width === width && prev.height === height
        ? prev
        : { width, height }
    );
  }, []);

  return (
    <View
      style={[BASE, style]}
      onLayout={onLayout}
      collapsable={false}
      testID={testID}
    >
      {size && size.width > 0 && size.height > 0 ? (
        <PanelSlices
          source={tableAssets.panels[kind]}
          kind={kind}
          size={size}
        />
      ) : null}
      <View style={[CONTENT, contentStyle]} pointerEvents="box-none">
        {children}
      </View>
    </View>
  );
};

interface PanelSlicesProps {
  source: ImageSource;
  kind: PanelKind;
  size: Size;
}

function PanelSlices({ source, kind, size }: PanelSlicesProps) {
  const slice = panelSlices[kind];
  const { width, height } = size;
  const scale = height / slice.height;
  const capWidth = Math.min(slice.cap * scale, width / 2);

  if (capWidth <= 0) {
    return (
      <View style={fill(0, width, height)} pointerEvents="none">
        <Image
          source={source}
          style={{ width, height }}
          contentFit="fill"
          transition={0}
        />
      </View>
    );
  }

  const capSource = capWidth / scale;
  const middleWidth = Math.max(0, width - capWidth * 2);
  const middleSource = slice.width - capSource * 2;
  const middleScale = middleSource > 0 ? middleWidth / middleSource : 0;
  const naturalWidth = slice.width * scale;

  return (
    <>
      <View style={fill(0, capWidth, height)} pointerEvents="none">
        <Image
          source={source}
          style={{ position: "absolute", left: 0, width: naturalWidth, height }}
          contentFit="fill"
          transition={0}
        />
      </View>
      {middleScale > 0 ? (
        <View
          style={fill(capWidth - 0.5, middleWidth + 1, height)}
          pointerEvents="none"
        >
          <Image
            source={source}
            style={{
              position: "absolute",
              left: -capSource * middleScale + 0.5,
              width: slice.width * middleScale,
              height,
            }}
            contentFit="fill"
            transition={0}
          />
        </View>
      ) : null}
      <View
        style={fill(width - capWidth, capWidth, height)}
        pointerEvents="none"
      >
        <Image
          source={source}
          style={{
            position: "absolute",
            right: 0,
            width: naturalWidth,
            height,
          }}
          contentFit="fill"
          transition={0}
        />
      </View>
    </>
  );
}

function fill(left: number, width: number, height: number): ViewStyle {
  return {
    position: "absolute",
    top: 0,
    left,
    width,
    height,
    overflow: "hidden",
  };
}
