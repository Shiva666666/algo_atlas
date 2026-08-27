import type {GraphEdgeView,GraphNodeView} from '../types';

interface GraphCanvasProps {
  nodes:GraphNodeView[];
  edges:GraphEdgeView[];
  label:string;
}

function position(node:GraphNodeView,index:number,count:number){
  if(node.x!==undefined&&node.y!==undefined)return {x:node.x,y:node.y};
  const angle=-Math.PI/2+(Math.PI*2*index)/Math.max(count,1);
  return {x:320+Math.cos(angle)*230,y:170+Math.sin(angle)*125};
}

export function GraphCanvas({nodes,edges,label}:GraphCanvasProps){
  const points=new Map(nodes.map((node,index)=>[node.id,position(node,index,nodes.length)]));
  return <svg className="learning-graph" viewBox="0 0 640 340" role="img" aria-label={label}>
    <title>{label}</title>
    <desc>Weighted graph with node roles and active algorithm transitions.</desc>
    <g className="learning-graph-edges">
      {edges.map((edge,index)=>{
        const from=points.get(edge.from);const to=points.get(edge.to);
        if(!from||!to)return null;
        const mx=(from.x+to.x)/2;const my=(from.y+to.y)/2;
        return <g className={`edge-${edge.state}`} key={`${edge.from}-${edge.to}-${index}`}>
          <line x1={from.x} y1={from.y} x2={to.x} y2={to.y}/>
          {edge.weight!==undefined&&<text x={mx} y={my-5}>{edge.weight}</text>}
        </g>;
      })}
    </g>
    <g className="learning-graph-nodes">
      {nodes.map((node,index)=>{const point=points.get(node.id)!;return <g className={`node-${node.role}`} transform={`translate(${point.x} ${point.y})`} key={node.id}>
        <circle r={node.role==='target'?25:22}/>
        {node.role==='target'&&<circle className="target-ring" r={30}/>} 
        {node.role==='terminal'&&<rect x={-16} y={-16} width={32} height={32} rx={4}/>} 
        {node.role==='source'&&<path d="M 0 -22 L 22 0 L 0 22 L -22 0 Z"/>}
        <text className="node-label" y={4}>{node.label}</text>
        {node.detail&&<text className="node-detail" y={37}>{node.detail}</text>}
        <title>{node.label}{node.detail?` — ${node.detail}`:''}</title>
      </g>})}
    </g>
  </svg>;
}
