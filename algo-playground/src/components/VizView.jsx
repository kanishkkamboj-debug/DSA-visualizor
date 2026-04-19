import React from 'react';
import SortVisualizer from './algorithms/SortVisualizer';
import DPTableVisualizer from './algorithms/DPTableVisualizer';
import GraphVisualizer from './algorithms/GraphVisualizer';

// IDs that have dedicated visualizers
const SORT_IDS = new Set([
  'binary_search', 'merge_sort', 'quick_sort',
  'merge_sort_dc', 'quick_sort_dc', 'binary_search_dc',
  'bubble_sort', 'selection_sort', 'insertion_sort',
  'heap_sort', 'counting_sort', 'radix_sort', 'bucket_sort', 'quick_select',
  'linear_search', 'lower_upper_bound', 'search_rotated', 'search_2d', 'peak_element', 'kth_missing',
]);

const DP_IDS = new Set([
  'lcs', 'matrix_chain',
  'fib_dp', 'climbing_stairs', 'knapsack_01', 'coin_change',
  'lis', 'edit_distance', 'house_robber', 'subset_sum',
]);

const GRAPH_IDS = new Set([
  'kruskal', 'huffman', 'prim',
  'graph_dfs', 'graph_bfs', 'dijkstra', 'bellman_ford', 'dsu', 'bipartite_check',
]);

const ComingSoon = ({ algorithm, category }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    height: '100%', gap: '1rem', textAlign: 'center', padding: '2rem',
  }}>
    <div style={{ fontSize: '3rem' }}>⚙️</div>
    <div style={{ color: 'var(--active-accent)', fontSize: '1.1rem', fontWeight: 700, textShadow: '0 0 8px var(--active-accent)' }}>
      {algorithm.name}
    </div>
    <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem', maxWidth: '340px', lineHeight: 1.6 }}>
      Interactive visualization for this algorithm is <strong style={{ color: 'rgba(255,255,255,0.6)' }}>coming soon</strong>.
      Switch to the <strong style={{ color: 'var(--active-accent)' }}>Code</strong> or <strong style={{ color: 'var(--active-accent)' }}>Recurrence</strong> tabs to study the implementation.
    </div>
    <div style={{
      display: 'flex', gap: '1.5rem', marginTop: '0.5rem', fontSize: '0.72rem',
      color: 'rgba(255,255,255,0.3)', flexWrap: 'wrap', justifyContent: 'center',
    }}>
      {algorithm.complexity && (
        <div style={{ padding: '0.3rem 0.7rem', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', fontFamily: 'Fira Code, monospace' }}>
          ⏱ {algorithm.complexity}
        </div>
      )}
      <div style={{ padding: '0.3rem 0.7rem', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px' }}>
        {category?.name}
      </div>
    </div>
  </div>
);

const VizView = ({ algorithm, category }) => {
  const renderVisualizer = () => {
    if (SORT_IDS.has(algorithm.id)) {
      return <SortVisualizer algorithmId={algorithm.id} />;
    }
    if (DP_IDS.has(algorithm.id)) {
      return <DPTableVisualizer algorithmId={algorithm.id} />;
    }
    if (GRAPH_IDS.has(algorithm.id)) {
      return <GraphVisualizer algorithmId={algorithm.id} />;
    }
    return <ComingSoon algorithm={algorithm} category={category} />;
  };

  return (
    <div className="viz-container glass-panel" style={{ flex: 1, padding: '1rem', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {renderVisualizer()}
    </div>
  );
};

export default VizView;
