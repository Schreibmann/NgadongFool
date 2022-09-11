import "./src/i18n";
import "./src/utils/ignore-warnings";
import "react-native-gesture-handler";
import React from "react";
import { StatusBar, useColorScheme, LogBox } from "react-native";
import SplashScreen from "react-native-splash-screen";
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";
/**
 * ? Local Imports
 */
import Navigation from "./src/navigation";
import { isAndroid } from "@freakycoder/react-native-helpers";

LogBox.ignoreAllLogs();

const App = () => {
  const scheme = useColorScheme();
  const isDarkMode = scheme === "dark";

  React.useEffect(() => {
    StatusBar.setBarStyle(isDarkMode ? "light-content" : "dark-content");
    if (isAndroid) {
      StatusBar.setBackgroundColor("rgba(0,0,0,0)");
      StatusBar.setTranslucent(true);
    }

    setTimeout(() => {
      SplashScreen.hide();
    }, 750);
  }, [scheme, isDarkMode]);

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <Navigation />
    </SafeAreaProvider>
  );
};

export default App;
