/* Compose a 4×4 contact sheet of the generated low-rank cards for review. */
const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");

function decodePNG(file) {
  const b = fs.readFileSync(file);
  let off = 8,
    w = 0,
    h = 0,
    idat = [],
    colorType = 0;
  while (off < b.length) {
    const len = b.readUInt32BE(off);
    const type = b.toString("ascii", off + 4, off + 8);
    const data = b.slice(off + 8, off + 8 + len);
    if (type === "IHDR") {
      w = data.readUInt32BE(0);
      h = data.readUInt32BE(4);
      colorType = data[9];
    }
    if (type === "IDAT") idat.push(data);
    off += 12 + len;
  }
  const bpp = colorType === 6 ? 4 : 3;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = w * bpp;
  const out = Buffer.alloc(h * stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)];
    const line = raw.slice(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? out[y * stride + x - bpp] : 0;
      const bb = y > 0 ? out[(y - 1) * stride + x] : 0;
      const c = x >= bpp && y > 0 ? out[(y - 1) * stride + x - bpp] : 0;
      let v = line[x];
      if (f === 1) v += a;
      else if (f === 2) v += bb;
      else if (f === 3) v += (a + bb) >> 1;
      else if (f === 4) {
        const pa = Math.abs(bb - c),
          pb = Math.abs(a - c),
          pc = Math.abs(a + bb - 2 * c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? bb : c;
      }
      out[y * stride + x] = v & 255;
    }
  }
  return { w, h, bpp, out };
}

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
  for (let i = 0; i < buf.length; i++)
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
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
    raw[y * (1 + w * 4)] = 0;
    rgba.copy(raw, y * (1 + w * 4) + 1, y * w * 4, (y + 1) * w * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const cards = path.join(__dirname, "..", "src", "assets", "cards");
const suits = ["spades", "clubs", "diamonds", "hearts"];
const ranks = ["two", "three", "four", "five"];

const GAP = 8;
const CW = 96,
  CH = 150;
const COLS = suits.length,
  ROWS = ranks.length;
const sheetW = COLS * CW + (COLS + 1) * GAP;
const sheetH = ROWS * CH + (ROWS + 1) * GAP;
const sheet = Buffer.alloc(sheetW * sheetH * 4);
const bg = [30, 77, 43];
for (let i = 0; i < sheet.length; i += 4) {
  sheet[i] = bg[0];
  sheet[i + 1] = bg[1];
  sheet[i + 2] = bg[2];
  sheet[i + 3] = 255;
}

for (let r = 0; r < ROWS; r++) {
  for (let c = 0; c < COLS; c++) {
    const img = decodePNG(path.join(cards, `${suits[c]}-${ranks[r]}.png`));
    const ox = GAP + c * (CW + GAP);
    const oy = GAP + r * (CH + GAP);
    for (let y = 0; y < CH; y++) {
      for (let x = 0; x < CW; x++) {
        const si = (y * img.w + x) * img.bpp;
        const a = img.bpp === 4 ? img.out[si + 3] / 255 : 1;
        if (a <= 0) continue;
        const di = ((oy + y) * sheetW + ox + x) * 4;
        sheet[di] = Math.round(img.out[si] * a + sheet[di] * (1 - a));
        sheet[di + 1] = Math.round(
          img.out[si + 1] * a + sheet[di + 1] * (1 - a)
        );
        sheet[di + 2] = Math.round(
          img.out[si + 2] * a + sheet[di + 2] * (1 - a)
        );
      }
    }
  }
}

const out = path.join(__dirname, "preview-low-rank-cards.png");
fs.writeFileSync(out, encodePNG(sheetW, sheetH, sheet));
console.log(`wrote ${out} (${sheetW}x${sheetH})`);
