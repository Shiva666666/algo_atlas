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
const {normalizeCode,nQueensCode,hexadecimalCode}=await load('practiceCode.ts');
const {getVisualizer}=await load('registry.ts');
const {NQueensCanvas,CoinChangeCanvas,HexadecimalCanvas}=await load('components/PracticeCanvas.tsx');
const {IncremovableCanvas}=await load('components/IncremovableCanvas.tsx');
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
});
