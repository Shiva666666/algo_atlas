import type {AtlasGraphData} from '../src/types';
// Synthetic only: never imported by the application or written to local records.
export function makeAtlasFixture(count=240):AtlasGraphData{
  const nodes:AtlasGraphData['nodes']=[],links:AtlasGraphData['links']=[];
  const colors=['#28dce5','#ac8aff','#fa399f','#7959ff','#49afff','#4ed4c2','#ffb24a','#67e1a4'];
  const names=['Arrays & Strings','Backtracking & Combinatorics','Dynamic Programming','Graphs & Networks','Math & Bitwise','Linear Structures','Search & Ordering','Trees & Ordered Structures'];
  for(let d=0;d<8;d++){
    nodes.push({id:`domain-${d}`,name:names[d],kind:'main',color:colors[d],value:1});
    for(let s=0;s<3;s++){nodes.push({id:`technique-${d}-${s}`,name:`Study technique ${s+1}`,kind:'sub',color:colors[d],value:1});links.push({source:`domain-${d}`,target:`technique-${d}-${s}`,kind:'hierarchy'})}
  }
  for(let p=0;p<count;p++){
    const d=p%8,s=Math.floor(p/8)%3;
    nodes.push({id:`problem-${p}`,name:`Practice problem ${p+1}: compare and connect states`,kind:'problem',color:colors[d],value:1,status:p%2?'Resolved':'Open'});
    links.push({source:`technique-${d}-${s}`,target:`problem-${p}`,kind:'primary'});
  }
  for(let t=0;t<6;t++){
    nodes.push({id:`pattern-${t}`,name:`Shared pattern ${t+1}`,kind:'pattern',color:'#93a8be',value:1});
    for(let p=t;p<count;p+=32)links.push({source:`pattern-${t}`,target:`problem-${p}`,kind:'pattern'});
  }
  return {nodes,links,aggregated:false};
}
