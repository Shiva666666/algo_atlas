import referenceCode from './reference/remove-k-digits.py?raw';
import type {VisualFrame,VisualizerAdapter} from './types';

export const removeKDigitsCode=referenceCode.trimEnd();
export interface RemoveKDigitsInput {num:string;k:number}
export type DigitPhase='scan'|'tail'|'build'|'trim';
export type DigitAction='guard'|'early-return'|'initialize'|'read'|'compare'|'pop'|'spend'|'push'|'output-init'|'tail-check'|'append-output'|'trim-init'|'trim-guard'|'trim-check'|'trim-step'|'result';
export interface RemoveKDigitsData {
  num:string;originalK:number;remainingK:number;scanIndex:number|null;currentDigit:string|null;
  stack:number[];topIndex:number|null;removed:Array<{index:number;reason:'larger predecessor'|'leftover tail'}>;
  condition:{stackPresent:boolean|null;greater:boolean|null;budgetAvailable:boolean|null;passes:boolean}|null;
  phase:DigitPhase;action:DigitAction;rawOutput:string;outputIndex:number|null;trimIndex:number|null;
  result:string|null;earlyReturn:boolean;pendingSpend:boolean;
}
export const digitPhases:Array<{id:DigitPhase;label:string}>=[{id:'scan',label:'Scan'},{id:'tail',label:'Tail cleanup'},{id:'build',label:'Build result'},{id:'trim',label:'Trim zeros'}];

export function parseRemoveKDigitsInput(raw:string):RemoveKDigitsInput{
  let value:unknown;
  try{value=JSON.parse(raw)}catch{throw new Error('Enter valid JSON, for example {"num":"1432219","k":3}.')}
  if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Provide an object with num (a digit string) and k (an integer).');
  const {num,k}=value as Partial<RemoveKDigitsInput>;
  if(typeof num!=='string'||!/^(0|[1-9][0-9]*)$/.test(num)||num.length>32)throw new Error('num must be a string of 1–32 ASCII digits, without leading zeros except "0".');
  if(typeof k!=='number'||!Number.isInteger(k)||k<1||k>num.length)throw new Error('k must be an integer from 1 through the number of digits.');
  return {num,k};
}

export function createRemoveKDigitsFrames(value:unknown):VisualFrame[]{
  const {num,k}=parseRemoveKDigitsInput(JSON.stringify(value));
  const frames:VisualFrame[]=[];
  const state:RemoveKDigitsData={num,originalK:k,remainingK:k,scanIndex:null,currentDigit:null,stack:[],topIndex:null,removed:[],condition:null,phase:'scan',action:'guard',rawOutput:'',outputIndex:null,trimIndex:null,result:null,earlyReturn:false,pendingSpend:false};
  const lines=removeKDigitsCode.split('\n');
  function emit(action:DigitAction,title:string,message:string,snippet:string,occurrence=0){
    const matches=lines.flatMap((line,index)=>line.trim()===snippet?[index+1]:[]);
    const line=matches[occurrence];
    if(!line)throw new Error(`Missing reference line: ${snippet}`);
    state.action=action;state.topIndex=state.stack.at(-1)??null;
    frames.push({kind:'remove-k-digits',phase:state.phase,title,message,codeFocus:[snippet],codeLines:[line],data:{...state,stack:[...state.stack],removed:state.removed.map(item=>({...item})),condition:state.condition?{...state.condition}:null}});
  }
  emit('guard','Can we remove every digit?',`${num.length} digits, ${k} removals. ${num.length===k?'The guard can return immediately.':'Keep scanning to choose which digits to remove.'}`,'if len(num) == k:');
  if(num.length===k){state.earlyReturn=true;state.result='0';emit('early-return','Return “0”','Removing all digits leaves zero. All four processing phases are skipped; the loops never run.','return "0"');return frames;}
  emit('initialize','Start with an empty index stack','Each stack entry will point to a digit in the original string.','stack = []');
  for(let i=0;i<num.length;i++){
    state.scanIndex=i;state.currentDigit=num[i];state.condition=null;
    emit('read',`Read digit ${num[i]} at index ${i}`,'Keep this incoming digit in focus while comparing it with successive stack tops.','cur = int(num[i])');
    while(true){
      const present=state.stack.length>0;
      const greater=present?num[state.stack.at(-1)!]>num[i]:null;
      const budget=greater===true?state.remainingK>0:null;
      state.condition={stackPresent:present,greater,budgetAvailable:budget,passes:present&&greater===true&&budget===true};
      const reason=!present?'The stack is empty; later terms are not evaluated.':!greater?`${num[state.stack.at(-1)!]} is not greater than ${num[i]}; the budget term is not evaluated.`:!budget?'The top is larger, but no removals remain.':'The top is larger and budget remains: remove that predecessor.';
      emit('compare','Check the stack top',reason,'while stack and int(num[stack[-1]]) > cur and k:');
      if(!state.condition.passes)break;
      const removed=state.stack.pop()!;state.removed.push({index:removed,reason:'larger predecessor'});state.pendingSpend=true;state.condition=null;
      emit('pop',`Remove ${num[removed]} at index ${removed}`,'The larger predecessor leaves the stack. The next source line spends one removal.','stack.pop()');
      state.remainingK--;state.pendingSpend=false;
      emit('spend',`${state.remainingK} removals left`,'Recheck the same incoming digit against the newly exposed stack top.','k-=1');
    }
    state.condition=null;state.stack.push(i);
    emit('push',`Keep index ${i} → digit ${num[i]}`,state.remainingK===0?'Budget exhausted: subsequent digits are appended even if the stack becomes descending.':'The incoming digit now becomes the stack top.','stack.append(i)');
  }
  state.phase='tail';state.scanIndex=null;state.currentDigit=null;
  emit('output-init','Prepare an empty result string','The scan has ended. Finish any remaining removals before assembling the answer.','res = ""');
  while(true){
    const budget=state.remainingK>0;const present=budget?state.stack.length>0:null;
    state.condition={stackPresent:present,greater:null,budgetAvailable:budget,passes:budget&&present===true};
    emit('tail-check','Check leftover removals',budget?'A removal is still required; remove the rightmost retained digit.':'No removal budget remains; the stack term is not evaluated.','while k and stack:');
    if(!state.condition.passes)break;
    const removed=state.stack.pop()!;state.removed.push({index:removed,reason:'leftover tail'});state.pendingSpend=true;state.condition=null;
    emit('pop',`Remove tail digit ${num[removed]}`,'After the scan, preserving the earlier digits is best; spend the leftover budget at the end.','stack.pop()',1);
    state.remainingK--;state.pendingSpend=false;
    emit('spend',`${state.remainingK} removals left`,'One tail removal has been accounted for.','k-=1',1);
  }
  state.phase='build';state.condition=null;
  for(const index of state.stack){state.outputIndex=index;state.rawOutput+=num[index];emit('append-output',`Append num[${index}] = “${num[index]}”`,'Read retained indexes in their original order. The variable digit in this loop contains an index.','res += num[digit]');}
  state.phase='trim';state.outputIndex=null;state.trimIndex=0;
  emit('trim-init','Start the leading-zero pointer','The source reuses i here. This pointer indexes res, not the original input.','i = 0');
  emit('trim-guard','Does the result have more than one digit?',state.rawOutput.length>1?'Check the leading digits for zeros.':'A single digit needs no leading-zero scan.','if len(res) > 1:');
  if(state.rawOutput.length>1){
    while(true){
      const inBounds=state.trimIndex<state.rawOutput.length;
      const zero=inBounds&&state.rawOutput[state.trimIndex]==='0';
      emit('trim-check','Check the leading-zero pointer',!inBounds?'Every retained digit was zero; stop at the end.':zero?'This leading zero can be hidden without spending any removals.':'This digit is nonzero; the answer starts here.','while i<len(res) and res[i] == "0":');
      if(!zero)break;
      state.trimIndex++;emit('trim-step','Advance past one leading zero','Only the formatting pointer moves. The stack and removal budget remain unchanged.','i+=1');
    }
  }
  state.result=state.trimIndex===state.rawOutput.length?'0':state.rawOutput.slice(state.trimIndex);
  emit('result',`Return “${state.result}”`,'The chosen subsequence is now formatted without leading zeros.','return "0" if i == len(res) else res[i:]');
  return frames;
}

const examples:Array<[string,number,string,'LeetCode'|'Diagnostic']>=[['1432219',3,'Official · 1219','LeetCode'],['10200',1,'Official · leading zero → 200','LeetCode'],['10',2,'Official · remove all → 0','LeetCode'],['12345',2,'Increasing · tail cleanup','Diagnostic'],['1111',2,'Equal digits · strict >','Diagnostic'],['123045',3,'Cascade · repeated pops','Diagnostic'],['321',1,'Budget exhausted · 21','Diagnostic'],['1000',1,'All retained digits zero','Diagnostic']];
export const removeKDigitsVisualizer:VisualizerAdapter={id:'remove-k-digits',name:'Greedy Stack Studio',mode:'specialized',presentation:'diagram-first',inputEditor:'digit-string',description:'Choose each removal with an index stack, finish the budget, then trim leading zeros.',inputLabel:'Number and removal budget',inputGuide:'Use a string of 1–32 digits without leading zeros (except "0"), and an integer k from 1 to its length.',placeholder:'{"num":"1432219","k":3}',referenceCode:removeKDigitsCode,presets:examples.map(([num,k,label,source])=>({label,source,input:JSON.stringify({num,k})})),parseInput:parseRemoveKDigitsInput,createFrames:createRemoveKDigitsFrames};
