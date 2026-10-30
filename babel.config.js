module.exports = (api) => {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "babel-plugin-module-resolver",
        {
          root: ["./src"],
          alias: {
            "@shared-components": "./src/shared/components",
            "@shared-constants": "./src/shared/constants",
            "@theme": "./src/shared/theme",
            "@i18n": "./src/i18n",
            "@navigation": "./src/navigation",
            "@features": "./src/features",
            "@assets": "./src/assets",
          },
          extensions: [".js", ".jsx", ".ts", ".tsx", ".json"],
        },
      ],
      "react-native-reanimated/plugin",
    ],
  };
};
