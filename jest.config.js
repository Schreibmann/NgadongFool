/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.test.ts"],
  moduleNameMapper: {
    "\\.(png|jpe?g|gif|webp|bmp|otf|ttf)$":
      "<rootDir>/src/__mocks__/asset-mock.js",
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
        // The project type-checker is the native TypeScript 7
        // (devDependency `@typescript/native`), which exposes no JavaScript
        // API. ts-jest 29 still requires the JS compiler API, so the
        // `typescript` dependency is aliased to `@typescript/typescript6` —
        // a mirror that re-exports TypeScript 6. ts-jest (including its
        // static `require("typescript")` calls) resolves the mirror, while
        // `tsc` itself is re-pointed at TS 7 by scripts/ensure-tsc-bin.cjs
        // (postinstall hook).
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
