import {forceSimulation,forceLink,forceManyBody,forceCollide,forceX,forceY,forceZ} from 'd3-force-3d';
import {createAtlasModel} from './model';
import {layoutBounds} from './layoutTypes';
import type {LayoutInput,LayoutResult,Point3} from './layoutTypes';

export const nodeRadius=(kind:string)=>kind==='main'?13:kind==='sub'?7.5:kind==='problem'?6:5;
function seed(id:string){let value=2166136261;for(const char of id)value=Math.imul(value^char.charCodeAt(0),16777619);return()=>{value+=0x6D2B79F5;let t=value;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}}
function direction(index:number,count:number):Point3{
  const y=1-2*(index+.5)/Math.max(count,1),angle=index*Math.PI*(3-Math.sqrt(5)),r=Math.sqrt(1-y*y);
  return {x:r*Math.cos(angle),y,z:r*Math.sin(angle)};
}
export function layout3D(graph:LayoutInput):LayoutResult{
  const sorted={nodes:[...graph.nodes].sort((a,b)=>a.id.localeCompare(b.id)),links:[...graph.links].sort((a,b)=>(a.source+a.target).localeCompare(b.source+b.target))};
  const model=createAtlasModel({...sorted,aggregated:false});
  const anchors=new Map<string,Point3>();
  const spread=170+Math.cbrt(graph.nodes.length)*27;
  [...model.domains].sort((a,b)=>a.id.localeCompare(b.id)).forEach((domain,index)=>{
    const vector=direction(index,model.domains.length),radius=spread*(index%3===0?.62:1);
    anchors.set(domain.id,{x:vector.x*radius,y:vector.y*radius,z:vector.z*radius});
  });
  const rootFor=(id:string)=>{let current=id;const seen=new Set<string>();while(model.parent.has(current)&&!seen.has(current)){seen.add(current);current=model.parent.get(current)!}return current};
  const nodes=sorted.nodes.map((node,index)=>{
    const random=seed(node.id),vector=direction(index,sorted.nodes.length);
    const root=anchors.get(rootFor(node.id));
    const anchor=anchors.get(node.id)??(root?{x:root.x+(random()-.5)*135,y:root.y+(random()-.5)*135,z:root.z+(random()-.5)*135}:{x:vector.x*spread*.5,y:vector.y*spread*.5,z:vector.z*spread*.5});
    anchors.set(node.id,anchor);return {...node,...anchor};
  });
  for(const node of nodes)if(['pattern','custom'].includes(node.kind)){
    const adjacent=[...model.neighbors.get(node.id)??[]].map(id=>anchors.get(id)).filter((p):p is Point3=>!!p);
    if(adjacent.length){const average={x:0,y:0,z:0};for(const p of adjacent)for(const axis of ['x','y','z'] as const)average[axis]+=p[axis]/adjacent.length;anchors.set(node.id,average);Object.assign(node,average)}
  }
  const simulation=forceSimulation(nodes,3).stop().randomSource(seed('atlas-layout-v1'))
    .force('links',forceLink(model.links.map(link=>({...link}))).id((n:{id:string})=>n.id).distance((l:{kind:string})=>l.kind==='pattern'?145:l.kind==='hierarchy'?95:65).strength((l:{kind:string})=>l.kind==='pattern'?.04:.3))
    .force('charge',forceManyBody().strength(-105))
    .force('collide',forceCollide((n:{kind:string})=>nodeRadius(n.kind)+15).iterations(2))
    .force('x',forceX((n:{id:string})=>anchors.get(n.id)!.x).strength(.075))
    .force('y',forceY((n:{id:string})=>anchors.get(n.id)!.y).strength(.075))
    .force('z',forceZ((n:{id:string})=>anchors.get(n.id)!.z).strength(.075)).alphaDecay(.025);
  simulation.tick(280);simulation.stop();
  const raw=layoutBounds(nodes);
  const spans=['x','y','z'].map(axis=>raw.max[axis as keyof Point3]-raw.min[axis as keyof Point3]);
  const target=Math.max(100,...spans);
  const positions:Record<string,Point3>={};
  for(const node of nodes){const p={x:0,y:0,z:0};for(const [i,axis] of (['x','y','z'] as const).entries())p[axis]=(node[axis]-raw.center[axis])*(nodes.length>=6?Math.min(1.8,target/Math.max(spans[i],1)):1);positions[node.id]=p}
  return {positions,bounds:layoutBounds(Object.values(positions))};
}
