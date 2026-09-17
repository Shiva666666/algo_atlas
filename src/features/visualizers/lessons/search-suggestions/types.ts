export interface TrieSuggestionsFrameData {
  products: string[];
  searchWord: string;
  nodes: TrieNodeView[];
  edges: TrieEdgeView[];
  currentPrefix: string;
  prefixIndex: number;
  traversalPath: string[];
  activeNode: string | null;
  activeCharacter: string | null;
  terminalProduct: string | null;
  suggestions: string[];
  resultLists: string[][];
  limit: 3;
  action:
    | 'insert'
    | 'ready'
    | 'walk'
    | 'missing'
    | 'collect'
    | 'suggestion'
    | 'prefix-complete'
    | 'complete';
}

export type TrieNodeState = 'idle' | 'active' | 'visited' | 'terminal' | 'missing';

export interface TrieNodeView {
  id: string;
  label: string;
  depth: number;
  parent: string | null;
  terminalProduct: string | null;
  state: TrieNodeState;
}

export interface TrieEdgeView {
  from: string;
  to: string;
  character: string;
  state: 'idle' | 'active' | 'visited';
}

export interface SearchSuggestionsInput {
  products: string[];
  searchWord: string;
}
export type TrieNode = {
  id: string;
  label: string;
  depth: number;
  parent: string | null;
  children: Map<string, TrieNode>;
  terminalProduct: string | null;
};
