# Ngadong Fool

Multiplayer card game built around the **Пеньки** deal/prepare table and the main-game fight that follows (dealer / «вахта» roles included). Play locally against CPU opponents on **iOS**, **Android**, or **web**.

Canonical rules for the domain engine live in the project docs (`game-rules-spec`); this README stays high-level so the table jargon does not drown the setup steps.

## Stack

- **Expo SDK 58** + React Native (Hermes), React Navigation (Welcome → Playground)
- Pure TypeScript rules engine (`src/features/game/engine`) + UI via `useSyncExternalStore`
- Cards: per-card assets, `expo-image`, Reanimated, Gesture Handler
- **EAS Build** / **EAS Update** profiles in `eas.json`

## Quick start

```bash
npm install
npm start          # Expo dev server (press i / a / w)
npm run web        # Web only
```

| Script | Purpose |
|--------|---------|
| `npm start` | Dev client / Expo Go |
| `npm run ios` / `npm run android` | Native targets via Expo |
| `npm run web` | Browser |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Jest rules-engine matrix |
| `npm run export:web` | Static web export smoke |

Node **20+** required (`engines` in `package.json`).

## Project layout

- `src/features/welcome` — title / play CTA
- `src/features/game` — playground UI, drag-drop, seats, **rules engine**
- `src/shared` — theme + Button / Text / Screen
- `src/assets/cards` — per-card PNGs
- `eas.json` — EAS Build + Update profiles
- `.github/workflows/ci.yml` — PR checks

## EAS Build & Update

Profiles (see `eas.json`):

| Profile | Use |
|---------|-----|
| `development` | Dev client, internal, simulator/APK |
| `preview` | Internal distribution, channel `preview` |
| `production` | Store/channel `production`, remote app version bump |

### One-time Expo dashboard setup (you must do this)

1. Install CLI if needed: `npm i -g eas-cli` (or use `npx eas-cli`).
2. Log in: `eas login`.
3. Link the app: `eas init` (or `eas build:configure`) — this writes a real **`extra.eas.projectId`** into `app.json` and sets `updates.url` to `https://u.expo.dev/<projectId>`. Replace the `YOUR_EAS_PROJECT_ID` placeholders.
4. Ensure the Expo project owns bundle id / package: `com.pithekantroparium.ngadongfag`.
5. For store submit, configure Apple / Google credentials in the Expo dashboard or via `eas credentials` (do not commit secrets).

### Common commands

```bash
eas build --profile preview --platform all
eas build --profile production --platform all
eas update --channel preview --message "describe change"
eas update --channel production --message "describe change"
```

`runtimeVersion.policy` is `appVersion` — bump `expo.version` in `app.json` when native binary compatibility changes so Update channels stay aligned.

### Secrets / env

- **No app secrets are required** for local play or the Jest suite.
- CI uses only public npm installs (`npm ci`); no Expo tokens needed for lint/tsc/test/web export.
- For **EAS Build/Update from CI or your machine**, authenticate with your Expo account (`EXPO_TOKEN` from [expo.dev → Access tokens](https://expo.dev/settings/access-tokens) if using non-interactive CI). Do not commit tokens.
- Optional profile `env.APP_ENV` is informational only today.

## CI

GitHub Action `.github/workflows/ci.yml` runs on pull requests and pushes to `develop` / `main` / `master`:

1. `npm ci`
2. `npm run lint`
3. `npm run typecheck`
4. `npm test`
5. `npm run export:web`

## License / product note

Personal / table game port. Rules wording and foul taxonomy belong in the rules spec, not in marketing copy.
