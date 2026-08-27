import type {Analytics,AtlasGraphData,Problem,TaxonomyKind,TaxonomyNode,TaxonomyResponse} from './types';

const updated='2026-08-28T00:00:00Z';
const main=(slug:string,name:string,color:string):TaxonomyNode=>({id:slug,name,slug,kind:'main',parent_id:null,aliases:[],color,protected:true,sort_order:0});
const sub=(slug:string,name:string,parent:TaxonomyNode):TaxonomyNode=>({id:slug,name,slug,kind:'sub',parent_id:parent.id,aliases:[],color:parent.color,protected:true,sort_order:0});
const pattern=(slug:string,name:string):TaxonomyNode=>({id:slug,name,slug,kind:'pattern',parent_id:null,aliases:[],color:null,protected:true,sort_order:0});

const families={
  graphs:main('graphs-networks','Graphs & Networks','#7c5cff'),
  dynamic:main('dynamic-programming','Dynamic Programming','#ff3cac'),
  search:main('search-ordering','Search & Ordering','#ffb547'),
  linear:main('linear-structures','Linear Structures','#55d6be'),
  backtracking:main('backtracking-combinatorics','Backtracking & Combinatorics','#a98bff'),
  trees:main('trees-ordered','Trees & Ordered Structures','#74f2a7'),
};

const subtags={
  treeDp:sub('tree-dp','Tree DP',families.dynamic),bitmask:sub('bitmask-dp','Bitmask DP',families.dynamic),oneDp:sub('1d-dp','1D DP',families.dynamic),gridDp:sub('2d-and-grid-dp','2D & Grid DP',families.dynamic),
  binary:sub('binary-search','Binary Search',families.search),graph:sub('graph-traversal','Graph Traversal',families.graphs),deques:sub('queues-and-deques','Queues & Deques',families.linear),subsets:sub('subsets','Subsets',families.backtracking),heaps:sub('heaps','Heaps',families.trees),
};

const patterns=[pattern('sliding-window','Sliding Window'),pattern('monotonic-queue','Monotonic Queue'),pattern('bfs','BFS'),pattern('dfs','DFS'),pattern('memoization','Memoization'),pattern('tabulation','Tabulation'),pattern('sorting','Sorting')];
const taxonomyNodes=[...Object.values(families),...Object.values(subtags),...patterns];
const bySlug=new Map(taxonomyNodes.map(node=>[node.slug,node]));

function problem(source:string,sourceKey:string,title:string,url:string,difficulty:Problem['difficulty'],status:Problem['status'],primary:TaxonomyNode,tags:string[],notes:Problem['notes'],time:string,space:string):Problem{return {id:sourceKey,source,source_key:sourceKey,slug:sourceKey,title,url,difficulty,status,primary_subtag:primary,primary_main:Object.values(families).find(item=>item.id===primary.parent_id)!,taxonomy:tags.map(tag=>bySlug.get(tag)).filter((node):node is TaxonomyNode=>!!node),time_complexity:time,space_complexity:space,mistake_count:1,created_at:updated,updated_at:updated,python_code:'',notes,mistake_events:[]}}

const intuition=(state:string,base:string,choice:string,invariant:string,edges:string[]):Problem['notes']=>({core_insight:[state],approach:[base,choice],invariants:[invariant],edge_cases:edges,recognition_signals:[],why_missed:[],follow_up:[]});

export const offlineProblems:Problem[]=[
  problem('hackerrank','ticket-to-ride','Ticket to Ride','https://www.hackerrank.com/challenges/ticket-to-ride/problem','Hard','Open',subtags.treeDp,[],intuition('Choose one simple path in the existing tree—not a branching Steiner subgraph.','A leaf exposes one unfinished endpoint.','Continue one child arm or join two arms through a node.','Selected path-degree never exceeds two.',['Two-city tree','Internal endpoint']), '', ''),
  problem('atcoder','abc395-g','Minimum Steiner Tree 2','https://atcoder.jp/contests/abc395/tasks/abc395_g','Hard','Open',subtags.bitmask,['tabulation'],intuition('DP[mask][v] is the cheapest connected graph containing the masked terminals and attachment vertex v.','Seed empty and singleton terminal masks.','Merge two masks at the same v, then move v with dense Dijkstra.','Every finite state is connected; optional connector vertices need no bits.',['Hidden hub','Zero-weight ties','64-bit total']),'O(3^K N^2 + 2^K N^3)','O(2^K N + N^2)'),
  problem('leetcode','koko-eating-bananas','Koko Eating Bananas','https://leetcode.com/problems/koko-eating-bananas/','Medium','Understood',subtags.binary,[],intuition('Search the first feasible eating speed.','The answer lies from 1 through max(piles).','Test total ceiling-division hours at mid.','Once a speed works, every faster speed works.',['Single pile','Tight deadline']),'O(n log max(piles))','O(1)'),
  problem('leetcode','special-array-with-x-elements-greater-than-or-equal-x','Special Array With X Elements Greater Than or Equal X','https://leetcode.com/problems/special-array-with-x-elements-greater-than-or-equal-x/','Easy','Understood',subtags.binary,['sorting'],intuition('Search candidate x from 0 through n; x need not occur in nums.','The count range is bounded by 0 and n.','Count values at least mid, then verify equality at the boundary.','count(nums ≥ x) ≥ x is monotonic.',['All zeros','Boundary not exact']),'O(n log n)','O(1)'),
  problem('leetcode','minimum-falling-path-sum','Minimum Falling Path Sum','https://leetcode.com/problems/minimum-falling-path-sum/','Medium','Understood',subtags.gridDp,['memoization','tabulation'],intuition('dp[row][col] is the minimum sum from one cell to the last row.','The last row equals its own values.','Choose down-left, down, or down-right when in bounds.','The child row is solved before its parent reads it.',['Single cell','Negative values']),'O(rows × columns)','O(rows × columns)'),
  problem('leetcode','is-graph-bipartite','Is Graph Bipartite?','https://leetcode.com/problems/is-graph-bipartite/','Medium','Understood',subtags.graph,['bfs','dfs'],intuition('Each vertex is uncolored, side A, or side B.','Seed every disconnected component with either side.','Color an unseen neighbor opposite; reject a same-color edge.','Every processed edge joins opposite colors.',['Odd cycle','Disconnected graph','Isolated node']),'O(V + E)','O(V)'),
  problem('leetcode','subsets-ii','Subsets II','https://leetcode.com/problems/subsets-ii/','Medium','Understood',subtags.subsets,['sorting'],intuition('Skip equal sibling branches after sorting; allow equal values deeper.','Every current path is already a valid subset.','Choose, recurse with the next index, then remove.','One recursion level never starts two branches with the same value.',['All duplicates','Empty input']),'O(n log n + n × unique subsets)','O(n) auxiliary + output'),
  problem('leetcode','longest-continuous-subarray-with-absolute-diff-less-than-or-equal-to-limit','Longest Continuous Subarray With Absolute Diff Less Than or Equal to Limit','https://leetcode.com/problems/longest-continuous-subarray-with-absolute-diff-less-than-or-equal-to-limit/','Medium','Understood',subtags.deques,['sliding-window','monotonic-queue'],intuition('The window is valid while max − min ≤ limit.','The window and both candidate deques start empty.','Expand right, prune deque backs, then shrink left while invalid.','Deque fronts are the current extremes and all indices remain in the window.',['Limit zero','Duplicate block plus spike']),'O(n)','O(n)'),
  problem('leetcode','ipo','IPO','https://leetcode.com/problems/ipo/','Hard','Understood',subtags.heaps,['sorting'],intuition('Separate unlock order by capital from greedy order by profit.','Current capital defines the first affordable frontier.','Move every affordable project into the profit heap, then take the maximum.','The profit heap contains all and only affordable unchosen projects.',['Nothing affordable','All affordable']),'O(n log n + k log n)','O(n)'),
  problem('leetcode','palindrome-partitioning-ii','Palindrome Partitioning II','https://leetcode.com/problems/palindrome-partitioning-ii/description/','Hard','Resolved',subtags.oneDp,['tabulation'],intuition('Precompute palindrome intervals, then minimize cuts for each prefix.','A single character is a palindrome; a whole-palindrome prefix needs zero cuts.','Choose the final palindrome segment of a prefix.','Every cut state reads an already solved shorter prefix.',['Single character','Repeated characters']),'O(n^2)','O(n^2)'),
];

const taxonomy:TaxonomyResponse={nodes:taxonomyNodes,main:Object.values(families),sub:Object.values(subtags),patterns,failure_reasons:[]};

function analytics():Analytics{
  const domains=Object.values(families).map(family=>{const items=offlineProblems.filter(item=>item.primary_main.id===family.id);return {...family,count:items.length,open:items.filter(item=>item.status==='Open').length,repeat_mistakes:0}}).filter(item=>item.count);
  return {summary:{total:offlineProblems.length,resolved:offlineProblems.filter(item=>item.status==='Resolved').length,open:offlineProblems.filter(item=>item.status==='Open').length,repeat_mistakes:0,unsynced_files:0},domains,patterns:[],activity:[{date:'2026-08-22',count:1},{date:'2026-08-23',count:1},{date:'2026-08-24',count:2},{date:'2026-08-25',count:1},{date:'2026-08-26',count:2},{date:'2026-08-27',count:1},{date:'2026-08-28',count:2}],failure_reasons:[],failure_matrix:[],recent:offlineProblems.slice(0,6)};
}

function atlas():AtlasGraphData{return {aggregated:false,nodes:[...Object.values(families).map(family=>({id:family.id,name:family.name,kind:'main',color:family.color??'#2de2e6',value:5})),...offlineProblems.map(item=>({id:item.id,name:item.title,kind:'problem',color:item.primary_main.color??'#2de2e6',value:2,status:item.status,difficulty:item.difficulty}))],links:offlineProblems.map(item=>({source:item.primary_main.id,target:item.id,kind:'hierarchy'}))}}

function filterProblems(url:URL){let items=[...offlineProblems];const query=(url.searchParams.get('q')??'').toLowerCase();if(query)items=items.filter(item=>`${item.title} ${item.source_key} ${Object.values(item.notes??{}).flat().join(' ')}`.toLowerCase().includes(query));for(const [parameter,field] of [['status','status'],['difficulty','difficulty']] as const){const value=url.searchParams.get(parameter);if(value)items=items.filter(item=>item[field]===value)}const mainId=url.searchParams.get('main_id');if(mainId)items=items.filter(item=>item.primary_main.id===mainId);const subtagId=url.searchParams.get('subtag_id');if(subtagId)items=items.filter(item=>item.primary_subtag.id===subtagId);const taxonomyId=url.searchParams.get('taxonomy_id');if(taxonomyId)items=items.filter(item=>item.taxonomy.some(node=>node.id===taxonomyId));return {items,total:items.length,limit:250,offset:0}}

export function offlineApi(path:string):unknown{
  const url=new URL(path,'https://offline.algo-atlas.local');
  if(url.pathname==='/api/problems')return filterProblems(url);
  if(url.pathname.startsWith('/api/problems/'))return offlineProblems.find(item=>item.id===decodeURIComponent(url.pathname.split('/').at(-1)??''));
  if(url.pathname==='/api/taxonomy')return taxonomy;
  if(url.pathname==='/api/analytics/overview')return analytics();
  if(url.pathname==='/api/analytics/atlas')return atlas();
  if(url.pathname==='/api/git')return {remote:'',branch:'main',user_name:'',user_email:'',ahead:0,behind:0,warnings:['Published preview is read-only.'],changes:[],additions:0,updates:0,deletions:0,proposed_commit:'',ready:false,status:'offline'};
  return undefined;
}

export const offlineTaxonomyKinds:TaxonomyKind[]=['main','sub','pattern','custom','failure'];
