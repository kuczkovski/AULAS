/* Service worker do Treino Full Body (gerado por scripts/generate-sw.mjs).
   Estratégia: todo o app estático é pré-armazenado na instalação, o que
   permite abrir qualquer tela offline. Dados do usuário ficam no IndexedDB
   e são sincronizados pelo próprio app quando houver conexão. */
const VERSION = "__VERSION__";
const CACHE = `treino-${VERSION}`;
const PRECACHE = __PRECACHE__;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k.startsWith("treino-") && k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

// A página pede a ativação imediata quando o usuário aceita atualizar.
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

function normalizePath(url) {
  let p = url.pathname;
  if (!p.endsWith("/") && !/\.[a-z0-9]+$/i.test(p)) p += "/";
  return p;
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Supabase e outros domínios: rede direta.

  // O roteador do Next faz HEAD nas rotas ao pré-carregar links.
  if (req.method === "HEAD") {
    event.respondWith(
      (async () => {
        const hit = await caches.match(normalizePath(url), { cacheName: CACHE });
        if (hit) return new Response(null, { status: hit.status, headers: hit.headers });
        return fetch(req);
      })(),
    );
    return;
  }
  if (req.method !== "GET") return;

  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE);
        const hit = (await cache.match(normalizePath(url))) || (await cache.match(normalizePath(url) + "index.html"));
        if (hit) return hit;
        try {
          return await fetch(req);
        } catch {
          return (await cache.match("/")) || Response.error();
        }
      })(),
    );
    return;
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      // Payloads RSC (?_rsc=...) são arquivos estáticos: ignora a query.
      const hit = await cache.match(req, { ignoreSearch: url.searchParams.has("_rsc") });
      if (hit) return hit;
      try {
        const res = await fetch(req);
        if (res.ok && res.type === "basic") cache.put(req, res.clone()).catch(() => undefined);
        return res;
      } catch {
        return Response.error();
      }
    })(),
  );
});
