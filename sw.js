// Sala de Juegos: funciona sin conexión.
// Al cambiar cualquier archivo, subí la versión para que los celulares tomen lo nuevo.
const CACHE='sala-v2.9.0';
const FILES=['./','index.html','manifest.json','icon-192.png','icon-512.png',
  'games/spider/index.html','games/spider/icon-192.png',
  'games/atasco/index.html','games/atasco/icon-192.png',
  'games/cinco/index.html','games/cinco/icon-192.png'];
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
