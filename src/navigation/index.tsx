import { useColorScheme } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SCREENS } from "@shared-constants";
import { LightTheme, DarkTheme } from "@theme/navigation-themes";
import { WelcomeScreen } from "@features/welcome/welcome-screen";
import { PlaygroundScreen } from "@features/game/playground-screen";
import type { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

const Navigation = () => {
  const scheme = useColorScheme();
  const isDarkMode = scheme === "dark";

  return (
    <NavigationContainer theme={isDarkMode ? DarkTheme : LightTheme}>
      <Stack.Navigator id="root" screenOptions={{ headerShown: false }}>
        <Stack.Screen name={SCREENS.HOME} component={WelcomeScreen} />
        <Stack.Screen name={SCREENS.PLAYGROUND} component={PlaygroundScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;
