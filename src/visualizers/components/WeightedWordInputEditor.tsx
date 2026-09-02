import {useMemo,useState} from 'react';
import {SmoothTabs} from './LessonPrimitives';
import type {WeightedWordMappingInput} from '../weightedWordMapping';

function readValue(raw:string):WeightedWordMappingInput|null{
  try{
    const value=JSON.parse(raw) as Partial<WeightedWordMappingInput>;
    if(!value||typeof value!=='object'||!Array.isArray(value.words)||!Array.isArray(value.weights))return null;
    return {words:value.words.filter((item):item is string=>typeof item==='string'),weights:value.weights.map(Number)};
  }catch{return null}
}

function writeValue(value:WeightedWordMappingInput){return JSON.stringify(value)}

export function WeightedWordInputEditor({raw,onChange}:{raw:string;onChange:(value:string)=>void}){
  const [mode,setMode]=useState('builder');
  const parsed=useMemo(()=>readValue(raw),[raw]);
  const update=(change:(value:WeightedWordMappingInput)=>void)=>{
    if(!parsed)return;
    const next={words:[...parsed.words],weights:[...parsed.weights]};
    change(next);onChange(writeValue(next));
  };
  return <div className="weighted-input-editor">
    <div className="weighted-editor-heading"><span>INPUT BUILDER</span><small>{parsed?`${parsed.words.length} words · ${parsed.weights.length} weight cells`:'JSON shape required for the builder'}</small></div>
    <SmoothTabs id="weighted-input" value={mode} onChange={setMode} label="Weighted word input editor" items={[{id:'builder',label:'Builder'},{id:'json',label:'JSON'}]}/>
    {mode==='builder'&&parsed?<div className="weighted-builder">
      <label className="weighted-words-field"><span>WORDS · ONE PER LINE</span><textarea rows={4} value={parsed.words.join('\n')} onChange={event=>update(value=>{value.words=event.target.value.split(/[\n,]+/).map(item=>item.trim()).filter(Boolean)})} spellCheck={false} aria-describedby="weighted-builder-help"/><small id="weighted-builder-help">Lowercase a–z only. The order here becomes the output order.</small></label>
      <div className="weighted-grid-field"><span>LETTER WEIGHTS · 26 CELLS</span><div className="weighted-input-grid">{Array.from({length:26},(_,index)=><label key={index}><b>{String.fromCharCode(97+index)}</b><input aria-label={`Weight for ${String.fromCharCode(97+index)}`} type="number" min="0" step="1" value={parsed.weights[index]??0} onChange={event=>{const next=Number(event.target.value);if(!Number.isSafeInteger(next)||next<0)return;update(value=>{value.weights[index]=next})}}/></label>)}</div><small>Zero is valid. Build steps validates word characters, counts, and safe totals.</small></div>
    </div>:mode==='json'?<label className="weighted-json-editor"><span>ADVANCED JSON INPUT</span><textarea rows={8} value={raw} onChange={event=>onChange(event.target.value)} spellCheck={false}/><small>Use the canonical shape: <code>{'{"words":["abcd"],"weights":[…26 values…]}'}</code>. Build steps validates the full domain.</small></label>:<p className="weighted-editor-error">Enter a complete object with words and weights to unlock the builder. Switch to JSON to repair it.</p>}
    {mode==='builder'&&parsed&&<button type="button" className="weighted-json-hint" onClick={()=>setMode('json')}>Need to paste or resize the arrays? Open advanced JSON</button>}
  </div>;
}
