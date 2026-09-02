import type {Problem} from '../types';
import {weightedWordMappingCode} from './practiceCode';
import type {VisualFrame,VisualizerAdapter} from './types';

export interface WeightedWordMappingInput {words:string[];weights:number[]}

export type WeightedWordMappingAction='start'|'word-start'|'lookup'|'add'|'store-total'|'modulo'|'map'|'append'|'complete';

export interface WeightedWordFrameData {
  words:string[];
  weights:number[];
  wordIndex:number|null;
  word:string|null;
  charIndex:number|null;
  character:string|null;
  alphabetIndex:number|null;
  selectedWeight:number|null;
  runningTotal:number;
  previousTotal:number|null;
  newTotal:number|null;
  totals:number[];
  modulo:number|null;
  mappedCharacter:string|null;
  output:string;
  action:WeightedWordMappingAction;
}

const DEFAULT_WORDS=['abcd','def','xyz'];
const MAX_WORDS=8;
const MAX_WORD_LENGTH=12;
const MAX_TOTAL_CHARACTERS=64;

export function parseWeightedWordMappingInput(raw:string):WeightedWordMappingInput{
  let value:unknown;
  try{value=JSON.parse(raw)}catch{throw new Error('Use {"words":["abcd"],"weights":[...]}.')}
  const object=value as {words?:unknown;weights?:unknown}|null;
  if(!object||typeof object!=='object'||!Array.isArray(object.words)||!Array.isArray(object.weights))throw new Error('Input must contain words and weights arrays.');
  if(object.words.length<1||object.words.length>MAX_WORDS)throw new Error(`Use 1–${MAX_WORDS} lowercase words for a readable trace.`);
  const words=object.words;
  if(!words.every(word=>typeof word==='string'&&/^[a-z]+$/.test(word)&&word.length<=MAX_WORD_LENGTH))throw new Error(`Words must be lowercase a–z strings of at most ${MAX_WORD_LENGTH} characters.`);
  if(words.some(word=>(word as string).length===0))throw new Error('Words cannot be empty.');
  if(words.join('').length>MAX_TOTAL_CHARACTERS)throw new Error(`Keep total word characters at or below ${MAX_TOTAL_CHARACTERS}.`);
  if(object.weights.length!==26||!object.weights.every(weight=>typeof weight==='number'&&Number.isSafeInteger(weight)&&weight>=0))throw new Error('weights must contain exactly 26 non-negative safe integers.');
  const weights=[...(object.weights as number[])];
  for(const word of words as string[]){
    let total=0;
    for(const character of word){
      total+=weights[character.charCodeAt(0)-97];
      if(!Number.isSafeInteger(total))throw new Error('A word total exceeds the safe integer range.');
    }
  }
  return {words:[...(words as string[])],weights};
}

function snapshot(input:WeightedWordMappingInput, state:Omit<WeightedWordFrameData,'words'|'weights'>):WeightedWordFrameData{
  return {...state,words:[...input.words],weights:[...input.weights],totals:[...state.totals]};
}

export function createWeightedWordMappingFrames(value:unknown,_problem?:Problem):VisualFrame[]{
  const input=parseWeightedWordMappingInput(JSON.stringify(value));
  const frames:VisualFrame[]=[];
  let wordIndex:number|null=null;
  let word:string|null=null;
  let charIndex:number|null=null;
  let character:string|null=null;
  let alphabetIndex:number|null=null;
  let selectedWeight:number|null=null;
  let runningTotal=0;
  let previousTotal:number|null=null;
  let newTotal:number|null=null;
  let totals:number[]=[];
  let modulo:number|null=null;
  let mappedCharacter:string|null=null;
  let output='';
  const emit=(action:WeightedWordMappingAction,phase:string,title:string,message:string,codeFocus:string[])=>{
    const data=snapshot(input,{wordIndex,word,charIndex,character,alphabetIndex,selectedWeight,runningTotal,previousTotal,newTotal,totals,modulo,mappedCharacter,output,action});
    frames.push({kind:'weighted-word-mapping',phase,title,message,codeFocus,data});
  };

  emit('start','INPUT','Load the word and weight tables','Each word is independent: characters contribute from the fixed a–z weight table, then one letter is emitted.',['for word in words:','weight = 0']);
  for(let currentWord=0;currentWord<input.words.length;currentWord+=1){
    wordIndex=currentWord;word=input.words[currentWord];charIndex=null;character=null;alphabetIndex=null;selectedWeight=null;runningTotal=0;previousTotal=null;newTotal=null;modulo=null;mappedCharacter=null;
    emit('word-start','WORD',`Start “${word}”`,`Reset the running total before scanning its ${word.length} characters.`,['for word in words:','weight = 0']);
    for(let currentChar=0;currentChar<word.length;currentChar+=1){
      charIndex=currentChar;character=word[currentChar];alphabetIndex=character.charCodeAt(0)-97;selectedWeight=input.weights[alphabetIndex];previousTotal=runningTotal;newTotal=null;
      emit('lookup','LOOKUP',`Read “${character}” → weight ${selectedWeight}`,`ord(char) − ord('a') = ${alphabetIndex}; the table supplies ${selectedWeight}.`,['for char in word:','weight += weights[ord(char) - ord(\'a\')]']);
      const before=runningTotal;runningTotal+=selectedWeight;newTotal=runningTotal;
      emit('add','ACCUMULATE',`${before} + ${selectedWeight} = ${runningTotal}`,`The running word total now includes character ${currentChar+1} of ${word.length}.`,['weight += weights[ord(char) - ord(\'a\')]']);
    }
    totals=[...totals,runningTotal];charIndex=null;character=null;alphabetIndex=null;selectedWeight=null;previousTotal=null;newTotal=null;
    emit('store-total','WORD TOTAL',`Store total ${runningTotal}`,`Keep this word’s total in word_idx before decoding it.`,['word_idx.append(weight)']);
    modulo=runningTotal%26;mappedCharacter=null;
    emit('modulo','MODULO',`${runningTotal} % 26 = ${modulo}`,`Only the remainder selects a position in the reverse alphabet.`,['x = idx % 26']);
    mappedCharacter=String.fromCharCode('z'.charCodeAt(0)-modulo);
    emit('map','REVERSE MAP',`${modulo} → “${mappedCharacter}”`,`Subtract the remainder from z: ord('z') − ${modulo}.`,['real = ord(\'z\') - x']);
    output+=mappedCharacter;
    emit('append','OUTPUT',`Append “${mappedCharacter}”`,`The output prefix for completed words is “${output}”.`,['res += chr(real)']);
  }
  wordIndex=null;word=null;charIndex=null;character=null;alphabetIndex=null;selectedWeight=null;previousTotal=null;newTotal=null;modulo=null;mappedCharacter=null;
  emit('complete','COMPLETE',`Return “${output}”`,`One mapped character was emitted for each input word.`,['return res']);
  return frames;
}

const DEFAULT_WEIGHTS=[5,3,12,14,1,2,3,2,10,6,6,9,7,8,7,10,8,9,6,9,9,8,3,7,7,2];
const UNIT_WEIGHTS=Array.from({length:26},()=>1);

export const weightedWordMappingVisualizer:VisualizerAdapter={
  id:'weighted-word-mapping',
  name:'Weighted words → reverse alphabet',
  mode:'specialized',
  description:'Accumulate each word through the a–z weight table, reduce modulo 26, and decode against the reverse alphabet.',
  inputLabel:'WORD MAPPING PARAMETERS · words and weights',
  inputGuide:`Use lowercase words and exactly 26 non-negative safe-integer weights. The readable trace accepts ${MAX_WORDS} words, ${MAX_WORD_LENGTH} characters per word, and ${MAX_TOTAL_CHARACTERS} total characters.`,
  placeholder:`{"words":${JSON.stringify(DEFAULT_WORDS)},"weights":${JSON.stringify(DEFAULT_WEIGHTS)}}`,
  referenceCode:weightedWordMappingCode,
  presets:[
    {label:'LeetCode example · rij',input:`{"words":${JSON.stringify(DEFAULT_WORDS)},"weights":${JSON.stringify(DEFAULT_WEIGHTS)}}`,source:'LeetCode'},
    {label:'Uniform weights · yyy',input:`{"words":["a","b","c"],"weights":${JSON.stringify(UNIT_WEIGHTS)}}`,source:'LeetCode'},
    {label:'Remainder zero · z',input:`{"words":["a"],"weights":[26,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]}`,source:'Diagnostic'},
    {label:'Remainder 25 · a',input:`{"words":["a"],"weights":[25,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]}`,source:'Diagnostic'},
    {label:'Repeated letters',input:`{"words":["aaaa","zz"],"weights":[2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3]}`,source:'Diagnostic'}
  ],
  parseInput:parseWeightedWordMappingInput,
  createFrames:createWeightedWordMappingFrames,
  presentation:'diagram-first',
  inputEditor:'weighted-word-grid',
};
