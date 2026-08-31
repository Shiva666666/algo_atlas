import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import type {MutableRefObject} from 'react';
import {Link} from 'react-router-dom';
import ForceGraph3D from 'react-force-graph-3d';
import type {ForceGraphMethods} from 'react-force-graph-3d';
import {AmbientLight,Color,DirectionalLight,HemisphereLight,Mesh,MeshStandardMaterial,SphereGeometry,Vector3} from 'three';
import {nodeLibraryUrl} from './model';
import type {AtlasNode,PositionedNode} from './model';
import type {AtlasGraphData} from '../types';
import {layoutBounds} from './layoutTypes';
import type {Point3} from './layoutTypes';
import {spatialCamera} from './viewport';
import {placeSpatialLabels} from './labels';

export type CameraPose={position:Point3;target:Point3};
type Props={nodes:PositionedNode[];links:AtlasGraphData['links'];visible:Set<string>;hovered:string|null;onHover:(id:string|null)=>void;onOpen:(node:AtlasNode)=>void;highlighted:Set<string>;reset:number;onUnavailable:()=>void;cameraState:MutableRefObject<CameraPose|null>;reducedMotion?:boolean};
const radius=(kind:string)=>kind==='main'?13:kind==='sub'?7.5:kind==='problem'?6:5;
const endpoint=(value:unknown)=>typeof value==='object'&&value!==null?(value as {id:string}).id:String(value);
const edgeKey=(link:{source?:unknown;target?:unknown})=>`${endpoint(link.source)}>${endpoint(link.target)}`;
const curveRotation=(link:{source?:unknown;target?:unknown})=>edgeKey(link).length%7*.8;
const noLabel=()=>'';

export function ConstellationCanvas({nodes,links,visible,hovered,onHover,onOpen,highlighted,reset,onUnavailable,cameraState,reducedMotion=false}:Props){
  const holder=useRef<HTMLDivElement>(null),graph=useRef<ForceGraphMethods<PositionedNode>|undefined>(undefined);
  const [size,setSize]=useState({width:0,height:0});
  const [labels,setLabels]=useState<Array<{id:string;x:number;y:number}>>([]);
  const data=useMemo(()=>({nodes:nodes.map(node=>({...node})),links:links.map(link=>({...link}))}),[nodes,links]);
  const points=useMemo(()=>new Map(nodes.map(node=>[node.id,node])),[nodes]);
  const bounds=useMemo(()=>layoutBounds(nodes),[nodes]);
  const textWidths=useMemo(()=>{const context=document.createElement('canvas').getContext('2d');if(context)context.font='13px "IBM Plex Sans"';return new Map(nodes.map(node=>[node.id,Math.min(280,(context?.measureText(node.name).width??node.name.length*7)+24)]))},[nodes]);
  const hoverTimer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
  const hoverNode=useCallback((id:string|null)=>{clearTimeout(hoverTimer.current);if(id)onHover(id);else hoverTimer.current=setTimeout(()=>onHover(null),180)},[onHover]);
  useEffect(()=>()=>clearTimeout(hoverTimer.current),[]);
  const objects=useMemo(()=>new Map(nodes.map(node=>{
    const color=new Color(node.color).lerp(new Color('#c0d0e4'),.13);
    return [node.id,new Mesh(new SphereGeometry(radius(node.kind),24,16),new MeshStandardMaterial({color,roughness:.55,metalness:.08,emissive:color,emissiveIntensity:.08}))];
  })),[nodes]);
  const materials=useMemo(()=>new Map(links.map(link=>[edgeKey(link),new MeshStandardMaterial({color:link.kind==='pattern'?'#627184':'#748fa1',roughness:.7,transparent:true,opacity:.44,depthWrite:false})])),[links]);
  const state=useRef({visible,hovered,highlighted});state.current={visible,hovered,highlighted};
  const didFit=useRef(false),lastReset=useRef(reset),dragStart=useRef({x:0,y:0,moved:false});
  useEffect(()=>{
    if(!holder.current)return;
    const observer=new ResizeObserver(([entry])=>setSize({width:Math.floor(entry.contentRect.width),height:Math.floor(entry.contentRect.height)}));observer.observe(holder.current);return()=>observer.disconnect();
  },[]);
  const saveCamera=useCallback(()=>{
    const g=graph.current;if(!g)return;
    const camera=g.camera(),controls=g.controls() as unknown as {target:Vector3};
    cameraState.current={position:{x:camera.position.x,y:camera.position.y,z:camera.position.z},target:{x:controls.target.x,y:controls.target.y,z:controls.target.z}};
  },[cameraState]);
  const fit=useCallback(()=>{
    const g=graph.current;if(!g||!size.width)return;
    const selected=nodes.filter(node=>state.current.visible.has(node.id));
    const pose=spatialCamera(selected,size.width,size.height);
    g.camera().up.set(0,1,0);g.cameraPosition(pose.position,pose.target,0);saveCamera();
  },[nodes,size.width,size.height,saveCamera]);
  useEffect(()=>{
    if(!graph.current||!size.width)return;
    const g=graph.current;
    const key=new DirectionalLight('#e4eeff',3.2);key.position.set(300,500,600);
    const rim=new DirectionalLight('#a6baff',1.5);rim.position.set(-400,0,-300);
    g.lights([new AmbientLight('#ffffff',.65),new HemisphereLight('#cde9ff','#162035',1.4),key,rim]);
    g.renderer().setPixelRatio(Math.min(window.devicePixelRatio,2));
    const canvas=g.renderer().domElement,controls=g.controls() as unknown as {addEventListener:(name:string,fn:()=>void)=>void;removeEventListener:(name:string,fn:()=>void)=>void;enableDamping:boolean;dampingFactor:number};
    controls.enableDamping=!reducedMotion;controls.dampingFactor=.12;controls.addEventListener('change',saveCamera);
    const lost=(event:Event)=>{event.preventDefault();onUnavailable()};canvas.addEventListener('webglcontextlost',lost);
    return()=>{const camera=g.camera(),target=(g.controls() as unknown as {target:Vector3}).target;cameraState.current={position:{x:camera.position.x,y:camera.position.y,z:camera.position.z},target:{x:target.x,y:target.y,z:target.z}};controls.removeEventListener('change',saveCamera);canvas.removeEventListener('webglcontextlost',lost)};
  },[size.width>0,saveCamera,onUnavailable,reducedMotion,cameraState]);
  useEffect(()=>{
    if(!size.width)return;
    const frame=requestAnimationFrame(()=>{
      if(!didFit.current&&cameraState.current){const pose=cameraState.current;graph.current?.cameraPosition(pose.position,pose.target,0)}
      else if(!didFit.current||reset!==lastReset.current)fit();
      didFit.current=true;lastReset.current=reset;
    });return()=>cancelAnimationFrame(frame);
  },[size.width,size.height,fit,reset,cameraState]);
  useEffect(()=>{
    for(const [id,object] of objects){const active=!hovered||highlighted.has(id);object.scale.setScalar((size.width<600?1.65:1)*(id===hovered?1.15:1));object.material.emissiveIntensity=id===hovered?.32:active?.08:.01;object.material.color.set(points.get(id)!.color).lerp(new Color(active?'#becddd':'#16202c'),active?.13:.6)}
    for(const link of links){const active=hovered===link.source||hovered===link.target;const material=materials.get(edgeKey(link))!;material.opacity=active?.95:link.kind==='pattern'?.16:hovered?.22:.72;material.color.set(active?'#cde9ff':link.kind==='pattern'?'#627184':'#9db5c8')}
  },[objects,materials,links,hovered,highlighted,points,size.width<600]);
  useEffect(()=>{
    if(!size.width)return;let frame=0,last=0;
    const update=(time:number)=>{
      frame=requestAnimationFrame(update);if(time-last<90||!graph.current)return;last=time;
      const g=graph.current,camera=g.camera(),current=state.current;
      const close=camera.position.distanceTo(new Vector3(bounds.center.x,bounds.center.y,bounds.center.z))<bounds.radius*2;
      const candidates=nodes.filter(node=>current.visible.has(node.id)&&(node.kind==='main'||node.id===current.hovered||close)).sort((a,b)=>(a.id===current.hovered?-1:b.id===current.hovered?1:a.kind==='main'?-1:b.kind==='main'?1:0));
      const projectedLabels=[];
      for(const node of candidates){
        const projected=new Vector3(node.x,node.y,node.z).project(camera);if(projected.z>1||projected.z< -1)continue;
        const p=g.graph2ScreenCoords(node.x,node.y,node.z);projectedLabels.push({id:node.id,x:p.x,y:p.y,width:textWidths.get(node.id)!});
      }
      const next=placeSpatialLabels(projectedLabels,size.width,size.height);
      setLabels(previous=>JSON.stringify(previous)===JSON.stringify(next)?previous:next);
    };frame=requestAnimationFrame(update);return()=>cancelAnimationFrame(frame);
  },[nodes,size,bounds,textWidths]);
  useEffect(()=>()=>{for(const object of objects.values()){object.geometry.dispose();object.material.dispose()}for(const material of materials.values())material.dispose()},[objects,materials]);
  const objectFor=useCallback((node:PositionedNode)=>objects.get(node.id)!,[objects]);
  const showNode=useCallback((node:PositionedNode)=>visible.has(node.id),[visible]);
  const showLink=useCallback((link:{source?:unknown;target?:unknown})=>visible.has(endpoint(link.source))&&visible.has(endpoint(link.target)),[visible]);
  const linkMaterial=useCallback((link:{source?:unknown;target?:unknown})=>materials.get(edgeKey(link))!,[materials]);
  const linkWidth=useCallback((link:{source?:unknown;target?:unknown;kind?:string})=>(size.width<600?1.45:1)*(hovered&&(endpoint(link.source)===hovered||endpoint(link.target)===hovered)?1.6:link.kind==='hierarchy'?1.1:.8),[hovered,size.width<600]);
  const nodeHover=useCallback((node:PositionedNode|null)=>hoverNode(node?.id??null),[hoverNode]);
  const nodeClick=useCallback((node:PositionedNode)=>{if(!dragStart.current.moved)onOpen(node)},[onOpen]);
  return <div className="constellation-webgl" ref={holder} onPointerDown={event=>{dragStart.current={x:event.clientX,y:event.clientY,moved:false}}} onPointerMove={event=>{if(event.buttons&&Math.hypot(event.clientX-dragStart.current.x,event.clientY-dragStart.current.y)>5)dragStart.current.moved=true}}>
    {size.width>0&&<ForceGraph3D<PositionedNode> ref={graph} width={size.width} height={size.height} graphData={data}
      nodeThreeObject={objectFor} nodeLabel={noLabel} nodeVisibility={showNode} backgroundColor="rgba(0,0,0,0)"
      linkVisibility={showLink} linkMaterial={linkMaterial} linkWidth={linkWidth}
      linkCurvature={.18} linkCurveRotation={curveRotation} linkResolution={6}
      showNavInfo={false} enableNodeDrag={false} enableNavigationControls controlType="orbit" cooldownTicks={0}
      onNodeHover={nodeHover} onNodeClick={nodeClick} showPointerCursor
    />}
    <div className="spatial-labels">{labels.map(label=>{const node=points.get(label.id)!;return <Link key={node.id} className={node.kind==='main'?'domain-label':'node-label'} style={{left:label.x,top:label.y}} to={nodeLibraryUrl(node)} onClick={event=>{if(dragStart.current.moved&&event.detail>0)event.preventDefault()}} onMouseEnter={()=>hoverNode(node.id)} onMouseLeave={()=>hoverNode(null)} onFocus={()=>hoverNode(node.id)} onBlur={()=>hoverNode(null)} aria-label={`Open ${node.name} in library`}>{node.name}</Link>})}</div>
    <span className="atlas-sr-only">3D spatial network. Use the node list or 2D study map for complete keyboard navigation.</span>
  </div>;
}
