// Gera os ícones PNG do PWA sem dependências externas (rasterização simples
// de retângulos arredondados com supersampling). Uso: npm run icons
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";

const BG = [10, 12, 15];
const FG = [198, 244, 50];

// Haltere em coordenadas normalizadas (0..1), dentro da zona segura de ícones "maskable".
const SHAPES = [
  { x: 0.2, y: 0.47, w: 0.6, h: 0.06, r: 0.03 }, // barra
  { x: 0.26, y: 0.33, w: 0.08, h: 0.34, r: 0.03 }, // anilha grande esq.
  { x: 0.66, y: 0.33, w: 0.08, h: 0.34, r: 0.03 }, // anilha grande dir.
  { x: 0.2, y: 0.39, w: 0.05, h: 0.22, r: 0.02 }, // anilha pequena esq.
  { x: 0.75, y: 0.39, w: 0.05, h: 0.22, r: 0.02 }, // anilha pequena dir.
];

function inRoundRect(px, py, s) {
  if (px < s.x || px > s.x + s.w || py < s.y || py > s.y + s.h) return false;
  const cx = Math.min(Math.max(px, s.x + s.r), s.x + s.w - s.r);
  const cy = Math.min(Math.max(py, s.y + s.r), s.y + s.h - s.r);
  return (px - cx) ** 2 + (py - cy) ** 2 <= s.r ** 2;
}

function render(size, { rounded }) {
  const SS = 4;
  const rows = [];
  const corner = rounded ? 0.22 : 0;
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 4);
    for (let x = 0; x < size; x++) {
      let fg = 0;
      let inside = 0;
      for (let sy = 0; sy < SS; sy++)
        for (let sx = 0; sx < SS; sx++) {
          const px = (x + (sx + 0.5) / SS) / size;
          const py = (y + (sy + 0.5) / SS) / size;
          if (!rounded || inRoundRect(px, py, { x: 0, y: 0, w: 1, h: 1, r: corner })) inside++;
          if (SHAPES.some((s) => inRoundRect(px, py, s))) fg++;
        }
      const a = fg / (SS * SS);
      const o = 1 + x * 4;
      for (let c = 0; c < 3; c++) row[o + c] = Math.round(BG[c] * (1 - a) + FG[c] * a);
      row[o + 3] = Math.round((inside / (SS * SS)) * 255);
    }
    rows.push(row);
  }
  return png(size, Buffer.concat(rows));
}

const CRC = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(size, raw) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

mkdirSync("public/icons", { recursive: true });
writeFileSync("public/icons/icon-192.png", render(192, { rounded: true }));
writeFileSync("public/icons/icon-512.png", render(512, { rounded: true }));
writeFileSync("public/icons/maskable-512.png", render(512, { rounded: false }));
writeFileSync("public/icons/apple-touch-icon.png", render(180, { rounded: false }));
console.log("Ícones gerados em public/icons");
