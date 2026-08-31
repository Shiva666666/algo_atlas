import {Component,useEffect,useId,useMemo,useRef,useState} from 'react';
import type {ReactNode,PointerEvent as ReactPointerEvent,MutableRefObject} from 'react';
import {Minus,Plus} from 'lucide-react';
import {Link,useNavigate} from 'react-router-dom';
import {nodeLibraryUrl} from './model';
import type {AtlasNode} from './model';
import type {AtlasGraphData} from '../types';
import {pinchAtlasAt,zoomAtlasAt} from './viewport';
import {fitStudyCamera,layout2D,studyEdge} from './layout2D';
import type {StudyNode} from './layout2D';

export class GraphErrorBoundary extends Component<{children:ReactNode;fallback:ReactNode},{failed:boolean}>{
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true}}
  render(){return this.state.failed?this.props.fallback:this.props.children}
}

export type FlatCamera={zoom:number;x:number;y:number};
const initialCamera:FlatCamera={zoom:1,x:28,y:168};
export function FlatConstellation({nodes,links,visible,hovered,onHover,highlighted,reset=0,cameraState}:{nodes:AtlasNode[];links:AtlasGraphData['links'];visible?:Set<string>;hovered:string|null;onHover:(id:string|null)=>void;highlighted:Set<string>;reset?:number;cameraState?:MutableRefObject<FlatCamera|null>}){
  const holder=useRef<HTMLDivElement>(null);
  const navigate=useNavigate();
  const clipId=useId();
  const [size,setSize]=useState({width:1200,height:750});
  const [camera,setCamera]=useState(cameraState?.current??initialCamera);
  const pointers=useRef(new Map<number,{x:number;y:number}>());
  const origin=useRef({x:0,y:0});const dragged=useRef(false);
  const layout=useMemo(()=>layout2D({nodes,links},size.width>=1250,size.width<600),[nodes,links,size.width>=1250,size.width<600]);
  const points=useMemo(()=>new Map(layout.nodes.map(node=>[node.id,node])),[layout]);
  const shown=visible??new Set(nodes.map(node=>node.id));
  const fit={centerX:0,centerY:0};
  const scale=camera.zoom,tx=camera.x,ty=camera.y;
  const lastReset=useRef(reset);
  useEffect(()=>{
    if(!holder.current)return;
    const observer=new ResizeObserver(([entry])=>setSize({width:Math.max(1,entry.contentRect.width),height:Math.max(1,entry.contentRect.height)}));
    observer.observe(holder.current);return()=>observer.disconnect();
  },[]);
  useEffect(()=>{if(reset!==lastReset.current){setCamera(fitStudyCamera(layout.nodes.filter(node=>!visible||visible.has(node.id)),size.width,size.height));lastReset.current=reset}},[reset,layout,size,visible]);
  useEffect(()=>{if(cameraState)cameraState.current=camera},[camera,cameraState]);
  const zoomAt=(factor:number,x:number,y:number)=>setCamera(previous=>zoomAtlasAt(previous,factor,x,y,fit.centerX,fit.centerY));
  useEffect(()=>{
    const element=holder.current;if(!element)return;
    const wheel=(event:WheelEvent)=>{
      event.preventDefault();const bounds=element.getBoundingClientRect();
      zoomAt(Math.exp(-event.deltaY*0.0015),event.clientX-bounds.left,event.clientY-bounds.top);
    };
    element.addEventListener('wheel',wheel,{passive:false});
    return()=>element.removeEventListener('wheel',wheel);
  },[fit.centerX,fit.centerY]);
  const move=(event:ReactPointerEvent<SVGSVGElement>)=>{
    const previous=pointers.current.get(event.pointerId);if(!previous)return;
    const next={x:event.clientX,y:event.clientY};
    if(pointers.current.size===2){
      const other=[...pointers.current.entries()].find(([id])=>id!==event.pointerId)![1];
      const rect=event.currentTarget.getBoundingClientRect();
      const local=(point:{x:number;y:number})=>({x:point.x-rect.left,y:point.y-rect.top});
      setCamera(camera=>pinchAtlasAt(camera,local(previous),local(next),local(other)));
      dragged.current=true;
    }else if(dragged.current||Math.hypot(next.x-origin.current.x,next.y-origin.current.y)>4){
      dragged.current=true;event.currentTarget.setPointerCapture(event.pointerId);
      setCamera(previousCamera=>({...previousCamera,x:previousCamera.x+next.x-previous.x,y:previousCamera.y+next.y-previous.y}));
      onHover(null);
    }
    pointers.current.set(event.pointerId,next);
  };
  const end=(event:ReactPointerEvent<SVGSVGElement>)=>{pointers.current.delete(event.pointerId);if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId)};
  const focusNode=(node:StudyNode)=>{onHover(node.id);setCamera(previous=>{
    const left=previous.x+node.x*previous.zoom,top=previous.y+node.y*previous.zoom;
    if(previous.zoom>=.8&&left>=8&&left+node.width*previous.zoom<=size.width-8&&top>=164&&top+node.height*previous.zoom<=size.height-122)return previous;
    return {zoom:1,x:Math.max(8,(size.width-node.width)/2)-node.x,y:Math.max(168,(size.height-node.height)/2)-node.y};
  })};
  return <div className="constellation-flat" ref={holder} role="region" aria-label="2D study network. Drag to pan, scroll or pinch to zoom. Arrow keys pan, plus and minus zoom, zero resets." tabIndex={0} onKeyDown={event=>{
    if(event.target!==event.currentTarget)return;
    if(event.key==='Tab'&&!event.shiftKey){const first=holder.current?.querySelector<SVGElement>('.study-node');if(first){event.preventDefault();first.focus()}return}
    const delta:Record<string,[number,number]>={ArrowLeft:[48,0],ArrowRight:[-48,0],ArrowUp:[0,48],ArrowDown:[0,-48]};
    if(delta[event.key]){event.preventDefault();const [x,y]=delta[event.key];setCamera(previous=>({...previous,x:previous.x+x,y:previous.y+y}))}
    else if(['+','=','-','0'].includes(event.key)){event.preventDefault();if(event.key==='0')setCamera(initialCamera);else zoomAt(event.key==='-'?0.8:1.25,fit.centerX,fit.centerY)}
  }}>
    <svg viewBox={`0 0 ${size.width} ${size.height}`} aria-label="Connected domains, techniques, patterns and problems"
      onPointerDown={event=>{if(event.button!==0)return;const point={x:event.clientX,y:event.clientY};if(!pointers.current.size){dragged.current=false;origin.current=point}pointers.current.set(event.pointerId,point)}}
      onPointerMove={move} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end}
      onPointerLeave={event=>{if(!event.buttons)pointers.current.clear()}}
      onClickCapture={event=>{if(dragged.current&&event.detail>0){event.preventDefault();event.stopPropagation()}}}>
      <defs><clipPath id={clipId}><rect x="0" y="164" width={size.width} height={Math.max(0,size.height-286)}/></clipPath></defs>
      <g clipPath={`url(#${clipId})`}><g transform={`translate(${tx} ${ty}) scale(${scale})`}>
        <g className="study-edges">{links.map((link,index)=>{const source=points.get(link.source),target=points.get(link.target);const active=hovered&&(link.source===hovered||link.target===hovered);if(!source||!target||!shown.has(source.id)||!shown.has(target.id)||link.kind==='pattern'&&!active)return null;return <path key={index} d={studyEdge(source,target,link.kind)} vectorEffect="non-scaling-stroke" className={`${link.kind} ${active?'active':''}`}/>})}</g>
        {layout.groups.filter(group=>shown.has(group.id)).map(group=><g key={group.id} className="study-group"><line x1={group.x} y1={group.y+group.headingHeight+28} x2={group.x+group.width} y2={group.y+group.headingHeight+28}/><text x={group.x+22} y={group.y+group.headingHeight+10}>{group.count} {group.count===1?'problem':'problems'}</text></g>)}
        {layout.nodes.filter(node=>shown.has(node.id)).map(node=><Link to={nodeLibraryUrl(node)} key={node.id} data-node-id={node.id} aria-label={`Open ${node.name} in library`} onMouseEnter={()=>{if(!pointers.current.size)onHover(node.id)}} onMouseLeave={()=>onHover(null)} onFocus={()=>focusNode(node)} onBlur={()=>onHover(null)} onKeyDown={event=>{
          if(event.key==='Enter'){event.preventDefault();navigate(nodeLibraryUrl(node));return}
          if(!['ArrowDown','ArrowRight','ArrowUp','ArrowLeft','Tab'].includes(event.key))return;
          const elements=[...holder.current?.querySelectorAll<SVGElement>('.study-node')??[]],index=elements.findIndex(el=>el.getAttribute('data-node-id')===node.id);
          const forward=event.key==='Tab'?!event.shiftKey:['ArrowDown','ArrowRight'].includes(event.key),next=elements[index+(forward?1:-1)];
          if(next){event.preventDefault();next.focus()}else if(event.key!=='Tab')event.preventDefault();
        }} className={`study-node ${node.kind} ${hovered===node.id?'active':''} ${hovered&&!highlighted.has(node.id)?'quiet':''}`} style={{color:node.color}}>
          <title>{`${node.name} — click to open in library`}</title>
          <rect className="study-node-surface" x={node.x} y={node.y} width={node.width} height={node.height} rx={6}/>
          <circle cx={node.x+8} cy={node.y+node.height/2} r={node.kind==='main'?5:3.5}/>
          <text x={node.x+22} y={node.y+node.height/2-(node.lines.length-1)*8.5+4}>{node.lines.map((line,i)=><tspan key={i} x={node.x+22} dy={i?17:0}>{line}</tspan>)}</text>
        </Link>)}
      </g></g>
    </svg>
    <div className="atlas-zoom-controls" aria-label="Map zoom"><button type="button" aria-label="Zoom out" onClick={()=>zoomAt(0.8,size.width/2,size.height/2)} disabled={camera.zoom<=0.0001}><Minus size={16}/></button><output aria-label="Zoom level">{Math.round(camera.zoom*1000)/10}%</output><button type="button" aria-label="Zoom in" onClick={()=>zoomAt(1.25,size.width/2,size.height/2)} disabled={camera.zoom>=8}><Plus size={16}/></button><button type="button" className="study-readable" onClick={()=>setCamera(initialCamera)}>Read labels</button></div>
  </div>;
}
