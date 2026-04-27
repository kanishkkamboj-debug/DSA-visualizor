import React from 'react';
import SortVisualizer from './algorithms/SortVisualizer';
import GraphVisualizer from './algorithms/GraphVisualizer';
import ArrayVisualizer from './algorithms/ArrayVisualizer';
import StringVisualizer from './algorithms/StringVisualizer';
import LinkedListVisualizer from './algorithms/LinkedListVisualizer';
import TreeVisualizer from './algorithms/TreeVisualizer';
import StackQueueVisualizer from './algorithms/StackQueueVisualizer';
import HashVisualizer from './algorithms/HashVisualizer';
import DPTableVisualizer from './algorithms/DPTableVisualizer';
import RecursionBacktrackingVisualizer from './algorithms/RecursionBacktrackingVisualizer';
import GreedyVisualizer from './algorithms/GreedyVisualizer';
import MathBitVisualizer from './algorithms/MathBitVisualizer';
import AdvancedDSAVisualizer from './algorithms/AdvancedDSAVisualizer';

// IDs that have dedicated visualizers
const SORT_IDS = new Set([
  'binary_search', 'merge_sort', 'quick_sort',
  'merge_sort_dc', 'quick_sort_dc', 'binary_search_dc',
  'bubble_sort', 'selection_sort', 'insertion_sort',
  'heap_sort', 'counting_sort', 'radix_sort', 'bucket_sort', 'quick_select',
  'linear_search', 'lower_upper_bound', 'search_rotated', 'search_2d', 'peak_element', 'kth_missing',
]);



const ARRAY_IDS = new Set([
  'traversal', 'prefix_sum', 'suffix_sum', 'two_pointer', 'sliding_window', 'kadane', 'dutch_flag',
  'merge_intervals', 'next_permutation', 'boyer_moore', 'rotate_array', 'trapping_rain',
  'stock_buy_sell', 'max_product_subarray', 'subarray_sum'
]);

const STRING_IDS = new Set([
  'reverse_string', 'palindrome_check', 'anagram_check', 'longest_common_prefix', 
  'sliding_window_str', 'kmp', 'rabin_karp', 'z_algorithm', 'manacher', 'min_window_substr', 'string_matching'
]);

const LL_IDS = new Set([
  'll_reverse', 'll_cycle', 'll_middle', 'll_merge_sorted', 'll_remove_nth', 'll_intersection', 'll_reverse_k', 'll_lru'
]);

const TREE_IDS = new Set([
  'tree_inorder', 'tree_preorder', 'tree_postorder', 'tree_level_order', 
  'tree_max_depth', 'tree_diameter', 'tree_same_tree', 'tree_lca', 'tree_max_path_sum',
  'bst_search', 'bst_insert', 'bst_delete', 'bst_validate', 'bst_kth_smallest', 'bst_lca', 'bst_successor',
  'heap_min', 'heap_max', 'heap_kth_largest', 'heap_median'
]);

const STACK_QUEUE_IDS = new Set([
  'next_greater', 'prev_greater', 'valid_parens', 'largest_rectangle', 'min_stack', 'infix_postfix',
  'queue_using_stack', 'stack_using_queue', 'sliding_window_max', 'circular_queue'
]);

const HASH_IDS = new Set([
  'freq_count', 'two_sum_hash', 'subarray_sum_k', 'longest_consecutive', 'group_anagrams'
]);

const GRAPH_IDS = new Set([
  'graph_dfs', 'graph_bfs', 'dijkstra', 'bellman_ford', 'floyd_warshall', 
  'prim', 'kruskal', 'topological_sort', 'dsu', 'bipartite_check'
]);

const DP_IDS = new Set([
  'fib_dp', 'climbing_stairs', 'knapsack_01', 'coin_change', 'lcs', 
  'lis', 'edit_distance', 'matrix_chain', 'house_robber', 'subset_sum'
]);

const RECURSION_BACKTRACKING_IDS = new Set([
  'factorial', 'fibonacci', 'subsets', 'permutations', 'combination_sum', 'generate_parens',
  'n_queens', 'sudoku', 'word_search', 'palindrome_partition'
]);

const GREEDY_IDS = new Set([
  'huffman', 'activity_selection', 'fractional_knapsack', 'jump_game', 'candy_distribution'
]);

const MATH_BIT_IDS = new Set([
  'sieve', 'gcd_euclid', 'fast_expo', 'prime_factorization', 'modular_arithmetic',
  'xor_tricks', 'power_of_two', 'count_set_bits', 'subsets_bitmask'
]);

const ADVANCED_DSA_IDS = new Set([
  'trie', 'segment_tree', 'fenwick_tree', 'sparse_table', 'rolling_hash'
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
    if (ARRAY_IDS.has(algorithm.id)) {
      return <ArrayVisualizer algorithmId={algorithm.id} />;
    }
    if (STRING_IDS.has(algorithm.id)) {
      return <StringVisualizer algorithmId={algorithm.id} />;
    }
    if (LL_IDS.has(algorithm.id)) {
      return <LinkedListVisualizer algorithmId={algorithm.id} />;
    }
    if (TREE_IDS.has(algorithm.id)) {
      return <TreeVisualizer algorithmId={algorithm.id} />;
    }
    if (STACK_QUEUE_IDS.has(algorithm.id)) {
      return <StackQueueVisualizer algorithmId={algorithm.id} />;
    }
    if (HASH_IDS.has(algorithm.id)) {
      return <HashVisualizer algorithmId={algorithm.id} />;
    }
    if (RECURSION_BACKTRACKING_IDS.has(algorithm.id)) {
      return <RecursionBacktrackingVisualizer algorithmId={algorithm.id} />;
    }
    if (GREEDY_IDS.has(algorithm.id)) {
      return <GreedyVisualizer algorithmId={algorithm.id} />;
    }
    if (MATH_BIT_IDS.has(algorithm.id)) {
      return <MathBitVisualizer algorithmId={algorithm.id} />;
    }
    if (ADVANCED_DSA_IDS.has(algorithm.id)) {
      return <AdvancedDSAVisualizer algorithmId={algorithm.id} />;
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
