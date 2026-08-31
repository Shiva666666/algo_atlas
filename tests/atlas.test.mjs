import assert from 'node:assert/strict';
import {after,test} from 'node:test';
import {createServer} from 'vite';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {MemoryRouter} from 'react-router-dom';
import {PerspectiveCamera,Vector3} from 'three';
import {readFile} from 'node:fs/promises';

const server=await createServer({configFile:false,server:{middlewareMode:true,hmr:false},appType:'custom'});
after(()=>server.close());
const {createAtlasModel,nodeLibraryUrl,atlasNodeMatches}=await server.ssrLoadModule('/src/atlas/model.ts');
const {libraryRequest,fetchLibrarySelection,updateLibraryFilter}=await server.ssrLoadModule('/src/librarySelection.ts');
const {offlineApi}=await server.ssrLoadModule('/src/offlineCatalog.ts');
const {FlatConstellation}=await server.ssrLoadModule('/src/atlas/FlatConstellation.tsx');
const {zoomAtlasAt}=await server.ssrLoadModule('/src/atlas/viewport.ts');
const node=(id,kind,name=id,status)=>({id,kind,name,status,color:'#37d9ff',value:99});
const sample={aggregated:false,nodes:[node('domain','main','Dynamic Programming'),node('empty','main','Empty domain'),node('sub','sub','Knapsack'),node('open','problem','Same name','Open'),node('done','problem','Same name','Resolved'),node('pattern','pattern','Memoization'),node('custom','custom','My tag')],links:[{source:'domain',target:'sub',kind:'hierarchy'},{source:'sub',target:'open',kind:'primary'},{source:'sub',target:'done',kind:'primary'},{source:'pattern',target:'open',kind:'pattern'},{source:'custom',target:'done',kind:'pattern'}]};

test('Every emitted node kind has an exact, encoded library destination',()=>{
  const keys={main:'main_id',sub:'subtag_id',pattern:'taxonomy_id',custom:'taxonomy_id',problem:'problem_id'};
  for(const [kind,key] of Object.entries(keys)){
    const id='id /?&= λ';const url=new URL(nodeLibraryUrl(node(id,kind)),'http://localhost');
    assert.equal(url.pathname,'/library');assert.equal(url.searchParams.get(key),id);
    assert.equal([...url.searchParams].length,1);
  }
  assert.equal(nodeLibraryUrl(node('unknown','unknown')),'/library');
});

test('A problem node fetches the exact existing detail endpoint, not a title search',async()=>{
  const params=new URLSearchParams({problem_id:'a/b?c'});
  assert.deepEqual(libraryRequest(params),{path:'/api/problems/a%2Fb%3Fc',single:true});
  const calls=[];const problem={id:'a/b?c',title:'Same name'};
  const result=await fetchLibrarySelection(params,async path=>{calls.push(path);return problem});
  assert.deepEqual(result,{items:[problem],total:1});assert.equal(calls.length,1);
  assert.ok(!calls[0].includes('q='));
});

test('Taxonomy filters use the existing list API without losing IDs',()=>{
  for(const key of ['main_id','subtag_id','taxonomy_id']){
    const request=libraryRequest(new URLSearchParams({[key]:'uuid / &'}));
    const url=new URL(request.path,'http://localhost');
    assert.equal(request.single,false);assert.equal(url.pathname,'/api/problems');
    assert.equal(url.searchParams.get(key),'uuid / &');assert.equal(url.searchParams.get('limit'),'250');
  }
});

test('Changing filters releases exact problem selection; changing domain clears hidden classifications',()=>{
  const params=new URLSearchParams({problem_id:'p',subtag_id:'s',taxonomy_id:'t',status:'Open'});
  const status=updateLibraryFilter(params,'status','Resolved');
  assert.equal(status.has('problem_id'),false);assert.equal(status.get('status'),'Resolved');assert.equal(status.get('subtag_id'),'s');
  const domain=updateLibraryFilter(params,'main_id','d');
  assert.equal(domain.get('main_id'),'d');assert.equal(domain.has('subtag_id'),false);assert.equal(domain.has('taxonomy_id'),false);
  assert.equal(params.get('problem_id'),'p');
});

test('Graph model derives counts from real connections, not visual weights',()=>{
  const model=createAtlasModel(sample);
  assert.deepEqual(model.problemIds('domain').sort(),['done','open']);
  assert.deepEqual(model.problemIds('sub').sort(),['done','open']);
  assert.deepEqual(model.problemIds('pattern'),['open']);assert.deepEqual(model.problemIds('custom'),['done']);
  assert.deepEqual(model.problemIds('empty'),[]);assert.deepEqual(model.problemIds('open'),['open']);
  assert.equal(model.neighbors.get('open').has('pattern'),true);
  assert.equal(model.parent.get('open'),'sub');
});

test('Layout is deterministic and graph input is not mutated',()=>{
  const original=JSON.stringify(sample);const first=createAtlasModel(sample);const second=createAtlasModel(sample);
  assert.deepEqual(first.nodes,second.nodes);assert.equal(JSON.stringify(sample),original);
  assert.ok(first.nodes.every(node=>!('x' in node)&&!('y' in node)&&!('z' in node)));
  first.nodes[0].x=999;first.links[0].source='changed';assert.equal(JSON.stringify(sample),original);
  assert.equal(createAtlasModel({nodes:[],links:[],aggregated:false}).nodes.length,0);
});

test('Dangling graph edges are omitted and cycles do not hang descendant lookup',()=>{
  const graph={...sample,links:[...sample.links,{source:'missing',target:'open',kind:'pattern'},{source:'sub',target:'domain',kind:'hierarchy'}]};
  const model=createAtlasModel(graph);assert.equal(model.links.some(link=>link.source==='missing'),false);
  assert.deepEqual(model.problemIds('domain').sort(),['done','open']);
});

test('Status and node-name search maintain correct taxonomy matches',()=>{
  const model=createAtlasModel(sample);
  const match=(id,q,status)=>atlasNodeMatches(model.byId.get(id),q,status,model.problemIds,model.byId);
  assert.equal(match('domain','dynamic','Open'),true);assert.equal(match('empty','','Open'),false);
  assert.equal(match('open','','Resolved'),false);assert.equal(match('done','same','Resolved'),true);
  assert.equal(match('pattern','MEMO','Open'),true);assert.equal(match('pattern','','Resolved'),false);
});

test('Offline catalog: every atlas node resolves to the intended library records',async()=>{
  const graph=offlineApi('/api/analytics/atlas');
  for(const item of graph.nodes){
    const params=new URL(nodeLibraryUrl(item),'http://localhost').searchParams;
    const result=await fetchLibrarySelection(params,async path=>offlineApi(path));
    if(item.kind==='problem'){assert.equal(result.total,1);assert.equal(result.items[0].id,item.id)}
    if(item.kind==='main')assert.ok(result.items.every(problem=>problem.primary_main.id===item.id));
  }
});

test('2D rendering keeps real links, accessible node names and escaped text',()=>{
  const graph={...sample,nodes:[...sample.nodes,node('unsafe','main','<img src=x onerror=alert(1)>')]};
  const model=createAtlasModel(graph);
  const html=renderToStaticMarkup(React.createElement(MemoryRouter,null,React.createElement(FlatConstellation,{nodes:model.nodes,links:model.links,hovered:null,onHover:()=>{},highlighted:new Set()})));
  assert.equal((html.match(/vector-effect="non-scaling-stroke"/g)??[]).length,sample.links.filter(l=>l.kind!=='pattern').length);
  assert.equal((html.match(/aria-label="Open /g)??[]).length,graph.nodes.length);
  assert.ok(html.includes('/library?problem_id=open'));assert.ok(html.includes('/library?taxonomy_id=pattern'));
  assert.ok(html.includes('&lt;img'));assert.ok(!html.includes('<img'));
  assert.ok(html.includes('aria-label="Zoom in"'));assert.ok(html.includes('aria-label="Zoom out"'));
  assert.ok(html.includes('Drag to pan, scroll or pinch to zoom'));
});

test('2D zoom stays anchored under the pointer and clamps at usable limits',()=>{
  const initial={zoom:1,x:32,y:-12},centerX=600,centerY=400,x=260,y=180;
  const result=zoomAtlasAt(initial,2,x,y,centerX,centerY);
  assert.equal((x-centerX-initial.x)/initial.zoom,(x-centerX-result.x)/result.zoom);
  assert.equal((y-centerY-initial.y)/initial.zoom,(y-centerY-result.y)/result.zoom);
  assert.equal(zoomAtlasAt(initial,1000,x,y,centerX,centerY).zoom,8);
  assert.equal(zoomAtlasAt(initial,0.00001,x,y,centerX,centerY).zoom,0.0001);
});

test('Home canvas is viewport-sized, panels are optional overlays, and hovering does not trigger camera fit',async()=>{
  const css=await readFile(new URL('../src/atlas/atlas.css',import.meta.url),'utf8');
  const page=await readFile(new URL('../src/pages/AtlasPage.tsx',import.meta.url),'utf8');
  const canvas=await readFile(new URL('../src/atlas/ConstellationCanvas.tsx',import.meta.url),'utf8');
  assert.ok(css.includes('height:calc(100dvh - 76px)'));
  assert.ok(css.includes('.constellation-layout,.constellation-panel,.constellation-stage {position:absolute;inset:0'));
  assert.ok(!page.includes('page-scroll constellation-page'));
  assert.ok(page.includes("panel==='domains'&&"));assert.ok(page.includes("panel==='details'&&"));
  assert.ok(!canvas.includes('onEngineStop={fit}'));assert.ok(canvas.includes('controlType="orbit"'));
});

test('Optional live read-only check: every atlas node opens the matching library selection',{skip:!process.env.ATLAS_TEST_BASE_URL},async()=>{
  const request=async path=>{const response=await fetch(`${process.env.ATLAS_TEST_BASE_URL}${path}`);assert.equal(response.status,200,path);return response.json()};
  const graph=await request('/api/analytics/atlas');
  for(const item of graph.nodes){
    const result=await fetchLibrarySelection(new URL(nodeLibraryUrl(item),'http://localhost').searchParams,request);
    if(item.kind==='problem'){assert.equal(result.total,1);assert.equal(result.items[0].id,item.id)}
    if(item.kind==='main')assert.ok(result.items.every(p=>p.primary_main.id===item.id));
    if(item.kind==='sub')assert.ok(result.items.every(p=>p.primary_subtag.id===item.id));
    if(['pattern','custom'].includes(item.kind))assert.ok(result.items.every(p=>p.taxonomy.some(t=>t.id===item.id)));
  }
});
