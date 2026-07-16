const C='koyomi-uiux-navigator-20260716-1';
const A=['./','./index.html','./today.html','./app.html','./smoke-test.html','./manifest.webmanifest','./icon.svg'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(C).then(c=>c.addAll(A)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(x=>x!==C).map(x=>caches.delete(x))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const isHtml=e.request.mode==='navigate'||e.request.headers.get('accept')?.includes('text/html');
  if(isHtml){
    e.respondWith(
      fetch(e.request)
        .then(res=>{
          const copy=res.clone();
          caches.open(C).then(c=>c.put(e.request,copy)).catch(()=>{});
          return res;
        })
        .catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html')))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request)
      .then(r=>r||fetch(e.request).then(res=>{
        const copy=res.clone();
        caches.open(C).then(c=>c.put(e.request,copy)).catch(()=>{});
        return res;
      }).catch(()=>caches.match('./index.html')))
  );
});
