import "react-native-gesture-handler";
import React from "react";
import { StyleSheet, useColorScheme } from "react-native";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Navigation from "./src/navigation";
import "./src/i18n";

void SplashScreen.preventAutoHideAsync();

const App = () => {
  const scheme = useColorScheme();
  const isDarkMode = scheme === "dark";
  const [fontsLoaded] = useFonts({
    Ngadong: require("./src/assets/fonts/Ngadong/Ngadong.otf"),
  });

  React.useEffect(() => {
    if (fontsLoaded) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <StatusBar style={isDarkMode ? "light" : "dark"} />
        <Navigation />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
});

export default App;
