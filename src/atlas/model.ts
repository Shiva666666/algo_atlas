import type {AtlasGraphData} from '../types';

export type AtlasNode=AtlasGraphData['nodes'][number];
export type PositionedNode=AtlasNode&{x:number;y:number;z:number;fx:number;fy:number;fz:number};
export const nodeKindLabel=(kind:string)=>({main:'Domain',sub:'Technique',pattern:'Pattern',custom:'Custom tag',problem:'Problem'}[kind]??'Node');

export function nodeLibraryUrl(node:Pick<AtlasNode,'id'|'kind'>):string{
  const key={main:'main_id',sub:'subtag_id',pattern:'taxonomy_id',custom:'taxonomy_id',problem:'problem_id'}[node.kind];
  return key?`/library?${new URLSearchParams({[key]:node.id})}`:'/library';
}

export function createAtlasModel(atlas:AtlasGraphData){
  const byId=new Map(atlas.nodes.map(node=>[node.id,node]));
  const links=atlas.links.filter(link=>byId.has(link.source)&&byId.has(link.target)).map(link=>({...link}));
  const neighbors=new Map(atlas.nodes.map(node=>[node.id,new Set<string>()]));
  const children=new Map(atlas.nodes.map(node=>[node.id,[] as string[]]));
  const parent=new Map<string,string>();
  for(const link of links){
    neighbors.get(link.source)!.add(link.target);neighbors.get(link.target)!.add(link.source);
    if(link.kind==='hierarchy'||link.kind==='primary'){
      children.get(link.source)!.push(link.target);parent.set(link.target,link.source);
    }
  }
  function problemIds(nodeId:string):string[]{
    const seen=new Set<string>();const found=new Set<string>();
    const visit=(id:string)=>{
      if(seen.has(id))return;seen.add(id);
      if(byId.get(id)?.kind==='problem'){found.add(id);return}
      for(const child of children.get(id)??[])visit(child);
    };
    visit(nodeId);
    if(['pattern','custom'].includes(byId.get(nodeId)?.kind??''))for(const id of neighbors.get(nodeId)??[])if(byId.get(id)?.kind==='problem')found.add(id);
    return [...found];
  }
  const domains=atlas.nodes.filter(node=>node.kind==='main').sort((a,b)=>a.name.localeCompare(b.name));
  return {nodes:atlas.nodes.map(node=>({...node})),links,byId,neighbors,parent,children,domains,problemIds};
}

export type AtlasModel=ReturnType<typeof createAtlasModel>;
export function selectAtlasGraph(model:AtlasModel,mode:'study'|'all',query='',status='all'){
  const eligible=model.nodes.filter(node=>mode==='all'||model.problemIds(node.id).length>0);
  const matched=eligible.filter(node=>atlasNodeMatches(node,query,status,model.problemIds,model.byId));
  const ids=new Set(matched.map(node=>node.id));
  for(const node of matched)if(query.trim())for(const id of model.problemIds(node.id))if(status==='all'||model.byId.get(id)?.status===status)ids.add(id);
  for(const id of [...ids]){
    let current=id;const seen=new Set<string>();
    while(model.parent.has(current)&&!seen.has(current)){seen.add(current);current=model.parent.get(current)!;ids.add(current)}
    if(model.byId.get(id)?.kind==='problem')for(const neighbor of model.neighbors.get(id)??[])if(['pattern','custom'].includes(model.byId.get(neighbor)?.kind??''))ids.add(neighbor);
  }
  return {nodes:model.nodes.filter(node=>ids.has(node.id)),links:model.links.filter(link=>ids.has(link.source)&&ids.has(link.target)),matched};
}

export function atlasNodeMatches(node:AtlasNode,query:string,scope:string,problemIds:(id:string)=>string[],byId:Map<string,AtlasNode>){
  const text=query.trim().toLowerCase();
  const hasText=!text||node.name.toLowerCase().includes(text);
  const hasStatus=scope==='all'||(node.kind==='problem'?node.status===scope:problemIds(node.id).some(id=>byId.get(id)?.status===scope));
  return hasText&&hasStatus;
}
