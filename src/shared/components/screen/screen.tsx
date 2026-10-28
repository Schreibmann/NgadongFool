import * as React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  View,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ScreenProps } from "./screen.props";
import { isNonScrolling, offsets, presets } from "./screen.presets";

const isIos = Platform.OS === "ios";

function ScreenWithoutScrolling(props: ScreenProps) {
  const insets = useSafeAreaInsets();
  const preset = presets.fixed;
  const style = props.style || {};
  const backgroundStyle = props.backgroundColor
    ? { backgroundColor: props.backgroundColor }
    : {};
  const insetStyle = { paddingTop: props.unsafe ? 0 : insets.top };

  return (
    <KeyboardAvoidingView
      style={[preset.outer, backgroundStyle]}
      behavior={isIos ? "padding" : undefined}
      keyboardVerticalOffset={offsets[props.keyboardOffset || "none"]}
    >
      <StatusBar barStyle={props.statusBar || "light-content"} />
      <View style={[preset.inner, style, insetStyle]}>{props.children}</View>
    </KeyboardAvoidingView>
  );
}

function ScreenWithScrolling(props: ScreenProps) {
  const insets = useSafeAreaInsets();
  const preset = presets.scroll;
  const style = props.style || {};
  const backgroundStyle = props.backgroundColor
    ? { backgroundColor: props.backgroundColor }
    : {};
  const insetStyle = { paddingTop: props.unsafe ? 0 : insets.top };
  const { height } = Dimensions.get("window");
  const scrollViewHeight = React.useRef<number | null>(null);
  const [scrollEnabled, setScrollEnabled] = React.useState(true);

  const updateScrollState = () => {
    if (props.preset === "auto" && scrollViewHeight.current !== null) {
      const contentFitsScreen =
        scrollViewHeight.current <
        height * presets.auto.offset.percent - presets.auto.offset.point;

      if (scrollEnabled && contentFitsScreen) {
        setScrollEnabled(false);
      }
      if (!scrollEnabled && !contentFitsScreen) {
        setScrollEnabled(true);
      }
    } else if (!scrollEnabled) {
      setScrollEnabled(true);
    }
  };

  const onContentSizeChange = (
    _contentWidth: number,
    contentHeight: number
  ) => {
    scrollViewHeight.current = contentHeight;
    updateScrollState();
  };

  if (scrollViewHeight.current !== null) {
    updateScrollState();
  }

  return (
    <KeyboardAvoidingView
      style={[preset.outer, backgroundStyle]}
      behavior={isIos ? "padding" : undefined}
      keyboardVerticalOffset={offsets[props.keyboardOffset || "none"]}
    >
      <StatusBar barStyle={props.statusBar || "light-content"} />
      <View style={[preset.outer, backgroundStyle, insetStyle]}>
        <ScrollView
          style={[preset.outer, backgroundStyle]}
          contentContainerStyle={[preset.inner, style]}
          keyboardShouldPersistTaps={
            props.keyboardShouldPersistTaps || "handled"
          }
          scrollEnabled={scrollEnabled}
          onContentSizeChange={onContentSizeChange}
        >
          {props.children}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

export function Screen(props: ScreenProps) {
  if (isNonScrolling(props.preset)) {
    return <ScreenWithoutScrolling {...props} />;
  }
  return <ScreenWithScrolling {...props} />;
}
