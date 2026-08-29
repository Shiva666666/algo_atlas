import type {IncremovableFrameData} from '../types';
import '../incremovable.css';
import {InsightRail,RuleStrip} from './LearningPrimitives';

export function IncremovableCanvas({data}:{data:IncremovableFrameData}){
  const startCount=data.added>0&&!data.allIncreasing?Math.max(0,data.prefixEnd+2):0;
  const removalEnd=data.suffixStart-1;
  const bridge=data.suffixStart>=data.nums.length
    ?'empty suffix'
    :data.prefixEnd<0
      ?'empty prefix'
      :`${data.nums[data.prefixEnd]} < ${data.nums[data.suffixStart]}`;
  return <div className="incremovable-lab">
    <div className="incremovable-array" aria-label={`Array ${data.nums.join(', ')}`}>
      {data.nums.map((value,index)=>{
        const prefix=index<=data.prefixEnd;const suffix=index>=data.suffixStart;const middle=!prefix&&!suffix;
        return <article className={`${prefix?'prefix':''} ${suffix?'suffix':''} ${middle?'middle':''} ${data.activeIndex===index?'active':''}`} key={index}>
          <small>{index}</small><strong>{value}</strong>
          {index===data.prefixEnd?<span>i</span>:index===data.suffixStart?<span>j</span>:null}
        </article>;
      })}
    </div>
    <div className="incremovable-status">
      <div><small>INCREASING PREFIX</small><strong>{data.prefixEnd<0?'empty':`[0, ${data.prefixEnd}]`}</strong></div>
      <div className={data.bridgeValid===false?'invalid':data.bridgeValid===true?'valid':''}><small>BRIDGE</small><strong>{bridge}</strong></div>
      <div><small>RUNNING ANSWER</small><strong>{data.answer}{data.added>0?`  (+${data.added})`:''}</strong></div>
    </div>
    <section className="removal-starts">
      <header><span>{data.allIncreasing?'EVERY REMOVAL INTERVAL IS VALID':'VALID REMOVAL STARTS FOR THIS BOUNDARY'}</span><small>{data.allIncreasing?`${data.answer} non-empty subarrays`:data.suffixStart>=data.nums.length?'remove through array end':`remove through index ${removalEnd}`}</small></header>
      <div>{data.allIncreasing?<em>Removing any non-empty subarray leaves a strictly increasing array.</em>:startCount?Array.from({length:startCount},(_,start)=><article key={start}><small>start {start}</small><strong>[{start}, {removalEnd}]</strong></article>):<em>Advance to a COUNT step to enumerate the valid starts.</em>}</div>
    </section>
    <p className="structure-action">{data.action}</p>
    <RuleStrip rules={data.rules}/>
    <InsightRail insights={data.insights}/>
  </div>;
}
