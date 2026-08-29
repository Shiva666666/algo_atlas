import type {Problem} from '../types';
import type {IncremovableFrameData,InsightModel,RuleFocus,VisualFrame,VisualizerAdapter} from './types';

type IncremovableInput={nums:number[]};

const insights:InsightModel={
  state:'i is the rightmost prefix value that can remain before the current increasing suffix beginning at j.',
  base:'Find the longest strictly increasing prefix. If it reaches the end, every non-empty subarray can be removed.',
  choice:'Move j left through the increasing suffix and retreat i until the bridge nums[i] < nums[j] is valid.',
  invariant:'For a fixed j, removal starts 0 through i + 1 are valid; both pointers only move left, so the total work is O(n).',
};

function rules(active:string):RuleFocus[]{return [
  {token:'nums[i] < nums[i + 1]',meaning:'extend increasing prefix',active:active==='prefix'},
  {token:'ans = i + 2',meaning:'count removals reaching the end',active:active==='base-count'},
  {token:'nums[i] >= nums[j]',meaning:'retreat i until the bridge works',active:active==='bridge'},
  {token:'ans += i + 2',meaning:'count starts 0 … i + 1',active:active==='count'},
  {token:'j -= 1',meaning:'extend the increasing suffix left',active:active==='suffix'},
]}

function parseInput(raw:string):IncremovableInput{
  let value:unknown;
  try{value=JSON.parse(raw)}catch{throw new Error('Use {"nums":[6,5,7,8]}.')}
  const nums=(value as {nums?:unknown})?.nums;
  if(!Array.isArray(nums)||!nums.length||!nums.every(item=>Number.isInteger(Number(item))&&Number(item)>0))throw new Error('nums must be a non-empty array of positive integers.');
  if(nums.length>18)throw new Error('Use at most 18 values so every pointer move stays readable.');
  return {nums:nums.map(Number)};
}

function makeFrame(phase:string,title:string,message:string,input:IncremovableInput,state:Omit<IncremovableFrameData,'nums'|'insights'|'rules'>,active:string):VisualFrame{
  return {phase,title,message,kind:'incremovable',data:{...state,nums:[...input.nums],insights,rules:rules(active)} satisfies IncremovableFrameData};
}

function createFrames(value:unknown,_problem:Problem):VisualFrame[]{
  const input=value as IncremovableInput;const {nums}=input;const n=nums.length;let i=0;let answer=0;const frames:VisualFrame[]=[];
  const state=(suffixStart:number,activeIndex:number|null,added:number,bridgeValid:boolean|null,allIncreasing:boolean,action:string)=>({prefixEnd:i,suffixStart,activeIndex,answer,added,bridgeValid,allIncreasing,action});
  frames.push(makeFrame('PREFIX','Seed the increasing prefix at index 0','The first value is a valid strictly increasing prefix by itself.',input,state(n,0,0,null,n===1,'Set i = 0.'),'prefix'));
  while(i+1<n&&nums[i]<nums[i+1]){
    const previous=i;i+=1;
    frames.push(makeFrame('PREFIX',`Extend the prefix through index ${i}`,`${nums[previous]} < ${nums[i]}, so indices 0…${i} remain strictly increasing.`,input,state(n,i,0,true,i===n-1,`Move i from ${previous} to ${i}.`),'prefix'));
  }
  if(i===n-1){
    answer=n*(n+1)/2;
    frames.push(makeFrame('COMPLETE','The whole array is increasing',`Every one of the ${answer} non-empty subarrays can be removed.`,input,state(n,null,answer,true,true,`Return n × (n + 1) / 2 = ${answer}.`),'count'));
    return frames;
  }
  frames.push(makeFrame('BOUNDARY','The prefix stops before the first drop',`${nums[i]} ≥ ${nums[i+1]}, so the prefix cannot extend beyond index ${i}.`,input,state(n,i+1,0,false,false,`Keep i = ${i}; suffix is still empty.`),'prefix'));
  answer=i+2;
  frames.push(makeFrame('COUNT','Count removals that reach the array end',`Starts 0…${i+1} give ${i+2} valid removals whose right end is ${n-1}.`,input,state(n,null,i+2,true,false,`Initialize ans = i + 2 = ${answer}.`),'base-count'));

  let j=n-1;
  while(j===n-1||nums[j]<nums[j+1]){
    frames.push(makeFrame('SUFFIX',`Use the increasing suffix starting at ${j}`,j===n-1?`A one-value suffix [${nums[j]}] is increasing.`:`${nums[j]} < ${nums[j+1]}, so indices ${j}…${n-1} form an increasing suffix.`,input,state(j,j,0,null,false,`Try to bridge the prefix to nums[${j}] = ${nums[j]}.`),'suffix'));
    while(i>=0&&nums[i]>=nums[j]){
      const rejected=i;i-=1;
      frames.push(makeFrame('BRIDGE',`Retreat i past index ${rejected}`,`${nums[rejected]} ≥ ${nums[j]}, so keeping both values would break strict increase.`,input,state(j,rejected,0,false,false,i>=0?`New bridge candidate: nums[${i}] = ${nums[i]} before nums[${j}] = ${nums[j]}.`:'No prefix value can remain; remove from index 0.'),'bridge'));
    }
    const added=i+2;answer+=added;
    const bridge=i<0?'The prefix is empty, so the bridge is automatically valid.':`${nums[i]} < ${nums[j]}, so the retained prefix and suffix join correctly.`;
    frames.push(makeFrame('COUNT',`Add ${added} removals for suffix index ${j}`,`${bridge} Valid removal starts are 0…${i+1}.`,input,state(j,i>=0?i:j,added,true,false,`ans += i + 2 → ${answer}.`),'count'));
    j-=1;
  }
  frames.push(makeFrame('COMPLETE','All valid boundary pairs are counted','The next suffix extension is not increasing, so no earlier suffix start can work.',input,state(j+1,null,0,true,false,`Return ${answer}. Each pointer moved left at most n times.`),'suffix'));
  return frames;
}

export const incremovableVisualizer:VisualizerAdapter={
  id:'count-the-number-of-incremovable-subarrays-i',name:'Increasing prefix + suffix two pointers',mode:'specialized',
  description:'Watch i retreat against each increasing suffix start j, then count every valid removal boundary in O(n).',
  inputLabel:'POSITIVE INTEGER ARRAY · nums',placeholder:'{"nums":[6,5,7,8]}',
  presets:[
    {label:'Bridge retreats once',input:'{"nums":[6,5,7,8]}',source:'LeetCode'},
    {label:'Already increasing',input:'{"nums":[1,2,3,4]}',source:'LeetCode'},
    {label:'Strictly decreasing',input:'{"nums":[8,7,6]}',source:'LeetCode'},
    {label:'Multiple bridge moves',input:'{"nums":[1,4,2,3,5]}',source:'Diagnostic'},
    {label:'Singleton',input:'{"nums":[5]}',source:'Diagnostic'},
  ],parseInput,createFrames,
};
