// Sala de Juegos: funciona sin conexión.
// Al cambiar cualquier archivo, subí la versión para que los celulares tomen lo nuevo.
const CACHE='sala-v3.7.0';
const FILES=['./','index.html','manifest.json','icon-192.png','icon-512.png',
  'games/blackjack/index.html','games/blackjack/icon-192.png',
  'games/crucigrama/index.html','games/crucigrama/icon-192.png',
  'games/engranajes/index.html','games/engranajes/icon-192.png',
  'games/mapa/index.html','games/mapa/icon-192.png',
  'games/puentes/index.html','games/puentes/icon-192.png',
  'games/piramide/index.html','games/piramide/icon-192.png',
  'games/encastre/index.html','games/encastre/icon-192.png',
  'games/desenredo/index.html','games/desenredo/icon-192.png',
  'games/bloques/index.html','games/bloques/icon-192.png',
  'games/rueda/index.html','games/rueda/icon-192.png',
  'games/2048/index.html','games/2048/icon-192.png',
  'games/minas/index.html','games/minas/icon-192.png',
  'games/cinco/index.html','games/cinco/icon-192.png',
  'games/atasco/index.html','games/atasco/icon-192.png',
  'games/spider/index.html','games/spider/icon-192.png',
  'fuentes/pixel-400.woff2','fuentes/pixel-700.woff2'];
self.addEventListener('install',e=>{
  // cache:'reload' evita guardar copias viejas que el navegador tenga en su caché HTTP
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES.map(f=>new Request(f,{cache:'reload'})))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;
  const save=res=>{if(res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(r,copy));}return res;};
  // páginas: primero internet (siempre la última versión); sin conexión, la copia guardada
  if(r.mode==='navigate'){
    e.respondWith(fetch(r,{cache:'no-cache'}).then(save).catch(()=>caches.match(r,{ignoreSearch:true}).then(hit=>hit||caches.match('index.html'))));
    return;
  }
  // íconos y demás: primero la copia guardada
  e.respondWith(caches.match(r,{ignoreSearch:true}).then(hit=>hit||fetch(r).then(save)));
});
