import type {AtlasNode,PositionedNode} from './model';
import type {AtlasGraphData} from '../types';
export type LayoutInput={nodes:AtlasNode[];links:AtlasGraphData['links']};
export type Point3={x:number;y:number;z:number};
export type LayoutBounds={min:Point3;max:Point3;center:Point3;radius:number};
export type LayoutResult={positions:Record<string,Point3>;bounds:LayoutBounds};
export type LayoutRequest={requestId:number;key:string;graph:LayoutInput};
export type LayoutResponse={requestId:number;key:string;result?:LayoutResult;error?:string};
export function graphIdentity(graph:LayoutInput){return JSON.stringify(['spatial-v1',graph.nodes.map(n=>[n.id,n.kind]).sort(),graph.links.map(l=>[l.source,l.target,l.kind]).sort()])}
export const isCurrentResult=(message:LayoutResponse,request:Pick<LayoutRequest,'requestId'|'key'>)=>message.requestId===request.requestId&&message.key===request.key;
// Pick only serializable graph data; the relationship model also contains functions.
export function createLayoutRequest(graph:LayoutInput,requestId:number):LayoutRequest{return {requestId,key:graphIdentity(graph),graph:{nodes:graph.nodes,links:graph.links}}}
export function layoutBounds(points:Point3[]):LayoutBounds{
  const min={x:Infinity,y:Infinity,z:Infinity},max={x:-Infinity,y:-Infinity,z:-Infinity};
  for(const point of points)for(const axis of ['x','y','z'] as const){min[axis]=Math.min(min[axis],point[axis]);max[axis]=Math.max(max[axis],point[axis])}
  if(!points.length)return {min:{x:0,y:0,z:0},max:{x:0,y:0,z:0},center:{x:0,y:0,z:0},radius:80};
  const center={x:(min.x+max.x)/2,y:(min.y+max.y)/2,z:(min.z+max.z)/2};
  return {min,max,center,radius:Math.max(80,...points.map(p=>Math.hypot(p.x-center.x,p.y-center.y,p.z-center.z)))+24};
}
export function positionedNodes(nodes:AtlasNode[],layout:LayoutResult):PositionedNode[]{return nodes.flatMap(node=>{const p=layout.positions[node.id];return p?[{...node,...p,fx:p.x,fy:p.y,fz:p.z}]:[]})}
