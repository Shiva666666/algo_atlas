import type {VisualFrame,VisualizerAdapter} from './types';
import {coinChangeCode} from './practiceCode';

export interface CoinCall {id:number;i:number;a:number;via:'root'|'take'|'skip';take:number|null;skip:number|null}
export interface CoinChangeData {coins:number[];amount:number;stack:CoinCall[];memo:Array<Array<number|null>>;active:[number,number]|null;event:string;returnValue:number|null;result:number|null}
function parseInput(raw:string){
  let value:unknown;try{value=JSON.parse(raw)}catch{throw new Error('Use {"coins":[1,2,5],"amount":5}.')}
  const {coins,amount}=(value??{}) as {coins?:unknown;amount?:unknown};
  if(typeof amount!=='number'||!Number.isInteger(amount)||amount<0||amount>12)throw new Error('amount must be an integer from 0 to 12 for a complete readable trace.');
  if(!Array.isArray(coins)||!coins.length||coins.length>5||!coins.every(c=>typeof c==='number'&&Number.isInteger(c)&&c>=1&&c<=99))throw new Error('Use 1–5 positive integer coins, each from 1 to 99.');
  if(new Set(coins).size!==coins.length)throw new Error('Coin denominations must be unique.');
  return {coins:[...coins] as number[],amount};
}
export function createCoinChangeFrames(value:unknown):VisualFrame[]{
  const {coins,amount}=parseInput(JSON.stringify(value));
  const memo:Array<Array<number|null>>=coins.map(()=>Array(amount+1).fill(null));const stack:CoinCall[]=[];const frames:VisualFrame[]=[];let nextId=0;let result:number|null=null;
  function emit(event:string,title:string,message:string,codeFocus:string[],returnValue:number|null=null){
    const call=stack.at(-1);const active:[number,number]|null=call&&call.i<coins.length&&call.a<amount?[call.i,call.a]:null;
    frames.push({kind:'coin-change',phase:event,title,message,codeFocus,data:{coins:[...coins],amount,stack:stack.map(c=>({...c})),memo:memo.map(row=>[...row]),active,event,returnValue,result} satisfies CoinChangeData});
  }
  function dfs(i:number,a:number,via:CoinCall['via']):number{
    const call:CoinCall={id:nextId++,i,a,via,take:null,skip:null};stack.push(call);
    emit('call',`Enter dfs(${i}, ${a})`,`The current sum is ${a}; only denominations at index ${i} onward are available.`,['def dfs(i, a):']);
    const finish=(v:number,event:string,title:string,message:string,code:string[])=>{emit(event,title,message,code,v);stack.pop();return v};
    if(a===amount)return finish(1,'base case','One complete combination',`The sum is exactly ${amount}. Return 1 immediately; base cases are not cached.`,['if a == amount:','return 1']);
    if(a>amount)return finish(0,'base case','This branch overshoots',`${a} is greater than ${amount}. Return 0 without writing to the cache.`,['if a > amount:']);
    if(i===coins.length)return finish(0,'base case','No denominations remain',`The sum is still ${a}, below ${amount}. Return 0.`,['if i == len(coins):']);
    if(memo[i][a]!==null)return finish(memo[i][a]!,'cache hit','Reuse a completed state',`cache[(${i}, ${a})] already holds ${memo[i][a]}. Do not explore its branches again.`,['if (i, a) in cache:','return cache[(i, a)]']);
    emit('take',`Take coin ${coins[i]}`,`Keep i = ${i}, because this coin can be reused. Recurse with sum ${a+coins[i]}.`,['dfs(i, a + coins[i])']);
    call.take=dfs(i,a+coins[i],'take');
    emit('take returned',`Take branch returns ${call.take}`,'The caller resumes with the first result. The skip result is still unknown.',['dfs(i, a + coins[i])']);
    emit('skip',`Skip coin ${coins[i]}`,`Move to index ${i+1}; keep the current sum at ${a}.`,['dfs(i + 1, a)']);
    call.skip=dfs(i+1,a,'skip');
    memo[i][a]=call.take+call.skip;
    emit('cache write',`Store ${call.take} + ${call.skip} = ${memo[i][a]}`,`Both children have returned. Save their sum at cache[(${i}, ${a})].`,['cache[(i, a)] =']);
    return finish(memo[i][a]!,'return',`Return ${memo[i][a]} to the caller`,`dfs(${i}, ${a}) is now complete.`,['return cache[(i, a)]']);
  }
  emit('start','Begin with an empty cache','Count combinations, not coin orderings. The take branch runs before the skip branch.',['cache = {}']);
  result=dfs(0,0,'root');
  emit('complete',`${result} combination${result===1?'':'s'}`,'The root call has returned. No calls remain on the stack.',['return dfs(0, 0)']);
  return frames;
}
export const coinChangeVisualizer:VisualizerAdapter={id:'coin-change-ii',name:'Take or skip, then remember',mode:'specialized',description:'Follow your recursive solution: explore both branches, add their answers, and reuse completed states.',inputLabel:'Coins and target amount',inputGuide:'Amount 0–12; 1–5 unique coins from 1–99. Coin order is preserved.',placeholder:'{"coins":[1,2,5],"amount":5}',referenceCode:coinChangeCode,presets:[{label:'Four combinations',input:'{"coins":[1,2,5],"amount":5}',source:'LeetCode'},{label:'Impossible amount',input:'{"coins":[2],"amount":3}',source:'LeetCode'},{label:'One denomination',input:'{"coins":[10],"amount":10}',source:'LeetCode'},{label:'Zero amount',input:'{"coins":[1,2],"amount":0}',source:'Diagnostic'}],parseInput,createFrames:createCoinChangeFrames};
