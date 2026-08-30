import {useQuery} from '@tanstack/react-query';
import {ArrowLeft,ChevronLeft,ChevronRight,ExternalLink,Pause,Play,RotateCcw,ScanLine} from 'lucide-react';
import {useEffect,useMemo,useRef,useState} from 'react';
import {useNavigate,useParams} from 'react-router-dom';
import {api} from '../api';
import type {Problem} from '../types';
import {FrameCanvas} from '../visualizers/components/FrameCanvas';
import {LessonButton,LessonMotion,SmoothTabs} from '../visualizers/components/LessonPrimitives';
import {normalizeCode} from '../visualizers/practiceCode';
import {getVisualizer} from '../visualizers/registry';
import type {VisualFrame,VisualizerAdapter} from '../visualizers/types';
import '../visualizers/learning.css';
import '../visualizers/lesson.css';

function buildTrace(adapter:VisualizerAdapter,problem:Problem,raw:string){
  const result=adapter.createFrames(adapter.parseInput(raw),problem);
  if(!result.length)throw new Error('This input did not create any steps.');
  return result;
}

function ExplanationPanel({adapter,problem,frames,index,stepTo}:{adapter:VisualizerAdapter;problem:Problem;frames:VisualFrame[];index:number;stepTo:(index:number)=>void}){
  const [tab,setTab]=useState('code');
  const codeList=useRef<HTMLPreElement>(null);const stepList=useRef<HTMLOListElement>(null);
  const code=adapter.referenceCode??problem.python_code??'';
  const matches=!!adapter.referenceCode&&normalizeCode(code)===normalizeCode(problem.python_code??'');
  const focus=frames[index]?.codeFocus??[];
  const highlights=code.split('\n').map(line=>focus.some(snippet=>line.replace(/\s/g,'').includes(snippet.replace(/\s/g,''))));
  const activeLines=highlights.flatMap((active,line)=>active?[line+1]:[]);
  useEffect(()=>{
    const panel=tab==='code'?codeList.current:stepList.current;
    const active=panel?.querySelector<HTMLElement>('[data-current="true"]');
    if(panel&&active){
      const top=active.offsetTop-panel.offsetTop;
      if(top<panel.scrollTop||top+active.offsetHeight>panel.scrollTop+panel.clientHeight)panel.scrollTop=Math.max(0,top-panel.clientHeight/3);
    }
  },[index,tab]);
  return <aside className="lesson-explanation">
    <SmoothTabs id="lesson-view" value={tab} onChange={setTab} items={[{id:'code',label:'Python code'},{id:'steps',label:`Steps · ${frames.length}`}]}/>
    <div id="lesson-view-code-panel" role="tabpanel" aria-labelledby="lesson-view-code" hidden={tab!=='code'}>
      <p className="code-context">{adapter.referenceCode?(matches?'Reference code matches your saved text.':'Reference implementation shown. Your saved text differs; custom edits are not simulated.'):'Saved code for reference. This view does not execute or verify your Python.'}</p>
      {activeLines.length>0&&<p className="code-context" id="current-code-operation">{frames[index]?.title} · Code {activeLines.length===1?'line':'lines'} {activeLines.join(', ')}</p>}
      {code?<pre className="lesson-code" ref={codeList} tabIndex={0} aria-label="Python reference code" aria-describedby={activeLines.length?'current-code-operation':undefined}><code>{code.split('\n').map((line,lineIndex)=><span key={lineIndex} className={highlights[lineIndex]?'code-line current':'code-line'} data-current={highlights[lineIndex]} aria-current={highlights[lineIndex]?'true':undefined}><i aria-hidden="true">{lineIndex+1}</i><span>{line||' '}</span></span>)}</code></pre>:<p className="lesson-empty">No Python code saved for this problem yet.</p>}
      {adapter.referenceCode&&!matches&&<details className="saved-code"><summary>Your saved code</summary><pre tabIndex={0}>{problem.python_code||'No code saved.'}</pre></details>}
      <p className="code-footnote">{adapter.referenceCode?'Highlighted lines are grouped logical operations. A line may have more than one visual step.':'Algorithm explanation, not a live Python debugger.'}</p>
    </div>
    <div id="lesson-view-steps-panel" role="tabpanel" aria-labelledby="lesson-view-steps" hidden={tab!=='steps'}>
      <ol className="lesson-step-list" ref={stepList}>{frames.map((frame,step)=><li key={step}><button type="button" className={step===index?'current':''} aria-current={step===index?'step':undefined} data-current={step===index} onClick={()=>stepTo(step)}><span>{step+1}</span><span><small>{frame.phase}</small><b>{frame.title}</b></span></button></li>)}</ol>
    </div>
  </aside>;
}

export function ProblemVisualizerPage(){
  const {problemId}=useParams();const navigate=useNavigate();
  const {data:problem,isLoading,error:loadError}=useQuery({queryKey:['problem',problemId],queryFn:()=>api<Problem>(`/api/problems/${problemId}`),enabled:!!problemId});
  const adapter=useMemo(()=>problem?getVisualizer(problem):null,[problem]);
  const [raw,setRaw]=useState('');const [appliedInput,setAppliedInput]=useState('');
  const [frames,setFrames]=useState<VisualFrame[]>([]);const [frameIndex,setFrameIndex]=useState(0);
  const [playing,setPlaying]=useState(false);const [speed,setSpeed]=useState(1100);const [traceError,setTraceError]=useState('');
  useEffect(()=>{
    setPlaying(false);setFrames([]);setFrameIndex(0);setTraceError('');
    if(!problem||!adapter)return;
    const initial=adapter.presets[0]?.input??adapter.placeholder;setRaw(initial);setAppliedInput(initial);
    try{setFrames(buildTrace(adapter,problem,initial))}catch(error){setTraceError(error instanceof Error?error.message:'Could not build the trace.')}
  },[problem,adapter]);
  useEffect(()=>{
    if(!playing)return;
    if(frameIndex>=frames.length-1){setPlaying(false);return}
    const timer=window.setTimeout(()=>setFrameIndex(current=>current+1),speed);
    return()=>window.clearTimeout(timer);
  },[playing,frameIndex,speed,frames.length]);

  if(isLoading)return <div className="page-loading"><i/><p>Loading the visual explanation…</p></div>;
  if(loadError||!problem||!adapter)return <section className="page-scroll lesson-page"><div className="lesson-empty"><ScanLine size={28}/><h2>Visualizer unavailable</h2><p>{loadError instanceof Error?loadError.message:'This problem could not be loaded.'}</p><button type="button" onClick={()=>navigate(-1)}>Go back</button></div></section>;

  const current=frames[frameIndex];const dirty=raw!==appliedInput;
  const runTrace=(nextRaw=raw)=>{
    setPlaying(false);setFrameIndex(0);
    try{setFrames(buildTrace(adapter,problem,nextRaw));setAppliedInput(nextRaw);setTraceError('')}catch(error){setFrames([]);setTraceError(error instanceof Error?error.message:'Could not build the trace.')}
  };
  const stepTo=(index:number)=>{setPlaying(false);setFrameIndex(Math.max(0,Math.min(index,frames.length-1)))};
  return <LessonMotion><section className="page-scroll lesson-page">
    <header className="lesson-header">
      <LessonButton className="lesson-back" onClick={()=>navigate(`/problems/${problem.id}`)}><ArrowLeft size={16}/> Problem notes</LessonButton>
      <div className="lesson-title"><h1>{problem.title}</h1><p className="lesson-meta">2D visual explanation · {problem.status}</p><p>{adapter.description}</p></div>
      {problem.url&&<a className="lesson-source" href={problem.url} target="_blank" rel="noreferrer">{problem.source}<ExternalLink size={14}/></a>}
    </header>
    <form className="lesson-input" onSubmit={event=>{event.preventDefault();runTrace()}}>
      <label className="lesson-presets"><span>Try an example</span><select value={adapter.presets.find(preset=>preset.input===raw)?.input??''} onChange={event=>{setRaw(event.target.value);runTrace(event.target.value)}}><option value="" disabled>Custom input</option>{adapter.presets.map(preset=><option value={preset.input} key={preset.label}>{preset.label}</option>)}</select></label>
      <label className="lesson-raw"><span>{adapter.inputLabel}</span><textarea rows={2} value={raw} onChange={event=>{setRaw(event.target.value);setPlaying(false)}} aria-describedby="lesson-input-guide" placeholder={adapter.placeholder} spellCheck={false}/></label>
      <LessonButton className="lesson-primary" type="submit"><ScanLine size={16}/> Build steps</LessonButton>
      <p id="lesson-input-guide">{adapter.inputGuide??`Use the example format shown above. ${adapter.mode==='generic'?'This fallback inspects parameters and notes, not algorithm execution.':'This teaching simulation uses bounded inputs.'}`}</p>
    </form>
    {traceError&&<p className="lesson-error" role="alert">{traceError}</p>}
    {dirty&&!traceError&&<p className="lesson-notice">Input edited. Build steps to apply it; the paused view below still uses <code>{appliedInput}</code>.</p>}
    <div className="lesson-workspace">
      <section className="lesson-stage" aria-label="Algorithm visual and playback">
        <div className="lesson-stage-label"><span>{adapter.mode==='generic'?'Study outline · not execution':adapter.referenceCode?'Code-linked algorithm trace':'Algorithm teaching model'}</span><small>Local simulation · Python never executed</small></div>
        <div className="lesson-controls" aria-label="Playback controls">
          <LessonButton onClick={()=>stepTo(0)} disabled={!frames.length||frameIndex===0} aria-label="Restart trace" title="Restart trace"><RotateCcw size={17}/></LessonButton>
          <LessonButton onClick={()=>stepTo(frameIndex-1)} disabled={!frames.length||frameIndex===0} aria-label="Previous step" title="Previous step"><ChevronLeft size={19}/></LessonButton>
          <LessonButton className="lesson-play" onClick={()=>{if(!playing&&frameIndex===frames.length-1)setFrameIndex(0);setPlaying(value=>!value)}} disabled={frames.length<2||dirty}>{playing?<Pause size={17}/>:<Play size={17}/>} {playing?'Pause':frameIndex===frames.length-1?'Replay':'Play'}</LessonButton>
          <LessonButton onClick={()=>stepTo(frameIndex+1)} disabled={!frames.length||frameIndex>=frames.length-1} aria-label="Next step" title="Next step"><ChevronRight size={19}/></LessonButton>
          <label>Speed<select value={speed} onChange={event=>setSpeed(Number(event.target.value))}><option value={2200}>0.5×</option><option value={1100}>1×</option><option value={550}>2×</option></select></label>
          <output>Step {frames.length?frameIndex+1:0} <span>/ {frames.length}</span></output>
        </div>
        <div className="lesson-timeline"><input aria-label="Trace step" aria-valuetext={`Step ${frameIndex+1}: ${current?.title??'No trace'}`} type="range" min={0} max={Math.max(0,frames.length-1)} value={frameIndex} disabled={!frames.length} onChange={event=>stepTo(Number(event.target.value))}/></div>
        {current?<><div className="lesson-frame-heading"><span>{current.phase}</span><h2>{current.title}</h2><p>{current.message}</p></div><div className="lesson-canvas"><FrameCanvas frame={current} problem={problem}/></div></>:<p className="lesson-empty">Enter a valid input and build steps to begin.</p>}
      </section>
      <ExplanationPanel key={problem.id} adapter={adapter} problem={problem} frames={frames} index={frameIndex} stepTo={stepTo}/>
    </div>
  </section></LessonMotion>;
}
