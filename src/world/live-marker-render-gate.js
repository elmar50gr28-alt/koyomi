export function createLiveMarkerRenderGate({isReady,render,onWaiting=()=>{}}={}){
  if(typeof isReady!=='function'||typeof render!=='function')throw new TypeError('isReady and render are required');
  let pending=false;

  const flush=()=>{
    if(!pending)return false;
    if(!isReady()){
      onWaiting();
      return false;
    }
    pending=false;
    try{
      const completed=render();
      if(completed===false)pending=true;
      return completed!==false;
    }catch(error){
      pending=true;
      throw error;
    }
  };

  return Object.freeze({
    request(){pending=true;return flush()},
    flush,
    isPending(){return pending}
  });
}
