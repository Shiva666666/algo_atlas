import {layout3D} from './layout3D';
import type {LayoutRequest,LayoutResponse} from './layoutTypes';
self.onmessage=(event:MessageEvent<LayoutRequest>)=>{
  const {requestId,key,graph}=event.data;
  let response:LayoutResponse;
  try{response={requestId,key,result:layout3D(graph)}}catch(error){response={requestId,key,error:error instanceof Error?error.message:'Could not arrange the network'}}
  self.postMessage(response);
};
