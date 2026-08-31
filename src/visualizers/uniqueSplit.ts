import type {Problem} from '../types';
import {uniqueSplitCode} from './practiceCode';
import type {UniqueSplitCallView,UniqueSplitFrameData,VisualFrame,VisualizerAdapter} from './types';

export interface UniqueSplitInput {s:string}

function parseInput(raw:string):UniqueSplitInput{
  let value:unknown;
  try{value=JSON.parse(raw)}catch{throw new Error('Use {"s":"ababccc"}.')}
  const s=(value as {s?:unknown}|null)?.s;
  if(typeof s!=='string'||!/^[a-z]+$/.test(s)||s.length===0||s.length>10)throw new Error('s must be 1–10 lowercase English letters for a readable recursion trace.');
  return {s};
}

export function createUniqueSplitFrames(value:unknown,_problem?:Problem):VisualFrame[]{
  const {s}=value as UniqueSplitInput;
  const path:string[]=[];
  const seen=new Set<string>();
  const callStack:UniqueSplitCallView[]=[];
  const frames:VisualFrame[]=[];
  let rootBest=0;
  const emit=(action:UniqueSplitFrameData['action'],phase:string,title:string,message:string,focus:string[],start:number,end:number|null,candidate:string|null,childResult:number|null)=>{
    const active=callStack.at(-1);
    const data:UniqueSplitFrameData={s,start,end,candidate,candidateRange:end===null?null:[start,end],path:[...path],seen:[...seen],best:active?.answer??rootBest,callStack:callStack.map(call=>({...call})),childResult,action};
    frames.push({phase,title,message,kind:'unique-split',codeFocus:focus,data});
  };
  emit('start','START','Start with an empty partition','At each call, choose the next non-empty substring and remember it before recursing.',['seen = set()'],0,null,null,null);

  const backtrack=(i:number):number=>{
    callStack.push({start:i,answer:0});
    if(i===s.length){
      emit('base','BASE',`Reached the end at index ${i}`,'Every character belongs to the current path, so this branch contributes zero more pieces.', ['if i == len(s):','return 0'],i,null,null,0);
      callStack.pop();
      return 0;
    }
    for(let j=i+1;j<=s.length;j+=1){
      const part=s.slice(i,j);
      emit('candidate','CANDIDATE',`Try s[${i}:${j}] = “${part}”`,`The loop extends the next substring one character at a time.`,['for j in range(i + 1, len(s) + 1):','part = s[i:j]'],i,j,part,null);
      if(seen.has(part)){
        emit('reject','REJECT',`Reject “${part}”: already used`,`A unique split cannot reuse a substring that is in seen.`,['if part not in seen:'],i,j,part,null);
        continue;
      }
      seen.add(part);path.push(part);
      emit('choose','CHOOSE',`Keep “${part}” and recurse`,`Add the candidate to both the path and seen; the child starts at index ${j}.`,['seen.add(part)','ans = max(ans, 1 + backtrack(j))'],i,j,part,null);
      const childResult=backtrack(j);
      const call=callStack.at(-1)!;
      call.answer=Math.max(call.answer,1+childResult);
      if(callStack.length===1)rootBest=call.answer;
      emit('return','RETURN',`Child from index ${j} returned ${childResult}`,`This branch contributes 1 + ${childResult} = ${1+childResult}; keep the larger local answer.`,['ans = max(ans, 1 + backtrack(j))'],i,j,part,childResult);
      seen.delete(part);path.pop();
      emit('remove','BACKTRACK',`Remove “${part}” before the next sibling`,'Restore the parent call’s state so the next candidate starts with the same seen set.', ['seen.remove(part)'],i,j,part,childResult);
    }
    const answer=callStack.at(-1)!.answer;
    callStack.pop();
    return answer;
  };
  const answer=backtrack(0);rootBest=answer;
  emit('complete','COMPLETE',`Maximum unique split = ${answer}`,'All branches returned; the best count from the root is the answer.', ['return backtrack(0)'],0,null,null,null);
  return frames;
}

export const uniqueSplitVisualizer:VisualizerAdapter={id:'split-a-string-into-the-max-number-of-unique-substrings',name:'Unique substring backtracking',mode:'specialized',description:'Choose a substring, reject repeats, recurse from its end, then restore the set for the next branch.',inputLabel:'BACKTRACKING PARAMETER · s',inputGuide:'Use a lowercase string of length 1–10 for a complete, readable recursion trace.',placeholder:'{"s":"ababccc"}',referenceCode:uniqueSplitCode,presets:[{label:'ababccc → 5',input:'{"s":"ababccc"}',source:'LeetCode'},{label:'aba → 2',input:'{"s":"aba"}',source:'LeetCode'},{label:'Repeated character',input:'{"s":"aa"}',source:'LeetCode'},{label:'All unique',input:'{"s":"abcd"}',source:'Diagnostic'}],parseInput,createFrames:createUniqueSplitFrames,presentation:'diagram-first'};
