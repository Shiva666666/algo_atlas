export type LabelCandidate={id:string;x:number;y:number;width:number};
export function placeSpatialLabels(candidates:LabelCandidate[],width:number,height:number){
  const occupied:Array<{x:number;y:number;width:number}>=[];
  const result:Array<{id:string;x:number;y:number}>=[];
  for(const candidate of candidates){
    for(const [dx,dy] of [[0,-38],[0,20],[candidate.width/2+20,-10],[-candidate.width/2-20,-10]]){
      const x=candidate.x+dx-candidate.width/2,y=candidate.y+dy;
      if(x<8||x+candidate.width>width-8||y<164||y+32>height-122)continue;
      if(occupied.some(box=>x<box.x+box.width+10&&x+candidate.width+10>box.x&&y<box.y+40&&y+40>box.y))continue;
      occupied.push({x,y,width:candidate.width});result.push({id:candidate.id,x:x+candidate.width/2,y});break;
    }
  }
  return result;
}
