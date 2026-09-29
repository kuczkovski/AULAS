// Servidor estático mínimo para testar o build de produção (pasta out/).
// Uso: npm run build && npm start  →  http://localhost:3000
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const ROOT = "out";
const PORT = Number(process.env.PORT ?? 3000);
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".txt": "text/x-component; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

async function resolve(pathname) {
  const safe = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, "");
  let file = join(ROOT, safe);
  try {
    if ((await stat(file)).isDirectory()) file = join(file, "index.html");
    await stat(file);
    return file;
  } catch {
    try {
      await stat(file + "/index.html");
      return null; // diretório sem barra final → redireciona
    } catch {
      return undefined;
    }
  }
}

createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  const file = await resolve(url.pathname);
  if (file === null) {
    res.writeHead(308, { Location: url.pathname + "/" + url.search }).end();
    return;
  }
  if (!file) {
    res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" }).end(await readFile(join(ROOT, "404.html")).catch(() => "404"));
    return;
  }
  const headers = { "Content-Type": TYPES[extname(file)] ?? "application/octet-stream" };
  if (file.endsWith("sw.js")) headers["Cache-Control"] = "no-cache";
  res.writeHead(200, headers).end(await readFile(file));
}).listen(PORT, () => console.log(`Servindo ${ROOT}/ em http://localhost:${PORT}`));
