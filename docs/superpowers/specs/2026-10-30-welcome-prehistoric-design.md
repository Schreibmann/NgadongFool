# Welcome Screen — Prehistoric Cave Design

**Date:** 2026-10-30  
**Scope:** Start / welcome screen only (mobile + desktop). Not playground.  
**Approach:** Compose from existing project assets (`images/*`, `prehistoric`, `prehistoric-v2`). Keep logo and character art.

Source concept: user brief + `pithec_design_spec.md` (palette, type, components).

---

## Goals

- Cave atmosphere aligned with the existing prehistoric table UI.
- Replace flat chips / plastic CTA with stone tablets and a boulder CTA.
- Responsive layouts: portrait mobile stack; desktop 60/40 split with side control panel.
- Preserve `logo.png`, `ng-man.png`, `game-title.png`.

## Non-goals

- Playground / main table redesign.
- New npm font packages (unless explicitly requested later).
- Regenerating logo / character art.
- Installing packages.

---

## Palette (normative)

| Role | HEX |
| --- | --- |
| Cave deep | `#151009` |
| Cave mid | `#2B1D12` |
| Stone | `#7A4A28` / light `#B08050` / shade `#3A2418` |
| Wood | `#4A2E1C` / light `#8A5A2E` |
| Bone text | `#E8DCC3` / muted `#9A8A74` |
| Embers (active) | `#FFC86E` → `#FF8A2E` → `#D93A12` |
| Danger | `#A32618` |

Rule: at most one ember accent in view. Moss (`#9BBE3C`) is status-only — unused on welcome.

## Typography (design target)

| Use | Family (design) | Code interim |
| --- | --- | --- |
| Banner / CTA | Ruslan Display | `Ngadong` |
| Section labels | Podkova SemiBold, ALL CAPS | `Ngadong` / system |
| Digits | Neucha | `Ngadong` |

Text treatments: *carved* (`#3A2418` + 1px light bottom edge) or *charcoal* (`#E8DCC3`) — never mixed on one control.

---

## Layout — Mobile (390×844 portrait)

1. Cave rock background + vignette + light soot.
2. Logo full content width (~358px), taller (~h 100), soft light glow.
3. Character (~38% screen height) + elliptical ground shadow.
4. Game title overlapping character by ~−12px.
5. Label «ИГРОКОВ ЗА СТОЛОМ» + chips 3–6 (gap 10).
6. Label «КАРТ В КОЛОДЕ» + chips 36 / 52.
7. CTA «ДЕГРАДИРОВАТЬ!» ~82% width, h 64; **no crack / horizontal line** through the label; bottom safe-area + 24.

### Chip rules (mobile + desktop)

- **Inactive:** stone-tile texture, rounded rectangle (~56×44 / 64×52), charcoal text. Not circular.
- **Active (selected only):** circular plate with stone/badge texture + ember wash + glow; carved dark text.
- Every chip keeps a visible stone texture fill (never flat solid-only).

## Layout — Desktop (≥1200, 60/40)

- **Left 60%:** larger logo top-left (~480×158); character centered in column; title full column width under character. Cave panorama + side vignette. Torches near column split (~58%) warm-lighting character and panel.
- **Right 40%:** ~380px vertical control panel with **full-panel cave-rock texture** (+ dark wash). Soft drop shadow. **Do not** put separate textured beds under each chip row — the panel itself is the texture. Stack:
  1. Label on wood board («ИГРОКОВ ЗА СТОЛОМ») — board sits *under* the label text (no empty board at panel top).
  2. Player chips (no extra bed).
  3. Label on wood board («КАРТ В КОЛОДЕ»).
  4. Deck chips (no extra bed).
  5. Boulder CTA — **no crack / horizontal line** through the label; textured plate OK if seamless.

---

## Components

### Stone chip (player / deck selectors)

- Irregular stone look via `stone_tile_*` / `stone_round_badge` / similar.
- Inactive: dark granite gradient, charcoal text.
- Active: ember gradient + glow; carved dark text.
- One active chip per group.

### Boulder CTA

- Seamless stone texture (`stone_tile` + wash) — **no mid crack / horizontal line** through the label.
- Carved dark text with light 1px edge.
- Press: slight settle (`translateY`).

### Control panel (desktop)

- Hide/wood panel language from pack; ragged edge preferred if maskable.
- Contains the same chip groups + CTA as mobile.

---

## Asset map (existing)

| Role | Path |
| --- | --- |
| Logo | `src/assets/images/logo.png` |
| Character | `src/assets/images/ng-man.png` |
| Title | `src/assets/images/game-title.png` |
| Cave rock / mural | `prehistoric/backgrounds/*`, `prehistoric-v2/boards/cave_mural_header.png`, `earth_rock_blurred.png` |
| Stone tiles / plates | `prehistoric/panels/*`, `prehistoric-v2/panels/*` |
| Torches | `prehistoric/decor/torch_lit.png`, `prehistoric-v2/decor/torch.png` |
| CTA plate | `prehistoric-v2/panels/irregular_stone_plate.png` |

Do not use the old `button-background.png` as the primary CTA look.

---

## Deliverables

1. Figma file: editable Mobile + Desktop frames composed from uploaded project assets.
2. This spec (approved before implementation plan).
3. Later: React Native welcome implementation (separate plan) — no new installs unless requested.

## Acceptance

- Logo and character recognizable and unchanged.
- Mobile reads as one vertical composition; desktop as 60/40 hero + panel.
- Chips and CTA read as stone/ember, not flat rectangles / plastic PNG bar.
- Palette and ember rule match this doc.

---

## Open for implementation phase

- Exact font files if Ruslan / Podkova / Neucha are added later (user must approve install/embed).
- Optional PNG cutout polish for character (only if alpha is insufficient).
- Motion: ember pulse, CTA crack sparks (polish, not blocking).
