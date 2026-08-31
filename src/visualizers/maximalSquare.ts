import type {Problem} from '../types';
import type {GridDpView,InsightModel,IntuitionFrameData,RuleFocus,VisualFrame,VisualizerAdapter} from './types';

type SquareInput={matrix:string[][]};
const referenceCode=`from typing import List

class Solution:
    def maximalSquare(self, matrix: List[List[str]]) -> int:
        m, n = len(matrix), len(matrix[0])
        dp = [list(map(int, row)) for row in matrix]
        res = max(max(dp[0]), max(dp[i][0] for i in range(m)))
        for i in range(1, m):
            for j in range(1, n):
                if dp[i][j]:
                    dp[i][j] = 1 + min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1])
                    res = max(res, dp[i][j])
        return res ** 2`;
const insights:InsightModel={state:'dp[i][j] is the largest all-1 square side whose bottom-right corner is (i, j).',base:'The first row and first column are copied directly because the recurrence has no complete set of neighbors there.',choice:'For an interior 1-cell, the limiting side is the minimum of its top, left, and diagonal neighbors.',invariant:'A zero cell stays zero; every computed 1-cell uses only already computed neighbors.'};
const rules=(active:string):RuleFocus[]=>[
  {token:'dp = [list(map(int, row)) for row in matrix]',meaning:'copy the input grid into numeric state',active:active==='input'},
  {token:'res = max(',meaning:'initialize the recurrence border',active:active==='border'},
  {token:'if dp[i][j]:',meaning:'zeros cannot end a square',active:active==='zero'},
  {token:'dp[i][j] = 1 + min(',meaning:'choose the limiting neighbor',active:active==='cell'},
  {token:'res = max(res, dp[i][j])',meaning:'track the largest side',active:active==='result'},
];
function parseInput(raw:string):SquareInput{let value:unknown;try{value=JSON.parse(raw)}catch{throw new Error('Use {"matrix":[["1","0"],["1","1"]]}.')}const matrix=Array.isArray(value)?value:(value as {matrix?:unknown})?.matrix;if(!Array.isArray(matrix)||!matrix.length||!matrix.every(row=>Array.isArray(row)&&row.length===matrix[0].length&&row.every(cell=>cell==='0'||cell==='1')))throw new Error('matrix must be a non-empty rectangular grid of "0" and "1" strings.');if(matrix.length>8||matrix[0].length>8)throw new Error('Use at most an 8 × 8 grid for a readable trace.');return {matrix:matrix.map(row=>[...(row as string[])])}}
const snapshot=(grid:number[][],dp:Array<Array<number|null>>,active:[number,number]|null,choices:Array<{row:number;column:number;value:number}>,chosen:[number,number]|null):GridDpView=>({grid:grid.map(row=>[...row]),dp:dp.map(row=>[...row]),active,choices:choices.map(choice=>({...choice})),chosen});
function make(phase:string,title:string,message:string,view:GridDpView,active:string):VisualFrame{return {phase,title,message,kind:'intuition',codeFocus:rules(active).filter(rule=>rule.active).map(rule=>rule.token),data:{variant:'grid-dp',insights,rules:rules(active),gridDp:view} satisfies IntuitionFrameData}}
function createFrames(value:unknown,_problem:Problem):VisualFrame[]{const input=value as SquareInput;const grid=input.matrix.map(row=>row.map(Number));const m=grid.length,n=grid[0].length;const dp=grid.map(row=>row.map(cell=>cell));let best=0;const frames:VisualFrame[]=[];frames.push(make('INPUT','Read the binary matrix','Each cell is a possible bottom-right corner; no square has been computed yet.',snapshot(grid,dp,null,[],null),'input'));
  for(let j=0;j<n;j++){best=Math.max(best,dp[0][j]);frames.push(make('BORDER',`Initialize first-row cell (0, ${j})`,`The border value is copied as side ${dp[0][j]}.`,snapshot(grid,dp,[0,j],[],[0,j]),'border'))}
  for(let i=1;i<m;i++){best=Math.max(best,dp[i][0]);frames.push(make('BORDER',`Initialize first-column cell (${i}, 0)`,`The border value is copied as side ${dp[i][0]}.`,snapshot(grid,dp,[i,0],[],[i,0]),'border'))}
  for(let i=1;i<m;i++)for(let j=1;j<n;j++){const choices=[{row:i-1,column:j,value:dp[i-1][j]},{row:i,column:j-1,value:dp[i][j-1]},{row:i-1,column:j-1,value:dp[i-1][j-1]}];if(grid[i][j]===0){frames.push(make('CELL',`Cell (${i}, ${j}) is zero`,'A zero cannot be the bottom-right corner of an all-1 square, so its side remains 0.',snapshot(grid,dp,[i,j],choices,null),'zero'));continue}const side=1+Math.min(...choices.map(choice=>choice.value));dp[i][j]=side;best=Math.max(best,side);frames.push(make('CELL',`Compute cell (${i}, ${j})`,`1 + min(${choices.map(choice=>choice.value).join(', ')}) = ${side}; the highlighted square ends here.`,snapshot(grid,dp,[i,j],choices,[i,j]),'cell'))}
  const area=best*best;frames.push(make('COMPLETE','Return the maximum square area',`The largest side is ${best}, so the returned area is ${best}² = ${area}.`,snapshot(grid,dp,null,[],null),'result'));return frames}
export const maximalSquareVisualizer:VisualizerAdapter={id:'maximal-square',name:'Bottom-right corner DP',mode:'specialized',description:'Trace border initialization and the three-neighbor recurrence that grows each all-1 square.',inputLabel:'BINARY MATRIX · matrix',placeholder:'{"matrix":[["1","0","1"],["1","1","1"],["1","1","1"]]}',referenceCode,presets:[{label:'Default · area 4',input:'{"matrix":[["1","0","1"],["1","1","1"],["1","1","1"]]}',source:'LeetCode'},{label:'All zeros',input:'{"matrix":[["0","0"],["0","0"]]}',source:'Diagnostic'},{label:'Single cell',input:'{"matrix":[["1"]]}',source:'Diagnostic'},{label:'Rectangular grid',input:'{"matrix":[["1","1","1","1"],["1","1","1","1"]]}',source:'Diagnostic'}],parseInput,createFrames};
