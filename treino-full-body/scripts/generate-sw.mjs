// Gera out/sw.js com a lista de todos os arquivos do export estático.
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

const OUT = "out";
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const hash = createHash("sha256");
const urls = new Set();
for (const file of walk(OUT).sort()) {
  const rel = relative(OUT, file).split(sep).join("/");
  if (rel === "sw.js" || rel.endsWith(".map") || rel.startsWith("404")) continue;
  hash.update(rel).update(readFileSync(file));
  if (rel.endsWith("index.html")) {
    urls.add(BASE + "/" + rel.slice(0, -"index.html".length)); // "/programa/"
  } else {
    urls.add(BASE + "/" + rel);
  }
}

const version = hash.digest("hex").slice(0, 12);
const template = readFileSync("scripts/sw-template.js", "utf8");
const sw = template.replace("__VERSION__", version).replace("__BASE__", BASE).replace("__PRECACHE__", JSON.stringify([...urls].sort(), null, 2));
writeFileSync(join(OUT, "sw.js"), sw);
console.log(`Service worker gerado: ${urls.size} arquivos, versão ${version}`);
