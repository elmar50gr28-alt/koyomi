const RELOAD_KEY='koyomi.serviceWorkerReloadAt.v1';
const RELOAD_GUARD_MS=30_000;

function recentlyReloaded(){
  try{return Date.now()-Number(sessionStorage.getItem(RELOAD_KEY)||0)<RELOAD_GUARD_MS}catch{return false}
}

function markReload(){try{sessionStorage.setItem(RELOAD_KEY,String(Date.now()))}catch{}}

export async function ensureCurrentServiceWorker(){
  if(!('serviceWorker'in navigator))return null;
  let changing=false;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{
    if(changing||recentlyReloaded())return;
    changing=true;markReload();location.reload();
  });
  const scriptUrl=new URL('../../service-worker.js',import.meta.url),registration=await navigator.serviceWorker.register(scriptUrl,{updateViaCache:'none'});
  await registration.update();
  return registration;
}

ensureCurrentServiceWorker().catch(error=>console.warn('[KOYOMI] service worker update unavailable',error));
