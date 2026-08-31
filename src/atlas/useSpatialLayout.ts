import {useEffect,useMemo,useState} from 'react';
import {createLayoutRequest,graphIdentity,isCurrentResult} from './layoutTypes';
import type {LayoutInput,LayoutResponse,LayoutResult} from './layoutTypes';
const cache=new Map<string,LayoutResult>();
const pending=new Map<string,Promise<LayoutResult>>();
let serial=0;
export function requestSpatialLayout(graph:LayoutInput):Promise<LayoutResult>{
  const key=graphIdentity(graph),cached=cache.get(key);if(cached)return Promise.resolve(cached);
  const existing=pending.get(key);if(existing)return existing;
  const promise=new Promise<LayoutResult>((resolve,reject)=>{
    const worker=new Worker(new URL('./layout.worker.ts',import.meta.url),{type:'module'});
    const request=createLayoutRequest(graph,++serial);
    const timeout=setTimeout(()=>{worker.terminate();reject(new Error('The spatial layout took too long. Use 2D or try again.'))},15000);
    const finish=()=>{clearTimeout(timeout);worker.terminate()};
    worker.onmessage=(event:MessageEvent<LayoutResponse>)=>{
      if(!isCurrentResult(event.data,request))return;
      finish();if(event.data.result){cache.set(key,event.data.result);if(cache.size>4)cache.delete(cache.keys().next().value!);resolve(event.data.result)}else reject(new Error(event.data.error));
    };
    worker.onerror=()=>{finish();reject(new Error('The 3D layout is unavailable. You can still use 2D or List.'))};
    try{worker.postMessage(request)}catch(error){finish();reject(error)}
  }).finally(()=>pending.delete(key));
  pending.set(key,promise);return promise;
}
export function useSpatialLayout(graph:LayoutInput,enabled:boolean){
  const key=useMemo(()=>graphIdentity(graph),[graph]);
  const [state,setState]=useState<{key:string;result?:LayoutResult;error?:string}>({key:''});
  useEffect(()=>{if(!enabled)return;let current=true;requestSpatialLayout(graph).then(result=>{if(current)setState({key,result})},error=>{if(current)setState({key,error:String(error.message)})});return()=>{current=false}},[key,enabled]);
  return state.key===key?state:{key};
}
