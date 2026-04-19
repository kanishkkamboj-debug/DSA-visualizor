import React, { useState, useRef, useEffect } from 'react';

// ---- Build recursion tree ----
const buildTree = (arr, depth = 0, id = '0') => {
  if (arr.length <= 1) return { id, arr, depth, left: null, right: null, merged: null };
  const mid = Math.floor(arr.length / 2);
  const left = buildTree(arr.slice(0, mid), depth + 1, id + 'L');
  const right = buildTree(arr.slice(mid), depth + 1, id + 'R');
  // Merged result (what this node looks like after merging children)
  const merged = [...arr].sort((a, b) => a - b); // simplified; real merge below
  return { id, arr, depth, left, right, merged };
};

// Collect nodes in BFS order with assigned positions
const assignPositions = (root, nodeW = 80, nodeH = 56, levelGap = 90) => {
  if (!root) return [];
  const nodes = [];

  const traverse = (node, xFrom, xTo, depth) => {
    if (!node) return;
    const x = (xFrom + xTo) / 2;
    const y = depth * levelGap + 40;
    nodes.push({ ...node, x, y });
    const mid = (xFrom + xTo) / 2;
    traverse(node.left, xFrom, mid, depth + 1);
    traverse(node.right, mid, xTo, depth + 1);
  };

  // Figure out max width needed
  const maxDepth = getDepth(root);
  const totalWidth = Math.max(780, Math.pow(2, maxDepth) * (nodeW + 8));
  traverse(root, 0, totalWidth, 0);
  return { nodes, totalWidth, maxDepth };
};

const getDepth = (node) => {
  if (!node) return 0;
  return 1 + Math.max(getDepth(node.left), getDepth(node.right));
};

// Flatten tree to BFS ordered list of nodeIds in divide order, then merge order
const getDivideOrder = (root) => {
  if (!root) return [];
  const order = [];
  const queue = [root];
  while (queue.length) {
    const node = queue.shift();
    order.push(node.id);
    if (node.left) queue.push(node.left);
    if (node.right) queue.push(node.right);
  }
  return order;
};

const getMergeOrder = (root) => {
  if (!root) return [];
  const order = [];
  const traverse = (node) => {
    if (!node) return;
    traverse(node.left);
    traverse(node.right);
    order.push(node.id);
  };
  traverse(root);
  return order;
};

const NODE_W = 72;
const NODE_H = 48;
const LEVEL_GAP = 100;
const ACCENT_DEFAULT = '#00ffff';

const MergeSortTree = ({ array }) => {
  const [phase, setPhase] = useState('idle'); // idle | dividing | merging | done
  const [visibleIds, setVisibleIds] = useState(new Set());
  const [mergedIds, setMergedIds] = useState(new Set());
  const [activeId, setActiveId] = useState(null);
  const [treeData, setTreeData] = useState(null);
  const [positioned, setPositioned] = useState(null);
  const [svgHeight, setSvgHeight] = useState(400);
  const [speed, setSpeed] = useState(500);
  const abortRef = useRef(null);

  useEffect(() => {
    rebuild();
  }, [array]);

  const rebuild = () => {
    if (abortRef.current) abortRef.current.abort();
    if (!array || array.length === 0) return;
    const tree = buildTree([...array]);
    const pos = assignPositions(tree, NODE_W, NODE_H, LEVEL_GAP);
    setTreeData(tree);
    setPositioned(pos);
    setSvgHeight(pos.maxDepth * LEVEL_GAP + LEVEL_GAP + 80);
    setVisibleIds(new Set(['0'])); // show root only
    setMergedIds(new Set());
    setActiveId(null);
    setPhase('idle');
  };

  const sleep = (ms) => new Promise((res, rej) => {
    const t = setTimeout(res, ms);
    abortRef.current?.signal.addEventListener('abort', () => { clearTimeout(t); rej(); });
  });

  const animate = async () => {
    if (!treeData || !positioned) return;
    abortRef.current = new AbortController();
    setPhase('dividing');
    setVisibleIds(new Set());
    setMergedIds(new Set());
    setActiveId(null);

    const divideOrder = getDivideOrder(treeData);
    const vis = new Set();

    // Phase 1: Divide — reveal nodes top-down BFS
    for (const id of divideOrder) {
      setActiveId(id);
      vis.add(id);
      setVisibleIds(new Set(vis));
      try { await sleep(speed); } catch (_) { return; }
    }
    setActiveId(null);

    // Phase 2: Merge — highlight nodes bottom-up
    try { await sleep(speed); } catch (_) { return; }
    setPhase('merging');
    const mergeOrder = getMergeOrder(treeData);
    const merged = new Set();
    for (const id of mergeOrder) {
      setActiveId(id);
      merged.add(id);
      setMergedIds(new Set(merged));
      try { await sleep(speed); } catch (_) { return; }
    }
    setActiveId(null);
    setPhase('done');
  };

  const reset = () => {
    if (abortRef.current) abortRef.current.abort();
    rebuild();
  };

  if (!positioned) return <div style={{ color: 'var(--text-muted)', padding: '2rem' }}>Building tree...</div>;

  const { nodes, totalWidth } = positioned;
  const accent = ACCENT_DEFAULT;

  // Build lookup map
  const nodeMap = {};
  nodes.forEach(n => { nodeMap[n.id] = n; });

  // Collect edges
  const edges = [];
  nodes.forEach(n => {
    if (n.left && nodeMap[n.left.id]) edges.push({ from: n, to: nodeMap[n.left.id] });
    if (n.right && nodeMap[n.right.id]) edges.push({ from: n, to: nodeMap[n.right.id] });
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
      {/* Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', gap: '0.75rem', flexWrap: 'wrap', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            <span><span style={{ color: 'rgba(255,255,255,0.25)' }}>◆</span> Not yet reached</span>
            <span><span style={{ color: accent }}>◆</span> Dividing (active)</span>
            <span><span style={{ color: '#ffc800' }}>◆</span> Merging (active)</span>
            <span><span style={{ color: '#00ff88' }}>◆</span> Merged</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Speed:
            <input type="range" min="100" max="1200" value={1200 - speed + 100}
              onChange={e => setSpeed(1200 - parseInt(e.target.value) + 100)}
              style={{ width: '70px', accentColor: accent }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={reset}
            style={{ background: 'transparent', border: '1px solid var(--panel-border)', color: '#fff', padding: '0.35rem 0.75rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>
            Reset
          </button>
          <button onClick={animate} disabled={phase === 'dividing' || phase === 'merging'}
            style={{ background: accent, border: 'none', color: '#000', fontWeight: 'bold', padding: '0.35rem 1rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', boxShadow: `0 0 10px ${accent}`, opacity: (phase === 'dividing' || phase === 'merging') ? 0.6 : 1 }}>
            {phase === 'dividing' ? 'Dividing...' : phase === 'merging' ? 'Merging...' : phase === 'done' ? 'Replay' : 'Animate'}
          </button>
        </div>
      </div>

      {/* SVG Tree */}
      <div style={{ flex: 1, overflow: 'auto', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
        <svg width={totalWidth} height={svgHeight} style={{ display: 'block' }}>
          {/* Edges */}
          {edges.map((e, i) => {
            const fromVisible = visibleIds.has(e.from.id);
            const toVisible = visibleIds.has(e.to.id);
            if (!fromVisible || !toVisible) return null;
            const isMergeActive = mergedIds.has(e.to.id) && mergedIds.has(e.from.id);
            return (
              <line key={i}
                x1={e.from.x} y1={e.from.y + NODE_H / 2}
                x2={e.to.x} y2={e.to.y - NODE_H / 2}
                stroke={isMergeActive ? '#00ff88' : 'rgba(255,255,255,0.15)'}
                strokeWidth={isMergeActive ? 2 : 1}
                strokeDasharray={isMergeActive ? '0' : '4 3'}
              />
            );
          })}

          {/* Nodes */}
          {nodes.map(node => {
            if (!visibleIds.has(node.id)) return null;
            const isActive = activeId === node.id;
            const isMerged = mergedIds.has(node.id) && !isActive;
            const isMergingActive = isActive && phase === 'merging';

            let fillColor = 'rgba(255,255,255,0.04)';
            let strokeColor = 'rgba(255,255,255,0.15)';
            let textColor = '#aaa';
            let glow = 'none';

            if (isActive && phase === 'dividing') {
              fillColor = `rgba(0,255,255,0.18)`;
              strokeColor = accent;
              textColor = '#fff';
              glow = `0 0 14px ${accent}`;
            } else if (isMergingActive) {
              fillColor = 'rgba(255,200,0,0.18)';
              strokeColor = '#ffc800';
              textColor = '#fff';
              glow = '0 0 14px #ffc800';
            } else if (isMerged) {
              fillColor = 'rgba(0,255,136,0.12)';
              strokeColor = '#00ff88';
              textColor = '#00ff88';
            } else if (visibleIds.has(node.id)) {
              fillColor = 'rgba(255,255,255,0.06)';
              strokeColor = 'rgba(255,255,255,0.2)';
              textColor = 'rgba(255,255,255,0.6)';
            }

            // Display merged result if in merge phase, else show current arr
            const displayArr = (isMerged || isMergingActive) ? node.merged : node.arr;
            const label = displayArr.slice(0, 5).join(',') + (displayArr.length > 5 ? '…' : '');

            const nx = node.x - NODE_W / 2;
            const ny = node.y - NODE_H / 2;

            return (
              <g key={node.id}>
                <rect x={nx} y={ny} width={NODE_W} height={NODE_H} rx={8}
                  fill={fillColor} stroke={strokeColor} strokeWidth={isActive ? 2 : 1}
                  style={{ filter: glow !== 'none' ? `drop-shadow(${glow})` : undefined }} />
                {/* Array values label */}
                <text x={node.x} y={node.y - 4} textAnchor="middle" fill={textColor}
                  fontSize="10" fontFamily="'Fira Code', monospace" fontWeight={isActive ? 'bold' : 'normal'}>
                  [{label}]
                </text>
                {/* Size label */}
                <text x={node.x} y={node.y + 12} textAnchor="middle" fill="rgba(255,255,255,0.3)"
                  fontSize="9" fontFamily="Inter">
                  n={node.arr.length}
                </text>
                {/* Phase badge for active */}
                {isActive && (
                  <text x={node.x} y={ny - 6} textAnchor="middle"
                    fill={phase === 'dividing' ? accent : '#ffc800'} fontSize="9" fontWeight="bold">
                    {phase === 'dividing' ? '▼ SPLIT' : '▲ MERGE'}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default MergeSortTree;
