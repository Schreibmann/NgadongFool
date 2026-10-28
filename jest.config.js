/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.test.ts"],
  moduleNameMapper: {
    "\\.(png|jpe?g|gif|webp|bmp|otf|ttf)$": "<rootDir>/src/__mocks__/asset-mock.js",
    "^@features/(.*)$": "<rootDir>/src/features/$1",
    "^@shared-constants$": "<rootDir>/src/shared/constants",
    "^@shared-components/(.*)$": "<rootDir>/src/shared/components/$1",
    "^@theme(/(.*))?$": "<rootDir>/src/shared/theme$2",
    "^@assets/(.*)$": "<rootDir>/src/assets/$1",
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          strict: true,
          strictNullChecks: true,
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          module: "commonjs",
          moduleResolution: "node",
          jsx: "react",
          skipLibCheck: true,
          // "node" declares the global `require` used by asset imports
          // (players.ts, card-images.ts) in UI-adjacent test files.
          types: ["jest", "node"],
        },
      },
    ],
  },
};
