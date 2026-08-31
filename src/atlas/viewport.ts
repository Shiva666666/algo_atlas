import type {PositionedNode} from './model';
import {layoutBounds} from './layoutTypes';

export const clampAtlasZoom=(zoom:number)=>Math.min(8,Math.max(0.0001,zoom));

export function zoomAtlasAt(previous:{zoom:number;x:number;y:number},factor:number,x:number,y:number,centerX:number,centerY:number){
  const zoom=clampAtlasZoom(previous.zoom*factor),ratio=zoom/previous.zoom;
  return {zoom,x:x-centerX-(x-centerX-previous.x)*ratio,y:y-centerY-(y-centerY-previous.y)*ratio};
}
// Preserve the point under the gesture midpoint as the fingers zoom and translate.
export function pinchAtlasAt(camera:{zoom:number;x:number;y:number},previous:{x:number;y:number},next:{x:number;y:number},other:{x:number;y:number}){
  const before=Math.hypot(previous.x-other.x,previous.y-other.y),after=Math.hypot(next.x-other.x,next.y-other.y);
  if(!before)return camera;
  const result=zoomAtlasAt(camera,after/before,(previous.x+other.x)/2,(previous.y+other.y)/2,0,0);
  return {...result,x:result.x+(next.x-previous.x)/2,y:result.y+(next.y-previous.y)/2};
}

export function spatialCamera(nodes:PositionedNode[],width:number,height:number){
  const bounds=layoutBounds(nodes),aspect=width/Math.max(height,1),fov=50*Math.PI/180;
  const vertical=Math.atan(Math.tan(fov/2)*Math.min(1,aspect));
  const distance=bounds.radius/Math.sin(vertical)*1.16;
  const target={...bounds.center,y:bounds.center.y+bounds.radius*.08};
  const direction={x:.35,y:.2,z:1},length=Math.hypot(direction.x,direction.y,direction.z);
  return {target,position:{x:target.x+direction.x/length*distance,y:target.y+direction.y/length*distance,z:target.z+direction.z/length*distance}};
}
