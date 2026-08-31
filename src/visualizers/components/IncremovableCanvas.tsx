import {useState} from 'react';
import type {IncremovableFrameData} from '../types';
import '../incremovable.css';
import {InsightRail,RuleStrip} from './LearningPrimitives';
import {StateLegend} from './LessonPrimitives';

export function IncremovableCanvas({data}:{data:IncremovableFrameData}){
  const [selectedStart,setSelectedStart]=useState(0);
  const startCount=data.added>0&&!data.allIncreasing?Math.max(0,data.prefixEnd+2):0;
  const removalEnd=data.suffixStart-1;
  const comparison=data.comparison;
  const comparisonValid=comparison?.valid??data.bridgeValid;
  const bridge=data.suffixStart>=data.nums.length
    ?'empty suffix'
    :data.prefixEnd<0
      ?'empty prefix'
      :`${data.nums[data.prefixEnd]} < ${data.nums[data.suffixStart]}`;
  const selectedEnd=data.suffixStart-1;
  const previewStart=startCount>0?Math.min(selectedStart,startCount-1):selectedStart;
  return <div className="incremovable-lab">
    <StateLegend items={[{label:'Retained prefix',symbol:'[',color:'#48a9ff'},{label:'Retained suffix',symbol:']',color:'#63e8aa'},{label:'Removal gap',symbol:'−',color:'#f06cae'}]}/>
    <div className="incremovable-array" aria-label={`Array ${data.nums.join(', ')}`}>
      {data.nums.map((value,index)=>{
        const prefix=index<=data.prefixEnd;const suffix=index>=data.suffixStart;const middle=!prefix&&!suffix;
        const selected=selectedEnd>=previewStart&&index>=previewStart&&index<=selectedEnd;
        return <article className={`${prefix?'prefix':''} ${suffix?'suffix':''} ${middle?'middle':''} ${selected?'selected-removal':''} ${data.activeIndex===index?'active':''}`} key={index}>
          <small>{index}</small><strong>{value}</strong>
          {(index===data.prefixEnd||index===(data.suffixPointer??data.suffixStart))&&<span>{[index===data.prefixEnd?'i':'',index===(data.suffixPointer??data.suffixStart)?'j':''].filter(Boolean).join(' · ')}</span>}
        </article>;
      })}
    </div>
    <div className="incremovable-status">
      <div><small>INCREASING PREFIX</small><strong>{data.prefixEnd<0?'empty':`[0, ${data.prefixEnd}]`}</strong></div>
      <div className={comparisonValid===false?'invalid':comparisonValid===true?'valid':''}><small>{comparison?`${comparison.kind.toUpperCase()} TEST`:data.bridgeValid===null?'NEXT BRIDGE (UNTESTED)':'BRIDGE'}</small><strong>{comparison?`${data.nums[comparison.left]} < ${data.nums[comparison.right]} · ${comparison.valid?'true':'false'}`:bridge}</strong></div>
      <div><small>RUNNING ANSWER</small><strong>{data.answer}{data.added>0?`  (+${data.added})`:''}</strong></div>
    </div>
    <section className="removal-starts">
      <header><span>{data.allIncreasing?'EVERY REMOVAL INTERVAL IS VALID':'VALID REMOVAL STARTS FOR THIS BOUNDARY'}</span><small>{data.allIncreasing?`${data.answer} non-empty subarrays`:data.suffixStart>=data.nums.length?'remove through array end':`remove through index ${removalEnd}`}</small></header>
      <div>{data.allIncreasing?<em>Removing any non-empty subarray leaves a strictly increasing array.</em>:startCount?Array.from({length:startCount},(_,start)=><button type="button" className={start===previewStart?'selected':''} onClick={()=>setSelectedStart(start)} key={start}><small>start {start}</small><strong>[{start}, {removalEnd}]</strong></button>):<em>Advance to a COUNT step to enumerate the valid starts.</em>}</div>
    </section>
    {!data.allIncreasing&&startCount>0&&<p className="removal-preview">Previewing removal <code>[{previewStart}, {selectedEnd}]</code>: the highlighted gap is removed; the prefix before it and suffix after it are retained.</p>}
    <p className="structure-action">{data.action}</p>
    <RuleStrip rules={data.rules}/>
    <InsightRail insights={data.insights}/>
  </div>;
}
