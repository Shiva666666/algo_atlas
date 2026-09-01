import {useMemo,useState} from 'react';
import {SmoothTabs} from './LessonPrimitives';

interface SteinerEditorValue {n:number;k:number;c:number[][];query:[number,number]}

function readValue(raw:string):SteinerEditorValue|null{
  try{
    const value=JSON.parse(raw) as Partial<SteinerEditorValue>;
    if(!value||typeof value!=='object'||!Number.isInteger(value.n)||!Array.isArray(value.c)||value.c.length!==value.n||!value.c.every(row=>Array.isArray(row)&&row.length===value.n)||!Number.isInteger(value.k)||!Array.isArray(value.query)||value.query.length!==2)return null;
    const n=value.n as number;const k=value.k as number;const matrix=value.c as number[][];const query=value.query as [unknown,unknown];
    return {n,k,c:matrix.map(row=>row.map(Number)),query:[Number(query[0]),Number(query[1])]};
  }catch{return null}
}

function writeValue(value:SteinerEditorValue){return JSON.stringify(value)}

export function SteinerInputEditor({raw,onChange}:{raw:string;onChange:(value:string)=>void}){
  const [mode,setMode]=useState('matrix');
  const parsed=useMemo(()=>readValue(raw),[raw]);
  const update=(change:(value:SteinerEditorValue)=>void)=>{if(!parsed)return;const next={n:parsed.n,k:parsed.k,c:parsed.c.map(row=>[...row]),query:[...parsed.query] as [number,number]};change(next);onChange(writeValue(next))};
  const vertices=parsed?Array.from({length:parsed.n},(_,index)=>index+1):[];
  const queryVertices=parsed?vertices.filter(vertex=>vertex>parsed.k):[];
  return <div className="steiner-input-editor">
    <div className="steiner-editor-heading"><span>INPUT BUILDER</span><small>{parsed?`${parsed.n} vertices · ${parsed.k} fixed terminals`:'JSON shape required for the matrix view'}</small></div>
    <SmoothTabs id="steiner-input" value={mode} onChange={setMode} label="Steiner input editor" items={[{id:'matrix',label:'Matrix'},{id:'json',label:'JSON'}]}/>
    {mode==='matrix'&&parsed?<div className="steiner-matrix-editor">
      <div className="steiner-parameters">
        <label><span>FIXED TERMINALS · k</span><select value={parsed.k} onChange={event=>{const k=Number(event.target.value);update(value=>{value.k=k;const valid=value.query.filter(vertex=>vertex>k);value.query=[valid[0]??k+1,valid[1]??k+2<=value.n?k+2:k+1]})}}>{Array.from({length:Math.min(parsed.n-2,4)},(_,index)=>index+1).map(value=><option value={value} key={value}>{value}</option>)}</select></label>
        <label><span>QUERY SOURCE · s</span><select value={parsed.query[0]} onChange={event=>update(value=>{value.query[0]=Number(event.target.value);if(value.query[0]===value.query[1])value.query[1]=queryVertices.find(vertex=>vertex!==value.query[0])??value.query[1]})}>{queryVertices.map(vertex=><option value={vertex} key={vertex}>{vertex}</option>)}</select></label>
        <label><span>QUERY TARGET · t</span><select value={parsed.query[1]} onChange={event=>update(value=>{value.query[1]=Number(event.target.value);if(value.query[1]===value.query[0])value.query[0]=queryVertices.find(vertex=>vertex!==value.query[1])??value.query[0]})}>{queryVertices.map(vertex=><option value={vertex} key={vertex}>{vertex}</option>)}</select></label>
        <p>Vertex count is edited in JSON mode. Diagonal cells stay 0 and mirrored cells stay equal.</p>
      </div>
      <div className="steiner-matrix-scroll"><table className="steiner-cost-matrix"><caption>Direct edge costs before Floyd–Warshall</caption><thead><tr><th scope="col">from \ to</th>{vertices.map(vertex=><th scope="col" key={vertex}>v{vertex}</th>)}</tr></thead><tbody>{parsed.c.map((row,rowIndex)=><tr key={rowIndex}><th scope="row">v{rowIndex+1}</th>{row.map((cost,columnIndex)=>{const disabled=rowIndex===columnIndex;return <td key={columnIndex}><input aria-label={`Cost from vertex ${rowIndex+1} to vertex ${columnIndex+1}`} type="number" min="0" step="any" value={cost} disabled={disabled} onChange={event=>{const next=Number(event.target.value);if(!Number.isFinite(next)||next<0)return;update(value=>{value.c[rowIndex][columnIndex]=next;value.c[columnIndex][rowIndex]=next})}}/></td>})}</tr>)}</tbody></table></div>
    </div>:mode==='json'?<label className="steiner-json-editor"><span>ADVANCED JSON INPUT</span><textarea rows={8} value={raw} onChange={event=>onChange(event.target.value)} spellCheck={false}/><small>Use the canonical shape: n, k, c, query. Build steps validates the full domain.</small></label>:<p className="steiner-editor-error">Enter a complete object with n, k, c, and query to unlock the matrix editor. Switch to JSON to repair it.</p>}
    {mode==='matrix'&&parsed&&<button type="button" className="steiner-json-hint" onClick={()=>setMode('json')}>Need to resize the graph? Open advanced JSON</button>}
  </div>;
}
