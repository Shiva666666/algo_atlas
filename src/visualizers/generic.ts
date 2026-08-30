import type {Problem} from '../types';
import type {GenericFrameData,VisualFrame,VisualizerAdapter,VisualPreset} from './types';

function parseInput(raw:string):unknown{
  const trimmed=raw.trim();
  if(!trimmed)throw new Error('Paste a JSON value or raw text to visualize.');
  try{return JSON.parse(trimmed)}catch{return trimmed}
}

function collectPaths(value:unknown,path:Array<string|number>=[],result:Array<Array<string|number>>=[]):Array<Array<string|number>>{
  if(Array.isArray(value)){
    if(value.length===0)result.push(path);
    value.slice(0,40).forEach((item,index)=>collectPaths(item,[...path,index],result));
  }else if(value!==null&&typeof value==='object'){
    const entries=Object.entries(value as Record<string,unknown>);
    if(entries.length===0)result.push(path);
    entries.slice(0,20).forEach(([key,item])=>collectPaths(item,[...path,key],result));
  }else result.push(path);
  return result;
}

function readPath(value:unknown,path:Array<string|number>):unknown{
  return path.reduce<unknown>((current,key)=>current!==null&&typeof current==='object'?(current as Record<string|number,unknown>)[key]:undefined,value);
}

function createFrames(input:unknown,problem:Problem):VisualFrame[]{
  const paths=collectPaths(input).slice(0,80);
  const transitions=problem.notes?.approach?.length?problem.notes.approach:['Inspect the supplied parameters and map them to this problem’s state.'];
  const frames:VisualFrame[]=[{phase:'INPUT MAP',title:'Inspect the input structure',message:'This fallback is a study outline, not algorithm execution. It shows input values and your saved notes; no computed result is produced.',kind:'generic',data:{value:input,activePath:[],transitionIndex:-1} satisfies GenericFrameData}];
  paths.forEach((path,index)=>{
    const value=readPath(input,path);
    frames.push({phase:'INPUT MAP',title:`Inspect ${path.length?path.join('.'):'input'}`,message:`Current value: ${typeof value==='string'?`“${value}”`:JSON.stringify(value)}`,kind:'generic',data:{value:input,activePath:path,transitionIndex:-1} satisfies GenericFrameData});
  });
  transitions.forEach((message,index)=>frames.push({phase:'SAVED NOTE',title:`Approach note ${index+1}`,message,kind:'generic',data:{value:input,activePath:[],transitionIndex:index} satisfies GenericFrameData}));
  frames.push({phase:'OUTLINE END',title:'End of saved outline',message:'No algorithm ran and no answer was calculated. A problem-specific visualizer is needed to show computed state transitions.',kind:'generic',data:{value:input,activePath:[],transitionIndex:transitions.length} satisfies GenericFrameData});
  return frames;
}

function starterFor(problem:Problem):VisualPreset{
  const path=`${problem.primary_main.slug}/${problem.primary_subtag.slug}`;
  if(path.includes('arrays')||path.includes('search')||path.includes('greedy'))return {label:'Array parameters',input:'{"nums":[2,7,11,15],"target":9}',source:'Starter'};
  if(path.includes('graphs'))return {label:'Graph parameters',input:'{"n":4,"edges":[[0,1],[1,2],[0,3]]}',source:'Starter'};
  if(path.includes('trees'))return {label:'Tree parameters',input:'{"root":[1,2,3,null,4]}',source:'Starter'};
  if(path.includes('strings'))return {label:'String parameters',input:'{"s":"example"}',source:'Starter'};
  return {label:'Structured parameters',input:'{"values":[1,2,3,4]}',source:'Starter'};
}

export function createGenericVisualizer(problem:Problem):VisualizerAdapter{
  const starter=starterFor(problem);
  return {
    id:'generic-structure',
    name:'Input and notes · study outline',
    mode:'generic',
    description:'Inspect input values alongside your saved approach. This fallback is not an execution trace and does not calculate an answer.',
    inputLabel:'CUSTOM PARAMETERS · JSON OR RAW TEXT',
    placeholder:starter.input,
    presets:[starter],
    parseInput,
    createFrames,
  };
}
