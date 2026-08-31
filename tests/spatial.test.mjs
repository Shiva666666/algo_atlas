import assert from 'node:assert/strict';
import {after,test} from 'node:test';
import {createServer} from 'vite';
import {PerspectiveCamera,Vector3} from 'three';
const server=await createServer({configFile:false,server:{middlewareMode:true,hmr:false},appType:'custom'});
after(()=>server.close());
const {createAtlasModel,selectAtlasGraph}=await server.ssrLoadModule('/src/atlas/model.ts');
const {pinchAtlasAt,spatialCamera}=await server.ssrLoadModule('/src/atlas/viewport.ts');
const {layout3D}=await server.ssrLoadModule('/src/atlas/layout3D.ts');
const {layout2D,wrapLabel,fitStudyCamera}=await server.ssrLoadModule('/src/atlas/layout2D.ts');
const {graphIdentity,createLayoutRequest,isCurrentResult,positionedNodes}=await server.ssrLoadModule('/src/atlas/layoutTypes.ts');
const {placeSpatialLabels}=await server.ssrLoadModule('/src/atlas/labels.ts');
const {makeAtlasFixture}=await server.ssrLoadModule('/tests/atlas-fixture.ts');

test('Study/all scopes and filters preserve real edges and ancestors',()=>{
  const graph=makeAtlasFixture(4),model=createAtlasModel(graph),study=selectAtlasGraph(model,'study'),all=selectAtlasGraph(model,'all');
  assert.ok(study.nodes.length<all.nodes.length);assert.equal(all.nodes.length,graph.nodes.length);
  const filtered=selectAtlasGraph(model,'study','Practice problem 1:','Open');
  assert.deepEqual(filtered.nodes.map(n=>n.id).sort(),['domain-0','pattern-0','problem-0','technique-0-0']);
  assert.ok(filtered.links.every(l=>graph.links.some(real=>JSON.stringify(real)===JSON.stringify(l))));
  assert.equal(selectAtlasGraph(model,'study','missing').nodes.length,0);
});

test('Worker messages are cloneable and reject stale identity or request serial',()=>{
  const graph=makeAtlasFixture(12),request=createLayoutRequest(createAtlasModel(graph),7);
  assert.deepEqual(structuredClone(request),request);assert.deepEqual(Object.keys(request.graph).sort(),['links','nodes']);
  assert.ok(isCurrentResult({...request,result:{}},request));
  assert.equal(isCurrentResult({...request,requestId:6},request),false);
  assert.equal(isCurrentResult({...request,key:'old'},request),false);
  const renamed={nodes:graph.nodes.map(n=>({...n,name:'renamed',status:'Resolved'})),links:[...graph.links].reverse()};
  assert.equal(graphIdentity(renamed),graphIdentity(graph));assert.notEqual(graphIdentity({...graph,links:[]}),graphIdentity(graph));
});

test('3D layout is deterministic, order independent, volumetric, and immutable',()=>{
  const graph=makeAtlasFixture(96),before=JSON.stringify(graph),first=layout3D(graph);
  assert.deepEqual(first,layout3D(graph));
  assert.deepEqual(first,layout3D({nodes:[...graph.nodes].reverse(),links:[...graph.links].reverse()}));
  assert.deepEqual(first,layout3D({nodes:graph.nodes.map(n=>({...n,name:'renamed'})),links:graph.links}));
  assert.equal(JSON.stringify(graph),before);assert.equal(Object.keys(first.positions).length,graph.nodes.length);
  const spans=['x','y','z'].map(axis=>first.bounds.max[axis]-first.bounds.min[axis]);
  assert.ok(Math.min(...spans)/Math.max(...spans)>.75);
  const coordinates=Object.values(first.positions);assert.ok(coordinates.every(p=>Object.values(p).every(Number.isFinite)));
  for(const [a,b] of [['x','y'],['y','z'],['x','z']]){
    const mean=axis=>coordinates.reduce((sum,p)=>sum+p[axis],0)/coordinates.length;
    const ma=mean(a),mb=mean(b),cov=coordinates.reduce((sum,p)=>sum+(p[a]-ma)*(p[b]-mb),0);
    const va=coordinates.reduce((sum,p)=>sum+(p[a]-ma)**2,0),vb=coordinates.reduce((sum,p)=>sum+(p[b]-mb)**2,0);
    assert.ok(Math.abs(cov/Math.sqrt(va*vb))<.85,'volume must not collapse onto a diagonal');
  }
  assert.equal(Object.keys(layout3D({nodes:[],links:[]}).positions).length,0);
});

test('Front, side, top and oblique projections stay spread; reset is oblique and unclipped',()=>{
  const graph=makeAtlasFixture(96),result=layout3D(graph),nodes=positionedNodes(graph.nodes,result);
  for(const angle of [[0,0,1],[1,0,0],[0,1,.001],[.35,.2,1],[1,0,1],[0,0,-1]]){
    const camera=new PerspectiveCamera(50,1.5,.1,100000),dir=new Vector3(...angle).normalize();
    camera.position.copy(dir.multiplyScalar(result.bounds.radius*3));camera.lookAt(0,0,0);camera.updateMatrixWorld();
    const p=nodes.map(n=>new Vector3(n.x,n.y,n.z).project(camera));
    for(const axis of ['x','y'])assert.ok(Math.max(...p.map(n=>n[axis]))-Math.min(...p.map(n=>n[axis]))>.55);
  }
  for(const [width,height] of [[1744,1004],[1190,692],[390,712]]){
    const pose=spatialCamera(nodes,width,height),camera=new PerspectiveCamera(50,width/height,.1,100000);
    assert.notEqual(pose.position.x,pose.target.x);assert.notEqual(pose.position.y,pose.target.y);
    camera.position.set(...['x','y','z'].map(a=>pose.position[a]));camera.lookAt(...['x','y','z'].map(a=>pose.target[a]));camera.updateMatrixWorld();
    for(const n of nodes){const p=new Vector3(n.x,n.y,n.z).project(camera);assert.ok(Math.abs(p.x)<1&&Math.abs(p.y)<1)}
  }
});

test('Independent 2D groups reserve nonoverlapping label boxes, including long words and tags',()=>{
  const graph=makeAtlasFixture(60);graph.nodes.push({id:'long',kind:'custom',name:'VeryLongUnbrokenName'.repeat(15),color:'#fff',value:1},{id:'tag',kind:'custom',name:'Another long custom tag '.repeat(15),color:'#fff',value:1});
  for(const [wide,compact] of [[true,false],[false,false],[false,true]]){
    const layout=layout2D(graph,wide,compact);
    assert.equal(layout.nodes.length,graph.nodes.length);assert.equal(new Set(layout.nodes.map(n=>n.id)).size,graph.nodes.length);
    assert.equal(new Set(layout.groups.map(g=>g.x)).size,wide?2:1);
    for(const n of layout.nodes){assert.ok(n.x>=0&&n.x+n.width<=layout.width);assert.ok(n.y>=0&&n.y+n.height<=layout.height);assert.ok(n.height>=n.lines.length*17+18)}
    for(let i=0;i<layout.nodes.length;i++)for(let j=i+1;j<layout.nodes.length;j++){
      const a=layout.nodes[i],b=layout.nodes[j];assert.ok(!(a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y),a.id+' overlaps '+b.id);
    }
    assert.deepEqual(layout.links,graph.links);
    for(const l of graph.links.filter(l=>l.kind==='primary')){const a=layout.nodes.find(n=>n.id===l.source),b=layout.nodes.find(n=>n.id===l.target);assert.ok(a.x+a.width<b.x)}
  }
  assert.ok(wrapLabel('x'.repeat(200),15).every(line=>line.length<=15));
});

test('2D overview fits visible bounds including tall catalogs, independent of the readable default',()=>{
  const layout=layout2D(makeAtlasFixture(1500),true);
  for(const selected of [layout.nodes,layout.nodes.slice(-3)])for(const [width,height] of [[1744,1004],[1190,692],[390,712]]){
    const fit=fitStudyCamera(selected,width,height);
    for(const n of selected){const x=fit.x+n.x*fit.zoom,y=fit.y+n.y*fit.zoom;assert.ok(x>=23&&x+n.width*fit.zoom<=width-23);assert.ok(y>=167&&y+n.height*fit.zoom<=height-131)}
  }
  assert.deepEqual(fitStudyCamera([],390,712),{zoom:1,x:28,y:168});
});

test('Projected labels stay inside content bounds and avoid collisions',()=>{
  const candidates=Array.from({length:50},(_,i)=>({id:String(i),x:100+i%8*39,y:200+Math.floor(i/8)*31,width:100}));
  const labels=placeSpatialLabels(candidates,390,712);assert.ok(labels.length>0&&labels.length<candidates.length);
  for(const label of labels)assert.ok(label.x>=58&&label.x<=332&&label.y>=164&&label.y+32<=590);
  for(let i=0;i<labels.length;i++)for(let j=i+1;j<labels.length;j++)assert.ok(Math.abs(labels[i].x-labels[j].x)>=110||Math.abs(labels[i].y-labels[j].y)>=40);
});

test('Large synthetic graph retains every node and finite positions without touching records',()=>{
  const graph=makeAtlasFixture(1500),before=JSON.stringify(graph),result=layout3D(graph);
  assert.equal(Object.keys(result.positions).length,graph.nodes.length);
  assert.ok(Object.values(result.positions).every(p=>Object.values(p).every(Number.isFinite)));
  assert.equal(JSON.stringify(graph),before);
});
test('Pinch zoom carries the world point under the old midpoint to the new midpoint',()=>{
  const camera={zoom:1.5,x:23,y:-10},old={x:100,y:100},next={x:70,y:80},other={x:300,y:200};
  const updated=pinchAtlasAt(camera,old,next,other);
  for(const axis of ['x','y'])assert.ok(Math.abs(((old[axis]+other[axis])/2-camera[axis])/camera.zoom-((next[axis]+other[axis])/2-updated[axis])/updated.zoom)<1e-9);
  assert.deepEqual(pinchAtlasAt(camera,other,next,other),camera);
});
