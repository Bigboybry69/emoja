const CACHE = 'emoja-shell-v8';
const ROOT = new URL('./', self.location.href);
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const response = await fetch(ROOT, {cache:'reload'});
    if (!response.ok) throw new Error('App shell unavailable');
    const html = await response.clone().text();
    const assets = [...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)].map(match=>new URL(match[1], ROOT).href);
    await cache.put(ROOT,response);
    await cache.addAll([...assets,'manifest.webmanifest','icons/icon-192.png','icons/icon-512.png','icons/apple-touch-icon.png'].map(path=>new URL(path,ROOT).href));
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith('emoja-shell-')&&key!==CACHE)await caches.delete(key);await self.clients.claim();})());
});
self.addEventListener('fetch', event => {
  if(event.request.method!=='GET'||new URL(event.request.url).origin!==ROOT.origin)return;
  event.respondWith((async()=>{
    try{
      const response=await fetch(event.request);
      if(response.ok){const cache=await caches.open(CACHE);await cache.put(event.request,response.clone());}
      return response;
    }catch(error){const cached=await caches.match(event.request);if(cached)return cached;if(event.request.mode==='navigate'){const shell=await caches.match(ROOT);if(shell)return shell;}throw error;}
  })());
});
