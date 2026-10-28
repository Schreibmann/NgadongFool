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

## Project structure

Feature-sliced layout. Dependency direction: the rules engine and `shared`
do not import from UI code; UI composes both.

```text
src/
├── features/
│   ├── welcome/                     # Экран приветствия: выбор 3–6 игроков, колода 36/52, CTA «Играть»
│   │   └── welcome-screen.tsx
│   └── game/
│       ├── engine/                  # Чистый TS-движок правил (без React)
│       │   ├── cards.ts            # Домен: CardRanks / CardSuits (единственный источник)
│       │   ├── types.ts            # Phase, Foul, GameState, EnginePlayer, StartOptions
│       │   ├── deck.ts             # Колода 36, Mulberry32 RNG, shuffle
│       │   ├── seats.ts            # Круговая механика мест (по часовой)
│       │   ├── rules.ts            # Чистые правила: canBeat, canPlaceOnTop, 6→ace
│       │   ├── engine.ts           # GameEngine — фасад/арбитр фаз Deal→Prepare→Huyovye→Main→Ended
│       │   ├── phases/
│       │   │   └── dealing.ts      # buildInitialGameState + dealStage (чистые функции)
│       │   ├── cpu/
│       │   │   ├── director.ts     # CpuDirector: CPU ходит только через легальный API хоста
│       │   │   ├── ai.ts           # Эвристики: pickLead, pickBeater, mistake rate
│       │   │   └── loop-guard.ts   # Анти-зацикливание Main (fingerprint streak)
│       │   ├── index.ts            # Публичные экспорты движка
│       │   └── __tests__/          # Jest-матрица правил (9 файлов, 82 теста)
│       ├── components/
│       │   ├── card/               # Card (Reanimated flip), card-images (36 PNG + back)
│       │   ├── drag-drop/          # DragProvider / Draggable / DropZone (overlay ghost)
│       │   └── ui/                 # Экранные блоки: StatusBox, баннеры, OpponentSlot,
│       │                           # TurnActionButtons, to-ui-card
│       ├── hooks/
│       │   ├── use-cpu-driver.ts   # CPU driver pulse from the UI (450 ms, per phase)
│       │   └── use-prepare-turn.ts # Prepare-phase selectors + human auto-draw
│       ├── playground-screen.tsx   # Игровой стол (композиция ui/*-компонентов)
│       ├── use-game-engine.ts      # useSyncExternalStore поверх GameEngine.subscribe
│       └── players.ts              # Составы: 1 человек + 4–5 CPU, аватары
├── shared/
│   ├── components/                 # Screen / Button / Text (пере-используемые)
│   ├── theme/                      # Палитра, типографика, spacing
│   └── constants/                  # Размеры карт, SCREENS (UI-only, без feature-зависимостей)
├── navigation/                     # Welcome → Playground (stack)
├── i18n/                           # i18n-js, ru.json, типизированные tx-ключи
└── types/                          # Дополнения типов
```

Ключевые инварианты архитектуры:

- **The engine is the arbiter.** Every player/CPU action is validated inside
  `GameEngine`; the UI never duplicates rules — it reads immutable snapshots
  via `useSyncExternalStore` and asks the engine through
  `peekFirstPrepareTarget` and public methods.
- **CPU never mutates state directly.** `CpuDirector` acts only through the
  host's legal API (`drawPrepare`, `playMain`, `takeBottom`, …), so fouls and
  turn advancement remain the engine's prerogative.
- **Immutable snapshots.** Every engine mutation publishes a new state object
  (cloned in `emit()`); UI subscribers render from snapshot data.
- **No UI imports inside the domain.** Card enums live in `engine/cards.ts`;
  `components/card/card.props.ts` merely re-exports them.

## Project layout (additional)

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

## Vercel (web)

Repo `vercel.json` pins the modern Expo static export (do **not** use legacy `expo build:web`):

| Setting | Value |
|---------|--------|
| Install Command | `npm ci` |
| Build Command | `npx expo export --platform web` |
| Output Directory | `dist` |
| Framework Preset | Other / no framework |

SPA fallback rewrite → `/index.html` is included. If the dashboard overrides these fields, match the table above (or clear overrides so `vercel.json` wins). Scripts `build:web` / `vercel-build` alias the same export for older templates.

## License / product note

Personal / table game port. Rules wording and foul taxonomy belong in the rules spec, not in marketing copy.
