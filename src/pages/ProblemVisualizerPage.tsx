import {useQuery} from '@tanstack/react-query';
import {Activity,ArrowLeft,ChevronLeft,ChevronRight,ExternalLink,Pause,Play,RotateCcw,ScanLine,Sparkles} from 'lucide-react';
import {useEffect,useMemo,useState} from 'react';
import {useNavigate,useParams} from 'react-router-dom';
import {api} from '../api';
import type {Problem} from '../types';
import {FrameCanvas} from '../visualizers/components/FrameCanvas';
import {getVisualizer} from '../visualizers/registry';
import type {VisualFrame,VisualizerAdapter} from '../visualizers/types';
import '../visualizers/learning.css';

function buildTrace(adapter:VisualizerAdapter,problem:Problem,raw:string){
  const input=adapter.parseInput(raw);
  const result=adapter.createFrames(input,problem);
  if(!result.length)throw new Error('This input did not create any transitions.');
  return result;
}

export function ProblemVisualizerPage(){
  const {problemId}=useParams();
  const navigate=useNavigate();
  const {data:problem,isLoading,error:loadError}=useQuery({queryKey:['problem',problemId],queryFn:()=>api<Problem>(`/api/problems/${problemId}`),enabled:!!problemId});
  const adapter=useMemo(()=>problem?getVisualizer(problem):null,[problem]);
  const [raw,setRaw]=useState('');
  const [frames,setFrames]=useState<VisualFrame[]>([]);
  const [frameIndex,setFrameIndex]=useState(0);
  const [playing,setPlaying]=useState(false);
  const [speed,setSpeed]=useState(650);
  const [traceError,setTraceError]=useState('');

  useEffect(()=>{
    if(!problem||!adapter)return;
    const initial=adapter.presets[0]?.input??adapter.placeholder;
    setRaw(initial);
    try{setFrames(buildTrace(adapter,problem,initial));setFrameIndex(0);setTraceError('')}catch(error){setTraceError(error instanceof Error?error.message:'Could not build the trace.')}
  },[problem,adapter]);

  useEffect(()=>{
    if(!playing||frames.length<2)return;
    const timer=window.setInterval(()=>setFrameIndex(current=>{
      if(current>=frames.length-1){setPlaying(false);return current}
      return current+1;
    }),speed);
    return()=>window.clearInterval(timer);
  },[playing,speed,frames.length]);

  if(isLoading)return <div className="page-loading"><i/><p>BUILDING THE STATE PLANE</p></div>;
  if(loadError||!problem||!adapter)return <section className="page-scroll"><div className="visualizer-empty panel"><ScanLine size={28}/><h2>Visualizer unavailable</h2><p>{loadError instanceof Error?loadError.message:'This problem signal could not be loaded.'}</p><button className="secondary-btn" onClick={()=>navigate(-1)}><ArrowLeft size={14}/> GO BACK</button></div></section>;

  const current=frames[Math.min(frameIndex,Math.max(0,frames.length-1))];
  const runTrace=(nextRaw=raw)=>{
    setPlaying(false);
    try{setFrames(buildTrace(adapter,problem,nextRaw));setFrameIndex(0);setTraceError('')}catch(error){setTraceError(error instanceof Error?error.message:'Could not build the trace.')}
  };
  const choosePreset=(value:string)=>{setRaw(value);runTrace(value)};
  const stepTo=(index:number)=>{setPlaying(false);setFrameIndex(Math.max(0,Math.min(index,frames.length-1)))};

  return <section className="page-scroll visualizer-page">
    <div className="visualizer-top">
      <button className="back-btn" onClick={()=>window.close()}><ArrowLeft size={15}/> CLOSE TAB</button>
      <div><p className="eyebrow"><ScanLine size={13}/> 2D ALGORITHM VISUALIZATION</p><h2>{problem.title}</h2><p>{problem.primary_main.name} / {problem.primary_subtag.name}</p></div>
      <div className="visualizer-badges"><span className={adapter.mode}><Sparkles size={12}/>{adapter.mode==='specialized'?'EXACT ALGORITHM ADAPTER':'UNIVERSAL TRACE'}</span>{problem.url&&<a href={problem.url} target="_blank" rel="noreferrer"><ExternalLink size={12}/> {problem.source.toUpperCase()}</a>}</div>
    </div>

    <div className="visualizer-grid">
      <aside className="panel visual-input-panel">
        <div className="panel-title"><span>01 / TEST INPUT</span><small>LOCAL ONLY</small></div>
        <div className="visual-panel-body">
          <p className="adapter-name"><Activity size={14}/><span><b>{adapter.name}</b><small>{adapter.description}</small></span></p>
          <label><span>GENERAL TEST CASES</span><select value={adapter.presets.find(preset=>preset.input===raw)?.input??''} onChange={event=>choosePreset(event.target.value)}><option value="" disabled>CUSTOM INPUT</option>{adapter.presets.map(preset=><option value={preset.input} key={preset.label}>{preset.label} · {preset.source}</option>)}</select></label>
          <label><span>{adapter.inputLabel}</span><textarea rows={8} value={raw} onChange={event=>setRaw(event.target.value)} placeholder={adapter.placeholder} spellCheck={false}/></label>
          <button className="primary-btn trace-button" onClick={()=>runTrace()}><ScanLine size={14}/> GENERATE TRACE</button>
          <div className="input-guide"><b>ACCEPTED INPUT SHAPES</b><span>Raw strings</span><span>JSON arrays and matrices</span><span>Objects with multiple parameters</span><span>Graph, tree, and scalar values</span></div>
        </div>
      </aside>

      <main className="panel visual-stage-panel">
        <div className="panel-title"><span>02 / TRANSITION ENGINE</span><small>SIMULATION ONLY · PYTHON NEVER EXECUTED</small></div>
        <div className="visual-controls">
          <button onClick={()=>stepTo(0)} title="Restart"><RotateCcw size={14}/></button>
          <button onClick={()=>stepTo(frameIndex-1)} disabled={frameIndex===0} title="Previous step"><ChevronLeft size={15}/></button>
          <button className="play-control" onClick={()=>setPlaying(currentValue=>!currentValue)} disabled={frames.length<2}>{playing?<Pause size={15}/>:<Play size={15}/>} {playing?'PAUSE':'PLAY'}</button>
          <button onClick={()=>stepTo(frameIndex+1)} disabled={frameIndex>=frames.length-1} title="Next step"><ChevronRight size={15}/></button>
          <label><span>SPEED</span><select value={speed} onChange={event=>setSpeed(Number(event.target.value))}><option value={1100}>0.5×</option><option value={650}>1×</option><option value={300}>2×</option></select></label>
          <strong>{String(frameIndex+1).padStart(2,'0')}<i>/</i>{String(frames.length).padStart(2,'0')}</strong>
        </div>
        {traceError?<div className="trace-error">{traceError}</div>:current&&<>
          <div className="frame-heading"><span>{current.phase}</span><h3>{current.title}</h3><p>{current.message}</p></div>
          <div className="visual-canvas"><FrameCanvas frame={current} problem={problem}/></div>
          <div className="timeline-control"><input aria-label="Trace timeline" type="range" min={0} max={Math.max(0,frames.length-1)} value={frameIndex} onChange={event=>stepTo(Number(event.target.value))}/><div><span>INPUT</span><span>STATE TRANSITIONS</span><span>RESULT</span></div></div>
        </>}
      </main>

      <aside className="panel visual-trace-panel">
        <div className="panel-title"><span>03 / TRACE LOG</span><small>{frames.length} FRAMES</small></div>
        <div className="trace-list">{frames.map((frame,index)=><button className={index===frameIndex?'active':index<frameIndex?'complete':''} onClick={()=>stepTo(index)} key={`${frame.phase}-${frame.title}-${index}`}><i>{index<frameIndex?'✓':String(index+1).padStart(2,'0')}</i><span><small>{frame.phase}</small><b>{frame.title}</b></span></button>)}</div>
      </aside>
    </div>
  </section>;
}
