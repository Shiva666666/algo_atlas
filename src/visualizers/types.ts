import type {Problem} from '../types';

export interface VisualPreset {
  label:string;
  input:string;
  source:'LeetCode'|'Diagnostic'|'Starter';
}

export interface VisualFrame {
  phase:string;
  title:string;
  message:string;
  kind:'palindrome-cuts'|'generic';
  data:unknown;
}

export interface PalindromeFrameData {
  s:string;
  palindrome:Array<Array<boolean|null>>;
  cuts:Array<number|null>;
  activeStart:number|null;
  activeEnd:number|null;
  highlightStart:number|null;
  highlightEnd:number|null;
  accepted:boolean|null;
  candidate:number|null;
}

export interface GenericFrameData {
  value:unknown;
  activePath:Array<string|number>;
  transitionIndex:number;
}

export interface VisualizerAdapter {
  id:string;
  name:string;
  mode:'specialized'|'generic';
  description:string;
  inputLabel:string;
  placeholder:string;
  presets:VisualPreset[];
  parseInput:(raw:string)=>unknown;
  createFrames:(input:unknown,problem:Problem)=>VisualFrame[];
}
