# Ngadong Fool

Card game (Пеньки / «вахта») on **Expo** — iOS, Android, and **web**.

## Stack

- Expo SDK 58 + React Native (Hermes)
- React Navigation (native stack): Welcome → Playground
- `expo-image` cards, Reanimated flip, Gesture Handler drag-and-drop
- EAS Build / Update stubs in `eas.json`

## Scripts

```bash
npm start          # Expo dev server
npm run web        # Web
npm run typecheck  # tsc --noEmit
npm run export:web # Static web export smoke
npm run lint
```

## Project layout

- `src/features/welcome` — welcome screen
- `src/features/game` — playground UI, card assets, drag-drop, `GameController`
- `src/shared` — theme + Button / Text / Screen
- `src/assets/cards` — per-card PNGs (sprite atlas split)

## Notes

Game rules engine rewrite is a follow-up (Phase 3). Current `GameController` still implements the simplified draft logic.
