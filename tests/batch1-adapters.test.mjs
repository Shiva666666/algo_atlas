import assert from 'node:assert/strict';
import {after,test} from 'node:test';
import {createServer} from 'vite';

const server=await createServer({configFile:false,server:{middlewareMode:true,hmr:false},appType:'custom'});
after(()=>server.close());
const load=path=>server.ssrLoadModule(`/src/visualizers/${path}`);
const {searchSuggestionsVisualizer:trie,createSearchSuggestionsFrames}=await load('searchSuggestions.ts');
const {uniqueSplitVisualizer:split,createUniqueSplitFrames}=await load('uniqueSplit.ts');
const {getVisualizer}=await load('registry.ts');

function suggestionsOracle(products,word){
  const sorted=[...products].sort();
  return Array.from({length:word.length},(_,i)=>sorted.filter(product=>product.startsWith(word.slice(0,i+1))).slice(0,3));
}
function splitOracle(s){
  const seen=new Set();let best=0;
  function visit(i,count){if(i===s.length){best=Math.max(best,count);return}for(let j=i+1;j<=s.length;j++){const part=s.slice(i,j);if(!seen.has(part)){seen.add(part);visit(j,count+1);seen.delete(part)}}}
  visit(0,0);return best;
}
function sourceLines(adapter){return adapter.referenceCode.split('\n').map(line=>line.replace(/\s/g,''));}

test('Search Suggestions: sorted trie trace matches independent prefix oracle',()=>{
  const input={products:['mobile','mouse','moneypot','monitor','mousepad'],searchWord:'mouse'};
  const frames=createSearchSuggestionsFrames(input);const last=frames.at(-1).data;
  assert.deepEqual(last.resultLists,suggestionsOracle(input.products,input.searchWord));
  assert.equal(last.action,'complete');
  assert.equal(last.nodes.filter(node=>node.terminalProduct).length,input.products.length);
  assert.ok(frames.some(frame=>frame.data.action==='insert'));
  assert.ok(frames.some(frame=>frame.data.action==='walk'));
  assert.ok(frames.some(frame=>frame.data.action==='suggestion'));
  assert.ok(frames.every(frame=>frame.data.suggestions.length<=3));
  const lines=sourceLines(trie);
  for(const frame of frames){assert.ok(frame.codeFocus?.length,frame.title);for(const focus of frame.codeFocus)assert.ok(lines.some(line=>line.includes(focus.replace(/\s/g,''))),focus)}
});

test('Search Suggestions: terminal prefix, missing branch, and fresh copied lists',()=>{
  const terminal={products:['app','apple','application','apt'],searchWord:'app'};
  const frames=createSearchSuggestionsFrames(terminal);assert.deepEqual(frames.at(-1).data.resultLists,suggestionsOracle(terminal.products,terminal.searchWord));
  assert.ok(frames.some(frame=>frame.data.terminalProduct==='app'&&frame.data.action==='suggestion'));
  const missing={products:['bags','baggage','banner'],searchWord:'xyz'};const missingFrames=createSearchSuggestionsFrames(missing);
  assert.deepEqual(missingFrames.at(-1).data.resultLists,[[],[],[]]);assert.equal(missingFrames.filter(frame=>frame.data.action==='missing').length,3);
  const stable=createSearchSuggestionsFrames(terminal);const before=JSON.stringify(stable[stable.length-2].data);stable.at(-1).data.resultLists[0].push('mutated');assert.equal(JSON.stringify(stable[stable.length-2].data),before);
});

test('Search Suggestions: parser keeps bounded lowercase unique input',()=>{
  for(const raw of ['not json','{"products":[],"searchWord":"a"}','{"products":["a","a"],"searchWord":"a"}','{"products":["A"],"searchWord":"a"}','{"products":["a"],"searchWord":"A"}','{"products":["aaaaaaaaaaaaaaaaa"],"searchWord":"a"}'])assert.throws(()=>trie.parseInput(raw));
  assert.deepEqual(trie.parseInput('{"products":["a"],"searchWord":""}'),{products:['a'],searchWord:''});
});

test('Unique Split: complete backtracking trace agrees with independent oracle',()=>{
  for(const s of ['ababccc','aba','aa','abcd','aabb']){
    const frames=createUniqueSplitFrames({s});const last=frames.at(-1).data;
    assert.equal(last.best,splitOracle(s));assert.equal(last.action,'complete');assert.deepEqual(last.path,[]);assert.deepEqual(last.seen,[]);assert.deepEqual(last.callStack,[]);
    if(s.includes(s[0]+s[0]))assert.ok(frames.some(frame=>frame.data.action==='reject'));
    assert.ok(frames.some(frame=>frame.data.action==='remove'));
    for(const frame of frames){assert.ok(frame.data.seen.every((part,index,array)=>array.indexOf(part)===index));assert.equal(frame.data.path.length,frame.data.seen.length);assert.ok(frame.data.best>=0);}
    const lines=sourceLines(split);for(const frame of frames){assert.ok(frame.codeFocus?.length,frame.title);for(const focus of frame.codeFocus)assert.ok(lines.some(line=>line.includes(focus.replace(/\s/g,''))),focus)}
  }
});

test('Unique Split: base case and branch snapshots are independent',()=>{
  const frames=createUniqueSplitFrames({s:'a'});assert.equal(frames.filter(frame=>frame.data.action==='base').length,1);assert.equal(frames.at(-1).data.best,1);
  const snapshots=createUniqueSplitFrames({s:'aba'});const chosen=snapshots.find(frame=>frame.data.action==='choose');assert.ok(chosen);const before=JSON.stringify(chosen.data);snapshots.at(-1).data.seen.push('changed');assert.equal(JSON.stringify(chosen.data),before);
});

test('Registry exposes the two new adapters without changing source routing',()=>{
  const problem={source:'leetcode',source_key:'unknown',primary_main:{slug:'arrays'},primary_subtag:{slug:'arrays'},notes:{}};
  assert.equal(getVisualizer({...problem,source_key:trie.id}).id,trie.id);
  assert.equal(getVisualizer({...problem,source_key:split.id}).id,split.id);
  assert.equal(getVisualizer({...problem,source:'lintcode',source_key:'33'}).id,'lintcode-33-n-queens');
});
