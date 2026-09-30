const CACHE='fb-project-v6';
const SHELL=['/index.html'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)));
  self.skipWaiting(); // activate immediately, don't wait for tabs to close
});
self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(
      keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)) // delete ALL old caches
    ))
  );
  self.clients.claim(); // take control of all open tabs right away
});
self.addEventListener('fetch',e=>{
  // Never cache Firebase API calls — always go to network
  if(e.request.url.includes('firestore')||e.request.url.includes('googleapis')||
     e.request.url.includes('firebase')||e.request.url.includes('gstatic')){return;}
  // For the shell HTML — network first, fall back to cache
  if(e.request.mode==='navigate'){
    e.respondWith(fetch(e.request).then(r=>{
      const clone=r.clone();
      caches.open(CACHE).then(c=>c.put(e.request,clone));
      return r;
    }).catch(()=>caches.match(e.request)));
    return;
  }
  // Everything else — cache first
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));
});
