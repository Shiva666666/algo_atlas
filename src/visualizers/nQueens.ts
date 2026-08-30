import type {VisualFrame,VisualizerAdapter} from './types';
import {nQueensCode} from './practiceCode';

export interface NQueensData {
  n:number; row:number; board:number[]; columns:number[]; differences:number[]; sums:number[];
  candidate:{row:number;column:number;conflicts:number[]}|null;
  solutions:number[][]; action:'start'|'call'|'check'|'reject'|'place'|'undo'|'solution'|'return'|'complete';
}
function parseInput(raw:string){
  let value:unknown;try{value=JSON.parse(raw)}catch{throw new Error('Use {"n":4}.')}
  const n=(value as {n?:unknown}|null)?.n;
  if(typeof n!=='number'||!Number.isInteger(n)||n<1||n>5)throw new Error('Use n from 1 to 5. Every branch is shown; larger searches are not truncated.');
  return {n};
}
export function createNQueensFrames(value:unknown):VisualFrame[]{
  const {n}=parseInput(JSON.stringify(value));
  const board:number[]=[];const columns=new Set<number>();const differences=new Set<number>();const sums=new Set<number>();
  const solutions:number[][]=[];const frames:VisualFrame[]=[];
  function emit(action:NQueensData['action'],row:number,title:string,message:string,codeFocus:string[],candidate:NQueensData['candidate']=null){
    frames.push({kind:'n-queens',phase:action,title,message,codeFocus,data:{n,row,board:[...board],columns:[...columns].sort((a,b)=>a-b),differences:[...differences].sort((a,b)=>a-b),sums:[...sums].sort((a,b)=>a-b),candidate:candidate?{...candidate,conflicts:[...candidate.conflicts]}:null,solutions:solutions.map(solution=>[...solution]),action} satisfies NQueensData});
  }
  function backtrack(row:number){
    emit('call',row,row===n?'Every row has a queen':`Find a safe square in row ${row}`,row===n?'The base condition is true. Copy the board before undoing any choices.':`Earlier rows stay fixed in this call. Test columns 0 through ${n-1}.`,['if i == n:']);
    if(row===n){solutions.push([...board]);emit('solution',row,`Save solution ${solutions.length}`,'res receives a copy. Later undo steps do not change this saved solution.',['res.append(sol[:])']);return}
    for(let column=0;column<n;column++){
      const conflicts=board.flatMap((queenColumn,queenRow)=>queenColumn===column||queenRow-queenColumn===row-column||queenRow+queenColumn===row+column?[queenRow]:[]);
      const candidate={row,column,conflicts};
      emit('check',row,`Test square (${row}, ${column})`,`Column ${column}; row − column = ${row-column}; row + column = ${row+column}. The candidate is not placed yet.`,['d1 = i - k','d2 = i + k','if k in col or d1 in diag1 or d2 in diag2:'],candidate);
      if(conflicts.length){emit('reject',row,'That square is attacked',`A queen in row ${conflicts.join(' or ')} shares this column or diagonal. Skip it; nothing changes.`,['continue'],candidate);continue}
      board.push(column);columns.add(column);differences.add(row-column);sums.add(row+column);
      emit('place',row,`Place Q at (${row}, ${column})`,'Append the row and register its column and both diagonals. Then explore the next row.',['row_str =','sol.append(row_str)','col.add(k)','diag1.add(d1)','diag2.add(d2)'],candidate);
      backtrack(row+1);
      columns.delete(column);differences.delete(row-column);sums.delete(row+column);board.pop();
      emit('undo',row,`Undo Q at (${row}, ${column})`,'The child call has finished. Remove all three attack markers and pop the row; now try the next column.',['col.remove(k)','diag1.remove(d1)','diag2.remove(d2)','sol.pop()']);
    }
    emit('return',row,`Finished row ${row}`,'Every column in this call was tested. Return control to the previous row.',['for k in range(n):']);
  }
  emit('start',0,'Start with an empty board','Place one queen per row. A column or diagonal may contain only one queen.',['res = []','sol = []','col, diag1, diag2 =']);
  backtrack(0);
  emit('complete',0,`${solutions.length} distinct solution${solutions.length===1?'':'s'}`,'The search is complete. The working board is empty after backtracking; the saved solutions are shown separately.',['return res']);
  return frames;
}
export const nQueensVisualizer:VisualizerAdapter={id:'lintcode-33-n-queens',name:'One queen per row',mode:'specialized',description:'Test a square, check its attacks, place a queen, and undo the choice after recursion returns.',inputLabel:'Board size',inputGuide:'Use {"n":4}; n must be 1–5. The complete search is shown.',placeholder:'{"n":4}',referenceCode:nQueensCode,presets:[{label:'Two solutions · n = 4',input:'{"n":4}',source:'LintCode'},{label:'One square',input:'{"n":1}',source:'Diagnostic'},{label:'No solution · n = 2',input:'{"n":2}',source:'Diagnostic'},{label:'No solution · n = 3',input:'{"n":3}',source:'Diagnostic'},{label:'Ten solutions · n = 5',input:'{"n":5}',source:'Diagnostic'}],parseInput,createFrames:createNQueensFrames};
