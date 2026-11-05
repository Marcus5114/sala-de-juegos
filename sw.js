// Sala de Juegos: funciona sin conexión.
// Al cambiar cualquier archivo, subí la versión para que los celulares tomen lo nuevo.
const CACHE='sala-v2.4.1';
const FILES=['./','index.html','manifest.json','icon-192.png','icon-512.png',
  'games/spider/index.html','games/spider/icon-192.png',
  'games/atasco/index.html','games/atasco/icon-192.png'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
// primero la caché; lo que no esté se busca en la red y se guarda para la próxima
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;
  e.respondWith(caches.match(r,{ignoreSearch:true}).then(hit=>hit||fetch(r).then(res=>{
    if(res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(r,copy));}
    return res;
  })));
});
