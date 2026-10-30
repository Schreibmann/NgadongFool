// Static Metro asset map for the v2 prehistoric table (copied from
// prehistoric_card_game_assets_v2). Keep require() paths literal.
export const tableAssets = {
  avatars: {
    ivan: require("./avatars/ivan.png"),
    sebastian: require("./avatars/sebastian.png"),
    gosha: require("./avatars/gosha.png"),
    alternate: require("./avatars/alternate_character.png"),
  },
  backgrounds: {
    earthBlurred: require("./backgrounds/earth_rock_blurred.png"),
  },
  boards: {
    caveMural: require("./boards/cave_mural_header.png"),
    stoneTable: require("./boards/stone_table_surface.png"),
  },
  cards: {
    deck: require("./cards/card_back_deck.png"),
  },
  decor: {
    bones: require("./decor/bone_pair.png"),
    torch: require("./decor/torch.png"),
    spear: require("./decor/stone_spear.png"),
    rockCluster: require("./decor/rock_cluster.png"),
    rockAngular: require("./decor/rock_angular.png"),
    handprint: require("./decor/handprint_plaque.png"),
  },
  icons: {
    players: require("./icons/players.png"),
    wifi: require("./icons/wifi.png"),
    settings: require("./icons/settings.png"),
    crown: require("./icons/crown.png"),
    sound: require("./icons/sound.png"),
    info: require("./icons/info.png"),
  },
  panels: {
    headerSmall: require("./panels/stone_header_small.png"),
    headerWide: require("./panels/stone_header_wide.png"),
    nameplate: require("./panels/stone_nameplate.png"),
    boneFrame: require("./panels/bone_frame_wide.png"),
    woodButton: require("./panels/wood_action_button.png"),
    roundBadge: require("./panels/stone_round_badge.png"),
    stonePlate: require("./panels/irregular_stone_plate.png"),
  },
} as const;

/** Source pixel sizes (manifest.json) and horizontal cap widths for 3-slice
 * stretching: caps keep their aspect, only the middle strip stretches. */
export const panelSlices = {
  headerSmall: { width: 331, height: 181, cap: 70 },
  headerWide: { width: 867, height: 194, cap: 80 },
  nameplate: { width: 450, height: 182, cap: 80 },
  boneFrame: { width: 1108, height: 255, cap: 200 },
  woodButton: { width: 608, height: 220, cap: 110 },
  roundBadge: { width: 175, height: 178, cap: 0 },
  stonePlate: { width: 680, height: 275, cap: 120 },
} as const;

export type PanelKind = keyof typeof panelSlices;
