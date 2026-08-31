import type {CSSProperties} from 'react';
import type {Problem} from '../../types';
import type {GenericFrameData,IncremovableFrameData,IntuitionFrameData,MonotonicWindowFrameData,PalindromeFrameData,SteinerFrameData,VisualFrame} from '../types';
import {IncremovableCanvas} from './IncremovableCanvas';
import {IntuitionCanvas} from './IntuitionCanvas';
import {MonotonicWindowCanvas} from './MonotonicWindowCanvas';
import {SteinerCanvas} from './SteinerCanvas';
import {TrieSuggestionsCanvas,UniqueSplitCanvas} from './Batch1Canvas';
import {NQueensCanvas,CoinChangeCanvas,HexadecimalCanvas} from './PracticeCanvas';
import type {NQueensData} from '../nQueens';
import type {CoinChangeData} from '../coinChange';
import type {HexadecimalData} from '../hexadecimal';

function PalindromeCanvas({data}:{data:PalindromeFrameData}){
  const n=data.s.length;
  const active=(index:number)=>data.highlightStart!==null&&data.highlightEnd!==null&&index>=data.highlightStart&&index<=data.highlightEnd;
  return <div className="palindrome-visual">
    <div className="string-ribbon" aria-label={`Input string ${data.s}`}>
      {Array.from(data.s).map((character,index)=><div className={`${active(index)?'active':''} ${index===data.activeStart?'start':''} ${index===data.activeEnd?'end':''}`} key={`${character}-${index}`}><small>{index}</small><b>{character}</b></div>)}
    </div>
    <div className="state-plane-grid">
      <section className="state-plane">
        <header><span>PALINDROME[start][end]</span><small>DEPENDENCY PLANE</small></header>
        <div className="viz-matrix-scroll">
          <div className="viz-matrix" style={{'--viz-n':n} as CSSProperties}>
            <i className="matrix-corner"/>
            {Array.from(data.s).map((character,index)=><b className="matrix-axis column" key={`column-${index}`}>{character}<small>{index}</small></b>)}
            {data.palindrome.map((row,start)=><div className="matrix-row" key={`row-${start}`}>
              <b className="matrix-axis row">{data.s[start]}<small>{start}</small></b>
              {row.map((value,end)=>{const current=start===data.activeStart&&end===data.activeEnd;const className=[value===null?'void':value?'truthy':'falsy',current?'current':'',current&&data.accepted===true?'accepted':'',current&&data.accepted===false?'rejected':''].filter(Boolean).join(' ');return <span className={className} key={`${start}-${end}`} title={`palindrome[${start}][${end}] = ${value}`}><em>{value===null?'·':value?'T':'F'}</em></span>})}
            </div>)}
          </div>
        </div>
      </section>
      <div className="state-transfer"><i/><span>VALID FINAL<br/>PALINDROME</span><i/></div>
      <section className="state-plane cut-plane">
        <header><span>CUTS[end]</span><small>PREFIX STATE</small></header>
        <div className="cut-cells">{data.cuts.map((value,index)=><div className={index===data.activeEnd?'current':''} key={`cut-${index}`}><small>{index}</small><strong>{value??'—'}</strong><span>{data.s.slice(0,index+1)}</span></div>)}</div>
        <div className={`transition-equation ${data.accepted===false?'rejected':''}`}>
          {data.activeStart===null||data.activeEnd===null?<><small>STATE RULE</small><b>cuts[end] = min(cuts[start − 1] + 1)</b></>:<><small>{data.accepted?'TRANSITION ACCEPTED':'TRANSITION SKIPPED'}</small><b>{data.accepted?data.activeStart===0?`cuts[${data.activeEnd}] = 0`:`cuts[${data.activeEnd}] ← min(current, cuts[${data.activeStart-1}] + 1${data.candidate===null?'':` = ${data.candidate}`})`:`palindrome[${data.activeStart}][${data.activeEnd}] = False`}</b></>}
        </div>
      </section>
    </div>
  </div>;
}

function displayScalar(value:unknown){if(value===null)return 'null';if(typeof value==='string')return value;if(typeof value==='undefined')return 'undefined';return String(value)}

function ScalarArray({value,path,activePath}:{value:unknown[];path:Array<string|number>;activePath:Array<string|number>}){
  return <div className="generic-array">{value.map((item,index)=><div className={activePath.length===path.length+1&&activePath.every((part,partIndex)=>partIndex<path.length?part===path[partIndex]:part===index)?'active':''} key={index}><small>{index}</small><b>{displayScalar(item)}</b></div>)}</div>;
}

function GenericValue({value,path,activePath}:{value:unknown;path:Array<string|number>;activePath:Array<string|number>}){
  if(Array.isArray(value)&&value.every(item=>!Array.isArray(item)&&!(item!==null&&typeof item==='object')))return <ScalarArray value={value} path={path} activePath={activePath}/>;
  if(Array.isArray(value)&&value.every(Array.isArray))return <div className="generic-matrix">{value.map((row,rowIndex)=><ScalarArray value={row as unknown[]} path={[...path,rowIndex]} activePath={activePath} key={rowIndex}/>)}</div>;
  if(value!==null&&typeof value==='object')return <div className="generic-object">{Object.entries(value as Record<string,unknown>).map(([key,item])=>{const prefixMatches=path.every((part,index)=>activePath[index]===part);const isActive=prefixMatches&&activePath[path.length]===key;return <section className={isActive?'active':''} key={key}><header><span>{key}</span><small>{Array.isArray(item)?`array · ${item.length}`:typeof item}</small></header><GenericValue value={item} path={[...path,key]} activePath={activePath}/></section>})}</div>;
  return <div className={activePath.length===0?'generic-scalar active':'generic-scalar'}><small>VALUE</small><b>{displayScalar(value)}</b></div>;
}

function GenericCanvas({data,approach}:{data:GenericFrameData;approach:string[]}){
  return <div className="generic-visual"><div className="generic-data-plane"><header><span>PARAMETER MAP</span><small>ARRAYS · MATRICES · OBJECTS · SCALARS</small></header><GenericValue value={data.value} path={[]} activePath={data.activePath}/></div><div className="generic-flow-arrow"><i/><span>RECORDED<br/>TRANSITIONS</span><i/></div><div className="approach-rail">{(approach.length?approach:['Inspect parameters and define the algorithm state.']).map((message,index)=><div className={index===data.transitionIndex?'active':index<data.transitionIndex?'complete':''} key={`${message}-${index}`}><i>{index+1}</i><span>{message}</span></div>)}</div></div>;
}

export function FrameCanvas({frame,problem}:{frame:VisualFrame;problem:Problem}){
  switch(frame.kind){
    case 'n-queens':return <NQueensCanvas data={frame.data as NQueensData}/>;
    case 'coin-change':return <CoinChangeCanvas data={frame.data as CoinChangeData}/>;
    case 'hexadecimal':return <HexadecimalCanvas data={frame.data as HexadecimalData}/>;
    case 'palindrome-cuts':return <PalindromeCanvas data={frame.data as PalindromeFrameData}/>;
    case 'steiner-tree':return <SteinerCanvas data={frame.data as SteinerFrameData}/>;
    case 'monotonic-window':return <MonotonicWindowCanvas data={frame.data as MonotonicWindowFrameData}/>;
    case 'incremovable':return <IncremovableCanvas data={frame.data as IncremovableFrameData}/>;
    case 'intuition':return <IntuitionCanvas data={frame.data as IntuitionFrameData}/>;
    case 'trie-suggestions':return <TrieSuggestionsCanvas data={frame.data as import('../types').TrieSuggestionsFrameData}/>;
    case 'unique-split':return <UniqueSplitCanvas data={frame.data as import('../types').UniqueSplitFrameData}/>;
    default:return <GenericCanvas data={frame.data as GenericFrameData} approach={problem.notes?.approach??[]}/>;
  }
}
