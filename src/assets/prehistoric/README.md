# Prehistoric Card Game — React Native Asset Pack

PNG assets separated from the generated visual asset sheets. Most UI graphics have transparent backgrounds after background-key removal.

## Contents

- `backgrounds/` — cave-board mural element.
- `avatars/` — individually framed characters.
- `panels/` — blank stone panels and decorative banner.
- `icons/` — settings, audio, connectivity, player, and action icons.
- `decor/` — handprint, medallions, torch, spear, bone divider and props.
- `card_back/` — card back and overlapping deck stack.
- `reference_only/` — example faces for visual reference only; do not use for actual card rank/suit rendering.

## Integration guidance

- Render all interface text, player names, card ranks/suits, counters, and game states with React Native components; avoid text baked into images.
- Use `resizeMode="stretch"` or a 9-slice approach for blank panels. For the board mural, prefer `cover` or a clipped `contain` layout depending on the target aspect ratio.
- Keep card faces data-driven: render ranks, suits, and court cards from the game state rather than using the reference images.
- For mobile, use `StyleSheet.absoluteFillObject` for the background and scale player portraits/panels based on available width.
- Images are PNG; dimensions and recommended use are listed in `manifest.json`.

## Notes

These are stylized generated concept assets, not a fully hand-authored production sprite library. Inspect them at target device scale before shipping; the checkerboard backdrop was removed automatically and a few edges may need touch-up if you notice a halo.
