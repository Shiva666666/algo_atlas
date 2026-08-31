import type {TrieSuggestionsFrameData,UniqueSplitFrameData} from '../types';
import {StateLegend} from './LessonPrimitives';

export function TrieSuggestionsCanvas({data}:{data:TrieSuggestionsFrameData}){
  const maxDepth=Math.max(1,...data.nodes.map(node=>node.depth));
  const byDepth=Array.from({length:maxDepth+1},(_,depth)=>data.nodes.filter(node=>node.depth===depth));
  const positions=new Map<string,[number,number]>();
  byDepth.forEach((nodes,depth)=>nodes.forEach((node,index)=>positions.set(node.id,[72+depth*112,48+(index+1)*Math.max(26,300/(nodes.length+1))])));
  return <div className="batch1-visual trie-visual">
    <StateLegend items={[{label:'Current traversal',symbol:'●',color:'#37d9ff'},{label:'Terminal product',symbol:'◆',color:'#4fd1a1'},{label:'Visited',symbol:'○',color:'#9b8cff'}]}/>
    <div className="trie-layout">
      <div className="trie-tree-wrap" role="img" aria-label={`Trie for ${data.products.join(', ')}; active prefix ${data.currentPrefix||'none'}`}>
        <svg className="trie-tree" viewBox="0 0 700 340" preserveAspectRatio="xMinYMid meet">
          {data.edges.map(edge=>{const from=positions.get(edge.from),to=positions.get(edge.to);if(!from||!to)return null;return <g key={`${edge.from}-${edge.to}`}><line className={`trie-edge ${edge.state}`} x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]}/><text className="trie-edge-label" x={(from[0]+to[0])/2} y={(from[1]+to[1])/2-4}>{edge.character}</text></g>})}
          {data.nodes.map(node=>{const point=positions.get(node.id)!;return <g key={node.id} className={`trie-node ${node.state}`}><circle cx={point[0]} cy={point[1]} r={node.depth===0?14:node.terminalProduct?10:7}/><text x={point[0]} y={point[1]+4} textAnchor="middle">{node.label}</text>{node.terminalProduct&&<text className="trie-terminal-label" x={point[0]+14} y={point[1]+4}>{node.terminalProduct}</text>}</g>})}
        </svg>
      </div>
      <aside className="trie-results"><div><small>TYPED PREFIX</small><strong>{data.currentPrefix||'—'}</strong></div><div><small>SUGGESTIONS · MAX 3</small>{data.suggestions.length?<ol>{data.suggestions.map(word=><li key={word}>{word}</li>)}</ol>:<em>{data.action==='missing'?'No matching branch':'Waiting for terminal products'}</em>}</div><div><small>COMPLETED PREFIXES</small><span>{data.resultLists.length?data.resultLists.map((list,index)=><code key={index}>{index+1}: {list.length?list.join(', '):'∅'}</code>):'None yet'}</span></div></aside>
    </div>
    <p className="visual-footnote">Terminal markers are checked before sorted child edges; each typed prefix receives a fresh copied result.</p>
  </div>;
}

export function UniqueSplitCanvas({data}:{data:UniqueSplitFrameData}){
  const end=data.end??data.start;
  return <div className="batch1-visual unique-split-visual">
    <StateLegend items={[{label:'Candidate',symbol:'▣',color:'#37d9ff'},{label:'Chosen path',symbol:'●',color:'#4fd1a1'},{label:'Rejected duplicate',symbol:'×',color:'#ff6b7a'}]}/>
    <div className="split-string" aria-label={`Input string ${data.s}`}>
      {Array.from(data.s).map((character,index)=><span className={index>=data.start&&index<end?'active':''} key={`${character}-${index}`}><small>{index}</small><b>{character}</b></span>)}
    </div>
    <div className="split-workbench">
      <section><small>ACTIVE CALL STACK</small><div className="split-calls">{data.callStack.length?data.callStack.map((call,index)=><article className={index===data.callStack.length-1?'current':''} key={`${call.start}-${index}`}><span>backtrack({call.start})</span><strong>best {call.answer}</strong></article>):<em>returned to root</em>}</div></section>
      <section><small>CHOSEN SUBSTRINGS · SEEN</small><div className="split-chips">{data.path.length?data.path.map((part,index)=><span key={`${part}-${index}`}>{part}</span>):<em>empty path</em>}</div><p>{data.action==='reject'?`“${data.candidate}” is already in seen.`:data.childResult===null?'Choose a candidate to recurse.':`Child returned ${data.childResult}; this branch contributes 1 + ${data.childResult}.`}</p></section>
    </div>
    <div className="split-status"><span>candidate <code>{data.candidate??'—'}</code></span><span>range <code>{data.candidateRange?`[${data.candidateRange[0]}, ${data.candidateRange[1]})`:'—'}</code></span><span>best <strong>{data.best}</strong></span></div>
    <p className="visual-footnote">Only the active branch is expanded; completed siblings remain represented by their returned best count.</p>
  </div>;
}
