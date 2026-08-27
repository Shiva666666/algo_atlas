import type {Problem} from '../types';
import type {GraphEdgeView,GraphNodeView,InsightModel,RuleFocus,SteinerFrameData,VisualFrame,VisualizerAdapter} from './types';

type SteinerInput={n:number;k:number;c:number[][];query:[number,number]};
type BaseParent={type:'seed'}|{type:'merge';left:number;right:number}|{type:'move';from:number}|null;
type WithParent={type:'seed-s'}|{type:'merge';left:number;rightBase:number}|{type:'move';from:number}|null;
type TransitionEvent={type:'merge'|'move';mask:number;submask:number|null;root:number;target:number|null;old:number;candidate:number;next:number};
const INF=Number.POSITIVE_INFINITY;

const insights:InsightModel={
  state:'DP[mask][v] is the cheapest connected graph containing the terminals in mask and the attachment vertex v.',
  base:'The empty fixed-terminal mask costs 0 everywhere; a singleton terminal costs 0 at its own vertex.',
  choice:'Either merge two smaller terminal groups at the same v, or move the attachment point through an edge.',
  invariant:'Every finite cell already describes one connected subgraph; optional Steiner vertices never need bits.',
};

function ruleSet(active:string):RuleFocus[]{return [
  {token:'mask',meaning:'required fixed terminals',active:active==='mask'},
  {token:'sub',meaning:'one side of a split',active:active==='sub'},
  {token:'v',meaning:'shared root / settled vertex',active:active==='v'},
  {token:'u',meaning:'relaxation destination',active:active==='u'},
  {token:'full, t',meaning:'O(1) query lookup',active:active==='lookup'},
]}

function parseInput(raw:string):SteinerInput{
  let value:unknown;try{value=JSON.parse(raw)}catch{throw new Error('Use JSON with n, k, c, and query.')}
  if(!value||typeof value!=='object')throw new Error('The input needs n, k, c, and query.');
  const candidate=value as Partial<SteinerInput>;const n=Number(candidate.n);const k=Number(candidate.k);const c=candidate.c;const query=candidate.query;
  if(!Number.isInteger(n)||n<3||n>8)throw new Error('Use 3 to 8 vertices in the visual lab.');
  if(!Number.isInteger(k)||k<1||k>Math.min(n-2,4))throw new Error('Use 1 to 4 fixed terminals for a readable trace.');
  if(!Array.isArray(c)||c.length!==n||c.some(row=>!Array.isArray(row)||row.length!==n))throw new Error('c must be an n × n matrix.');
  const matrix=c.map(row=>row.map(Number));
  for(let i=0;i<n;i+=1)for(let j=0;j<n;j+=1){if(!Number.isFinite(matrix[i][j])||matrix[i][j]<0)throw new Error('Every edge cost must be a non-negative number.');if(matrix[i][j]!==matrix[j][i])throw new Error('The matrix must be symmetric.');if(i===j&&matrix[i][j]!==0)throw new Error('Every diagonal cost must be 0.');}
  if(!Array.isArray(query)||query.length!==2)throw new Error('query must be [s, t].');
  const s=Number(query[0]);const t=Number(query[1]);if(!Number.isInteger(s)||!Number.isInteger(t)||s<=k||t<=k||s>n||t>n||s===t)throw new Error('s and t must be distinct vertices in K+1…N.');
  return {n,k,c:matrix,query:[s,t]};
}

function denseClosure(row:number[],parents:BaseParent[]|WithParent[],matrix:number[][],mask:number,events:TransitionEvent[]){
  const n=matrix.length;const used=Array(n).fill(false);
  for(let step=0;step<n;step+=1){let v=-1;for(let index=0;index<n;index+=1)if(!used[index]&&(v<0||row[index]<row[v]))v=index;if(v<0||!Number.isFinite(row[v]))break;used[v]=true;
    for(let u=0;u<n;u+=1){const candidate=row[v]+matrix[v][u];if(candidate<row[u]){const old=row[u];row[u]=candidate;parents[u]={type:'move',from:v};events.push({type:'move',mask,submask:null,root:v,target:u,old,candidate,next:candidate});}}
  }
}

function computeBase(matrix:number[][],k:number){
  const n=matrix.length;const size=1<<k;const dp=Array.from({length:size},()=>Array(n).fill(INF));const parent:Array<BaseParent[]>=Array.from({length:size},()=>Array<BaseParent>(n).fill(null));const events:TransitionEvent[]=[];
  dp[0].fill(0);for(let v=0;v<n;v+=1)parent[0][v]={type:'seed'};
  for(let terminal=0;terminal<k;terminal+=1){dp[1<<terminal][terminal]=0;parent[1<<terminal][terminal]={type:'seed'}}
  for(let mask=1;mask<size;mask+=1){
    for(let sub=(mask-1)&mask;sub>0;sub=(sub-1)&mask){const other=mask^sub;if(!other||sub>other)continue;for(let v=0;v<n;v+=1){const candidate=dp[sub][v]+dp[other][v];if(candidate<dp[mask][v]){const old=dp[mask][v];dp[mask][v]=candidate;parent[mask][v]={type:'merge',left:sub,right:other};events.push({type:'merge',mask,submask:sub,root:v,target:null,old,candidate,next:candidate});}}}
    denseClosure(dp[mask],parent[mask],matrix,mask,events);
  }
  return {dp,parent,events};
}

function computeWithS(matrix:number[][],base:ReturnType<typeof computeBase>,k:number,s:number){
  const n=matrix.length;const size=1<<k;const dp=Array.from({length:size},()=>Array(n).fill(INF));const parent:Array<WithParent[]>=Array.from({length:size},()=>Array<WithParent>(n).fill(null));const events:TransitionEvent[]=[];
  dp[0][s]=0;parent[0][s]={type:'seed-s'};
  for(let mask=0;mask<size;mask+=1){
    for(let sub=mask;;sub=(sub-1)&mask){const other=mask^sub;for(let v=0;v<n;v+=1){const candidate=dp[sub][v]+base.dp[other][v];if(candidate<dp[mask][v]){const old=dp[mask][v];dp[mask][v]=candidate;parent[mask][v]={type:'merge',left:sub,rightBase:other};events.push({type:'merge',mask,submask:sub,root:v,target:null,old,candidate,next:candidate});}}if(sub===0)break;}
    denseClosure(dp[mask],parent[mask],matrix,mask,events);
  }
  return {dp,parent,events};
}

function edgeKey(a:number,b:number){return a<b?`${a}-${b}`:`${b}-${a}`}

function reconstruct(base:ReturnType<typeof computeBase>,withS:ReturnType<typeof computeWithS>,full:number,t:number){
  const edges=new Set<string>();const seenBase=new Set<string>();const seenWith=new Set<string>();
  const visitBase=(mask:number,v:number)=>{const key=`${mask}-${v}`;if(seenBase.has(key))return;seenBase.add(key);const parent=base.parent[mask][v];if(!parent||parent.type==='seed')return;if(parent.type==='move'){edges.add(edgeKey(v,parent.from));visitBase(mask,parent.from)}else{visitBase(parent.left,v);visitBase(parent.right,v)}};
  const visitWith=(mask:number,v:number)=>{const key=`${mask}-${v}`;if(seenWith.has(key))return;seenWith.add(key);const parent=withS.parent[mask][v];if(!parent||parent.type==='seed-s')return;if(parent.type==='move'){edges.add(edgeKey(v,parent.from));visitWith(mask,parent.from)}else{visitWith(parent.left,v);visitBase(parent.rightBase,v)}};
  visitWith(full,t);return edges;
}

function finiteRow(row:number[]){return row.map(value=>Number.isFinite(value)?value:null)}

function graphFor(input:SteinerInput,solution:Set<string>,root:number|null,activeEdge:[number,number]|null,showSolution:boolean){
  const [s,t]=input.query;const fixed=Array.from({length:input.k},(_,index)=>index+1);const nodes:GraphNodeView[]=Array.from({length:input.n},(_,index)=>{const id=index+1;let role:GraphNodeView['role']='ordinary';if(fixed.includes(id))role='terminal';if(id===s)role='source';if(id===t)role='target';if(id===root&&role==='ordinary')role='root';return {id,label:String(id),role,detail:id===root?'current v':id===s?'query s':id===t?'query t':fixed.includes(id)?'fixed':''}});
  const allCosts:number[]=[];for(let i=0;i<input.n;i+=1)for(let j=i+1;j<input.n;j+=1)allCosts.push(input.c[i][j]);const minimum=Math.min(...allCosts);const lowThreshold=minimum===0?0:minimum*2;const edges:GraphEdgeView[]=[];
  for(let i=0;i<input.n;i+=1)for(let j=i+1;j<input.n;j+=1){const key=edgeKey(i,j);const oneBasedKey=edgeKey(i+1,j+1);const active=activeEdge&&edgeKey(activeEdge[0],activeEdge[1])===oneBasedKey;const selected=showSolution&&solution.has(key);if(input.c[i][j]<=lowThreshold||selected||active){edges.push({from:i+1,to:j+1,weight:input.c[i][j],state:active?'active':selected?'selected':'quiet'});}}
  return {nodes,edges};
}

function frame(input:SteinerInput,base:ReturnType<typeof computeBase>,withS:ReturnType<typeof computeWithS>,solution:Set<string>,phase:string,title:string,message:string,options:{layer:SteinerFrameData['layer'];mask:number;submask?:number|null;root?:number|null;target?:number|null;row?:number[];event?:TransitionEvent|null;comparison?:SteinerFrameData['comparison'];activeRule:string;showSolution?:boolean;activeEdge?:[number,number]|null}):VisualFrame{
  const full=(1<<input.k)-1;const event=options.event??null;const row=options.row??(options.layer==='with-s'||options.layer==='answer'?withS.dp[options.mask]:base.dp[options.mask]);const activeEdge=options.activeEdge??(event?.type==='move'&&event.target!==null?[event.root+1,event.target+1] as [number,number]:null);const root=options.root??(event?event.root+1:null);const target=options.target??(event?.target!==null&&event?.target!==undefined?event.target+1:null);
  const data:SteinerFrameData={graph:graphFor(input,solution,root,activeEdge,!!options.showSolution),fixed:Array.from({length:input.k},(_,index)=>index+1),s:input.query[0],t:input.query[1],layer:options.layer,mask:options.mask,maskWidth:input.k,maskTerminals:Array.from({length:input.k},(_,index)=>index+1),submask:options.submask===undefined?(event?.submask??null):options.submask,root,target,dpRow:finiteRow(row),oldCost:event&&Number.isFinite(event.old)?event.old:null,candidateCost:event&&Number.isFinite(event.candidate)?event.candidate:null,newCost:event&&Number.isFinite(event.next)?event.next:null,answer:withS.dp[full][input.query[1]-1],comparison:options.comparison,insights,rules:ruleSet(options.activeRule)};
  return {phase,title,message,kind:'steiner-tree',data};
}

function createFrames(value:unknown,_problem:Problem):VisualFrame[]{
  const input=value as SteinerInput;const base=computeBase(input.c,input.k);const sIndex=input.query[0]-1;const tIndex=input.query[1]-1;const withS=computeWithS(input.c,base,input.k,sIndex);const full=(1<<input.k)-1;const solution=reconstruct(base,withS,full,tIndex);const baseFullEvents=base.events.filter(event=>event.mask===full);const withFullEvents=withS.events.filter(event=>event.mask===full);const baseMerge=baseFullEvents.find(event=>event.type==='merge')??null;const baseMove=baseFullEvents.find(event=>event.type==='move'&&!Array.from({length:input.k},(_,index)=>index).includes(event.target??-1))??baseFullEvents.find(event=>event.type==='move')??null;const withMerge=withFullEvents.find(event=>event.type==='merge')??null;const withMove=withFullEvents.find(event=>event.type==='move'&&event.target===tIndex)??withFullEvents.find(event=>event.type==='move')??null;
  const frames:VisualFrame[]=[
    frame(input,base,withS,solution,'RECOGNIZE','Do not enumerate connector vertices','The screenshot searches subsets of optional vertices. This task is small only in K, so the mask belongs to fixed terminals.',{layer:'comparison',mask:full,row:Array(input.n).fill(INF),comparison:{naive:'up to 2^72 connector sets',intended:'at most 2^8 = 256 masks'},activeRule:'mask'}),
    frame(input,base,withS,solution,'STATE','Give v a precise job','v is an attachment point contained in the connected subgraph—not an endpoint that must stay fixed forever.',{layer:'base',mask:full,activeRule:'v',root:base.dp[full].indexOf(Math.min(...base.dp[full]))+1}),
    frame(input,base,withS,solution,'BASE','Seed the smallest true states','A singleton mask costs zero at its own terminal. The empty fixed mask costs zero because it asks for no fixed terminal.',{layer:'base',mask:1,activeRule:'mask',root:1}),
  ];
  if(baseMerge)frames.push(frame(input,base,withS,solution,'MERGE','Join two terminal groups at one root','Both partial trees contain the same v, so adding their costs keeps the result connected.',{layer:'base',mask:full,event:baseMerge,activeRule:'sub'}));
  if(baseMove)frames.push(frame(input,base,withS,solution,'MOVE ROOT','Let a connector vertex emerge','Dense Dijkstra closes the row: an improved tree at v can extend to u through edge C[v][u]. No connector bit is needed.',{layer:'base',mask:full,event:baseMove,activeRule:'u'}));
  frames.push(frame(input,base,withS,solution,'QUERY LAYER',`Carry s = ${input.query[0]} separately`,'The query-specific table starts with s already present. This lets the fixed-terminal DP be reused for every possible s.',{layer:'with-s',mask:0,activeRule:'mask',root:input.query[0]}));
  if(withMerge)frames.push(frame(input,base,withS,solution,'ASYMMETRIC MERGE','Only one side carries s','withS[sub][v] already contains s; base[other][v] supplies the remaining fixed terminals.',{layer:'with-s',mask:full,event:withMerge,activeRule:'sub'}));
  if(withMove)frames.push(frame(input,base,withS,solution,'DIJKSTRA CLOSURE','Move the query layer to t','The same root-movement rule fills every possible attachment column, including the queried t.',{layer:'with-s',mask:full,event:withMove,activeRule:'u'}));
  frames.push(frame(input,base,withS,solution,'LOOKUP','Read the answer cell',`Choosing column t = ${input.query[1]} forces t into the connected graph, so t needs no mask bit.`,{layer:'answer',mask:full,activeRule:'lookup',root:input.query[1],target:input.query[1],showSolution:true}));
  frames.push(frame(input,base,withS,solution,'COMPLETE','Reconstruct the chosen tree',`The highlighted edges connect fixed terminals 1…${input.k}, s=${input.query[0]}, and t=${input.query[1]} for total cost ${withS.dp[full][tIndex].toLocaleString()}.`,{layer:'answer',mask:full,activeRule:'lookup',root:input.query[1],target:input.query[1],showSolution:true}));
  return frames;
}

const official='{"n":5,"k":2,"c":[[0,395,395,1,1],[395,0,1,395,1],[395,1,0,395,1],[1,395,395,0,1],[1,1,1,1,0]],"query":[3,4]}';
const hiddenHub='{"n":5,"k":2,"c":[[0,9,9,9,1],[9,0,9,9,1],[9,9,0,9,1],[9,9,9,0,1],[1,1,1,1,0]],"query":[3,4]}';
const indirect='{"n":4,"k":1,"c":[[0,1,9,9],[1,0,1,9],[9,1,0,1],[9,9,1,0]],"query":[2,4]}';
const trueSplit='{"n":7,"k":3,"c":[[0,20,20,20,20,1,20],[20,0,20,20,20,1,20],[20,20,0,20,20,20,1],[20,20,20,0,20,20,1],[20,20,20,20,0,1,1],[1,1,20,20,1,0,20],[20,20,1,1,1,20,0]],"query":[4,5]}';
const zeroTies='{"n":5,"k":2,"c":[[0,7,7,7,0],[7,0,7,7,0],[7,7,0,7,0],[7,7,7,0,0],[0,0,0,0,0]],"query":[3,4]}';
const large='{"n":5,"k":3,"c":[[0,1000000000,1000000000,1000000000,1000000000],[1000000000,0,1000000000,1000000000,1000000000],[1000000000,1000000000,0,1000000000,1000000000],[1000000000,1000000000,1000000000,0,1000000000],[1000000000,1000000000,1000000000,1000000000,0]],"query":[4,5]}';

export const steinerTreeVisualizer:VisualizerAdapter={id:'abc395-g',name:'Graph × bitmask DP workbench',mode:'specialized',description:'Terminal masks, subset merges, dense-Dijkstra root movement, query reuse, and final tree reconstruction stay aligned without showing a finished solution.',inputLabel:'ATCODER PARAMETERS · n, k, c, query',placeholder:official,presets:[
  {label:'Official sample · connector reuse',input:official,source:'AtCoder'},
  {label:'Hidden hub beats required-only MST',input:hiddenHub,source:'Diagnostic'},
  {label:'Indirect route beats direct edge',input:indirect,source:'Diagnostic'},
  {label:'True split at the query root',input:trueSplit,source:'Diagnostic'},
  {label:'Zero weights and tied optima',input:zeroTies,source:'Diagnostic'},
  {label:'64-bit total cost',input:large,source:'Diagnostic'},
],parseInput,createFrames};
