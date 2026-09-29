/* Service worker da Torre Infinita.
   - Arquivos com hash em /_next/static: cache primeiro (nunca mudam).
   - Páginas: rede primeiro, com cópia guardada para quando estiver offline.
   - Outros arquivos do próprio site (ícones, manifesto): usa a cópia e atualiza em segundo plano.
   - Outros domínios (Supabase): não intercepta; o app cuida da fila offline. */
const VERSAO = "v1";
const CACHE = `torre-${VERSAO}`;
const PAGINAS = ["/", "/professor"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => Promise.allSettled(PAGINAS.map((p) => c.add(p)))).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((chaves) => Promise.all(chaves.filter((k) => k.startsWith("torre-") && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

// A página informa os arquivos que já carregou, para que o app abra offline mesmo na primeira visita.
self.addEventListener("message", (event) => {
  if (event.data?.tipo !== "guardar" || !Array.isArray(event.data.urls)) return;
  const mesmoSite = event.data.urls.filter((u) => typeof u === "string" && new URL(u, self.location).origin === self.location.origin);
  event.waitUntil(caches.open(CACHE).then((c) => Promise.allSettled(mesmoSite.map((u) => c.add(u)))));
});

async function redePrimeiro(req) {
  const cache = await caches.open(CACHE);
  try {
    const r = await Promise.race([fetch(req), new Promise((_, rej) => setTimeout(() => rej(new Error("lento")), 4000))]);
    if (r.ok) cache.put(req, r.clone());
    return r;
  } catch {
    return (await cache.match(req)) || (await cache.match("/")) || Response.error();
  }
}

async function cachePrimeiro(req) {
  const cache = await caches.open(CACHE);
  const guardado = await cache.match(req);
  if (guardado) return guardado;
  const r = await fetch(req);
  if (r.ok) cache.put(req, r.clone());
  return r;
}

async function usaEAtualiza(req) {
  const cache = await caches.open(CACHE);
  const guardado = await cache.match(req);
  const rede = fetch(req).then((r) => { if (r.ok) cache.put(req, r.clone()); return r; }).catch(() => null);
  return guardado || (await rede) || Response.error();
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (req.mode === "navigate") { event.respondWith(redePrimeiro(req)); return; }
  if (url.pathname.startsWith("/_next/static/")) { event.respondWith(cachePrimeiro(req)); return; }
  if (url.pathname.startsWith("/_next/") || url.pathname.startsWith("/api/")) return;
  event.respondWith(usaEAtualiza(req));
});
