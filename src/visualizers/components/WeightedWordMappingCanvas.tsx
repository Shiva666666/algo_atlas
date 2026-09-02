import type {WeightedWordFrameData} from '../weightedWordMapping';
import {StateLegend} from './LessonPrimitives';

const alphabet=Array.from({length:26},(_,index)=>String.fromCharCode(97+index));

function wordClass(data:WeightedWordFrameData,index:number){
  if(data.charIndex===null)return 'pending';
  if(index<data.charIndex)return 'processed';
  if(index===data.charIndex)return `current ${data.action==='lookup'?'lookup':''}`;
  return 'pending';
}

function displayNumber(value:number|null){return value===null?'—':value.toLocaleString()}

export function WeightedWordMappingCanvas({data}:{data:WeightedWordFrameData}){
  const activeWord=data.word??(data.wordIndex===null?'':data.words[data.wordIndex]??'');
  const activeModulo=data.modulo;
  return <div className="weighted-word-visual">
    <StateLegend items={[{label:'Current character',symbol:'◎',color:'#37d9ff'},{label:'Previous total',symbol:'−',color:'#f06cae'},{label:'Committed output',symbol:'◆',color:'#4fd1a1'},{label:'Mapping structure',symbol:'→',color:'#9b8cff'}]}/>

    <section className="weighted-word-ribbon" aria-label={`Words being mapped. Active word ${activeWord||'none'}`}>
      <header><span>WORD QUEUE</span><small>{data.wordIndex===null?'ready':`word ${data.wordIndex+1} of ${data.words.length}`}</small></header>
      <div className="weighted-word-list">
        {data.words.map((item,index)=><div className={`weighted-word-card ${index===data.wordIndex?'active':''} ${index<(data.wordIndex??-1)?'complete':''}`} key={`${item}-${index}`}>
          <small>{String(index+1).padStart(2,'0')}</small>
          <div>{Array.from(item).map((character,charIndex)=><span className={index===data.wordIndex?wordClass(data,charIndex):index<(data.wordIndex??-1)?'processed':'pending'} key={`${character}-${charIndex}`}><i>{charIndex}</i><b>{character}</b></span>)}</div>
          {data.totals[index]!==undefined&&<strong>{data.totals[index]}</strong>}
        </div>)}
      </div>
    </section>

    <div className="weighted-word-workbench">
      <section className="weighted-weight-board" aria-label="Alphabet weight lookup">
        <header><span>A–Z WEIGHT LOOKUP</span><small>{data.character?`weights[${data.alphabetIndex}] = ${data.selectedWeight}`:'fixed 26-entry table'}</small></header>
        <table><caption>Each lowercase letter points to one supplied weight.</caption><thead><tr><th scope="col">Letter</th><th scope="col">Weight</th><th scope="col">Letter</th><th scope="col">Weight</th></tr></thead><tbody><>{Array.from({length:13},(_,row)=>{const left=row;const right=row+13;return <tr key={row}><th scope="row" className={data.alphabetIndex===left?'current':''}>{alphabet[left]}</th><td className={data.alphabetIndex===left?'current':''}>{data.weights[left]}</td><th scope="row" className={data.alphabetIndex===right?'current':''}>{alphabet[right]}</th><td className={data.alphabetIndex===right?'current':''}>{data.weights[right]}</td></tr>})}</></tbody></table>
      </section>

      <section className="weighted-accumulator" aria-label="Running word total">
        <header><span>RUNNING TOTAL</span><small>{activeWord?`word “${activeWord}”`: 'awaiting word'}</small></header>
        <div className="weighted-equation"><code>{data.previousTotal===null?'0':data.previousTotal} {data.selectedWeight===null?'':`+ ${data.selectedWeight}`} {data.newTotal===null?'':`= ${data.newTotal}`}</code><strong>{data.runningTotal.toLocaleString()}</strong></div>
        <p>{data.action==='lookup'?'Lookup selected; the total has not changed yet.':data.action==='add'?`Add the selected weight for “${data.character}”.`:data.action==='store-total'?`Store ${data.runningTotal} as this word’s total.`:'Each character contributes exactly one table value.'}</p>
        <div className="weighted-total-history" aria-label="Completed word totals">{data.totals.length?data.totals.map((total,index)=><span key={`${total}-${index}`}><small>{data.words[index]}</small><b>{total}</b></span>):<em>No word totals yet</em>}</div>
      </section>
    </div>

    <section className="weighted-mapping-plane" aria-label="Modulo 26 reverse alphabet mapping">
      <header><span>MODULO DECODER</span><small>{activeModulo===null?'Reduce a completed word total':'The selected remainder points to the reverse alphabet'}</small></header>
      <p className="weighted-formula"><code>remainder = total % 26</code><span>then</span><code>letter = chr(ord('z') − remainder)</code></p>
      <div className="weighted-map-scroll"><div className="weighted-map-rail" role="img" aria-label={activeModulo===null?'Modulo positions 0 through 25 map to reverse alphabet letters z through a':`Remainder ${activeModulo} maps to ${data.mappedCharacter??'a letter'}`}>
        <div className="weighted-map-row weighted-map-index">{Array.from({length:26},(_,index)=><span className={activeModulo===index?'selected':''} key={index}>{index}</span>)}</div>
        <div className="weighted-map-connector">{Array.from({length:26},(_,index)=><i className={activeModulo===index?'selected':''} key={index}/>)}</div>
        <div className="weighted-map-row weighted-map-letter">{Array.from({length:26},(_,index)=><span className={activeModulo===index?'selected':''} key={index}>{alphabet[25-index]}</span>)}</div>
      </div></div>
      <div className="weighted-map-result"><span>SELECTED</span><strong>{activeModulo===null?'—':activeModulo}</strong><i>→</i><strong>{data.mappedCharacter??'—'}</strong><small>{data.action==='map'?`ord('z') − ${activeModulo}`:'reverse alphabet output'}</small></div>
    </section>

    <section className="weighted-output" aria-label="Mapped output">
      <header><span>OUTPUT TAPE</span><small>{data.output.length} of {data.words.length} words decoded</small></header>
      <div className="weighted-output-tape">{data.output?Array.from(data.output).map((character,index)=><span key={`${character}-${index}`}><small>{data.words[index]}</small><b>{character}</b></span>):<em>Characters appear here after each modulo decode.</em>}</div>
    </section>
    <p className="visual-footnote">The visualization mirrors the saved solution’s expressions. It is a bounded teaching trace; saved Python is displayed for study and never executed.</p>
  </div>;
}
