import type { TrieSuggestionsFrameData } from './types';

import { StateLegend } from '../../../../shared/ui/LessonPrimitives';

export function TrieSuggestionsCanvas({ data }: { data: TrieSuggestionsFrameData }) {
  const maxDepth = Math.max(1, ...data.nodes.map((node) => node.depth));
  const byDepth = Array.from({ length: maxDepth + 1 }, (_, depth) =>
    data.nodes.filter((node) => node.depth === depth),
  );
  const positions = new Map<string, [number, number]>();
  byDepth.forEach((nodes, depth) =>
    nodes.forEach((node, index) =>
      positions.set(node.id, [
        72 + depth * 112,
        48 + (index + 1) * Math.max(26, 300 / (nodes.length + 1)),
      ]),
    ),
  );
  return (
    <div className="batch1-visual trie-visual">
      <StateLegend
        items={[
          { label: 'Current traversal', symbol: '●', color: '#37d9ff' },
          { label: 'Terminal product', symbol: '◆', color: '#4fd1a1' },
          { label: 'Visited', symbol: '○', color: '#9b8cff' },
        ]}
      />
      <div className="trie-layout">
        <div
          className="trie-tree-wrap"
          role="img"
          aria-label={`Trie for ${data.products.join(', ')}; active prefix ${data.currentPrefix || 'none'}`}
        >
          <svg className="trie-tree" viewBox="0 0 700 340" preserveAspectRatio="xMinYMid meet">
            {data.edges.map((edge) => {
              const from = positions.get(edge.from),
                to = positions.get(edge.to);
              if (!from || !to) return null;
              return (
                <g key={`${edge.from}-${edge.to}`}>
                  <line
                    className={`trie-edge ${edge.state}`}
                    x1={from[0]}
                    y1={from[1]}
                    x2={to[0]}
                    y2={to[1]}
                  />
                  <text
                    className="trie-edge-label"
                    x={(from[0] + to[0]) / 2}
                    y={(from[1] + to[1]) / 2 - 4}
                  >
                    {edge.character}
                  </text>
                </g>
              );
            })}
            {data.nodes.map((node) => {
              const point = positions.get(node.id)!;
              return (
                <g key={node.id} className={`trie-node ${node.state}`}>
                  <circle
                    cx={point[0]}
                    cy={point[1]}
                    r={node.depth === 0 ? 14 : node.terminalProduct ? 10 : 7}
                  />
                  <text x={point[0]} y={point[1] + 4} textAnchor="middle">
                    {node.label}
                  </text>
                  {node.terminalProduct && (
                    <text className="trie-terminal-label" x={point[0] + 14} y={point[1] + 4}>
                      {node.terminalProduct}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
        <aside className="trie-results">
          <div>
            <small>TYPED PREFIX</small>
            <strong>{data.currentPrefix || '—'}</strong>
          </div>
          <div>
            <small>SUGGESTIONS · MAX 3</small>
            {data.suggestions.length ? (
              <ol>
                {data.suggestions.map((word) => (
                  <li key={word}>{word}</li>
                ))}
              </ol>
            ) : (
              <em>
                {data.action === 'missing' ? 'No matching branch' : 'Waiting for terminal products'}
              </em>
            )}
          </div>
          <div>
            <small>COMPLETED PREFIXES</small>
            <span>
              {data.resultLists.length
                ? data.resultLists.map((list, index) => (
                    <code key={index}>
                      {index + 1}: {list.length ? list.join(', ') : '∅'}
                    </code>
                  ))
                : 'None yet'}
            </span>
          </div>
        </aside>
      </div>
      <p className="visual-footnote">
        Terminal markers are checked before sorted child edges; each typed prefix receives a fresh
        copied result.
      </p>
    </div>
  );
}
