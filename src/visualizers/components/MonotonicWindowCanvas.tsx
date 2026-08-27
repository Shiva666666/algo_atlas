import type {MonotonicWindowFrameData} from '../types';
import {InsightRail,RuleStrip} from './LearningPrimitives';

function Deque({label,indices,nums,order}:{label:string;indices:number[];nums:number[];order:string}){
  return <section className="deque-lane"><header><span>{label}</span><small>{order}</small></header><div>{indices.length?indices.map((index,position)=><article className={position===0?'front':''} key={index}><small>{position===0?'FRONT':`i=${index}`}</small><strong>{nums[index]}</strong><span>@{index}</span></article>):<em>empty</em>}</div></section>;
}

export function MonotonicWindowCanvas({data}:{data:MonotonicWindowFrameData}){
  const hasWindow=data.right>=data.left&&data.right>=0;
  const max=data.maxDeque.length?data.nums[data.maxDeque[0]]:null;
  const min=data.minDeque.length?data.nums[data.minDeque[0]]:null;
  return <div className="window-lab">
    <div className="window-array" aria-label={`Array ${data.nums.join(', ')}`}>
      {data.nums.map((value,index)=>{const inWindow=hasWindow&&index>=data.left&&index<=data.right;const isBest=data.bestRange&&index>=data.bestRange[0]&&index<=data.bestRange[1];return <article className={`${inWindow?'in-window':''} ${isBest?'best-window':''} ${data.activeIndex===index?'active':''}`} key={index}><small>{index}</small><strong>{value}</strong>{index===data.left&&hasWindow?<span>L</span>:index===data.right&&hasWindow?<span>R</span>:null}</article>})}
    </div>
    <div className="window-status">
      <div><small>CURRENT WINDOW</small><strong>{hasWindow?`[${data.left}, ${data.right}]`:'—'}</strong></div>
      <div className={data.valid===false?'invalid':data.valid===true?'valid':''}><small>EXTREME CHECK</small><strong>{max===null||min===null?'—':`${max} − ${min} = ${max-min} ≤ ${data.limit}`}</strong></div>
      <div><small>BEST LENGTH</small><strong>{data.best}</strong></div>
    </div>
    <div className="deque-grid">
      <Deque label="MAX DEQUE" indices={data.maxDeque} nums={data.nums} order="decreasing · largest at front"/>
      <Deque label="MIN DEQUE" indices={data.minDeque} nums={data.nums} order="increasing · smallest at front"/>
    </div>
    <p className="structure-action">{data.action}</p>
    <RuleStrip rules={data.rules}/>
    <InsightRail insights={data.insights}/>
  </div>;
}
