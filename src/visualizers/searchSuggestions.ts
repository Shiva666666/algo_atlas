import type {Problem} from '../types';
import {searchSuggestionsCode} from './practiceCode';
import type {TrieEdgeView,TrieNodeView,TrieSuggestionsFrameData,VisualFrame,VisualizerAdapter} from './types';

export interface SearchSuggestionsInput {products:string[];searchWord:string}

type TrieNode={id:string;label:string;depth:number;parent:string|null;children:Map<string,TrieNode>;terminalProduct:string|null};

const WHY_I_MISSED_IT=[
  'I found the node for each prefix, but I had not separated prefix lookup from collecting products below that node.',
  'A terminal marker belongs to the current node, so it must be checked before descending into child edges.',
  'Suggestions must follow sorted child edges and stop after three products; collecting everything and sorting later obscures that invariant.',
  'Each typed prefix needs a fresh result list, and the list must be copied into the outer result.',
  'In Python, list.sort() mutates the list and returns None, so it cannot be returned as the sorted suggestions.'
];

function parseInput(raw:string):SearchSuggestionsInput{
  let value:unknown;
  try{value=JSON.parse(raw)}catch{throw new Error('Use {"products":["mobile","mouse"],"searchWord":"mouse"}.')}
  const object=value as {products?:unknown;searchWord?:unknown}|null;
  if(!object||!Array.isArray(object.products)||typeof object.searchWord!=='string')throw new Error('products must be an array and searchWord must be a string.');
  const products=object.products;
  if(products.length===0||products.length>8)throw new Error('Use 1–8 unique products for a readable trie trace.');
  if(new Set(products).size!==products.length||!products.every(item=>typeof item==='string'&&/^[a-z]+$/.test(item)&&item.length<=16))throw new Error('Products must be unique lowercase words of at most 16 characters.');
  if(products.join('').length>96)throw new Error('Keep the total product characters at or below 96.');
  if(!/^[a-z]{0,16}$/.test(object.searchWord))throw new Error('searchWord must contain at most 16 lowercase letters.');
  return {products:[...products] as string[],searchWord:object.searchWord};
}

function cloneNodes(root:TrieNode,activePath:Set<string>,visitedPath:Set<string>,missingNode:string|null):TrieNodeView[]{
  const result:TrieNodeView[]=[];
  const visit=(node:TrieNode)=>{
    const state:TrieNodeView['state']=node.id===missingNode?'missing':activePath.has(node.id)?'active':visitedPath.has(node.id)?'visited':node.terminalProduct?'terminal':'idle';
    result.push({id:node.id,label:node.label,depth:node.depth,parent:node.parent,terminalProduct:node.terminalProduct,state});
    for(const child of node.children.values())visit(child);
  };
  visit(root);
  return result;
}

function cloneEdges(root:TrieNode,activePath:Set<string>,visitedPath:Set<string>):TrieEdgeView[]{
  const result:TrieEdgeView[]=[];
  const visit=(node:TrieNode)=>{for(const [character,child] of node.children){const state:TrieEdgeView['state']=activePath.has(child.id)?'active':visitedPath.has(child.id)?'visited':'idle';result.push({from:node.id,to:child.id,character,state});visit(child)}};
  visit(root);
  return result;
}

export function createSearchSuggestionsFrames(value:unknown,_problem?:Problem):VisualFrame[]{
  const input=value as SearchSuggestionsInput;
  const root:TrieNode={id:'root',label:'∅',depth:0,parent:null,children:new Map(),terminalProduct:null};
  const frames:VisualFrame[]=[];
  let currentPrefix='';
  let prefixIndex=-1;
  let traversalPath:string[]=[];
  let activeNode:string|null='root';
  let activeCharacter:string|null=null;
  let terminalProduct:string|null=null;
  let suggestions:string[]=[];
  const resultLists:string[][]=[];
  const emit=(action:TrieSuggestionsFrameData['action'],phase:string,title:string,message:string,focus:string[],missingNode:string|null=null)=>{
    const activeSet=new Set(traversalPath);
    if(activeNode)activeSet.add(activeNode);
    const visitedSet=new Set(traversalPath);
    const data:TrieSuggestionsFrameData={products:[...input.products],searchWord:input.searchWord,nodes:cloneNodes(root,activeSet,visitedSet,missingNode),edges:cloneEdges(root,activeSet,visitedSet),currentPrefix,prefixIndex,traversalPath:[...traversalPath],activeNode,activeCharacter,terminalProduct,suggestions:[...suggestions],resultLists:resultLists.map(result=>[...result]),limit:3,action};
    frames.push({phase,title,message,kind:'trie-suggestions',codeFocus:focus,data});
  };

  emit('ready','INPUT','Build a prefix index before any search begins.','Each product will share trie nodes with products that have the same prefix.',['trie = {}','res = []']);
  for(const product of input.products){
    let node=root;
    for(const character of product){
      let child=node.children.get(character);
      if(!child){child={id:`${node.id}/${character}`,label:character,depth:node.depth+1,parent:node.id,children:new Map(),terminalProduct:null};node.children.set(character,child)}
      node=child;activeNode=node.id;activeCharacter=character;traversalPath=[node.id];currentPrefix=product.slice(0,node.depth);terminalProduct=null;
      emit('insert','INSERT',`Insert “${product}”: add or reuse “${currentPrefix}”`,`The character ${character} extends one shared prefix node.`,['for product in products:','for char in product:','if char not in node:','node[char] = {}']);
    }
    node.terminalProduct=product;activeNode=node.id;activeCharacter=null;traversalPath=[node.id];terminalProduct=product;
    emit('insert','TERMINAL',`Mark “${product}” as complete`,'The terminal marker stores the whole product at the node for its final character.',['node["$"] = product']);
  }
  currentPrefix='';prefixIndex=-1;traversalPath=[];activeNode='root';activeCharacter=null;terminalProduct=null;
  emit('ready','TRIE READY','The complete trie is ready for prefix queries.','A terminal word is considered before its descendants, while child edges are visited alphabetically.',['def collect(node, temp):','for char in sorted(node):']);

  const findNode=(prefix:string):TrieNode|null=>{let node=root;for(const character of prefix){const child=node.children.get(character);if(!child)return null;node=child}return node};
  for(let end=1;end<=input.searchWord.length;end+=1){
    currentPrefix=input.searchWord.slice(0,end);prefixIndex=end-1;traversalPath=['root'];activeNode='root';activeCharacter=null;terminalProduct=null;suggestions=[];
    let node=root;let missing=false;
    for(const character of currentPrefix){const child=node.children.get(character);activeCharacter=character;activeNode=child?.id??null;traversalPath=child?[...traversalPath,child.id]:[...traversalPath];
      if(!child){missing=true;emit('missing','PREFIX MISSING',`No trie edge for “${currentPrefix}”`,`The result for this typed prefix is an empty list; later prefixes cannot recover from a missing branch.`,['if char not in node:','return []'],'missing');break}
      emit('walk','WALK PREFIX',`Follow “${character}” to prefix “${currentPrefix.slice(0,traversalPath.length-1)}”`,'Lookup only finds the node; suggestions still need a DFS beneath it.',['for char in prefix:','node = node[char]']);node=child;
    }
    if(missing){resultLists.push([]);continue}
    const collect=(cursor:TrieNode)=>{
      if(suggestions.length===3)return;
      traversalPath=traversalPath.slice(0,cursor.depth+1);activeNode=cursor.id;activeCharacter=null;terminalProduct=cursor.terminalProduct;
      emit('collect','COLLECT',`Inspect node “${cursor.label}” for prefix “${currentPrefix}”`,'Check the terminal marker before exploring sorted child edges.',['def collect(node, temp):','if len(temp) == 3:','if "$" in node:']);
      if(suggestions.length===3)return;
      if(cursor.terminalProduct){suggestions.push(cursor.terminalProduct);terminalProduct=cursor.terminalProduct;emit('suggestion','SUGGESTION',`Keep “${cursor.terminalProduct}” (${suggestions.length}/3)`,'A complete product at the current node is lexicographically first before its descendants.',['temp.append(node["$"])']);}
      for(const character of [...cursor.children.keys()].sort()){
        if(suggestions.length===3)break;
        const child=cursor.children.get(character)!;traversalPath=[...traversalPath,child.id];activeNode=child.id;activeCharacter=character;terminalProduct=null;
        emit('collect','DESCEND',`Explore “${character}” beneath “${currentPrefix}”`,'Sorted child edges make the first three terminal products the lexicographically smallest suggestions.',['for char in sorted(node):','if char != "$":','collect(node[char], temp)']);
        collect(child);
        traversalPath=traversalPath.slice(0,cursor.depth+1);
      }
    };
    collect(node);
    resultLists.push([...suggestions]);
    emit('prefix-complete','PREFIX COMPLETE',`Suggestions for “${currentPrefix}” are [${suggestions.join(', ')}]`,`Reset the temporary list for the next typed prefix; the outer result receives a copy.`,['temp = []','collect(node, temp)','res.append(dfs(searchWord[:end]))']);
  }
  currentPrefix=input.searchWord;prefixIndex=input.searchWord.length-1;activeNode=null;activeCharacter=null;terminalProduct=null;traversalPath=[];
  emit('complete','COMPLETE','All typed prefixes have independent suggestion lists.',`Return ${resultLists.length} lists; every list contains at most three products.`,['return res']);
  return frames;
}

export const searchSuggestionsVisualizer:VisualizerAdapter={id:'search-suggestions-system',name:'Trie prefix → three suggestions',mode:'specialized',description:'Build a shared trie, walk each typed prefix, then collect terminal products in sorted depth-first order.',inputLabel:'TRIE PARAMETERS · products, searchWord',inputGuide:'Use lowercase unique products. The teaching trace accepts up to 8 products, 16 characters per product, and 96 total product characters.',placeholder:'{"products":["mobile","mouse","moneypot","monitor","mousepad"],"searchWord":"mouse"}',referenceCode:searchSuggestionsCode,mistakeExplanation:WHY_I_MISSED_IT,presets:[{label:'Mouse suggestions',input:'{"products":["mobile","mouse","moneypot","monitor","mousepad"],"searchWord":"mouse"}',source:'LeetCode'},{label:'The prefix is also a product',input:'{"products":["app","apple","application","apt"],"searchWord":"app"}',source:'Diagnostic'},{label:'Missing branch',input:'{"products":["bags","baggage","banner"],"searchWord":"xyz"}',source:'Diagnostic'},{label:'Exactly three results',input:'{"products":["car","carbon","card","care","cargo"],"searchWord":"car"}',source:'Diagnostic'}],parseInput,createFrames:createSearchSuggestionsFrames,presentation:'diagram-first'};
