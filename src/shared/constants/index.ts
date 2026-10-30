/** Shared size/layout constants for cards and screens. Card enums live in the
 * engine domain (`@features/game/engine/cards`); this module stays UI-only and
 * does not depend on feature code. */

export const CardWidth = 96;
export const cardHeight = 150;
/** Each card to the right covers this fraction of the card on its left. */
export const CardFanOverlap = 0.5;
/** FlatList / fan stride so neighbors overlap by CardFanOverlap. */
export const CardFanStride = CardWidth * (1 - CardFanOverlap);

export const SCREENS: { HOME: "Home"; PLAYGROUND: "Playground" } = {
  HOME: "Home",
  PLAYGROUND: "Playground",
};
