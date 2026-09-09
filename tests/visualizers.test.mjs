import assert from 'node:assert/strict';
import {after,test} from 'node:test';
import {createServer} from 'vite';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

// Vite transforms our TypeScript for tests without opening a port or a browser.
const server=await createServer({configFile:false,server:{middlewareMode:true,hmr:false},appType:'custom'});
after(()=>server.close());
const load=path=>server.ssrLoadModule(`/src/visualizers/${path}`);
const {nQueensVisualizer:nq,createNQueensFrames}=await load('nQueens.ts');
const {coinChangeVisualizer:cc,createCoinChangeFrames}=await load('coinChange.ts');
const {hexadecimalVisualizer:hx,createHexadecimalFrames}=await load('hexadecimal.ts');
const {incremovableVisualizer:inc,createIncremovableFrames}=await load('incremovable.ts');
const {steinerTreeVisualizer:st,parseSteinerInput}=await load('steinerTree.ts');
const {weightedWordMappingVisualizer:wwm,createWeightedWordMappingFrames}=await load('weightedWordMapping.ts');
const {matchsticksSquareVisualizer:ms,createMatchsticksFrames,parseMatchsticksInput}=await load('matchsticksSquare.ts');
const {normalizeCode,nQueensCode,hexadecimalCode,weightedWordMappingCode}=await load('practiceCode.ts');
const {getVisualizer}=await load('registry.ts');
const {NQueensCanvas,CoinChangeCanvas,HexadecimalCanvas}=await load('components/PracticeCanvas.tsx');
const {IncremovableCanvas}=await load('components/IncremovableCanvas.tsx');
const {SteinerCanvas}=await load('components/SteinerCanvas.tsx');
const {WeightedWordMappingCanvas}=await load('components/WeightedWordMappingCanvas.tsx');
const {MatchsticksCanvas}=await load('components/MatchsticksCanvas.tsx');
const {removeKDigitsVisualizer:rk,createRemoveKDigitsFrames,parseRemoveKDigitsInput}=await load('removeKDigits.ts');
const {RemoveKDigitsCanvas}=await load('components/RemoveKDigitsCanvas.tsx');
const {RemoveKDigitsInputEditor}=await load('components/RemoveKDigitsInputEditor.tsx');

function removalStringOracle(num,k){
  const candidates=[];
  function choose(start,partial){
    if(partial.length===num.length-k){candidates.push(partial.replace(/^0+/, '')||'0');return;}
    for(let index=start;index<num.length;index++)choose(index+1,partial+num[index]);
  }
  choose(0,'');
  return candidates.sort((a,b)=>a.length-b.length||a.localeCompare(b))[0];
}

test('Remove K Digits: exhaustive small subsequence oracle and 32-digit string arithmetic',()=>{
  let count=0;
  for(let length=1;length<=5;length++)for(let pattern=0;pattern<3**length;pattern++){
    let x=pattern;let num='';for(let i=0;i<length;i++){num+=String(x%3+1);x=Math.floor(x/3);}
    for(let k=1;k<=length;k++){assert.equal(createRemoveKDigitsFrames({num,k}).at(-1).data.result,removalStringOracle(num,k));count++;}
  }
  assert.ok(count>1000);
  for(const preset of rk.presets){const input=rk.parseInput(preset.input);assert.equal(createRemoveKDigitsFrames(input).at(-1).data.result,removalStringOracle(input.num,input.k));}
  assert.equal(createRemoveKDigitsFrames({num:'9'.repeat(32),k:1}).at(-1).data.result,'9'.repeat(31));
});

test('Remove K Digits: index identity, short circuit, source lines, and separate budget accounting',()=>{
  const source=rk.referenceCode.split('\n');
  for(const preset of rk.presets){
    const frames=createRemoveKDigitsFrames(rk.parseInput(preset.input));
    for(let step=0;step<frames.length;step++){
      const frame=frames[step],d=frame.data;
      assert.equal(frame.kind,'remove-k-digits');assert.equal(frame.codeLines.length,1);
      assert.equal(source[frame.codeLines[0]-1].trim(),frame.codeFocus[0]);
      assert.equal(d.topIndex,d.stack.at(-1)??null);
      assert.deepEqual([...d.stack].sort((a,b)=>a-b),d.stack);
      assert.equal(new Set([...d.stack,...d.removed.map(item=>item.index)]).size,d.stack.length+d.removed.length);
      assert.equal(d.removed.length,d.originalK-d.remainingK+(d.pendingSpend?1:0));
      if(d.action==='compare'){
        const present=d.stack.length>0;assert.equal(d.condition.stackPresent,present);
        assert.equal(d.condition.greater,present?d.num[d.topIndex]>d.currentDigit:null);
        assert.equal(d.condition.budgetAvailable,d.condition.greater===true?d.remainingK>0:null);
      }
      if(d.action==='pop'){const previous=frames[step-1].data;assert.equal(d.removed.at(-1).index,previous.stack.at(-1));assert.equal(d.remainingK,previous.remainingK);}
      if(d.action==='spend')assert.equal(d.remainingK,frames[step-1].data.remainingK-1);
      if(d.action==='append-output')assert.equal(d.rawOutput,frames[step-1].data.rawOutput+d.num[d.outputIndex]);
      if(d.action==='trim-step'){assert.equal(d.trimIndex,frames[step-1].data.trimIndex+1);assert.equal(d.remainingK,frames[step-1].data.remainingK);assert.deepEqual(d.stack,frames[step-1].data.stack);}
      assert.equal(d.rawOutput,d.stack.map(index=>d.num[index]).join('').slice(0,d.rawOutput.length));
    }
    const before=JSON.stringify(frames[0].data);frames.at(-1).data.stack.push(99);frames.at(-1).data.removed.push({index:99,reason:'mutated'});assert.equal(JSON.stringify(frames[0].data),before);
  }
});

test('Remove K Digits: equality, budget exhaustion, tail removal, early return, and zero formatting',()=>{
  const equal=createRemoveKDigitsFrames({num:'1111',k:2});assert.ok(equal.filter(f=>f.data.action==='pop').every(f=>f.data.phase==='tail'));
  const exhausted=createRemoveKDigitsFrames({num:'321',k:1}).at(-1).data;assert.equal(exhausted.stack.map(i=>exhausted.num[i]).join(''),'21');
  const early=createRemoveKDigitsFrames({num:'10',k:2});assert.equal(early.length,2);assert.equal(early.at(-1).data.earlyReturn,true);assert.deepEqual(early.at(-1).data.stack,[]);
  const zeros=createRemoveKDigitsFrames({num:'1000',k:1}).at(-1).data;assert.equal(zeros.rawOutput,'000');assert.equal(zeros.trimIndex,3);assert.equal(zeros.result,'0');
  const cascade=createRemoveKDigitsFrames({num:'123045',k:3});assert.equal(cascade.filter(f=>f.data.action==='pop'&&f.data.scanIndex===3).length,3);
});

test('Remove K Digits: strict parser, registry and semantic UI',()=>{
  for(const value of [null,[],{}, {num:123,k:1},{num:'',k:1},{num:'01',k:1},{num:'1 2',k:1},{num:'１２',k:1},{num:'+12',k:1},{num:'1.2',k:1},{num:'1'.repeat(33),k:1},{num:'123',k:0},{num:'123',k:4},{num:'123',k:1.5},{num:'123',k:'1'},{num:'123',k:true}])assert.throws(()=>parseRemoveKDigitsInput(JSON.stringify(value)));
  assert.throws(()=>parseRemoveKDigitsInput('{bad'));
  assert.equal(createRemoveKDigitsFrames({num:'0',k:1}).at(-1).data.result,'0');
  for(const key of ['402','remove-k-digits'])assert.equal(getVisualizer({source:'leetcode',source_key:key}).id,rk.id);
  const markup=renderToStaticMarkup(React.createElement(RemoveKDigitsCanvas,{data:createRemoveKDigitsFrames({num:'10200',k:1}).at(-1).data}));
  for(const text of ['Index stack','Removal budget','Removed digits','Raw res','Returned string','200','Trim zeros'])assert.ok(markup.includes(text),text);
  const input=renderToStaticMarkup(React.createElement(RemoveKDigitsInputEditor,{raw:'{"num":"123","k":1}',onChange:()=>{}}));
  assert.match(input,/role="tabpanel"/);assert.match(input,/digits-input-fields-panel/);
});
const problem={source:'leetcode',source_key:'unknown',primary_main:{slug:'arrays'},primary_subtag:{slug:'search'},notes:{approach:['A saved study note.']}};

function coinOracle(coins,amount){
  const counts=Array(amount+1).fill(0);counts[0]=1;
  for(const coin of coins)for(let sum=coin;sum<=amount;sum++)counts[sum]+=counts[sum-coin];
  return counts[amount];
}
function removalOracle(nums){
  const intervals=[];
  for(let start=0;start<nums.length;start++)for(let end=start;end<nums.length;end++){
    const remaining=[...nums.slice(0,start),...nums.slice(end+1)];
    if(remaining.every((value,i)=>i===0||remaining[i-1]<value))intervals.push(`${start}:${end}`);
  }
  return intervals;
}

function weightedWordOracle(input){
  return input.words.map(word=>{const total=[...word].reduce((sum,char)=>sum+input.weights[char.charCodeAt(0)-97],0);return String.fromCharCode(122-(total%26))}).join('');
}

function matchsticksOracle(values){
  const total=values.reduce((sum,value)=>sum+value,0);if(total%4!==0)return false;
  const target=total/4;const used=Array(values.length).fill(false);const sides=[0,0,0,0];
  function place(index){
    if(index===values.length)return sides.every(side=>side===target);
    const value=values.slice().sort((a,b)=>b-a)[index];
    for(let side=0;side<4;side++){if(sides[side]+value>target)continue;sides[side]+=value;const ok=place(index+1);sides[side]-=value;if(ok)return true;}
    return false;
  }
  return place(0);
}

function steinerOracle(input){
  const {n,k,c,query}=input;const distance=c.map(row=>[...row]);
  for(let middle=0;middle<n;middle++)for(let i=0;i<n;i++)for(let j=0;j<n;j++)distance[i][j]=Math.min(distance[i][j],distance[i][middle]+distance[middle][j]);
  const size=1<<k;const dp=Array.from({length:size},()=>Array(n).fill(Infinity));dp[0].fill(0);
  for(let terminal=0;terminal<k;terminal++)dp[1<<terminal][terminal]=0;
  for(let mask=1;mask<size;mask++){
    for(let sub=mask;;sub=(sub-1)&mask){const other=mask^sub;for(let v=0;v<n;v++)dp[mask][v]=Math.min(dp[mask][v],dp[sub][v]+dp[other][v]);if(sub===0)break}
    const old=[...dp[mask]];for(let u=0;u<n;u++)for(let v=0;v<n;v++)dp[mask][u]=Math.min(dp[mask][u],old[v]+distance[v][u]);
  }
  const source=query[0]-1;const target=query[1]-1;const ndp=Array.from({length:size},()=>Array(n).fill(Infinity));ndp[0][source]=0;
  for(let mask=0;mask<size;mask++){
    for(let sub=mask;;sub=(sub-1)&mask){const other=mask^sub;for(let v=0;v<n;v++)ndp[mask][v]=Math.min(ndp[mask][v],ndp[sub][v]+dp[other][v]);if(sub===0)break}
    const old=[...ndp[mask]];for(let u=0;u<n;u++)for(let v=0;v<n;v++)ndp[mask][u]=Math.min(ndp[mask][u],old[v]+distance[v][u]);
  }
  return {distance,answer:ndp[size-1][target]};
}

test('N-Queens: complete search, attack sets, copied solutions and final undo',()=>{
  const counts=[0,1,0,0,2,10];
  for(let n=1;n<=5;n++){
    const frames=createNQueensFrames({n});const last=frames.at(-1).data;
    assert.equal(last.solutions.length,counts[n]);assert.deepEqual(last.board,[]);
    for(const {data} of frames){
      assert.deepEqual(data.columns,[...data.board].sort((a,b)=>a-b));
      assert.deepEqual(data.differences,data.board.map((c,r)=>r-c).sort((a,b)=>a-b));
      assert.deepEqual(data.sums,data.board.map((c,r)=>r+c).sort((a,b)=>a-b));
      assert.equal(new Set(data.differences).size,data.board.length);
      assert.equal(new Set(data.sums).size,data.board.length);
      for(const solution of data.solutions)assert.equal(solution.length,n);
      if(data.action==='reject')assert.ok(data.candidate.conflicts.length>0);
    }
    assert.deepEqual(frames[0].data.board,[]);
    const saved=frames.find(frame=>frame.data.solutions.length);
    if(saved){const previous=JSON.stringify(saved.data);last.board.push(99);assert.equal(JSON.stringify(saved.data),previous)}
  }
  assert.deepEqual(createNQueensFrames({n:4}).at(-1).data.solutions,[[1,3,0,2],[2,0,3,1]]);
});

test('Coin Change II: 806 ordered inputs agree with independent bottom-up oracle',()=>{
  let checked=0;
  for(let mask=1;mask<32;mask++){
    const subset=Array.from({length:5},(_,i)=>i+1).filter((_,i)=>mask&(1<<i));
    for(const coins of [subset,[...subset].reverse()])for(let amount=0;amount<=12;amount++){
      const frames=createCoinChangeFrames({coins,amount});const last=frames.at(-1).data;
      assert.equal(last.result,coinOracle(coins,amount));assert.deepEqual(last.stack,[]);
      assert.deepEqual(last.coins,coins);assert.ok(last.memo.every(row=>row[amount]===null));
      for(const frame of frames){
        const data=frame.data;const current=data.stack.at(-1);
        for(let i=0;i<coins.length;i++)for(let a=0;a<amount;a++)if(data.memo[i][a]!==null)assert.equal(data.memo[i][a],coinOracle(coins.slice(i),amount-a));
        if(data.event==='cache write'){
          assert.notEqual(current.take,null);assert.notEqual(current.skip,null);
          assert.equal(data.memo[current.i][current.a],current.take+current.skip);
        }
        if(data.event==='skip')assert.notEqual(current.take,null);
        if(data.event==='base case')assert.equal(data.active,null);
      }
      checked++;
    }
  }
  assert.equal(checked,806);
});

test('Coin Change II: zero, impossible amounts, cache hits, and large denomination',()=>{
  assert.equal(createCoinChangeFrames({coins:[99],amount:12}).at(-1).data.result,0);
  const zero=createCoinChangeFrames({coins:[1,2],amount:0});
  assert.equal(zero.at(-1).data.result,1);assert.ok(zero.at(-1).data.memo.flat().every(v=>v===null));
  const frames=createCoinChangeFrames({coins:[1,2,5],amount:5});
  assert.equal(frames.filter(f=>f.data.event==='cache hit').length,3);
  assert.ok(frames.at(-1).data.memo.flat().includes(0));
  assert.ok(frames[0].data.memo.flat().every(v=>v===null));
});

test('Hexadecimal: 1,010 boundary and seeded signed inputs preserve 32 bits',()=>{
  let seed=529;const numbers=[0,1,15,16,26,256,-1,-26,-2147483648,2147483647];
  for(let i=0;i<1000;i++){seed=(Math.imul(seed,1664525)+1013904223)|0;numbers.push(seed)}
  for(const num of numbers){
    const frames=createHexadecimalFrames({num});
    assert.equal(frames.at(-1).data.result,BigInt.asUintN(32,BigInt(num)).toString(16));
    if(num===0){assert.equal(frames.length,2);assert.equal(frames.at(-1).data.working,null)}
    for(let i=0;i<frames.length;i++){
      const {data}=frames[i];
      if(data.working!==null)assert.ok(data.working>=0&&data.working<=4294967295);
      if(data.action==='extract')assert.equal(data.nibble,data.working%16);
      if(data.action==='prepend')assert.equal(data.result,data.digit+frames[i-1].data.result);
      if(data.action==='shift')assert.equal(data.working,Math.floor(frames[i-1].data.working/16));
    }
  }
});

test('Incremovable: 21,844 arrays have exact counts and valid removal intervals',()=>{
  let checked=0;
  for(let n=1;n<=7;n++)for(let pattern=0;pattern<4**n;pattern++){
    let key=pattern;const nums=Array.from({length:n},()=>{const value=key%4+1;key=Math.floor(key/4);return value});
    const expected=removalOracle(nums);const frames=createIncremovableFrames({nums});
    assert.equal(frames.at(-1).data.answer,expected.length);
    const intervals=[];
    for(const frame of frames){
      const data=frame.data;
      if(data.comparison)assert.equal(data.nums[data.comparison.left]<data.nums[data.comparison.right],data.comparison.valid);
      if(data.allIncreasing)assert.ok(data.answer>0);
      if(data.bridgeValid===false){assert.equal(frame.phase,'BRIDGE');assert.ok(nums[data.prefixEnd]>=nums[data.suffixStart])}
      if(frame.phase==='COUNT')for(let start=0;start<data.added;start++)intervals.push(`${start}:${data.suffixStart-1}`);
    }
    if(!frames.at(-1).data.allIncreasing)assert.deepEqual(intervals.sort(),expected.sort());
    checked++;
  }
  assert.equal(checked,21844);
});

test('Parsers reject coercion, invalid domains and unsupported large traces',()=>{
  for(const input of [{n:true},{n:'4'},{n:0},{n:6},{n:2.5}])assert.throws(()=>nq.parseInput(JSON.stringify(input)));
  for(const input of [{coins:[1,1],amount:5},{coins:[0],amount:3},{coins:['2'],amount:3},{coins:[1],amount:13},{coins:[1],amount:true}])assert.throws(()=>cc.parseInput(JSON.stringify(input)));
  for(const input of [{num:'26'},{num:true},{num:2147483648},{num:-2147483649},{num:1.5}])assert.throws(()=>hx.parseInput(JSON.stringify(input)));
  for(const nums of [[true],['1'],[[1]],[],[0],[9007199254740992],Array(19).fill(1)])assert.throws(()=>inc.parseInput(JSON.stringify({nums})));
  for(const adapter of [nq,cc,hx,inc])assert.throws(()=>adapter.parseInput('not JSON'));
});

test('Steiner studio: Floyd closure, exact DP answer, and immutable stage snapshots',()=>{
  const reference=st.referenceCode.split('\n').map(line=>line.replace(/\s/g,''));
  for(const preset of st.presets){
    const input=parseSteinerInput(preset.input);const expected=steinerOracle(input);const frames=st.createFrames(input,problem);const floyd=frames.filter(frame=>frame.data.stage==='floyd-warshall');const dp=frames.filter(frame=>frame.data.stage==='steiner-dp');
    assert.equal(st.inputEditor,'steiner-matrix');assert.ok(floyd.length>input.n*input.n*input.n);assert.ok(dp.length>0);
    const cells=floyd.filter(frame=>frame.data.floyd.current!==null);assert.equal(cells.length,input.n**3);
    const sealed=floyd.at(-1).data;assert.equal(sealed.floyd.sealed,true);assert.deepEqual(sealed.floyd.matrix,expected.distance.map(row=>row.map(value=>Number.isFinite(value)?value:null)));
    const answer=dp.at(-1).data;assert.equal(answer.answer,expected.answer);assert.equal(answer.transition,'reconstruct');assert.equal(answer.stage,'steiner-dp');
    assert.ok(frames.some(frame=>frame.traceRole==='transition'));assert.ok(frames.some(frame=>frame.traceRole==='checkpoint'));
    for(const frame of frames){assert.ok(frame.codeFocus?.length,`${preset.label}: ${frame.title}`);for(const focus of frame.codeFocus)assert.ok(reference.some(line=>line.includes(focus.replace(/\s/g,''))),`${preset.label}: ${focus}`);if(frame.data.stage==='floyd-warshall'&&frame.data.floyd.current){const view=frame.data.floyd;assert.equal(view.newDistance,Math.min(view.oldDistance,view.viaDistance));}if(frame.data.stage==='steiner-dp'&&frame.data.transition==='merge'&&frame.data.submask!==null)assert.equal(frame.data.otherMask,frame.data.mask^frame.data.submask);if(frame.data.stage==='steiner-dp'&&frame.data.transition==='relax'&&frame.data.oldDpRow&&frame.data.root!==null&&frame.data.target!==null){const old=frame.data.oldDpRow[frame.data.root];const distance=frame.data.distanceMatrix[frame.data.root][frame.data.target];const candidate=(old===null||distance===null)?null:old+distance;assert.equal(frame.data.candidateCost,candidate)}}
    const firstMatrix=JSON.stringify(frames[0].data.floyd.matrix);answer.dpTable[0][0]=999999;assert.equal(JSON.stringify(frames[0].data.floyd.matrix),firstMatrix);
  }
  const all=st.createFrames(st.parseInput(st.presets[0].input),problem);const guided=all.filter(frame=>frame.traceRole!=='transition');assert.ok(guided.length<all.length);assert.match(renderToStaticMarkup(React.createElement(SteinerCanvas,{data:all[0].data})),/Floyd/);assert.match(renderToStaticMarkup(React.createElement(SteinerCanvas,{data:all.at(-1).data})),/Steiner dynamic-programming state table/);
});

test('Steiner parser rejects malformed matrices and query endpoints',()=>{
  const valid=JSON.parse(st.presets[0].input);
  for(const value of [{...valid,n:2},{...valid,k:0},{...valid,c:[[0,1],[2,0]]},{...valid,c:valid.c.map(row=>[...row]),query:[1,2]},{...valid,c:valid.c.map(row=>[...row])}]){
    if(value.c?.length===valid.c.length&&value.c[0]?.length===valid.c.length&&value.query?.[0]===valid.query[0])value.c[0][1]=value.c[1][0]+1;
    assert.throws(()=>parseSteinerInput(JSON.stringify(value)));
  }
});

test('Weighted Word Mapping: every character transition matches the independent oracle',()=>{
  for(const preset of wwm.presets){
    const input=wwm.parseInput(preset.input);const frames=createWeightedWordMappingFrames(input,problem);const last=frames.at(-1).data;
    assert.equal(wwm.inputEditor,'weighted-word-grid');
    assert.equal(last.output,weightedWordOracle(input));assert.equal(last.action,'complete');
    assert.equal(last.totals.length,input.words.length);assert.equal(last.words.join('|'),input.words.join('|'));
    const reference=weightedWordMappingCode.split('\n').map(line=>line.replace(/\s/g,''));
    for(const frame of frames){
      const data=frame.data;assert.ok(frame.codeFocus?.length,`${preset.label}: ${frame.title}`);
      for(const focus of frame.codeFocus)assert.ok(reference.some(line=>line.includes(focus.replace(/\s/g,''))),`${preset.label}: ${focus}`);
      if(data.action==='lookup')assert.equal(data.selectedWeight,input.weights[data.alphabetIndex]);
      if(data.action==='add'){
        assert.equal(data.newTotal,data.previousTotal+data.selectedWeight);
        assert.equal(data.runningTotal,data.newTotal);
      }
      if(data.action==='modulo')assert.equal(data.modulo,data.runningTotal%26);
      if(data.action==='map')assert.equal(data.mappedCharacter,String.fromCharCode(122-data.modulo));
      if(data.action==='append')assert.equal(data.output.at(-1),data.mappedCharacter);
      assert.ok(data.output.length<=data.words.length);
      assert.ok(data.totals.every((total,index)=>total===[...data.words[index]].reduce((sum,char)=>sum+input.weights[char.charCodeAt(0)-97],0)));
    }
    const first=JSON.stringify(frames[0].data);last.words.push('mutated');last.weights[0]=999;last.totals.push(123);assert.equal(JSON.stringify(frames[0].data),first);
  }
});

test('Weighted Word Mapping: parser rejects malformed, unsafe, and oversized inputs',()=>{
  const valid=JSON.parse(wwm.presets[0].input);
  for(const value of [null,{}, {...valid,words:[]},{...valid,words:['A']},{...valid,words:['']},{...valid,words:Array(9).fill('a')},{...valid,words:['a'.repeat(13)]},{...valid,words:['a'.repeat(65)]},{...valid,weights:[1,2]},{...valid,weights:[...valid.weights.slice(0,25),-1]},{...valid,weights:[...valid.weights.slice(0,25),1.5]}])assert.throws(()=>wwm.parseInput(JSON.stringify(value)));
  const unsafe={words:['aa'],weights:[Number.MAX_SAFE_INTEGER,...Array(25).fill(0)]};assert.throws(()=>wwm.parseInput(JSON.stringify(unsafe)));
  assert.throws(()=>wwm.parseInput('not JSON'));
});

test('Matchsticks to Square: complete scalar backtracking agrees with an independent oracle',()=>{
  const cases=[[1,1,2,2,2],[3,3,3,3,4],[2,2,2,2,3,3,7,7],[1,1,1,1],[1,2,3,4,5,5,6,7]];
  const reference=ms.referenceCode.split('\n').map(line=>line.replace(/\s/g,''));
  for(const values of cases){
    const frames=createMatchsticksFrames({matchsticks:values});const last=frames.at(-1).data;
    assert.equal(last.result,matchsticksOracle(values));
    assert.deepEqual(last.original,values);assert.deepEqual(last.sorted.map(item=>item.value),[...values].sort((a,b)=>b-a));
    for(const frame of frames){
      const data=frame.data;assert.equal(frame.kind,'matchsticks-square');assert.ok(frame.codeFocus?.length);
      for(const focus of frame.codeFocus)assert.ok(reference.some(line=>line.includes(focus.replace(/\s/g,''))),`${frame.title}: ${focus}`);
      if(data.action==='check'||data.action==='prune')assert.equal(data.candidateSum,data.sideSums[data.activeSide]+data.currentStick.value);
      if(data.action==='resume')assert.equal(data.childResult,false);
      for(const side of ['left','right','top','down'])assert.equal(data.sideSums[side],data.sideSticks[side].reduce((sum,id)=>sum+data.sorted.find(item=>item.id===id).value,0));
    }
    const first=JSON.stringify(frames[0].data);last.sideSums.left=999;last.sorted[0].value=999;assert.equal(JSON.stringify(frames[0].data),first);
  }
  const diagnostic=createMatchsticksFrames({matchsticks:[2,2,2,2,3,3,7,7]});
  assert.ok(diagnostic.some(frame=>frame.data.action==='resume'),'diagnostic must show a failed child returning to its parent');
  assert.equal(diagnostic.at(-1).data.sideSums.left,7);assert.equal(diagnostic.at(-1).data.sideSums.right,7);
  assert.match(renderToStaticMarkup(React.createElement(MatchsticksCanvas,{data:diagnostic.find(frame=>frame.data.action==='resume').data})),/Resume parent state/);
});

test('Matchsticks to Square: parser accepts shorthand and rejects unsafe domains',()=>{
  assert.deepEqual(parseMatchsticksInput('[1,1,2,2,2]'),{matchsticks:[1,1,2,2,2]});
  for(const value of [null,{},[],[0],[1.5],[-1],[1,2,3,4,5,6,7,8,9],Array(9).fill(1),['2']])assert.throws(()=>parseMatchsticksInput(JSON.stringify(value)));
  assert.throws(()=>parseMatchsticksInput('not JSON'));
  assert.equal(ms.inputEditor,'matchsticks');assert.equal(getVisualizer({...problem,source_key:'matchsticks-to-square'}).id,'matchsticks-to-square');
});

test('All preset traces have code-focus snippets that exist in their reference',()=>{
  for(const adapter of [nq,cc,hx,inc])for(const preset of adapter.presets){
    const reference=adapter.referenceCode.split('\n').map(line=>line.replace(/\s/g,''));
    for(const frame of adapter.createFrames(adapter.parseInput(preset.input),problem)){
      assert.ok(frame.codeFocus?.length,`${adapter.id} ${frame.title}`);
      for(const focus of frame.codeFocus)assert.ok(reference.some(line=>line.includes(focus.replace(/\s/g,''))),focus);
    }
  }
});

test('Reference matching preserves meaningful Python indentation and literal spaces',()=>{
  assert.equal(normalizeCode(nQueensCode),normalizeCode(`\n${nQueensCode}\n\n`));
  assert.notEqual(normalizeCode(nQueensCode),normalizeCode(nQueensCode.replace('                return','            return')));
  assert.notEqual(normalizeCode(hexadecimalCode),normalizeCode(hexadecimalCode.replace('= "a"','= "a "')));
});

test('Registry recognizes LintCode 33 without assigning that adapter to other sources',()=>{
  assert.equal(getVisualizer({...problem,source:'lintcode',source_key:'33'}).id,nq.id);
  assert.equal(getVisualizer({...problem,source:'leetcode',source_key:'33'}).mode,'generic');
  assert.equal(getVisualizer({...problem,source_key:'coin-change-ii'}).id,cc.id);
  assert.equal(getVisualizer({...problem,source_key:'convert-a-number-to-hexadecimal'}).id,hx.id);
  assert.equal(getVisualizer({...problem,source_key:'weighted-word-mapping'}).id,wwm.id);
  const generic=getVisualizer(problem);const frames=generic.createFrames({nums:[1,2,3]},problem);
  assert.match(frames[0].message,/not algorithm execution/);
  assert.ok(frames.filter(frame=>frame.phase==='SAVED NOTE').every(frame=>frame.data.activePath.length===0));
});

test('Render smoke: diagrams expose labels and distinct empty/computed/result states',()=>{
  const render=(component,data)=>renderToStaticMarkup(React.createElement(component,{data}));
  const queens=createNQueensFrames({n:4});
  assert.match(render(NQueensCanvas,queens.at(-1).data),/No queens placed/);
  assert.match(render(NQueensCanvas,queens.at(-1).data),/Solution 2/);
  assert.match(render(NQueensCanvas,queens.find(f=>f.data.action==='reject').data),/queen-attack-lines/);
  const coin=createCoinChangeFrames({coins:[1,2,5],amount:5});
  assert.match(render(CoinChangeCanvas,coin.at(-1).data),/All calls returned/);
  assert.match(render(CoinChangeCanvas,coin.at(-1).data),/not cached/);
  assert.match(render(HexadecimalCanvas,createHexadecimalFrames({num:-1}).at(-1).data),/Original signed input/);
  assert.match(render(HexadecimalCanvas,createHexadecimalFrames({num:0}).at(-1).data),/returns before the bit operations/);
  const bridge=createIncremovableFrames({nums:[1,3,5,2,4,6]}).find(f=>f.phase==='BRIDGE');
  assert.match(render(IncremovableCanvas,bridge.data),/false/);
  const weighted=createWeightedWordMappingFrames(JSON.parse(wwm.presets[0].input));
  assert.match(render(WeightedWordMappingCanvas,weighted.find(frame=>frame.data.action==='add').data),/A–Z WEIGHT LOOKUP/);
  assert.match(render(WeightedWordMappingCanvas,weighted.find(frame=>frame.data.action==='modulo').data),/MODULO DECODER/);
  assert.match(render(WeightedWordMappingCanvas,weighted.at(-1).data),/OUTPUT TAPE/);
});
