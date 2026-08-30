import {useEffect,useRef} from 'react';
import type {CSSProperties} from 'react';
import type {NQueensData} from '../nQueens';
import type {CoinChangeData} from '../coinChange';
import type {HexadecimalData} from '../hexadecimal';
import {StateLegend} from './LessonPrimitives';

const cyan='#37d9ff',violet='#9b8cff',red='#ff6b7a',green='#4fd1a1',muted='#a9b4c2';
const setText=(values:number[])=>values.length?`{ ${values.join(', ')} }`:'∅';

export function NQueensCanvas({data}:{data:NQueensData}){
  const {n,board,candidate}=data;
  const describe=`${n} by ${n} working board. ${board.length?board.map((column,row)=>`Queen at row ${row}, column ${column}`).join('. '):'No queens placed.'}${candidate?` Candidate row ${candidate.row}, column ${candidate.column}; ${candidate.conflicts.length?'attacked':'safe'}.`:''}`;
  return <div className="practice-visual queens-visual">
    <StateLegend items={[{label:'Placed queen',symbol:'Q',color:violet},{label:'Candidate',symbol:'◎',color:cyan},{label:'Conflict',symbol:'×',color:red}]}/>
    <div className="queen-workspace">
      <section aria-label="Working chessboard">
        <div className="visual-section-label">Working board <span>0-based row / column</span></div>
        <div className="queen-coordinates" style={{'--board-n':n} as CSSProperties}>
          <span className="queen-axis-corner">r / c</span>
          <div className="queen-column-axis">{Array.from({length:n},(_,c)=><span key={c}>{c}</span>)}</div>
          <div className="queen-row-axis">{Array.from({length:n},(_,r)=><span className={r===data.row?'current':''} key={r}>{r}</span>)}</div>
          <div className="queen-board" role="img" aria-label={describe}>
            {Array.from({length:n*n},(_,index)=>{
              const row=Math.floor(index/n),column=index%n;
              const placed=board[row]===column;
              const testing=candidate?.row===row&&candidate.column===column;
              const conflict=placed&&candidate?.conflicts.includes(row);
              return <div key={index} aria-hidden="true" className={`queen-square ${(row+column)%2?'dark':''} ${placed?'placed':''} ${testing?'candidate':''} ${conflict||testing&&candidate.conflicts.length?'conflict':''}`}>
                {placed?<b>Q</b>:testing?<b>{candidate.conflicts.length?'×':'◎'}</b>:<span>·</span>}
              </div>;
            })}
            {candidate&&candidate.conflicts.length>0&&<svg className="queen-attack-lines" viewBox={`0 0 ${n} ${n}`} aria-hidden="true">{candidate.conflicts.map(row=><line key={row} x1={board[row]+0.5} y1={row+0.5} x2={candidate.column+0.5} y2={candidate.row+0.5}/>)}</svg>}
          </div>
        </div>
      </section>
      <section className="queen-state" aria-label="Attack sets">
        <div className="visual-section-label">Occupied attack sets</div>
        <dl>
          <div><dt>Columns <code>col</code></dt><dd>{setText(data.columns)}</dd></div>
          <div><dt>↘ Diagonals <code>row − col</code></dt><dd>{setText(data.differences)}</dd></div>
          <div><dt>↗ Diagonals <code>row + col</code></dt><dd>{setText(data.sums)}</dd></div>
        </dl>
        {candidate?<div className={`candidate-check ${candidate.conflicts.length?'is-conflict':''}`}><b>{data.action==='place'?'Registered queen':'Candidate check'}</b><span>column = {candidate.column}</span><span>row − col = {candidate.row-candidate.column}</span><span>row + col = {candidate.row+candidate.column}</span><p>{candidate.conflicts.length?'A matching set entry means this square is attacked.':data.action==='place'?'All three markers now include this queen.':'None of these markers are occupied. This square is safe.'}</p></div>:<p className="visual-footnote">Each recursive call chooses one row. Removing a queen must also remove all three attack markers.</p>}
      </section>
    </div>
    <details className="saved-boards" open={data.action==='complete'||data.action==='solution'}>
      <summary>Saved solutions <strong>{data.solutions.length}</strong><span>Copied boards, separate from the working board</span></summary>
      {data.solutions.length?<div className="saved-board-list">{data.solutions.map((solution,index)=><figure key={index}><div className="mini-board" style={{'--board-n':n} as CSSProperties} role="img" aria-label={`Solution ${index+1}: columns ${solution.join(', ')}`}>
        {Array.from({length:n*n},(_,cell)=><span key={cell} aria-hidden="true" className={solution[Math.floor(cell/n)]===cell%n?'placed':''}>{solution[Math.floor(cell/n)]===cell%n?'Q':'·'}</span>)}
      </div><figcaption>Solution {index+1}</figcaption></figure>)}</div>:<p className="visual-footnote">{data.action==='complete'?`No valid board exists for n = ${n}.`:'No complete board saved yet.'}</p>}
    </details>
  </div>;
}

export function CoinChangeCanvas({data}:{data:CoinChangeData}){
  const call=data.stack.at(-1);
  const hasBranches=call&&call.i<data.coins.length&&call.a<data.amount&&data.event!=='cache hit';
  const stackView=useRef<HTMLOListElement>(null);
  useEffect(()=>{if(stackView.current)stackView.current.scrollLeft=stackView.current.scrollWidth},[call?.id]);
  return <div className="practice-visual coin-visual">
    <div className="coin-summary"><span>Coins, in original order <b>{data.coins.join(' · ')}</b></span><span>Target <b>{data.amount}</b></span><span>Root answer <b>{data.result??'not returned'}</b></span></div>
    <section className="recursion-state" aria-label="Current recursive call">
      <div className="visual-section-label">Call stack <span>root → active call · {data.stack.length} deep</span></div>
      <ol className="call-stack" ref={stackView} tabIndex={0} aria-label="Scrollable call stack, active call is last">{data.stack.length?data.stack.map((entry,index)=><li key={entry.id} className={index===data.stack.length-1?'active':''} aria-current={index===data.stack.length-1?'true':undefined}><small>{entry.via}</small><code>dfs({entry.i}, {entry.a})</code></li>):<li className="empty-stack">{data.result===null?'No calls yet':'All calls returned'}</li>}</ol>
      {call&&<div className="active-call"><b>dfs(i = {call.i}, a = {call.a})</b><span><code>a</code> is the sum already collected, not the amount remaining.</span>{data.returnValue!==null&&<strong className="returned-value">Returning {data.returnValue}</strong>}</div>}
      {hasBranches&&<div className="coin-branches">
        <div className={data.event==='take'||data.event==='take returned'?'active':''}><small>1 · Take {data.coins[call.i]}</small><code>dfs({call.i}, {call.a+data.coins[call.i]})</code><span>Same coin index · can reuse</span><b>{call.take===null?'? not returned':`${call.take} ways`}</b></div>
        <span className="branch-plus">+</span>
        <div className={data.event==='skip'?'active':''}><small>2 · Skip {data.coins[call.i]}</small><code>dfs({call.i+1}, {call.a})</code><span>Next coin · same sum</span><b>{call.skip===null?'? not returned':`${call.skip} ways`}</b></div>
      </div>}
    </section>
    <section aria-label="Memoization table">
      <div className="visual-section-label">Cache <span>row = coin index i · column = collected sum a</span></div>
      <StateLegend items={[{label:'Not cached',symbol:'—',color:muted},{label:'Computed, including 0',symbol:'●',color:violet},{label:'Current state',symbol:'□',color:cyan}]}/>
      <div className="memo-scroll" tabIndex={0} role="region" aria-label="Scrollable memoization table">
        <table className="coin-memo"><caption>cache[(i, a)] counts ways to finish from this state.</caption><thead><tr><th scope="col">i / a</th>{Array.from({length:data.amount+1},(_,a)=><th scope="col" key={a}>{a}{a===data.amount&&<small>target</small>}</th>)}</tr></thead><tbody>{data.memo.map((row,i)=><tr key={i}><th scope="row">i = {i}<small>coin {data.coins[i]}</small></th>{row.map((value,a)=><td key={a} className={`${value!==null?'computed':''} ${data.active?.[0]===i&&data.active[1]===a?'current':''} ${a===data.amount?'base-column':''}`} aria-label={`i ${i}, sum ${a}: ${value===null?'not cached':value}${data.active?.[0]===i&&data.active[1]===a?', current state':''}`}>{value??'—'}</td>)}</tr>)}</tbody></table>
      </div>
      <p className="visual-footnote">Base cases return directly and never enter this table. Reaching the target returns 1; overshooting or running out of coins returns 0. A stored 0 is a computed answer, not an empty cell.</p>
    </section>
  </div>;
}

export function HexadecimalCanvas({data}:{data:HexadecimalData}){
  const bits=data.working?.toString(2).padStart(32,'0');
  return <div className="practice-visual hex-visual">
    <div className="hex-values"><div><small>Original signed input</small><strong>{data.original}</strong></div><span aria-hidden="true">→</span><div><small>Working unsigned value</small><strong>{data.working??'not masked'}</strong></div></div>
    <section aria-label="32-bit working word">
      <div className="visual-section-label">32-bit working word <span>Read left → right · bit 31 to bit 0</span></div>
      {bits?<div className="bit-word">{Array.from({length:8},(_,index)=><div className={`bit-nibble ${index===7&&data.nibble!==null?'current':''}`} key={index}><small>{31-index*4}–{28-index*4}</small><code>{bits.slice(index*4,index*4+4)}</code><span>{index===7?'lowest 4 bits':`group ${7-index}`}</span></div>)}</div>:<div className="word-placeholder">{data.action==='zero'?'The zero branch returns before the bit operations.':'The 32-bit word appears after num &= 0xFFFFFFFF.'}</div>}
    </section>
    <StateLegend items={[{label:'Current nibble',symbol:'□',color:cyan},{label:'New result digit',symbol:'●',color:green}]}/>
    <div className="hex-operation"><div><small>Extract</small><code>num & 15</code><b>{data.nibble===null?'—':`${data.nibble.toString(2).padStart(4,'0')}₂ = ${data.nibble}`}</b></div><span aria-hidden="true">→</span><div><small>Look up</small><code>hashmap[value]</code><b>{data.digit===null?'—':`“${data.digit}”`}</b></div><span aria-hidden="true">→</span><div><small>Prepend</small><code>digit + res</code><b>{data.action==='prepend'?'Updated below':data.action==='extract'?'Next operation':'—'}</b></div></div>
    <details className="hex-lookup" open={data.action==='lookup'}><summary>Hex digit map · 0–15 → 0–f</summary><div>{Array.from('0123456789abcdef',(digit,index)=><span className={data.nibble===index?'current':''} key={digit}><small>{index}</small><b>{digit}</b></span>)}</div></details>
    <section className="hex-result" aria-label="Accumulated result"><div className="visual-section-label">Result <span>New digits are added on the left</span></div><div className="hex-result-digits">{data.result?Array.from(data.result,(digit,index)=><span className={data.action==='prepend'&&index===0?'new-digit':''} key={index}>{digit}</span>):<em>Empty string ""</em>}</div></section>
    <p className="visual-footnote">One hexadecimal digit represents four bits. Masking first keeps negative inputs within 32 bits; shifting then discards the nibble just consumed. This is your bit-manipulation solution, not a built-in conversion.</p>
  </div>;
}
