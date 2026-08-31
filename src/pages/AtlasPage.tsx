import {useQuery} from '@tanstack/react-query';
import {ArrowRight,BookOpen,Check,ChevronRight,Focus,GitBranch,Info,Layers,Search,X} from 'lucide-react';
import {lazy,Suspense,useCallback,useMemo,useRef,useState} from 'react';
import type {CSSProperties} from 'react';
import {Link,useNavigate} from 'react-router-dom';
import {api} from '../api';
import type {Analytics,AtlasGraphData} from '../types';
import {createAtlasModel,nodeKindLabel,nodeLibraryUrl,selectAtlasGraph} from '../atlas/model';
import {FlatConstellation,GraphErrorBoundary} from '../atlas/FlatConstellation';
import type {FlatCamera} from '../atlas/FlatConstellation';
import type {CameraPose} from '../atlas/ConstellationCanvas';
import {useSpatialLayout} from '../atlas/useSpatialLayout';
import {positionedNodes} from '../atlas/layoutTypes';
import {LessonButton,LessonMotion,SmoothTabs,StateLegend,useLessonReducedMotion} from '../visualizers/components/LessonPrimitives';
import '../atlas/atlas.css';
const ConstellationCanvas=lazy(()=>import('../atlas/ConstellationCanvas').then(module=>({default:module.ConstellationCanvas})));

function supportsWebGL(){
  try{const canvas=document.createElement('canvas');const context=canvas.getContext('webgl2')??canvas.getContext('webgl');context?.getExtension('WEBGL_lose_context')?.loseContext();return !!context}catch{return false}
}
const emptyGraph:AtlasGraphData={nodes:[],links:[],aggregated:false};

export function AtlasPage({initialWebGL}:{initialWebGL?:boolean}={}){
  const navigate=useNavigate();const reduced=useLessonReducedMotion();
  const [webgl,setWebgl]=useState(()=>initialWebGL??supportsWebGL());
  const [view,setView]=useState(()=>window.innerWidth<760?'flat':'space');
  const [query,setQuery]=useState('');const [scope,setScope]=useState('all');
  const [network,setNetwork]=useState<'study'|'all'>('study');
  const camera3D=useRef<CameraPose|null>(null),camera2D=useRef<FlatCamera|null>(null);
  const [panel,setPanel]=useState<'domains'|'details'|null>(null);
  const [showSearch,setShowSearch]=useState(false);
  const [hovered,setHovered]=useState<string|null>(null);const [lastInspected,setLastInspected]=useState<string|null>(null);const [reset,setReset]=useState(0);
  const {data:atlas,isLoading,error,refetch}=useQuery({queryKey:['atlas'],queryFn:()=>api<AtlasGraphData>('/api/analytics/atlas')});
  const {data:analytics}=useQuery({queryKey:['analytics'],queryFn:()=>api<Analytics>('/api/analytics/overview')});
  const model=useMemo(()=>createAtlasModel(atlas??emptyGraph),[atlas]);
  const summary=analytics?.summary;
  const weakest=analytics?.domains.filter(domain=>domain.open>0).sort((a,b)=>b.open-a.open)[0];
  const onHover=useCallback((id:string|null)=>{setHovered(id);if(id)setLastInspected(id)},[]);
  const changeView=useCallback((next:string)=>{setHovered(null);setView(next)},[]);
  const onUnavailable=useCallback(()=>setWebgl(false),[]);
  const graphBase=useMemo(()=>selectAtlasGraph(model,network),[model,network]);
  const graphSelection=useMemo(()=>selectAtlasGraph(model,network,query,scope),[model,network,query,scope]);
  const matched=graphSelection.matched;
  const visible=useMemo(()=>new Set(graphSelection.nodes.map(node=>node.id)),[graphSelection]);
  const spatial=useSpatialLayout(model,webgl&&view==='space'&&model.nodes.length>0);
  const spatialNodes=useMemo(()=>spatial.result?positionedNodes(model.nodes,spatial.result):[],[model,spatial.result]);
  const highlighted=useMemo(()=>new Set(hovered?[hovered,...model.neighbors.get(hovered)??[]]:[]),[hovered,model]);
  const inspected=model.byId.get(hovered??lastInspected??'')??model.byId.get(weakest?.id??'')??model.domains[0];
  const related=inspected?model.problemIds(inspected.id).map(id=>model.byId.get(id)!).filter(Boolean):[];
  const inspectedDomain=analytics?.domains.find(domain=>domain.id===inspected?.id);
  const actualView=view==='space'&&!webgl?'flat':view;
  const openNode=useCallback((node:AtlasGraphData['nodes'][number])=>navigate(nodeLibraryUrl(node)),[navigate]);
  const graphFallback=<FlatConstellation nodes={graphBase.nodes} links={graphBase.links} visible={visible} hovered={hovered} onHover={onHover} highlighted={highlighted} reset={reset} cameraState={camera2D}/>;

  return <LessonMotion><section className="constellation-page spatial-study-page" onKeyDown={event=>{if(event.key==='Escape'){setPanel(null);setShowSearch(false)}}}>
    <header className="constellation-header">
      <div><h2>Your knowledge, <em>connected.</em></h2><p>{actualView==='flat'?'Follow a technique to the problems you have practiced.':'Explore the relationships behind your practice.'}</p></div>
    </header>
    <div className="atlas-summary-strip" aria-label="Library summary">
      <Link to="/library"><strong>{summary?.total??'—'}</strong><span>problems in your atlas</span></Link>
      <Link to="/library?status=Resolved"><Check size={16}/><strong>{summary?.resolved??'—'}</strong><span>resolved</span></Link>
      <span><GitBranch size={16}/><strong>{summary?.repeat_mistakes??'—'}</strong> repeat signals</span>
    </div>
    <div className="constellation-layout">
      {panel==='domains'&&<aside id="atlas-domains" className="atlas-domain-rail atlas-floating-panel" aria-label="Domains">
        <div className="atlas-section-title"><h3>Domains · {model.domains.length}</h3><LessonButton aria-label="Close domains" onClick={()=>setPanel(null)}><X size={16}/></LessonButton></div>
        <p className="atlas-muted">Hover to locate. Click to explore.</p>
        <nav className="atlas-domain-list" aria-label="Open a domain in the library">{model.domains.map(domain=>{
          const count=analytics?.domains.find(item=>item.id===domain.id)?.count??model.problemIds(domain.id).length;
          return <Link key={domain.id} to={nodeLibraryUrl(domain)} onMouseEnter={()=>onHover(domain.id)} onMouseLeave={()=>onHover(null)} onFocus={()=>onHover(domain.id)} onBlur={()=>onHover(null)} className={hovered===domain.id?'active':''} style={{'--domain-color':domain.color} as CSSProperties}><span className="domain-marker"/><span>{domain.name}</span><b>{count}</b></Link>;
        })}</nav>
        {weakest&&<div className="atlas-review-prompt"><span>Worth revisiting</span><h3>{weakest.name}</h3><p>{weakest.open} open {weakest.open===1?'problem':'problems'} in this domain.</p><Link to={`/library?${new URLSearchParams({main_id:weakest.id,status:'Open'})}`}>Review these signals <ArrowRight size={15}/></Link></div>}
        {summary?.total===0&&<Link className="atlas-review-prompt" to="/problems/new">Log your first signal <ArrowRight size={16}/></Link>}
      </aside>}

      <section className="constellation-panel" aria-label="Explore your spatial study network">
        <div className="constellation-toolbar">
          <h3 className="atlas-sr-only">Study network</h3>
          <SmoothTabs id="atlas-view" label="Network view" value={actualView} onChange={changeView} items={[...(webgl?[{id:'space',label:'3D'}]:[]),{id:'flat',label:'2D'},{id:'list',label:'List'}]}/>
          <LessonButton className="atlas-tool-button" aria-label="Search and filter nodes" aria-expanded={showSearch} aria-controls="atlas-search" onClick={()=>setShowSearch(value=>!value)}><Search size={17}/>{(query||scope!=='all')&&<span className="atlas-filter-dot"/>}</LessonButton>
          <LessonButton className="atlas-tool-button" aria-label="Show domains" aria-expanded={panel==='domains'} aria-controls="atlas-domains" onClick={()=>setPanel(value=>value==='domains'?null:'domains')}><Layers size={17}/></LessonButton>
          <LessonButton className="atlas-tool-button" aria-label="Show node details" aria-expanded={panel==='details'} aria-controls="atlas-details" onClick={()=>setPanel(value=>value==='details'?null:'details')}><Info size={17}/></LessonButton>
          <Link className="atlas-tool-button" aria-label="Open library" to="/library"><BookOpen size={17}/></Link>
        </div>
        <div className="atlas-network-switch" role="group" aria-label="Network scope"><LessonButton aria-pressed={network==='study'} onClick={()=>setNetwork('study')}>My study network</LessonButton><LessonButton aria-pressed={network==='all'} onClick={()=>setNetwork('all')}>All topics</LessonButton><span>{graphSelection.nodes.length} nodes · {graphSelection.links.length} connections</span></div>
        {showSearch&&<div id="atlas-search" className="atlas-find-bar">
          <label className="atlas-find"><Search size={16}/><input aria-label="Find a node in the atlas" placeholder="Find a problem, domain, or pattern…" value={query} onChange={event=>{setQuery(event.target.value);setHovered(null)}}/>{query&&<LessonButton onClick={()=>setQuery('')} aria-label="Clear node search"><X size={16}/></LessonButton>}</label>
          <select aria-label="Filter atlas by problem status" value={scope} onChange={event=>{setScope(event.target.value);setHovered(null)}}><option value="all">All statuses</option><option value="Open">Open</option><option value="Understood">Understood</option><option value="Resolved">Resolved</option></select>
        </div>}
        {isLoading?<div className="atlas-state-message" role="status"><Layers size={28}/><h3>Connecting your signals…</h3><p>Loading the atlas from your library.</p></div>:error?<div className="atlas-state-message" role="alert"><h3>The atlas couldn't load</h3><p>{error instanceof Error?error.message:'Try again to reconnect your library.'}</p><LessonButton onClick={()=>refetch()}>Try again</LessonButton></div>:!graphBase.nodes.length&&network==='study'?<div className="atlas-state-message"><h3>Start your study network</h3><p>Log a problem to connect it to your topics, or explore the full taxonomy.</p><Link className="inspector-open" to="/problems/new">Log your first problem <ArrowRight size={16}/></Link><LessonButton onClick={()=>setNetwork('all')}>Explore all topics</LessonButton></div>:!matched.length?<div className="atlas-state-message"><Search size={28}/><h3>No matching signals</h3><p>Try another name or clear the status filter.</p><LessonButton onClick={()=>{setQuery('');setScope('all')}}>Clear filters</LessonButton></div>:<>
          <div className="constellation-stage" id={`atlas-view-${actualView}-panel`} role="tabpanel" aria-labelledby={`atlas-view-${actualView}`}>
            {actualView==='space'?spatial.error?<div className="atlas-state-message" role="alert"><h3>3D is unavailable</h3><p>{spatial.error}</p><LessonButton onClick={()=>setView('flat')}>Open 2D study map</LessonButton></div>:!spatial.result?<div className="atlas-state-message" role="status">Arranging your study network…</div>:<GraphErrorBoundary fallback={<><p className="atlas-render-notice">3D is unavailable. The same nodes are available in 2D or List.</p>{graphFallback}</>}><Suspense fallback={<div className="atlas-state-message" role="status">Preparing the 3D map…</div>}><ConstellationCanvas nodes={spatialNodes} links={model.links} visible={visible} hovered={hovered} onHover={onHover} onOpen={openNode} highlighted={highlighted} reset={reset} onUnavailable={onUnavailable} cameraState={camera3D} reducedMotion={reduced}/></Suspense></GraphErrorBoundary>:actualView==='flat'?graphFallback:<div className="atlas-node-directory">{matched.map(node=><Link key={node.id} to={nodeLibraryUrl(node)} onMouseEnter={()=>onHover(node.id)} onMouseLeave={()=>onHover(null)} onFocus={()=>onHover(node.id)} onBlur={()=>onHover(null)}><span className={`directory-marker ${node.kind}`} style={{color:node.color}}/><span><small>{nodeKindLabel(node.kind)}{node.status?` · ${node.status}`:''}</small><b>{node.name}</b></span><ChevronRight size={16}/></Link>)}</div>}
            {actualView!=='list'&&<LessonButton className="atlas-fit" onClick={()=>setReset(value=>value+1)}><Focus size={16}/> Fit map</LessonButton>}
          </div>
          <footer className="constellation-map-footer"><StateLegend items={[{label:'Domain',symbol:'◎',color:'#9b8cff'},{label:'Technique',symbol:'○',color:'#a9b4c2'},{label:'Problem',symbol:'●',color:'#37d9ff'},{label:'Pattern',symbol:'◇',color:'#a9b4c2'}]}/><span>{actualView==='space'?'Drag to rotate · Right-drag to pan · Scroll to zoom':actualView==='flat'?'Drag to pan · Scroll or pinch to zoom · Click a node to open':'Every entry opens in your library'}</span></footer>
          {hovered&&panel===null&&<div className="atlas-hover-label" role="status"><span style={{color:inspected?.color}}>{nodeKindLabel(inspected?.kind??'')}</span><strong>{inspected?.name}</strong><small>Click node to open in library</small></div>}
        </>}
        {!webgl&&<p className="atlas-render-notice">3D is unavailable on this device. The 2D map and list keep every node accessible.</p>}
        {atlas?.aggregated&&<p className="atlas-render-notice">Showing the latest 1,500 problem nodes. The library contains the full collection.</p>}
      </section>

      {panel==='details'&&<aside id="atlas-details" className="atlas-inspector atlas-floating-panel" aria-label="Node details">
        <div className="atlas-section-title"><h3>Signal details</h3><LessonButton aria-label="Close node details" onClick={()=>setPanel(null)}><X size={16}/></LessonButton></div>
        {inspected?<>
          <span className="inspector-kind"><span style={{background:inspected.color}}/>{nodeKindLabel(inspected.kind)}</span>
          <h3 className="inspector-name">{inspected.name}</h3>
          {inspected.kind==='problem'?<div className="inspector-tags"><span>{inspected.status}</span><span>{inspected.difficulty}</span></div>:<p className="inspector-count"><strong>{inspectedDomain?.count??related.length}</strong> {atlas?.aggregated&&!inspectedDomain?'visible ':''}linked {related.length===1?'problem':'problems'}</p>}
          <Link className="inspector-open" to={nodeLibraryUrl(inspected)}>Open in library <ArrowRight size={16}/></Link>
          <div className="inspector-divider"/>
          <h4>{inspected.kind==='problem'?'Connected to':'Linked problems'}</h4>
          <div className="inspector-related">{inspected.kind==='problem'?[...model.neighbors.get(inspected.id)??[]].map(id=>{const node=model.byId.get(id)!;return <Link key={id} to={nodeLibraryUrl(node)}><span>{node.name}</span><ChevronRight size={14}/></Link>}):related.length?related.slice(0,5).map(node=><Link key={node.id} to={nodeLibraryUrl(node)}><span>{node.name}<small>{node.status}</small></span><ChevronRight size={14}/></Link>):<p>No problems linked yet. This domain is ready for your next entry.</p>}
            {related.length>5&&<Link to={nodeLibraryUrl(inspected)}>View all {related.length} in library <ArrowRight size={14}/></Link>}
          </div>
        </>:<p className="atlas-muted">Hover a node to see its connections, then click to open it in the library.</p>}
        <p className="inspector-note">The map shows real classifications and shared techniques. Distance is for layout, not a difficulty score.</p>
      </aside>}
    </div>
  </section></LessonMotion>;
}
