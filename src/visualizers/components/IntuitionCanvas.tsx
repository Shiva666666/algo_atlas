import type {CSSProperties} from 'react';
import type {BinarySearchView,DualHeapView,GraphColoringView,GridDpView,IntuitionFrameData,SubsetPruningView,TreePathView} from '../types';
import {GraphCanvas} from './GraphCanvas';
import {InsightRail,RuleStrip} from './LearningPrimitives';

function BinarySearchPlane({view}:{view:BinarySearchView}){
  const candidates=Array.from({length:Math.max(0,view.high-view.low+1)},(_,index)=>view.low+index);
  const shown=candidates.length<=17?candidates:[...candidates.slice(0,7),Number.NaN,...candidates.slice(-7)];
  return <div className="binary-search-plane">
    <div className="binary-context"><small>INPUT SIGNAL</small><strong>{view.context}</strong></div>
    <div className="candidate-range">{shown.map((value,index)=>Number.isNaN(value)?<i key={`ellipsis-${index}`}>…</i>:<article className={value===view.mid?'mid':''} key={value}><small>{value===view.low?'L':value===view.high?'R':value===view.mid?'MID':''}</small><strong>{value}</strong></article>)}</div>
    <div className="decision-meter"><div><small>{view.metricLabel}</small><strong>{view.metric??'—'}</strong></div><span>→</span><div><small>VERDICT</small><strong>{view.verdict}</strong></div><span>→</span><div><small>ANSWER</small><strong>{view.answer??'?'}</strong></div></div>
  </div>;
}

function GraphColoringPlane({view}:{view:GraphColoringView}){
  return <div className="graph-coloring-plane"><GraphCanvas nodes={view.graph.nodes} edges={view.graph.edges} label="Bipartite coloring trace"/><aside><small>BFS QUEUE</small><div>{view.queue.length?view.queue.map(node=><span key={node}>{node}</span>):<em>empty</em>}</div><small>COLOR STATE</small><div className="color-state">{view.colors.map((color,index)=><span className={color===0?'a':color===1?'b':''} key={index}>{index}:{color===null?'·':color}</span>)}</div><strong className={view.valid===false?'bad':view.valid===true?'good':''}>{view.valid===null?'checking edges':view.valid?'still bipartite':'same-color conflict'}</strong></aside></div>;
}

function GridDpPlane({view}:{view:GridDpView}){
  return <div className="grid-dp-plane">
    <div className="dp-matrix" style={{'--grid-columns':view.grid[0]?.length??1} as CSSProperties}>{view.grid.map((row,rowIndex)=><div key={rowIndex}>{row.map((value,columnIndex)=>{const active=view.active?.[0]===rowIndex&&view.active[1]===columnIndex;const chosen=view.chosen?.[0]===rowIndex&&view.chosen[1]===columnIndex;const candidate=view.choices.some(choice=>choice.row===rowIndex&&choice.column===columnIndex);return <article className={`${active?'active':''} ${chosen?'chosen':''} ${candidate?'candidate':''}`} key={columnIndex}><small>[{rowIndex},{columnIndex}]</small><strong>{value}</strong><span>{view.dp[rowIndex][columnIndex]===null?'dp ·':`dp ${view.dp[rowIndex][columnIndex]}`}</span></article>})}</div>)}</div>
    <div className="choice-stack"><small>THREE CHILD CHOICES</small>{view.choices.length?view.choices.map(choice=><div className={view.chosen?.[0]===choice.row&&view.chosen[1]===choice.column?'chosen':''} key={`${choice.row}-${choice.column}`}><code>({choice.row},{choice.column})</code><strong>{choice.value}</strong></div>):<p>Seed the last row first.</p>}</div>
  </div>;
}

function SubsetPlane({view}:{view:SubsetPruningView}){
  return <div className="subset-plane"><div className="recursion-path"><small>CURRENT PATH · LEVEL {view.level}</small><div>{view.path.length?view.path.map((value,index)=><span key={`${value}-${index}`}>{value}</span>):<em>empty subset</em>}</div><strong>{view.resultCount} unique subsets recorded</strong></div><span className="path-arrow">→</span><div className="sibling-row"><small>CANDIDATES AT THIS LEVEL</small><div>{view.candidates.map(candidate=><article className={candidate.state} key={candidate.index}><small>i={candidate.index}</small><strong>{candidate.value}</strong><span>{candidate.state==='skipped'?'same sibling value':candidate.state}</span></article>)}</div></div></div>;
}

function DualHeapPlane({view}:{view:DualHeapView}){
  return <div className="dual-heap-plane"><div className="capital-core"><small>CAPITAL</small><strong>{view.capital}</strong><span>round {view.round}</span></div><section><header><span>LOCKED PROJECTS</span><small>ordered by required capital</small></header><div>{view.locked.length?view.locked.map((project,index)=><article key={`${project.capital}-${project.profit}-${index}`}><small>cap {project.capital}</small><strong>+{project.profit}</strong></article>):<em>none</em>}</div></section><i>unlock<br/>when affordable</i><section className="profit-heap"><header><span>AVAILABLE PROFITS</span><small>maximum on top</small></header><div>{view.available.length?view.available.map((profit,index)=><article className={profit===view.selected?'selected':''} key={`${profit}-${index}`}><small>{index===0?'TOP':'profit'}</small><strong>+{profit}</strong></article>):<em>none</em>}</div></section></div>;
}

function TreePathPlane({view}:{view:TreePathView}){
  return <div className="tree-path-plane"><GraphCanvas nodes={view.graph.nodes} edges={view.graph.edges} label="Unique path in the Ticket to Ride tree"/><aside><small>STRUCTURE CHECK</small><strong>{view.branchComparison?'Steiner may branch':'Ticket chooses one path'}</strong><div className={view.branchComparison?'branch-shape':'path-shape'}>{view.branchComparison?<><span/><span/><span/><span/></>:view.path.map(node=><span key={node}>{node}</span>)}</div><p>{view.branchComparison?'A branching connector is legal in Steiner Tree.':'A tree already gives exactly one route between the chosen endpoints.'}</p></aside></div>;
}

export function IntuitionCanvas({data}:{data:IntuitionFrameData}){
  let plane=null;
  if(data.variant==='binary-search'&&data.binarySearch)plane=<BinarySearchPlane view={data.binarySearch}/>;
  if(data.variant==='graph-coloring'&&data.graphColoring)plane=<GraphColoringPlane view={data.graphColoring}/>;
  if(data.variant==='grid-dp'&&data.gridDp)plane=<GridDpPlane view={data.gridDp}/>;
  if(data.variant==='subset-pruning'&&data.subsetPruning)plane=<SubsetPlane view={data.subsetPruning}/>;
  if(data.variant==='dual-heap'&&data.dualHeap)plane=<DualHeapPlane view={data.dualHeap}/>;
  if(data.variant==='tree-path'&&data.treePath)plane=<TreePathPlane view={data.treePath}/>;
  return <div className={`intuition-lab intuition-${data.variant}`}>{plane}<RuleStrip rules={data.rules}/><InsightRail insights={data.insights}/></div>;
}
