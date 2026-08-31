import type {Problem} from '../types';
import type {InsightModel,IntuitionFrameData,ParenthesesView,RuleFocus,VisualFrame,VisualizerAdapter} from './types';

type Input={n:number};
const referenceCode=`from typing import List

class Solution:
    def generateParenthesis(self, n: int) -> List[str]:
        result = []
        def backtrack(current, opened, closed):
            if len(current) == 2 * n:
                result.append(current)
                return
            if opened < n:
                backtrack(current + "(", opened + 1, closed)
            if closed < opened:
                backtrack(current + ")", opened, closed + 1)
        backtrack("", 0, 0)
        return result`;
const insights:InsightModel={state:'The partial string is always a valid prefix: closes never exceed opens.',base:'When the string reaches 2n characters it is a complete result.',choice:'Add an open while fewer than n opens exist; add a close only when it has an unmatched opener.',invariant:'Every recorded string is balanced and contains exactly n pairs.'};
const rules=(active:string):RuleFocus[]=>[{token:'len(current) == 2 * n',meaning:'record a complete result',active:active==='record'},{token:'opened < n',meaning:'open branch is available',active:active==='open'},{token:'closed < opened',meaning:'close branch preserves balance',active:active==='close'},{token:'backtrack',meaning:'return to the parent prefix',active:active==='return'}];
function parseInput(raw:string):Input{let value:unknown;try{value=JSON.parse(raw)}catch{throw new Error('Use {"n":3}.')}const rawN=typeof value==='number'?value:(value as {n?:unknown})?.n;const n=Number(rawN);if(!Number.isInteger(n)||n<0||n>5)throw new Error('n must be an integer from 0 to 5 for a readable trace.');return {n}}
function makeFrame(phase:string,title:string,message:string,view:ParenthesesView,active:string):VisualFrame{return {phase,title,message,kind:'intuition',codeFocus:active==='record'?['len(current) == 2 * n']:active==='open'?['opened < n']:active==='close'?['closed < opened']:['backtrack'],data:{variant:'parentheses',insights,rules:rules(active),parentheses:{...view,results:[...view.results]}} satisfies IntuitionFrameData}}
export function createParenthesesFrames(raw:unknown,_problem:Problem):VisualFrame[]{const value=raw as Input;const frames:VisualFrame[]=[];const results:string[]=[];const walk=(current:string,opened:number,closed:number)=>{if(current.length===2*value.n){results.push(current);frames.push(makeFrame('RECORD',`Record ${current||'ε'}`,'The prefix reached 2n characters, so it is a complete balanced result.',{n:value.n,partial:current,open:opened,close:closed,action:'record',results},'record'));return}if(opened<value.n){const next=current+'(';frames.push(makeFrame('CHOICE','Add an opening parenthesis',`opened=${opened} is below n, so extend the prefix to ${next}.`,{n:value.n,partial:next,open:opened+1,close:closed,action:'choose-open',results},'open'));walk(next,opened+1,closed);frames.push(makeFrame('RETURN','Return to the parent prefix','Undo the opening choice before trying a sibling branch.',{n:value.n,partial:current,open:opened,close:closed,action:'return',results},'return'))}if(closed<opened){const next=current+')';frames.push(makeFrame('CHOICE','Add a closing parenthesis',`closed=${closed} is below opened=${opened}, so balance remains valid.`,{n:value.n,partial:next,open:opened,close:closed+1,action:'choose-close',results},'close'));walk(next,opened,closed+1);frames.push(makeFrame('RETURN','Return to the parent prefix','Undo the closing choice and continue the depth-first search.',{n:value.n,partial:current,open:opened,close:closed,action:'return',results},'return'))}};frames.push(makeFrame('START',`Generate ${value.n} pair${value.n===1?'':'s'}`,'Choose balanced prefixes until each branch has exactly 2n characters.',{n:value.n,partial:'',open:0,close:0,action:'return',results},'return'));walk('',0,0);return frames}
export const generateParenthesesVisualizer:VisualizerAdapter={id:'generate-parentheses',name:'Balanced-prefix recursion',mode:'specialized',description:'Build balanced prefixes and record every complete parenthesis string.',inputLabel:'RECURSION PARAMETER · n',placeholder:'{"n":3}',presets:[{label:'Default · n = 3',input:'{"n":3}',source:'LeetCode'},{label:'Single pair',input:'{"n":1}',source:'Diagnostic'},{label:'Empty result',input:'{"n":0}',source:'Diagnostic'},{label:'Four pairs',input:'{"n":4}',source:'Diagnostic'}],parseInput,createFrames:createParenthesesFrames,referenceCode};
