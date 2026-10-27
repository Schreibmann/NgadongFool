module.exports = function (api) {
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
            "@services": "./src/services",
            "@features": "./src/features",
            "@utils": "./src/utils",
            "@assets": "./src/assets",
            theme: "./src/shared/theme",
            i18n: "./src/i18n",
          },
          extensions: [".js", ".jsx", ".ts", ".tsx", ".json"],
        },
      ],
      "react-native-reanimated/plugin",
    ],
  };
};
