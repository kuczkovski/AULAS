// Gera os ícones do PWA a partir do desenho em SVG, usando o Chromium.
// Uso (precisa de playwright-core e de um Chromium instalado):
//   CHROMIUM=/caminho/do/chromium node scripts/gerar-icones.mjs
import { chromium } from "playwright-core";
import { mkdirSync, writeFileSync } from "node:fs";

/** Torre de três andares com uma bandeira. `folga` reduz o desenho para a zona segura do ícone "maskable". */
const desenho = (folga) => `
  <g transform="translate(256 256) scale(${folga}) translate(-256 -256)">
    <rect x="252" y="70" width="8" height="92" rx="4" fill="#ffc21a"/>
    <path d="M260 74 L330 98 L260 122 Z" fill="#ffc21a"/>
    <rect x="176" y="156" width="160" height="60" rx="14" fill="#fff"/>
    <rect x="146" y="228" width="220" height="60" rx="14" fill="#fff"/>
    <rect x="116" y="300" width="280" height="60" rx="14" fill="#fff"/>
    <g fill="#5b3df5" opacity=".85">
      <rect x="220" y="174" width="16" height="24" rx="4"/><rect x="276" y="174" width="16" height="24" rx="4"/>
      <rect x="190" y="246" width="16" height="24" rx="4"/><rect x="248" y="246" width="16" height="24" rx="4"/><rect x="306" y="246" width="16" height="24" rx="4"/>
      <rect x="160" y="318" width="16" height="24" rx="4"/><rect x="220" y="318" width="16" height="24" rx="4"/><rect x="276" y="318" width="16" height="24" rx="4"/><rect x="336" y="318" width="16" height="24" rx="4"/>
    </g>
    <rect x="96" y="372" width="320" height="18" rx="9" fill="#ffffff" opacity=".55"/>
  </g>`;

const svg = (raio, folga) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7a5cff"/><stop offset="1" stop-color="#4429d1"/></linearGradient></defs>
  <rect width="512" height="512" rx="${raio}" fill="url(#g)"/>${desenho(folga)}</svg>`;

mkdirSync("public/icons", { recursive: true });
writeFileSync("public/icons/icon.svg", svg(112, 1));
writeFileSync("src/app/icon.svg", svg(112, 1));

const saidas = [
  ["public/icons/icon-192.png", 192, svg(112, 1)],
  ["public/icons/icon-512.png", 512, svg(112, 1)],
  ["public/icons/maskable-512.png", 512, svg(0, 0.78)],
  ["src/app/apple-icon.png", 180, svg(0, 0.86)],
];
const b = await chromium.launch({ executablePath: process.env.CHROMIUM, args: ["--no-sandbox"] });
for (const [arq, tam, conteudo] of saidas) {
  const p = await b.newPage({ viewport: { width: tam, height: tam } });
  await p.setContent(`<body style="margin:0;background:transparent">${conteudo.replace("<svg ", `<svg width="${tam}" height="${tam}" `)}</body>`);
  await p.screenshot({ path: arq, omitBackground: true });
  await p.close();
  console.log("gerado", arq);
}
await b.close();
