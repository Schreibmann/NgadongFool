/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.test.ts"],
  moduleNameMapper: {
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
          strictNullChecks: false,
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          module: "commonjs",
          moduleResolution: "node",
          jsx: "react",
          skipLibCheck: true,
          types: ["jest"],
        },
      },
    ],
  },
};
