import type {SteinerFrameData} from '../types';
import {GraphCanvas} from './GraphCanvas';
import {formatCost,InsightRail,RuleStrip} from './LearningPrimitives';

function bit(mask:number,index:number){return (mask&(1<<index))!==0}

export function SteinerCanvas({data}:{data:SteinerFrameData}){
  const binary=data.mask.toString(2).padStart(data.maskWidth,'0');
  return <div className="steiner-lab">
    {data.comparison&&<div className="steiner-comparison">
      <article><small>VISUALGO-STYLE BRUTE FORCE</small><strong>{data.comparison.naive}</strong><span>optional vertices are guessed</span></article>
      <i>≠</i>
      <article className="intended"><small>ATCODER STATE SPACE</small><strong>{data.comparison.intended}</strong><span>terminal masks are solved; connectors emerge</span></article>
    </div>}
    <div className="steiner-workbench">
      <section className="graph-workbench">
        <header><span>GRAPH PLANE</span><small>SQUARE = FIXED · DIAMOND = s · DOUBLE RING = t</small></header>
        <GraphCanvas nodes={data.graph.nodes} edges={data.graph.edges} label={`Steiner graph for query ${data.s} to ${data.t}`}/>
        <div className="graph-legend"><span className="terminal">fixed terminal</span><span className="source">query s</span><span className="target">query t</span><span className="selected">chosen tree</span><span className="active">current transition</span></div>
      </section>
      <section className="mask-workbench">
        <header><span>{data.layer==='with-s'?'WITH-s DP':'BASE DP'}[mask][v]</span><small>{data.layer.replace('-',' ').toUpperCase()}</small></header>
        <div className="mask-state">
          <div><small>MASK</small><strong>{binary}</strong></div>
          <div className="mask-chips">{data.maskTerminals.map((terminal,index)=><span className={bit(data.mask,index)?'on':''} key={terminal}>T{terminal}</span>)}</div>
        </div>
        {data.submask!==null&&<div className="split-tray"><small>SPLIT AT THE SAME ROOT</small><div><span>{data.submask.toString(2).padStart(data.maskWidth,'0')}</span><b>+</b><span>{(data.mask^data.submask).toString(2).padStart(data.maskWidth,'0')}</span><b>@ v={data.root}</b></div></div>}
        <div className="dp-row" style={{'--dp-columns':data.dpRow.length} as React.CSSProperties}>
          {data.dpRow.map((cost,index)=><div className={`${data.root===index+1?'root':''} ${data.target===index+1?'target':''}`} key={index}><small>v={index+1}</small><strong>{formatCost(cost)}</strong></div>)}
        </div>
        <div className="transition-ledger">
          <div><small>OLD</small><b>{formatCost(data.oldCost)}</b></div>
          <span>→</span>
          <div><small>CANDIDATE</small><b>{formatCost(data.candidateCost)}</b></div>
          <span>→</span>
          <div><small>NEW</small><b>{formatCost(data.newCost)}</b></div>
        </div>
        <div className="answer-lookup"><small>QUERY LOOKUP</small><strong>withS[{binary}][t={data.t}] = {formatCost(data.answer)}</strong></div>
      </section>
    </div>
    <RuleStrip rules={data.rules}/>
    <InsightRail insights={data.insights}/>
  </div>;
}
