import type {Problem} from '../types';
import type {InsightModel,MonotonicWindowFrameData,RuleFocus,VisualFrame,VisualizerAdapter} from './types';

type WindowInput={nums:number[];limit:number};

const insights:InsightModel={
  state:'The current valid window is [left, right]; the answer is its best length seen so far.',
  base:'Before right moves, the window and both candidate deques are empty.',
  choice:'Expand right, prune useless deque backs, then move left until max − min ≤ limit.',
  invariant:'Deque fronts are the current extremes; indices inside each deque stay inside the window.',
};

function rules(active:string):RuleFocus[]{return [
  {token:'right',meaning:'new value enters',active:active==='right'},
  {token:'max_q.back',meaning:'drop smaller, older candidates',active:active==='max'},
  {token:'min_q.back',meaning:'drop larger, older candidates',active:active==='min'},
  {token:'left',meaning:'shrink only while invalid',active:active==='left'},
  {token:'front',meaning:'read max and min in O(1)',active:active==='check'},
]}

function parseInput(raw:string):WindowInput{
  let value:unknown;
  try{value=JSON.parse(raw)}catch{throw new Error('Use {"nums":[8,2,4,7],"limit":4}.')}
  if(!value||typeof value!=='object')throw new Error('The input needs nums and limit.');
  const nums=(value as {nums?:unknown}).nums;const limit=Number((value as {limit?:unknown}).limit);
  if(!Array.isArray(nums)||!nums.length||!nums.every(item=>Number.isFinite(Number(item))))throw new Error('nums must be a non-empty numeric array.');
  if(nums.length>18)throw new Error('Use at most 18 values so every queue change stays readable.');
  if(!Number.isFinite(limit)||limit<0)throw new Error('limit must be a non-negative number.');
  return {nums:nums.map(Number),limit};
}

function makeFrame(phase:string,title:string,message:string,input:WindowInput,state:Omit<MonotonicWindowFrameData,'nums'|'limit'|'insights'|'rules'>,active:string):VisualFrame{
  return {phase,title,message,kind:'monotonic-window',data:{...state,nums:[...input.nums],limit:input.limit,minDeque:[...state.minDeque],maxDeque:[...state.maxDeque],bestRange:state.bestRange?[...state.bestRange] as [number,number]:null,insights,rules:rules(active)} satisfies MonotonicWindowFrameData};
}

function createFrames(value:unknown,_problem:Problem):VisualFrame[]{
  const input=value as WindowInput;const minDeque:number[]=[];const maxDeque:number[]=[];let left=0;let best=0;let bestRange:[number,number]|null=null;const frames:VisualFrame[]=[];
  const state=(right:number,activeIndex:number|null,valid:boolean|null,action:string)=>({left,right,minDeque,maxDeque,best,bestRange,activeIndex,valid,action});
  frames.push(makeFrame('BASE','Start with no window','The deques do not store every value; they store only candidates that could become an extreme.',input,state(-1,null,null,'Nothing has entered yet.'),'right'));
  for(let right=0;right<input.nums.length;right+=1){
    const valueAtRight=input.nums[right];
    const removedMax:number[]=[];while(maxDeque.length&&input.nums[maxDeque[maxDeque.length-1]]<valueAtRight)removedMax.push(maxDeque.pop()!);maxDeque.push(right);
    frames.push(makeFrame('EXPAND',`Add nums[${right}] = ${valueAtRight}`,removedMax.length?`Drop ${removedMax.map(index=>`${input.nums[index]}@${index}`).join(', ')} from the max deque: each is smaller and older than ${valueAtRight}.`:'Keep every larger max candidate already in front of the new value.',input,state(right,right,null,removedMax.length?'Smaller, older values can never become the maximum while this new value remains.':'The max deque stays decreasing.'),'max'));
    const removedMin:number[]=[];while(minDeque.length&&input.nums[minDeque[minDeque.length-1]]>valueAtRight)removedMin.push(minDeque.pop()!);minDeque.push(right);
    frames.push(makeFrame('PRUNE',`Place ${valueAtRight} in the min deque`,removedMin.length?`Drop ${removedMin.map(index=>`${input.nums[index]}@${index}`).join(', ')}: each is larger and older than ${valueAtRight}.`:'No larger candidate needs to be removed.',input,state(right,right,null,removedMin.length?'Larger, older values can never become the minimum while this new value remains.':'The min deque stays increasing.'),'min'));
    while(input.nums[maxDeque[0]]-input.nums[minDeque[0]]>input.limit){
      const leaving=left;const difference=input.nums[maxDeque[0]]-input.nums[minDeque[0]];
      if(maxDeque[0]===leaving)maxDeque.shift();if(minDeque[0]===leaving)minDeque.shift();left+=1;
      frames.push(makeFrame('SHRINK',`Move left past index ${leaving}`,`${difference} exceeds ${input.limit}. Only an expired front is removed; dominated values were already pruned from the backs.`,input,state(right,leaving,false,`Index ${leaving} left the window. The new left boundary is ${left}.`),'left'));
    }
    const length=right-left+1;if(length>best){best=length;bestRange=[left,right]}
    frames.push(makeFrame('CHECK',`Window [${left}, ${right}] is valid`,`max ${input.nums[maxDeque[0]]} − min ${input.nums[minDeque[0]]} ≤ ${input.limit}; record length ${length}.`,input,state(right,right,true,`Both extremes are available at the deque fronts. Best length is now ${best}.`),'check'));
  }
  frames.push(makeFrame('COMPLETE','Longest valid window found',bestRange?`The best range is [${bestRange[0]}, ${bestRange[1]}], with length ${best}.`:'No values were supplied.',input,state(input.nums.length-1,null,true,`Answer = ${best}.`),'check'));
  return frames;
}

export const monotonicWindowVisualizer:VisualizerAdapter={
  id:'longest-continuous-subarray-with-absolute-diff-less-than-or-equal-to-limit',
  name:'Window + two monotonic deques',mode:'specialized',
  description:'See the window, increasing minimum deque, decreasing maximum deque, and every shrink decision stay synchronized.',
  inputLabel:'WINDOW PARAMETERS · nums, limit',placeholder:'{"nums":[8,2,4,7],"limit":4}',
  presets:[
    {label:'Default · expand then shrink',input:'{"nums":[8,2,4,7],"limit":4}',source:'LeetCode'},
    {label:'Long middle window',input:'{"nums":[10,1,2,4,7,2],"limit":5}',source:'LeetCode'},
    {label:'Duplicates · limit zero',input:'{"nums":[4,2,2,2,4,4,2,2],"limit":0}',source:'LeetCode'},
    {label:'Singleton',input:'{"nums":[5],"limit":0}',source:'Diagnostic'},
    {label:'Increasing values',input:'{"nums":[1,2,3,4,5],"limit":3}',source:'Diagnostic'},
    {label:'Duplicate block + spike',input:'{"nums":[1,1,1,10,1,1],"limit":0}',source:'Diagnostic'},
  ],parseInput,createFrames,
};
