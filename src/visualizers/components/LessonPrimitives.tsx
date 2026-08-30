import {motion,MotionConfig,useReducedMotion} from 'motion/react';
import {useEffect,useId,useLayoutEffect,useRef,useState} from 'react';
import type {ComponentProps,ReactNode} from 'react';

export function useLessonReducedMotion(){
  const systemReduced=useReducedMotion();
  const [localReduced,setLocalReduced]=useState(()=>localStorage.getItem('algo-atlas-reduced-motion')==='true');
  useEffect(()=>{
    const sync=()=>setLocalReduced(localStorage.getItem('algo-atlas-reduced-motion')==='true');
    window.addEventListener('storage',sync);
    window.addEventListener('focus',sync);
    return()=>{window.removeEventListener('storage',sync);window.removeEventListener('focus',sync)};
  },[]);
  return !!systemReduced||localReduced;
}

export function LessonMotion({children}:{children:ReactNode}){
  const reduced=useLessonReducedMotion();
  return <MotionConfig reducedMotion={reduced?'always':'user'} transition={{duration:reduced?0:0.16}}>{children}</MotionConfig>;
}

export function LessonButton(props:ComponentProps<typeof motion.button>){
  const reduced=useLessonReducedMotion();
  return <motion.button type="button" whileHover={reduced?undefined:{y:-1}} whileTap={reduced?undefined:{scale:0.98}} {...props}/>;
}

// Source-adapted from Bklit UI's MIT-licensed Legend / LegendItem / LegendMarker.
// Hover emphasizes the key only; it never hides algorithm state or filters data.
export function StateLegend({items}:{items:Array<{label:string;symbol:string;color:string}>}){
  const [hoveredIndex,setHoveredIndex]=useState<number|null>(null);
  return <ul className="state-legend" aria-label="Visual key" onMouseLeave={()=>setHoveredIndex(null)}>
    {items.map((item,index)=><li key={item.label} onMouseEnter={()=>setHoveredIndex(index)} style={{opacity:hoveredIndex===null||hoveredIndex===index?1:0.65}}>
      <span className="state-legend-marker" style={{color:item.color}} aria-hidden="true">{item.symbol}</span>{item.label}
    </li>)}
  </ul>;
}

// Source-adapted from Kokonut UI SmoothTab (MIT): measure the active tab and
// move its shared background. Native focus and arrow-key navigation are retained.
export function SmoothTabs({value,onChange,items,id}:{value:string;onChange:(value:string)=>void;items:Array<{id:string;label:string}>;id:string}){
  const fallbackId=useId();const tabId=id||fallbackId;
  const container=useRef<HTMLDivElement>(null);
  const buttons=useRef<Array<HTMLButtonElement|null>>([]);
  const [indicator,setIndicator]=useState({x:0,width:0});
  const reduced=useLessonReducedMotion();
  const selected=items.findIndex(item=>item.id===value);
  useLayoutEffect(()=>{
    const measure=()=>{
      const parent=container.current;const button=buttons.current[selected];
      if(parent&&button)setIndicator({x:button.offsetLeft,width:button.offsetWidth});
    };
    measure();const observer=new ResizeObserver(measure);
    if(container.current)observer.observe(container.current);
    return()=>observer.disconnect();
  },[selected]);
  return <div className="smooth-tabs" ref={container} role="tablist" aria-label="Explanation view">
    <motion.div className="smooth-tab-indicator" aria-hidden="true" initial={false} animate={indicator} transition={reduced?{duration:0}:{type:'spring',stiffness:400,damping:30}}/>
    {items.map((item,index)=><button type="button" key={item.id} ref={element=>{buttons.current[index]=element}} role="tab" id={`${tabId}-${item.id}`} aria-controls={`${tabId}-${item.id}-panel`} aria-selected={value===item.id} tabIndex={value===item.id?0:-1} onClick={()=>onChange(item.id)} onKeyDown={event=>{
      let next=index;
      if(event.key==='ArrowRight')next=(index+1)%items.length;
      else if(event.key==='ArrowLeft')next=(index+items.length-1)%items.length;
      else if(event.key==='Home')next=0;
      else if(event.key==='End')next=items.length-1;
      else return;
      event.preventDefault();onChange(items[next].id);buttons.current[next]?.focus();
    }}>{item.label}</button>)}
  </div>;
}
