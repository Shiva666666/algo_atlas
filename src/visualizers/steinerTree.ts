import type {Problem} from '../types';
import {steinerCode} from './steinerCode';
import type {GraphEdgeView,GraphNodeView,InsightModel,RuleFocus,SteinerFrameData,VisualFrame,VisualizerAdapter} from './types';

export interface SteinerInput {n:number;k:number;c:number[][];query:[number,number]}
type Matrix=number[][];
type BaseParent={type:'seed'}|{type:'merge';left:number;right:number}|{type:'move';from:number}|null;
type WithParent={type:'seed-s'}|{type:'merge';left:number;rightBase:number}|{type:'move';from:number}|null;
type TraceRole='checkpoint'|'transition';
type DpLayer='base'|'with-s';
type DpEvent={layer:DpLayer;type:'merge'|'relax';mask:number;submask:number|null;otherMask:number|null;root:number|null;target:number|null;old:number;candidate:number;next:number;table:Matrix;oldRow:number[]|null;traceRole:TraceRole};
type FloydEvent={kind:'start'|'intermediate-start'|'cell'|'intermediate-end'|'sealed';intermediate:number|null;current:[number,number]|null;old:number|null;via:number|null;next:number|null;accepted:boolean|null;matrix:Matrix;completedIntermediates:number[];traceRole:TraceRole};
const INF=Number.POSITIVE_INFINITY;

const insights:InsightModel={
  state:'First make every pairwise cost a shortest-path distance. Then DP[mask][v] stores the cheapest connected graph containing the masked terminals and attachment vertex v.',
  base:'Floyd–Warshall allows intermediates 1…k. The empty fixed-terminal mask costs 0 everywhere; a singleton terminal costs 0 at its own vertex.',
  choice:'Either merge two disjoint terminal groups at one v, or move the attachment point using a distance already computed by Floyd–Warshall.',
  invariant:'Every finite DP cell describes a connected subgraph. Optional connector vertices never need mask bits.',
};

function rules(active:string):RuleFocus[]{return [
  {token:'k',meaning:'allowed intermediate vertex',active:active==='k'},
  {token:'i, j',meaning:'matrix endpoints',active:active==='cell'},
  {token:'min',meaning:'keep the shorter route',active:active==='min'},
  {token:'mask',meaning:'required fixed terminals',active:active==='mask'},
  {token:'sub',meaning:'one side of a split',active:active==='sub'},
  {token:'v',meaning:'shared root / settled vertex',active:active==='v'},
  {token:'u',meaning:'relaxation destination',active:active==='u'},
  {token:'full, t',meaning:'query lookup',active:active==='lookup'},
]}

function cloneMatrix(matrix:Matrix):Matrix{return matrix.map(row=>[...row])}
function finite(value:number|null|undefined){return value!==undefined&&value!==null&&Number.isFinite(value)?value:null}
function nullableMatrix(matrix:Matrix){return matrix.map(row=>row.map(value=>finite(value)))}
function edgeKey(a:number,b:number){return a<b?`${a}-${b}`:`${b}-${a}`}

export function parseSteinerInput(raw:string):SteinerInput{
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

function runFloyd(original:Matrix){
  const n=original.length;const distance=cloneMatrix(original);const nextHop=Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>i===j?i:j));const events:FloydEvent[]=[];
  events.push({kind:'start',intermediate:null,current:null,old:null,via:null,next:null,accepted:null,matrix:cloneMatrix(distance),completedIntermediates:[],traceRole:'checkpoint'});
  for(let k=0;k<n;k+=1){
    events.push({kind:'intermediate-start',intermediate:k,current:null,old:null,via:null,next:null,accepted:null,matrix:cloneMatrix(distance),completedIntermediates:Array.from({length:k},(_,index)=>index),traceRole:'checkpoint'});
    for(let i=0;i<n;i+=1)for(let j=0;j<n;j+=1){
      const old=distance[i][j];const via=distance[i][k]+distance[k][j];const next=Math.min(old,via);const accepted=next<old;
      if(accepted){distance[i][j]=next;nextHop[i][j]=nextHop[i][k]}
      events.push({kind:'cell',intermediate:k,current:[i,j],old,via,next,accepted,matrix:cloneMatrix(distance),completedIntermediates:Array.from({length:k},(_,index)=>index),traceRole:accepted?'checkpoint':'transition'});
    }
    events.push({kind:'intermediate-end',intermediate:k,current:null,old:null,via:null,next:null,accepted:null,matrix:cloneMatrix(distance),completedIntermediates:Array.from({length:k+1},(_,index)=>index),traceRole:'checkpoint'});
  }
  events.push({kind:'sealed',intermediate:null,current:null,old:null,via:null,next:null,accepted:null,matrix:cloneMatrix(distance),completedIntermediates:Array.from({length:n},(_,index)=>index),traceRole:'checkpoint'});
  return {distance,nextHop,events};
}

function runBase(matrix:Matrix,k:number){
  const n=matrix.length;const size=1<<k;const dp=Array.from({length:size},()=>Array(n).fill(INF));const parent:Array<BaseParent[]>=Array.from({length:size},()=>Array<BaseParent>(n).fill(null));const events:DpEvent[]=[];
  dp[0].fill(0);for(let v=0;v<n;v+=1)parent[0][v]={type:'seed'};
  const seedTables=[cloneMatrix(dp)];
  for(let terminal=0;terminal<k;terminal+=1){dp[1<<terminal][terminal]=0;parent[1<<terminal][terminal]={type:'seed'};seedTables.push(cloneMatrix(dp))}
  for(let mask=1;mask<size;mask+=1){
    for(let sub=mask;;sub=(sub-1)&mask){const other=mask^sub;for(let v=0;v<n;v+=1){const old=dp[mask][v];const candidate=dp[sub][v]+dp[other][v];const next=Math.min(old,candidate);if(candidate<old){dp[mask][v]=next;parent[mask][v]={type:'merge',left:sub,right:other}}events.push({layer:'base',type:'merge',mask,submask:sub,otherMask:other,root:v,target:null,old,candidate,next,table:cloneMatrix(dp),oldRow:null,traceRole:candidate<old?'checkpoint':'transition'})}if(sub===0)break}
    const oldRow=[...dp[mask]];
    for(let u=0;u<n;u+=1)for(let v=0;v<n;v+=1){const old=dp[mask][u];const candidate=oldRow[v]+matrix[v][u];const next=Math.min(old,candidate);if(candidate<old){dp[mask][u]=next;parent[mask][u]={type:'move',from:v}}events.push({layer:'base',type:'relax',mask,submask:null,otherMask:null,root:v,target:u,old,candidate,next,table:cloneMatrix(dp),oldRow:[...oldRow],traceRole:candidate<old?'checkpoint':'transition'})}
  }
  return {dp,parent,events,seedTables};
}

function runWithS(matrix:Matrix,base:ReturnType<typeof runBase>,k:number,s:number){
  const n=matrix.length;const size=1<<k;const dp=Array.from({length:size},()=>Array(n).fill(INF));const parent:Array<WithParent[]>=Array.from({length:size},()=>Array<WithParent>(n).fill(null));const events:DpEvent[]=[];
  dp[0][s]=0;parent[0][s]={type:'seed-s'};const seedTable=cloneMatrix(dp);
  for(let mask=0;mask<size;mask+=1){
    for(let sub=mask;;sub=(sub-1)&mask){const other=mask^sub;for(let v=0;v<n;v+=1){const old=dp[mask][v];const candidate=dp[sub][v]+base.dp[other][v];const next=Math.min(old,candidate);if(candidate<old){dp[mask][v]=next;parent[mask][v]={type:'merge',left:sub,rightBase:other}}events.push({layer:'with-s',type:'merge',mask,submask:sub,otherMask:other,root:v,target:null,old,candidate,next,table:cloneMatrix(dp),oldRow:null,traceRole:candidate<old?'checkpoint':'transition'})}if(sub===0)break}
    const oldRow=[...dp[mask]];
    for(let u=0;u<n;u+=1)for(let v=0;v<n;v+=1){const old=dp[mask][u];const candidate=oldRow[v]+matrix[v][u];const next=Math.min(old,candidate);if(candidate<old){dp[mask][u]=next;parent[mask][u]={type:'move',from:v}}events.push({layer:'with-s',type:'relax',mask,submask:null,otherMask:null,root:v,target:u,old,candidate,next,table:cloneMatrix(dp),oldRow:[...oldRow],traceRole:candidate<old?'checkpoint':'transition'})}
  }
  return {dp,parent,events,seedTable};
}

function reconstruct(base:ReturnType<typeof runBase>,withS:ReturnType<typeof runWithS>,full:number,t:number){
  const edges=new Set<string>();const seenBase=new Set<string>();const seenWith=new Set<string>();
  const visitBase=(mask:number,v:number)=>{const key=`${mask}-${v}`;if(seenBase.has(key))return;seenBase.add(key);const parent=base.parent[mask][v];if(!parent||parent.type==='seed')return;if(parent.type==='move'){edges.add(edgeKey(v,parent.from));visitBase(mask,parent.from)}else{visitBase(parent.left,v);visitBase(parent.right,v)}};
  const visitWith=(mask:number,v:number)=>{const key=`${mask}-${v}`;if(seenWith.has(key))return;seenWith.add(key);const parent=withS.parent[mask][v];if(!parent||parent.type==='seed-s')return;if(parent.type==='move'){edges.add(edgeKey(v,parent.from));visitWith(mask,parent.from)}else{visitWith(parent.left,v);visitBase(parent.rightBase,v)}};
  visitWith(full,t);return edges;
}

function expandMetricEdges(solution:Set<string>,nextHop:number[][]){
  const expanded=new Set<string>();const n=nextHop.length;
  solution.forEach(key=>{const [a,b]=key.split('-').map(Number);let current=a;let guard=0;while(current!==b&&guard++<=n){const next=nextHop[current]?.[b];if(next===undefined||next===current)break;expanded.add(edgeKey(current,next));current=next}});return expanded;
}

function graphFor(input:SteinerInput,weights:Matrix,solution:Set<string>,root:number|null,activeEdge:[number,number]|null,showSolution:boolean,expanded:Set<string>|null=null){
  const [s,t]=input.query;const fixed=Array.from({length:input.k},(_,index)=>index+1);const nodes:GraphNodeView[]=Array.from({length:input.n},(_,index)=>{const id=index+1;let role:GraphNodeView['role']='ordinary';if(fixed.includes(id))role='terminal';if(id===s)role='source';if(id===t)role='target';if(id===root&&role==='ordinary')role='root';return {id,label:String(id),role,detail:id===root?'current v':id===s?'query s':id===t?'query t':fixed.includes(id)?'fixed':''}});
  const allCosts:number[]=[];for(let i=0;i<input.n;i+=1)for(let j=i+1;j<input.n;j+=1)allCosts.push(weights[i][j]);const minimum=Math.min(...allCosts);const lowThreshold=minimum===0?0:minimum*2;const edges:GraphEdgeView[]=[];
  for(let i=0;i<input.n;i+=1)for(let j=i+1;j<input.n;j+=1){const key=edgeKey(i,j);const oneBasedKey=edgeKey(i+1,j+1);const active=activeEdge&&edgeKey(activeEdge[0],activeEdge[1])===oneBasedKey;const selected=showSolution&&solution.has(key);const expandedSelected=showSolution&&expanded?.has(key);if(weights[i][j]<=lowThreshold||selected||expandedSelected||active)edges.push({from:i+1,to:j+1,weight:weights[i][j],state:active?'active':selected||expandedSelected?'selected':'quiet'});}
  return {nodes,edges};
}

function common(input:SteinerInput,stage:SteinerFrameData['stage'],distance:Matrix,solution:Set<string>,root:number|null,activeEdge:[number,number]|null,showSolution:boolean,expanded:Set<string>|null,overrides:Partial<SteinerFrameData>):SteinerFrameData{
  const full=(1<<input.k)-1;const graph=graphFor(input,distance,solution,root,activeEdge,showSolution);const expandedGraph=showSolution&&expanded?graphFor(input,input.c,solution,null,null,true,expanded):undefined;
  return {stage,graph,expandedGraph,fixed:Array.from({length:input.k},(_,index)=>index+1),s:input.query[0],t:input.query[1],layer:stage==='floyd-warshall'?'comparison':'base',transition:'overview',mask:full,maskWidth:input.k,maskTerminals:Array.from({length:input.k},(_,index)=>index+1),submask:null,otherMask:null,root,target:null,dpRow:[],dpTable:[],oldDpRow:null,oldCost:null,candidateCost:null,newCost:null,answer:null,distanceMatrix:nullableMatrix(distance),insights,rules:rules(''),...overrides};
}

function floydFrame(input:SteinerInput,event:FloydEvent,solution:Set<string>):VisualFrame{
  const current=event.current;const intermediate=event.intermediate===null?null:event.intermediate+1;const activeEdge=current&&intermediate!==null?[current[0]+1,intermediate] as [number,number]:null;const accepted=event.accepted;const title=event.kind==='start'?'Start with direct costs':event.kind==='sealed'?'Distance map sealed':event.kind==='intermediate-start'?`Allow vertex ${intermediate} as an intermediate`:event.kind==='intermediate-end'?`Finish intermediate ${intermediate}`:`${accepted?'Shorten':'Check'} ${current![0]+1} → ${current![1]+1} via ${intermediate}`;const message=event.kind==='start'?'The matrix is the direct-cost input. We will only change a cell when a route through the current intermediate is shorter.':event.kind==='sealed'?'Every pair now stores its shortest-path distance. This sealed matrix is the cost map consumed by the Steiner DP.':event.kind==='intermediate-start'?`Floyd–Warshall now permits vertices 1…${intermediate} inside a route.`:event.kind==='intermediate-end'?`All ${input.n} × ${input.n} cells were checked with intermediate ${intermediate}.`:accepted?`min(${event.old}, ${event.via}) = ${event.next}. The route through ${intermediate} wins.`:`min(${event.old}, ${event.via}) stays ${event.next}. No shorter route was found.`;const focus=event.kind==='cell'?['for final_vertex in range(n):','cost[current_vertex][final_vertex] = min(']:['for intermediate_vertex in range(n):'];const activeRule=event.kind==='cell'?(accepted?'min':'cell'):event.kind==='intermediate-start'?'k':'';const data=common(input,'floyd-warshall',event.matrix,solution,null,activeEdge,false,null,{transition:event.kind==='sealed'?'handoff':'overview',distanceMatrix:nullableMatrix(event.matrix),rules:rules(activeRule),floyd:{matrix:nullableMatrix(event.matrix),original:nullableMatrix(input.c),intermediate,current:current?[current[0]+1,current[1]+1]:null,oldDistance:finite(event.old),viaDistance:finite(event.via),newDistance:finite(event.next),accepted,candidatePath:current&&intermediate!==null?Array.from(new Set([current[0]+1,intermediate,current[1]+1])):[],completedIntermediates:event.completedIntermediates.map(value=>value+1),sealed:event.kind==='sealed'}});return {phase:event.kind==='cell'?'FLOYD CELL':'FLOYD–WARSHALL',title,message,kind:'steiner-tree',codeFocus:focus,traceRole:event.traceRole,data};
}

function dpFrame(input:SteinerInput,distance:Matrix,solution:Set<string>,expanded:Set<string>,event:DpEvent|null,table:Matrix,layer:SteinerFrameData['layer'],transition:SteinerFrameData['transition'],title:string,message:string,focus:string[],showSolution=false,maskOverride:number|null=null):VisualFrame{
  const full=(1<<input.k)-1;const mask=event?.mask??(maskOverride??full);const root=event?.root??null;const target=event?.target??null;const activeEdge=event?.type==='relax'&&root!==null&&target!==null?[root+1,target+1] as [number,number]:null;const activeRule=transition==='merge'?'sub':transition==='relax'?'u':transition==='lookup'?'lookup':transition==='query-seed'?'mask':transition==='seed'?'v':'';const commonData=common(input,'steiner-dp',distance,solution,root,activeEdge,showSolution,expanded,{layer,transition,mask,submask:event?.submask??null,otherMask:event?.otherMask??null,root,target,dpRow:table[mask]?.map(value=>finite(value))??[],dpTable:table.map(row=>row.map(value=>finite(value))),oldDpRow:event?.oldRow?.map(value=>finite(value))??null,oldCost:finite(event?.old),candidateCost:finite(event?.candidate),newCost:finite(event?.next),answer:showSolution?finite(table[full]?.[input.query[1]-1]):null,rules:rules(activeRule)});return {phase:layer==='with-s'?'QUERY DP':'STEINER DP',title,message,kind:'steiner-tree',codeFocus:focus,traceRole:event?.traceRole??'checkpoint',data:commonData};
}

function createFrames(value:unknown,_problem:Problem):VisualFrame[]{
  const input=value as SteinerInput;const floyd=runFloyd(input.c);const base=runBase(floyd.distance,input.k);const sIndex=input.query[0]-1;const tIndex=input.query[1]-1;const withS=runWithS(floyd.distance,base,input.k,sIndex);const full=(1<<input.k)-1;const solution=reconstruct(base,withS,full,tIndex);const expanded=expandMetricEdges(solution,floyd.nextHop);const frames:VisualFrame[]=[];
  floyd.events.forEach(event=>frames.push(floydFrame(input,event,new Set())));
  frames.push(dpFrame(input,floyd.distance,solution,expanded,null,base.seedTables[0],'base','seed','Initialize dp[mask][v]','The empty fixed-terminal mask asks for no terminals, so every attachment vertex costs zero.',['dp = [[INF] * n for _ in range(1 << k)]','dp[0] = [0] * n'],false,0));
  base.seedTables.slice(1).forEach((table,index)=>frames.push(dpFrame(input,floyd.distance,solution,expanded,null,table,'base','seed',`Seed terminal ${index+1}`,`A singleton mask containing terminal ${index+1} costs zero at that terminal and remains unreachable elsewhere.`,['dp[1 << t][t] = 0'],false,1<<index)));
  base.events.forEach(event=>{const binary=event.mask.toString(2).padStart(input.k,'0');const sub=event.submask===null?'':event.submask.toString(2).padStart(input.k,'0');const title=event.type==='merge'?`Try ${sub} + ${(event.otherMask??0).toString(2).padStart(input.k,'0')} at v=${(event.root??0)+1}`:`Relax ${event.root!+1} → ${event.target!+1} for mask ${binary}`;const message=event.type==='merge'?`Both partial trees share v=${(event.root??0)+1}. The candidate is dp[sub][v] + dp[other][v].`:`The frozen old row is used: old[${event.root!+1}] + distance[${event.root!+1}][${event.target!+1}].`;frames.push(dpFrame(input,floyd.distance,solution,expanded,event,event.table,'base',event.type==='merge'?'merge':'relax',title,message,event.type==='merge'?['while True:','dp[mask][v] = min(']:['old = dp[mask][:]','dp[mask][u] = min(']))});
  frames.push(dpFrame(input,floyd.distance,solution,expanded,null,base.dp,'base','handoff','Base DP is complete','All fixed-terminal masks have been merged and relaxed over the Floyd–Warshall distance map.',['old = dp[mask][:]']));
  frames.push(dpFrame(input,floyd.distance,solution,expanded,null,withS.seedTable,'with-s','query-seed',`Attach query source s = ${input.query[0]}`,`The selected query source is seeded outside the fixed-terminal mask. This is the branch used to answer s = ${input.query[0]}, t = ${input.query[1]}.`,['for s in range(k, n):','ndp[0][s] = 0'],false,0));
  withS.events.forEach(event=>{const binary=event.mask.toString(2).padStart(input.k,'0');const title=event.type==='merge'?`Query merge for mask ${binary}`:`Query relax ${event.root!+1} → ${event.target!+1}`;const message=event.type==='merge'?`ndp[sub][v] already carries s; base[other][v] supplies the remaining fixed terminals.`:`The query layer also moves its attachment point with the sealed distance matrix.`;frames.push(dpFrame(input,floyd.distance,solution,expanded,event,event.table,'with-s',event.type==='merge'?'merge':'relax',title,message,event.type==='merge'?['ndp[mask][v] = min(']:['old = ndp[mask][:]','ndp[mask][u] = min(']))});
  const answer=withS.dp[full][tIndex];frames.push(dpFrame(input,floyd.distance,solution,expanded,null,withS.dp,'with-s','lookup',`Read ndp[full][t = ${input.query[1]}]`,`The target column forces t into the connected graph without adding another mask bit. The answer is ${answer.toLocaleString()}.`,['answer[s][t] = ndp[full_mask][t]'],true));frames.push(dpFrame(input,floyd.distance,solution,expanded,null,withS.dp,'answer','reconstruct','Reconstruct the chosen tree',`The highlighted metric edges connect terminals 1…${input.k}, s=${input.query[0]}, and t=${input.query[1]}. Expanded shortest paths are available in the graph view.`,['answer[s][t] = ndp[full_mask][t'],true));
  return frames;
}

const official='{"n":5,"k":2,"c":[[0,395,395,1,1],[395,0,1,395,1],[395,1,0,395,1],[1,395,395,0,1],[1,1,1,1,0]],"query":[3,4]}';
const hiddenHub='{"n":5,"k":2,"c":[[0,9,9,9,1],[9,0,9,9,1],[9,9,0,9,1],[9,9,9,0,1],[1,1,1,1,0]],"query":[3,4]}';
const indirect='{"n":4,"k":1,"c":[[0,1,9,9],[1,0,1,9],[9,1,0,1],[9,9,1,0]],"query":[2,4]}';
const trueSplit='{"n":7,"k":3,"c":[[0,20,20,20,20,1,20],[20,0,20,20,20,1,20],[20,20,0,20,20,20,1],[20,20,20,0,20,20,1],[20,20,20,20,0,1,1],[1,1,20,20,1,0,20],[20,20,1,1,1,20,0]],"query":[4,5]}';
const zeroTies='{"n":5,"k":2,"c":[[0,7,7,7,0],[7,0,7,7,0],[7,7,0,7,0],[7,7,7,0,0],[0,0,0,0,0]],"query":[3,4]}';
const large='{"n":5,"k":3,"c":[[0,1000000000,1000000000,1000000000,1000000000],[1000000000,0,1000000000,1000000000,1000000000],[1000000000,1000000000,0,1000000000,1000000000],[1000000000,1000000000,1000000000,0,1000000000],[1000000000,1000000000,1000000000,1000000000,0]],"query":[4,5]}';

export const steinerTreeVisualizer:VisualizerAdapter={id:'abc395-g',name:'Floyd–Warshall → Steiner DP studio',mode:'specialized',description:'Build the all-pairs shortest-path matrix, then reuse it inside the exact terminal-mask DP and reconstruct the selected query tree.',inputLabel:'ATCODER PARAMETERS · n, k, c, query',inputGuide:'Use {"n":5,"k":2,"c":[…],"query":[3,4]}. The matrix editor keeps costs symmetric and traces the selected query branch.',placeholder:official,referenceCode:steinerCode,inputEditor:'steiner-matrix',presets:[
  {label:'Official sample · connector reuse',input:official,source:'AtCoder'},
  {label:'Hidden hub beats required-only MST',input:hiddenHub,source:'Diagnostic'},
  {label:'Indirect route beats direct edge',input:indirect,source:'Diagnostic'},
  {label:'True split at the query root',input:trueSplit,source:'Diagnostic'},
  {label:'Zero weights and tied optima',input:zeroTies,source:'Diagnostic'},
  {label:'64-bit total cost',input:large,source:'Diagnostic'},
],parseInput:parseSteinerInput,createFrames,presentation:'diagram-first'};
