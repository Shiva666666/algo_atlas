import type {IncremovableFrameData,InsightModel,RuleFocus,VisualFrame,VisualizerAdapter} from './types';
import {incremovableCode} from './practiceCode';

type IncremovableInput={nums:number[]};
const insights:InsightModel={
  state:'i ends the retained prefix; j starts the retained suffix. Remove a non-empty interval between them.',
  base:'Find the longest strictly increasing prefix. If it reaches the end, every non-empty subarray can be removed.',
  choice:'Move j left through the increasing suffix and retreat i until the bridge nums[i] < nums[j] works.',
  invariant:'For a fixed j, starts 0 through i + 1 are valid. Both pointers only retreat after the prefix scan: O(n) time, O(1) extra space.',
};
function rules(active:string):RuleFocus[]{return [
  {token:'nums[i] < nums[i + 1]',meaning:'extend the increasing prefix',active:active==='prefix'},
  {token:'return n * (n + 1) // 2',meaning:'all-increasing shortcut',active:active==='shortcut'},
  {token:'ans = i + 2',meaning:'count removals reaching the end',active:active==='base-count'},
  {token:'nums[i] >= nums[j]',meaning:'test the retained bridge',active:active==='bridge'},
  {token:'i -= 1',meaning:'retreat the prefix boundary',active:active==='retreat'},
  {token:'ans += i + 2',meaning:'count starts 0 … i + 1',active:active==='count'},
  {token:'nums[j] < nums[j + 1]',meaning:'suffix must remain increasing',active:active==='suffix'},
  {token:'j -= 1',meaning:'try the previous suffix start',active:active==='move-suffix'},
  {token:'return ans',meaning:'all valid boundary pairs counted',active:active==='return'},
]}
function parseInput(raw:string):IncremovableInput{
  let value:unknown;try{value=JSON.parse(raw)}catch{throw new Error('Use {"nums":[6,5,7,8]}.')}
  const nums=(value as {nums?:unknown}|null)?.nums;
  if(!Array.isArray(nums)||!nums.length||!nums.every(item=>typeof item==='number'&&Number.isSafeInteger(item)&&item>0))throw new Error('nums must be a non-empty array of positive safe integers.');
  if(nums.length>18)throw new Error('Use at most 18 values so every pointer move stays readable.');
  return {nums:[...nums]};
}
export function createIncremovableFrames(value:unknown):VisualFrame[]{
  const {nums}=parseInput(JSON.stringify(value));const n=nums.length;let i=0;let answer=0;const frames:VisualFrame[]=[];
  function emit(phase:string,title:string,message:string,suffixStart:number,activeIndex:number|null,added:number,bridgeValid:boolean|null,allIncreasing:boolean,action:string,rule:string,comparison?:IncremovableFrameData['comparison'],suffixPointer=suffixStart){
    const focus=rules(rule).filter(item=>item.active).map(item=>item.token);
    frames.push({phase,title,message,kind:'incremovable',codeFocus:focus,data:{nums:[...nums],prefixEnd:i,suffixStart,suffixPointer,activeIndex,answer,added,bridgeValid,allIncreasing,action,comparison:comparison?{...comparison}:undefined,insights,rules:rules(rule)} satisfies IncremovableFrameData});
  }
  emit('PREFIX','Seed the increasing prefix at index 0','The first value is an increasing prefix by itself.',n,0,0,null,false,'Set i = 0.','prefix');
  while(i+1<n&&nums[i]<nums[i+1]){
    const previous=i;i++;
    emit('PREFIX',`Extend the prefix through index ${i}`,`${nums[previous]} < ${nums[i]}, so indices 0…${i} are strictly increasing.`,n,i,0,null,false,`Move i from ${previous} to ${i}.`,'prefix',{left:previous,right:i,kind:'prefix',valid:true});
  }
  if(i===n-1){answer=n*(n+1)/2;emit('COMPLETE','The whole array is increasing',`Every one of the ${answer} non-empty subarrays can be removed.`,n,null,answer,null,true,`Return n × (n + 1) / 2 = ${answer}.`,'shortcut');return frames}
  emit('BOUNDARY','The prefix stops before the first drop',`${nums[i]} ≥ ${nums[i+1]}, so the prefix cannot extend beyond index ${i}.`,n,i+1,0,null,false,`Keep i = ${i}; the suffix has not been chosen.`,'prefix',{left:i,right:i+1,kind:'prefix',valid:false});
  answer=i+2;
  emit('COUNT','Count removals that reach the array end',`Starts 0…${i+1} give ${i+2} valid removals ending at ${n-1}.`,n,null,i+2,true,false,`Initialize ans = i + 2 = ${answer}.`,'base-count');
  let j=n-1;
  while(j===n-1||nums[j]<nums[j+1]){
    emit('SUFFIX',`Use the increasing suffix starting at ${j}`,j===n-1?`A one-value suffix [${nums[j]}] is increasing.`:`${nums[j]} < ${nums[j+1]}, so this suffix is increasing.`,j,j,0,null,false,`Next, test the prefix bridge to nums[${j}].`,'suffix',j===n-1?undefined:{left:j,right:j+1,kind:'suffix',valid:true});
    while(i>=0&&nums[i]>=nums[j]){
      emit('BRIDGE',`The bridge at index ${i} fails`,`${nums[i]} ≥ ${nums[j]}, so keeping both values breaks strict increase.`,j,i,0,false,false,'The comparison is shown before moving i.','bridge',{left:i,right:j,kind:'bridge',valid:false});
      const rejected=i;i--;
      emit('RETREAT',`Move i left from ${rejected} to ${i}`,i<0?'The prefix is now empty.':`The new candidate is ${nums[i]}; it has not been tested yet.`,j,i>=0?i:null,0,null,false,i<0?'No prefix can remain; start removal at index 0.':'Re-check the bridge using the new i.','retreat');
    }
    const added=i+2;answer+=added;
    emit('COUNT',`Add ${added} removals for suffix index ${j}`,i<0?'The empty prefix always joins correctly. Only removal start 0 is valid.':`${nums[i]} < ${nums[j]}. Valid removal starts are 0…${i+1}.`,j,i>=0?i:j,added,true,false,`ans += i + 2 → ${answer}.`,'count',i>=0?{left:i,right:j,kind:'bridge',valid:true}:undefined);
    j--;
    emit('MOVE SUFFIX',`Try suffix boundary j = ${j}`,'Keep the last valid suffix highlighted while checking whether it can extend one position left.',j+1,j,0,null,false,`j -= 1 → ${j}. The next comparison decides whether to continue.`,'move-suffix',undefined,j);
  }
  emit('STOP','The suffix cannot extend further',`${nums[j]} ≥ ${nums[j+1]}, so starting the suffix at ${j} would break strict increase.`,j+1,j,0,null,false,`Last valid suffix starts at ${j+1}; attempted j = ${j}.`,'suffix',{left:j,right:j+1,kind:'suffix',valid:false},j);
  emit('COMPLETE','All valid boundary pairs are counted',`Return ${answer}. There are no earlier increasing suffix starts to try.`,j+1,null,0,null,false,'Each pointer moved left at most n times.','return',undefined,j);
  return frames;
}
export const incremovableVisualizer:VisualizerAdapter={
  id:'count-the-number-of-incremovable-subarrays-i',name:'Increasing prefix + suffix two pointers',mode:'specialized',
  description:'Follow the O(n) solution: join an increasing prefix and suffix, then count every valid removal boundary.',
  inputLabel:'Positive integer array · nums',inputGuide:'Use {"nums":[6,5,7,8]}; 1–18 positive safe integers.',placeholder:'{"nums":[6,5,7,8]}',referenceCode:incremovableCode,
  presets:[
    {label:'Bridge retreats once',input:'{"nums":[6,5,7,8]}',source:'LeetCode'},
    {label:'Already increasing',input:'{"nums":[1,2,3,4]}',source:'LeetCode'},
    {label:'Strictly decreasing',input:'{"nums":[8,7,6]}',source:'LeetCode'},
    {label:'Multiple bridge moves',input:'{"nums":[1,3,5,2,4,6]}',source:'Diagnostic'},
    {label:'Singleton',input:'{"nums":[5]}',source:'Diagnostic'},
  ],parseInput,createFrames:createIncremovableFrames,
};
