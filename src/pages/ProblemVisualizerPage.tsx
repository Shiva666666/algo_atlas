import {useQuery} from '@tanstack/react-query';
import {Activity,ArrowLeft,ChevronLeft,ChevronRight,ExternalLink,Pause,Play,RotateCcw,ScanLine,Sparkles} from 'lucide-react';
import {useEffect,useMemo,useState,type CSSProperties} from 'react';
import {useNavigate,useParams} from 'react-router-dom';
import {api} from '../api';
import type {Problem} from '../types';
import {getVisualizer} from '../visualizers/registry';
import type {GenericFrameData,PalindromeFrameData,VisualFrame,VisualizerAdapter} from '../visualizers/types';

function buildTrace(adapter:VisualizerAdapter,problem:Problem,raw:string){
  const input=adapter.parseInput(raw);
  const result=adapter.createFrames(input,problem);
  if(!result.length)throw new Error('This input did not create any transitions.');
  return result;
}

function PalindromeCanvas({data}:{data:PalindromeFrameData}){
  const n=data.s.length;
  const active=(index:number)=>data.highlightStart!==null&&data.highlightEnd!==null&&index>=data.highlightStart&&index<=data.highlightEnd;
  return <div className="palindrome-visual">
    <div className="string-ribbon" aria-label={`Input string ${data.s}`}>
      {Array.from(data.s).map((character,index)=><div className={`${active(index)?'active':''} ${index===data.activeStart?'start':''} ${index===data.activeEnd?'end':''}`} key={`${character}-${index}`}><small>{index}</small><b>{character}</b></div>)}
    </div>
    <div className="state-plane-grid">
      <section className="state-plane">
        <header><span>PALINDROME[start][end]</span><small>DEPENDENCY PLANE</small></header>
        <div className="viz-matrix-scroll">
          <div className="viz-matrix" style={{'--viz-n':n} as CSSProperties}>
            <i className="matrix-corner"/>
            {Array.from(data.s).map((character,index)=><b className="matrix-axis column" key={`column-${index}`}>{character}<small>{index}</small></b>)}
            {data.palindrome.map((row,start)=><div className="matrix-row" key={`row-${start}`}>
              <b className="matrix-axis row">{data.s[start]}<small>{start}</small></b>
              {row.map((value,end)=>{
                const current=start===data.activeStart&&end===data.activeEnd;
                const className=[value===null?'void':value?'truthy':'falsy',current?'current':'',current&&data.accepted===true?'accepted':'',current&&data.accepted===false?'rejected':''].filter(Boolean).join(' ');
                return <span className={className} key={`${start}-${end}`} title={`palindrome[${start}][${end}] = ${value}`}><em>{value===null?'·':value?'T':'F'}</em></span>;
              })}
            </div>)}
          </div>
        </div>
      </section>
      <div className="state-transfer"><i/><span>VALID FINAL<br/>PALINDROME</span><i/></div>
      <section className="state-plane cut-plane">
        <header><span>CUTS[end]</span><small>PREFIX STATE</small></header>
        <div className="cut-cells">
          {data.cuts.map((value,index)=><div className={index===data.activeEnd?'current':''} key={`cut-${index}`}><small>{index}</small><strong>{value??'—'}</strong><span>{data.s.slice(0,index+1)}</span></div>)}
        </div>
        <div className={`transition-equation ${data.accepted===false?'rejected':''}`}>
          {data.activeStart===null||data.activeEnd===null?<><small>STATE RULE</small><b>cuts[end] = min(cuts[start − 1] + 1)</b></>:<><small>{data.accepted?'TRANSITION ACCEPTED':'TRANSITION SKIPPED'}</small><b>{data.accepted?data.activeStart===0?`cuts[${data.activeEnd}] = 0`:`cuts[${data.activeEnd}] ← min(current, cuts[${data.activeStart-1}] + 1${data.candidate===null?'':` = ${data.candidate}`})`:`palindrome[${data.activeStart}][${data.activeEnd}] = False`}</b></>}
        </div>
      </section>
    </div>
  </div>;
}

function displayScalar(value:unknown){
  if(value===null)return 'null';
  if(typeof value==='string')return value;
  if(typeof value==='undefined')return 'undefined';
  return String(value);
}

function ScalarArray({value,path,activePath}:{value:unknown[];path:Array<string|number>;activePath:Array<string|number>}){
  return <div className="generic-array">{value.map((item,index)=><div className={activePath.length===path.length+1&&activePath.every((part,partIndex)=>partIndex<path.length?part===path[partIndex]:part===index)?'active':''} key={index}><small>{index}</small><b>{displayScalar(item)}</b></div>)}</div>;
}

function GenericValue({value,path,activePath}:{value:unknown;path:Array<string|number>;activePath:Array<string|number>}){
  if(Array.isArray(value)&&value.every(item=>!Array.isArray(item)&&!(item!==null&&typeof item==='object')))return <ScalarArray value={value} path={path} activePath={activePath}/>;
  if(Array.isArray(value)&&value.every(Array.isArray))return <div className="generic-matrix">{value.map((row,rowIndex)=><ScalarArray value={row as unknown[]} path={[...path,rowIndex]} activePath={activePath} key={rowIndex}/>)}</div>;
  if(value!==null&&typeof value==='object')return <div className="generic-object">{Object.entries(value as Record<string,unknown>).map(([key,item])=>{const prefixMatches=path.every((part,index)=>activePath[index]===part);const isActive=prefixMatches&&activePath[path.length]===key;return <section className={isActive?'active':''} key={key}><header><span>{key}</span><small>{Array.isArray(item)?`array · ${item.length}`:typeof item}</small></header><GenericValue value={item} path={[...path,key]} activePath={activePath}/></section>})}</div>;
  return <div className={activePath.length===0?'generic-scalar active':'generic-scalar'}><small>VALUE</small><b>{displayScalar(value)}</b></div>;
}

function GenericCanvas({data,approach}:{data:GenericFrameData;approach:string[]}){
  return <div className="generic-visual">
    <div className="generic-data-plane"><header><span>PARAMETER MAP</span><small>ARRAYS · MATRICES · OBJECTS · SCALARS</small></header><GenericValue value={data.value} path={[]} activePath={data.activePath}/></div>
    <div className="generic-flow-arrow"><i/><span>RECORDED<br/>TRANSITIONS</span><i/></div>
    <div className="approach-rail">
      {(approach.length?approach:['Inspect parameters and define the algorithm state.']).map((message,index)=><div className={index===data.transitionIndex?'active':index<data.transitionIndex?'complete':''} key={`${message}-${index}`}><i>{index+1}</i><span>{message}</span></div>)}
    </div>
  </div>;
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
      <div className="visualizer-badges"><span className={adapter.mode}><Sparkles size={12}/>{adapter.mode==='specialized'?'EXACT ALGORITHM ADAPTER':'UNIVERSAL TRACE'}</span>{problem.url&&<a href={problem.url} target="_blank" rel="noreferrer"><ExternalLink size={12}/> LEETCODE</a>}</div>
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
          <div className="visual-canvas">{current.kind==='palindrome-cuts'?<PalindromeCanvas data={current.data as PalindromeFrameData}/>:<GenericCanvas data={current.data as GenericFrameData} approach={problem.notes?.approach??[]}/>}</div>
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
