import type {Problem} from '../types';
import type {PalindromeFrameData,VisualFrame,VisualizerAdapter} from './types';

type PalindromeInput={s:string};

function parseInput(raw:string):PalindromeInput {
  const trimmed=raw.trim();
  if(!trimmed)throw new Error('Enter a string to visualize.');
  let value:unknown=trimmed;
  if(trimmed.startsWith('{')||trimmed.startsWith('[')||trimmed.startsWith('"')){
    try{value=JSON.parse(trimmed)}catch{throw new Error('Use raw text, a JSON string, or {"s":"aab"}.')}
  }
  const s=typeof value==='string'?value:typeof value==='object'&&value!==null&&'s' in value?String((value as {s:unknown}).s):'';
  if(!s)throw new Error('The input needs a non-empty s parameter.');
  if(s.length>18)throw new Error('Use at most 18 characters so every transition stays readable.');
  return {s};
}

function cloneTable(table:Array<Array<boolean|null>>){return table.map(row=>[...row])}

function frame(phase:string,title:string,message:string,data:PalindromeFrameData):VisualFrame{
  return {phase,title,message,kind:'palindrome-cuts',data:{...data,palindrome:cloneTable(data.palindrome),cuts:[...data.cuts]}};
}

function createFrames(input:unknown,_problem:Problem):VisualFrame[]{
  const {s}=input as PalindromeInput;
  const n=s.length;
  const palindrome:Array<Array<boolean|null>>=Array.from({length:n},()=>Array<boolean|null>(n).fill(null));
  const cuts:Array<number|null>=Array(n).fill(null);
  const frames:VisualFrame[]=[];
  const base=():PalindromeFrameData=>({s,palindrome,cuts,activeStart:null,activeEnd:null,highlightStart:null,highlightEnd:null,accepted:null,candidate:null});

  frames.push(frame('SETUP','Create the state planes','The upper triangle answers palindrome[start][end]; the cut row stores the best answer for each prefix.',base()));
  for(let i=0;i<n;i+=1){
    palindrome[i][i]=true;
    frames.push(frame('PALINDROME TABLE',`Single character at ${i}`,`s[${i}:${i+1}] is always a palindrome.`,{...base(),activeStart:i,activeEnd:i,highlightStart:i,highlightEnd:i,accepted:true}));
  }
  for(let start=n-1;start>=0;start-=1){
    for(let end=start+1;end<n;end+=1){
      const same=s[start]===s[end];
      const innerReady=end-start===1||palindrome[start+1][end-1]===true;
      const accepted=same&&innerReady;
      palindrome[start][end]=accepted;
      frames.push(frame('PALINDROME TABLE',`Check [${start}, ${end}]`,accepted?`“${s.slice(start,end+1)}” is a palindrome.`:`“${s.slice(start,end+1)}” is not a palindrome.`,{...base(),activeStart:start,activeEnd:end,highlightStart:start,highlightEnd:end,accepted}));
    }
  }
  for(let end=0;end<n;end+=1){
    if(palindrome[0][end]){
      cuts[end]=0;
      frames.push(frame('PREFIX CUTS',`Resolve prefix ending at ${end}`,`“${s.slice(0,end+1)}” is already a palindrome, so cuts[${end}] = 0.`,{...base(),activeStart:0,activeEnd:end,highlightStart:0,highlightEnd:end,accepted:true,candidate:0}));
      continue;
    }
    for(let start=1;start<=end;start+=1){
      const accepted=palindrome[start][end]===true;
      const candidate=accepted?(cuts[start-1]??0)+1:null;
      if(candidate!==null&&(cuts[end]===null||candidate<cuts[end]!))cuts[end]=candidate;
      frames.push(frame('PREFIX CUTS',`Try final segment [${start}, ${end}]`,accepted?`Append palindrome “${s.slice(start,end+1)}”: cuts[${start-1}] + 1 = ${candidate}.`:`Skip “${s.slice(start,end+1)}” because it is not a palindrome.`,{...base(),activeStart:start,activeEnd:end,highlightStart:start,highlightEnd:end,accepted,candidate}));
    }
  }
  frames.push(frame('COMPLETE','Minimum cuts resolved',`The minimum cut count for “${s}” is ${cuts[n-1]}.`,{...base(),highlightStart:0,highlightEnd:n-1,accepted:true,candidate:cuts[n-1]}));
  return frames;
}

export const palindromePartitioningVisualizer:VisualizerAdapter={
  id:'palindrome-partitioning-ii',
  name:'Palindrome table + prefix cuts',
  mode:'specialized',
  description:'Watch the triangular palindrome table fill first, then see each valid suffix update the one-dimensional prefix-cut state.',
  inputLabel:'STRING PARAMETER · s',
  placeholder:'aab\n\nor {"s":"cdd"}',
  presets:[
    {label:'Example 1 · aab',input:'{"s":"aab"}',source:'LeetCode'},
    {label:'Example 2 · a',input:'{"s":"a"}',source:'LeetCode'},
    {label:'Example 3 · ab',input:'{"s":"ab"}',source:'LeetCode'},
    {label:'Index check · cdd',input:'{"s":"cdd"}',source:'Diagnostic'},
  ],
  parseInput,
  createFrames,
};
