import {createAtlasModel} from './model';
import type {AtlasNode} from './model';
import type {LayoutInput} from './layoutTypes';
export type StudyNode=AtlasNode&{x:number;y:number;width:number;height:number;lines:string[]};
export type StudyGroup={id:string;x:number;y:number;width:number;height:number;headingHeight:number;count:number};
export function wrapLabel(text:string,max=26){
  const lines:string[]=[];let line='';
  for(const token of text.split(/\s+/))for(let start=0;start<token.length;start+=max){const word=token.slice(start,start+max);if((line+' '+word).trim().length>max&&line){lines.push(line);line=''}line+=(line?' ':'')+word}
  if(line)lines.push(line);return lines.length?lines:[''];
}
export function layout2D(graph:LayoutInput,wide:boolean,compact=false){
  const model=createAtlasModel({...graph,aggregated:false});
  const nodes:StudyNode[]=[],groups:StudyGroup[]=[];const placed=new Set<string>();
  const columns=wide?2:1,groupWidth=compact?340:568,gap=64,heights=Array(columns).fill(0) as number[];
  const place=(node:AtlasNode,x:number,y:number,width:number,max:number)=>{const lines=wrapLabel(node.name,max),height=Math.max(44,lines.length*17+18);const result={...node,x,y,width,height,lines};nodes.push(result);placed.add(node.id);return result};
  model.domains.forEach((domain,index)=>{
    const col=index%columns,x=col*(groupWidth+gap),y=heights[col];
    const heading=place(domain,x,y,groupWidth,compact?27:52);
    let row=y+heading.height+52;
    const techniques=(model.children.get(domain.id)??[]).map(id=>model.byId.get(id)!).filter(Boolean).sort((a,b)=>a.name.localeCompare(b.name));
    for(const technique of techniques){
      const problems=(model.children.get(technique.id)??[]).map(id=>model.byId.get(id)!).filter(Boolean).sort((a,b)=>a.name.localeCompare(b.name));
      const start=row;let bottom=row;
      const techniqueNode=place(technique,x+24,start,compact?120:198,compact?11:20);
      for(const problem of problems){const item=place(problem,x+(compact?180:282),bottom,compact?154:270,compact?15:28);bottom+=item.height+12}
      row=Math.max(bottom,start+techniqueNode.height)+24;
    }
    const height=Math.max(130,row-y);groups.push({id:domain.id,x,y,width:groupWidth,height,headingHeight:heading.height,count:model.problemIds(domain.id).length});heights[col]+=height+56;
  });
  let footer=Math.max(0,...heights)+16;
  for(const node of graph.nodes.filter(node=>!placed.has(node.id)).sort((a,b)=>a.name.localeCompare(b.name))){const item=place(node,compact?8:32,footer,compact?326:500,compact?32:52);footer+=item.height+20}
  return {nodes,groups,width:columns*(groupWidth+gap)-gap,height:Math.max(160,footer),links:graph.links};
}
export function studyEdge(source:StudyNode,target:StudyNode,kind:string){
  if(kind==='hierarchy'){
    const x=source.x+8,y=source.y+source.height;
    return `M${x},${y} V${target.y+target.height/2-14} Q${x},${target.y+target.height/2} ${x+14},${target.y+target.height/2} H${target.x}`;
  }
  const x1=source.x+source.width+4,y1=source.y+source.height/2,x2=target.x-8,y2=target.y+target.height/2;
  return `M${x1},${y1} C${(x1+x2)/2},${y1} ${(x1+x2)/2},${y2} ${x2},${y2}`;
}
export function fitStudyCamera(nodes:StudyNode[],width:number,height:number){
  if(!nodes.length)return {zoom:1,x:28,y:168};
  const minX=Math.min(...nodes.map(n=>n.x)),minY=Math.min(...nodes.map(n=>n.y));
  const maxX=Math.max(...nodes.map(n=>n.x+n.width)),maxY=Math.max(...nodes.map(n=>n.y+n.height));
  const zoom=Math.min(1,Math.max(1,width-48)/Math.max(1,maxX-minX),Math.max(1,height-300)/Math.max(1,maxY-minY));
  return {zoom:Math.max(.0001,zoom),x:24-minX*zoom,y:168-minY*zoom};
}
