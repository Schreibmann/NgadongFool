/*
 * Generates the 16 missing low-rank card PNGs (ranks 2–5 × 4 suits) in the
 * style of the existing deck: 96×150 RGBA, white face, thin rounded black
 * border, corner rank index (top-left + rotated bottom-right), big suit
 * symbol in the center. Pure Node (zlib), no dependencies.
 *
 * Run: node scripts/generate-low-rank-cards.cjs
 */
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

// ——— PNG encoder (RGBA, bit depth 8, filter 0) ———

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}

function encodePNG(w, h, rgba) {
  const raw = Buffer.alloc(h * (1 + w * 4));
  for (let y = 0; y < h; y++) {
    raw[y * (1 + w * 4)] = 0; // filter: none
    rgba.copy(raw, y * (1 + w * 4) + 1, y * w * 4, (y + 1) * w * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ——— Canvas helpers ———

function makeCanvas(w, h) {
  return { w, h, px: Buffer.alloc(w * h * 4) };
}

/** Blend src color with coverage 0..1 over the canvas pixel. */
function blend(cv, x, y, [r, g, b], cov) {
  if (cov <= 0) return;
  const i = (y * cv.w + x) * 4;
  const a0 = cv.px[i + 3] / 255;
  const a1 = Math.min(1, cov);
  const outA = a1 + a0 * (1 - a1);
  if (outA <= 0) return;
  cv.px[i] = Math.round((r * a1 + cv.px[i] * a0 * (1 - a1)) / outA);
  cv.px[i + 1] = Math.round((g * a1 + cv.px[i + 1] * a0 * (1 - a1)) / outA);
  cv.px[i + 2] = Math.round((b * a1 + cv.px[i + 2] * a0 * (1 - a1)) / outA);
  cv.px[i + 3] = Math.round(outA * 255);
}

/**
 * Render an analytic inside(x, y) shape with supersample anti-aliasing.
 * inside gets final-resolution coordinates.
 */
function drawShape(cv, inside, color, ss = 3) {
  for (let y = 0; y < cv.h; y++) {
    for (let x = 0; x < cv.w; x++) {
      let cov = 0;
      for (let sy = 0; sy < ss; sy++) {
        for (let sx = 0; sx < ss; sx++) {
          if (inside(x + (sx + 0.5) / ss, y + (sy + 0.5) / ss)) cov += 1;
        }
      }
      if (cov > 0) blend(cv, x, y, color, cov / (ss * ss));
    }
  }
}

// ——— Card style constants (matched to the existing deck) ———

const W = 96;
const H = 150;
const CORNER_R = 10;
const BORDER = 2;
const FACE = [255, 255, 255];
const EDGE = [17, 17, 17];
const BLACK = [16, 16, 16];
const RED = [224, 8, 8];

function inRoundedRect(x, y, x0, y0, x1, y1, r) {
  if (x < x0 || x > x1 || y < y0 || y > y1) return false;
  const dx = Math.max(x0 + r - x, 0, x - (x1 - r));
  const dy = Math.max(y0 + r - y, 0, y - (y1 - r));
  return dx * dx + dy * dy <= r * r;
}

function cardBase(cv) {
  // Face + border: outer rounded rect (transparent outside), border band black.
  const m = 0.5;
  drawShape(
    cv,
    (x, y) => {
      if (!inRoundedRect(x, y, m, m, W - m, H - m, CORNER_R)) return false;
      return !inRoundedRect(x, y, m + BORDER, m + BORDER, W - m - BORDER, H - m - BORDER, CORNER_R - BORDER);
    },
    EDGE,
  );
  drawShape(
    cv,
    (x, y) => inRoundedRect(x, y, m + BORDER, m + BORDER, W - m - BORDER, H - m - BORDER, CORNER_R - BORDER),
    FACE,
  );
}

// ——— 5×7 pixel font for the corner index ———

const FONT = {
  2: [".###.", "#...#", "....#", "..##.", ".#...", "#....", "#####"],
  3: [".###.", "#...#", "....#", "..##.", "....#", "#...#", ".###."],
  4: ["...#.", "..##.", ".#.#.", "#..#.", "#####", "...#.", "...#."],
  5: ["#####", "#....", "####.", "....#", "....#", "#...#", ".###."],
};

function drawGlyph(cv, digit, ox, oy, scale, color, flip) {
  const rows = FONT[digit];
  const h = rows.length;
  for (let gy = 0; gy < h; gy++) {
    const row = rows[flip ? h - 1 - gy : gy];
    for (let gx = 0; gx < row.length; gx++) {
      const on = row[flip ? row.length - 1 - gx : gx] === "#";
      if (!on) continue;
      for (let sy = 0; sy < scale; sy++) {
        for (let sx = 0; sx < scale; sx++) {
          blend(cv, ox + gx * scale + sx, oy + gy * scale + sy, color, 1);
        }
      }
    }
  }
}

// ——— Suit symbols (unit-space analytic shapes, supersampled) ———

const inCircle = (x, y, cx, cy, r) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r;

function inTriangle(x, y, ax, ay, bx, by, cx, cy) {
  const s = (bx - ax) * (y - ay) - (by - ay) * (x - ax);
  const t = (cx - bx) * (y - by) - (cy - by) * (x - bx);
  const u = (ax - cx) * (y - cy) - (ay - cy) * (x - cx);
  return (s >= 0 && t >= 0 && u >= 0) || (s <= 0 && t <= 0 && u <= 0);
}

const SHAPES = {
  hearts(x, y) {
    return (
      inCircle(x, y, 0.3, 0.34, 0.235) ||
      inCircle(x, y, 0.7, 0.34, 0.235) ||
      inTriangle(x, y, 0.075, 0.44, 0.925, 0.44, 0.5, 1.0)
    );
  },
  spades(x, y) {
    return (
      inCircle(x, y, 0.3, 0.66, 0.235) ||
      inCircle(x, y, 0.7, 0.66, 0.235) ||
      inTriangle(x, y, 0.075, 0.56, 0.925, 0.56, 0.5, 0.0) ||
      (x >= 0.44 && x <= 0.56 && y >= 0.55 && y <= 1.0)
    );
  },
  diamonds(x, y) {
    return inTriangle(x, y, 0.5, 0.0, 0.98, 0.5, 0.5, 1.0) ||
      inTriangle(x, y, 0.5, 0.0, 0.02, 0.5, 0.5, 1.0);
  },
  clubs(x, y) {
    return (
      inCircle(x, y, 0.5, 0.26, 0.235) ||
      inCircle(x, y, 0.28, 0.6, 0.235) ||
      inCircle(x, y, 0.72, 0.6, 0.235) ||
      (x >= 0.44 && x <= 0.56 && y >= 0.55 && y <= 1.0)
    );
  },
};

function drawSuit(cv, suit, color, size) {
  const shape = SHAPES[suit];
  const x0 = Math.round((W - size) / 2);
  const y0 = Math.round((H - size) / 2);
  drawShape(cv, (x, y) => shape((x - x0) / size, (y - y0) / size), color);
}

// ——— Generate ———

const OUT = path.join(__dirname, "..", "src", "assets", "cards");
const RANK_NAMES = { 2: "two", 3: "three", 4: "four", 5: "five" };
const SUIT_COLOR = {
  spades: BLACK,
  clubs: BLACK,
  hearts: RED,
  diamonds: RED,
};
const GLYPH_SCALE = 2;

for (const suit of ["spades", "clubs", "diamonds", "hearts"]) {
  for (const rank of [2, 3, 4, 5]) {
    const cv = makeCanvas(W, H);
    cardBase(cv);
    const color = SUIT_COLOR[suit];
    drawGlyph(cv, rank, 6, 6, GLYPH_SCALE, color, false);
    drawGlyph(
      cv,
      rank,
      W - 6 - 5 * GLYPH_SCALE,
      H - 6 - 7 * GLYPH_SCALE,
      GLYPH_SCALE,
      color,
      true,
    );
    drawSuit(cv, suit, color, 52);
    const file = path.join(OUT, `${suit}-${RANK_NAMES[rank]}.png`);
    fs.writeFileSync(file, encodePNG(W, H, cv.px));
    console.log(`wrote ${file}`);
  }
}
console.log("done");
