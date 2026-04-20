import React, { useEffect, useRef, useState } from 'react';
import StepLog from './StepLog';

// ---- Pre-laid node positions for a clean graph ----
const basePositions = [
  { x: 250, y: 60 },
  { x: 400, y: 150 },
  { x: 370, y: 300 },
  { x: 250, y: 360 },
  { x: 110, y: 290 },
  { x: 90, y: 150 },
];

const makeAutoGraph = () => {
  const nodes = basePositions.map((p, i) => ({ id: i, ...p }));
  const edges = [
    { u: 0, v: 1, weight: 4 }, { u: 0, v: 5, weight: 2 },
    { u: 1, v: 2, weight: 5 }, { u: 1, v: 5, weight: 3 },
    { u: 2, v: 3, weight: 6 }, { u: 2, v: 4, weight: 8 },
    { u: 3, v: 4, weight: 7 }, { u: 4, v: 5, weight: 9 },
    { u: 4, v: 1, weight: 11 },
  ];
  return { nodes, edges };
};

const GraphVisualizer = ({ algorithmId }) => {
  const canvasRef = useRef(null);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  
  const [mode, setMode] = useState('auto');
  const [customInput, setCustomInput] = useState('0-1:4, 0-5:2, 1-2:5, 1-5:3, 2-3:6, 3-4:7, 4-5:9');
  const [errorMsg, setErrorMsg] = useState('');
  const [speed, setSpeed] = useState(400);

  // --- Snapshot Animation Engine State ---
  const [trace, setTrace] = useState([]); // Array of snapshots
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    initGraph();
  }, [algorithmId]);

  // Playback loop
  useEffect(() => {
    let timer;
    if (isPlaying && currentStep < trace.length - 1) {
      timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, speed);
    } else if (currentStep >= trace.length - 1 && trace.length > 0) {
      setIsPlaying(false);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentStep, trace, speed]);

  const initGraph = () => {
    setIsPlaying(false);
    setTrace([]);
    setCurrentStep(0);
    setErrorMsg('');
    const { nodes: n, edges: e } = makeAutoGraph();
    setNodes(n); setEdges(e);
  };

  const applyCustomGraph = () => {
    if (!customInput.trim()) return;
    try {
      const pairs = customInput.split(',').map(s => s.trim()).filter(Boolean);
      const edgeList = [];
      const nodeSet = new Set();
      pairs.forEach(pair => {
        const [edgeStr, weightStr] = pair.split(':');
        const [u, v] = edgeStr.trim().split('-').map(Number);
        const w = parseInt(weightStr?.trim() || '1', 10);
        if (isNaN(u) || isNaN(v) || isNaN(w)) throw new Error('bad');
        nodeSet.add(u); nodeSet.add(v);
        edgeList.push({ u, v, weight: w });
      });
      const sortedIds = [...nodeSet].sort((a, b) => a - b);
      const angleStep = (2 * Math.PI) / sortedIds.length;
      const newNodes = sortedIds.map((id, i) => ({
        id,
        x: 240 + 180 * Math.cos(i * angleStep - Math.PI / 2),
        y: 200 + 150 * Math.sin(i * angleStep - Math.PI / 2),
      }));
      const idxOf = (id) => newNodes.findIndex(n => n.id === id);
      const newEdges = edgeList.map(e => ({ u: idxOf(e.u), v: idxOf(e.v), weight: e.weight }));
      setNodes(newNodes); setEdges(newEdges);
      
      setIsPlaying(false);
      setTrace([]);
      setCurrentStep(0);
      setErrorMsg('');
    } catch(_) {
      setErrorMsg('Invalid format. Use: U-V:W, e.g. 0-1:4, 0-2:8');
    }
  };

  // --- Snapshot Builder ---
  const executeGraphAlgo = () => {
    if (trace.length > 0 && currentStep === 0) { setIsPlaying(true); return; }
    if (currentStep > 0 && currentStep < trace.length - 1) { setIsPlaying(true); return; }
    if (currentStep >= trace.length - 1 && trace.length > 0) { setCurrentStep(0); setIsPlaying(true); return; }

    const newTrace = [];
    const pushState = (mst = [], rej = [], currE = null, actN = [], nodeLabels = {}, msg = '') => {
      newTrace.push({
        mstEdges: [...mst],
        rejectedEdges: [...rej],
        currentEdge: currE,
        activeNodes: [...actN],
        nodeLabels: { ...nodeLabels },
        msg
      });
    };

    pushState([], [], null, [], {}, 'Starting graph algorithm...');

    // Build Adjacency List
    const adj = Array.from({ length: nodes.length }, () => []);
    edges.forEach(e => {
      adj[e.u].push({ v: e.v, weight: e.weight, edge: e });
      adj[e.v].push({ v: e.u, weight: e.weight, edge: e }); // Assuming undirected for most visuals
    });

    switch (algorithmId) {
      case 'kruskal': runKruskal(pushState); break;
      case 'prim': runPrim(adj, pushState); break;
      case 'dijkstra': runDijkstra(adj, pushState); break;
      case 'graph_dfs': runDFS(adj, pushState); break;
      case 'graph_bfs': runBFS(adj, pushState); break;
      case 'bipartite_check': runBipartite(adj, pushState); break;
      case 'topological_sort': runTopoSort(pushState); break;
      default: pushState([], [], null, [], {}, `Logic for ${algorithmId} coming soon.`); break;
    }

    setTrace(newTrace);
    setCurrentStep(0);
    setIsPlaying(true);
  };

  // --- Algorithms ---

  const runKruskal = (pushState) => {
    const parent = Array.from({ length: nodes.length }, (_, i) => i);
    const find = (x) => { if (parent[x] !== x) parent[x] = find(parent[x]); return parent[x]; };
    const union = (a, b) => {
      const ra = find(a), rb = find(b);
      if (ra === rb) return false;
      parent[ra] = rb;
      return true;
    };

    const sorted = [...edges].sort((a, b) => a.weight - b.weight);
    const mst = [];
    const rejected = [];
    let totalW = 0;

    pushState(mst, rejected, null, [], {}, `Edges sorted by weight.`);

    for (const edge of sorted) {
      pushState(mst, rejected, edge, [edge.u, edge.v], {}, `Evaluating edge (${nodes[edge.u].id}-${nodes[edge.v].id}) weight ${edge.weight}`);
      
      if (union(edge.u, edge.v)) {
        mst.push(edge);
        totalW += edge.weight;
        pushState(mst, rejected, null, [], {}, `✅ Accepted! No cycle. MST Weight: ${totalW}`);
      } else {
        rejected.push(edge);
        pushState(mst, rejected, null, [], {}, `❌ Rejected! Adding would create a cycle.`);
      }
      if (mst.length === nodes.length - 1) break;
    }
    pushState(mst, rejected, null, [], {}, `✅ Kruskal MST Complete. Total Weight: ${totalW}`);
  };

  const runPrim = (adj, pushState) => {
    const inMST = new Array(nodes.length).fill(false);
    const mst = [];
    let totalW = 0;
    
    // Simplistic Prim: repeatedly pick min edge connecting visited to unvisited
    inMST[0] = true;
    pushState(mst, [], null, [0], {}, `Starting Prim's at node ${nodes[0].id}`);

    while (mst.length < nodes.length - 1) {
      let minEdge = null;
      let minW = Infinity;
      
      for (let u = 0; u < nodes.length; u++) {
        if (!inMST[u]) continue;
        for (const neighbor of adj[u]) {
          if (!inMST[neighbor.v] && neighbor.weight < minW) {
            minW = neighbor.weight;
            minEdge = neighbor.edge;
          }
        }
      }

      if (!minEdge) break; // disconnected graph

      pushState(mst, [], minEdge, [minEdge.u, minEdge.v], {}, `Found minimum edge to unvisited node: weight ${minEdge.weight}`);
      
      mst.push(minEdge);
      totalW += minEdge.weight;
      inMST[minEdge.u] = true;
      inMST[minEdge.v] = true;
      
      pushState(mst, [], null, Array.from(inMST.keys()).filter(i=>inMST[i]), {}, `Added to MST. Total Weight: ${totalW}`);
    }
    pushState(mst, [], null, [], {}, `✅ Prim MST Complete. Total Weight: ${totalW}`);
  };

  const runDijkstra = (adj, pushState) => {
    const dist = new Array(nodes.length).fill(Infinity);
    const visited = new Set();
    const mst = []; // used to highlight shortest path edges tree
    const parentEdge = {};
    const labels = {};
    
    dist[0] = 0;
    labels[0] = 0;
    pushState(mst, [], null, [0], labels, `Starting Dijkstra at node ${nodes[0].id}. Initial distance 0.`);

    while (visited.size < nodes.length) {
      let u = -1;
      let minD = Infinity;
      for (let i = 0; i < nodes.length; i++) {
        if (!visited.has(i) && dist[i] < minD) { minD = dist[i]; u = i; }
      }
      if (u === -1) break;

      visited.add(u);
      pushState(mst, [], null, [u], labels, `Selected node ${nodes[u].id} with min distance ${dist[u]}`);

      for (const neighbor of adj[u]) {
        const v = neighbor.v;
        if (visited.has(v)) continue;
        
        pushState(mst, [], neighbor.edge, [u, v], labels, `Checking neighbor ${nodes[v].id}. Distance through ${nodes[u].id} is ${dist[u]} + ${neighbor.weight} = ${dist[u] + neighbor.weight}`);
        
        if (dist[u] + neighbor.weight < dist[v]) {
          dist[v] = dist[u] + neighbor.weight;
          labels[v] = dist[v];
          
          // Remove old parent edge if exists
          if (parentEdge[v]) {
            const idx = mst.indexOf(parentEdge[v]);
            if (idx > -1) mst.splice(idx, 1);
          }
          parentEdge[v] = neighbor.edge;
          mst.push(neighbor.edge);
          
          pushState(mst, [], null, [v], labels, `Updated shortest path to ${nodes[v].id}. New distance: ${dist[v]}`);
        }
      }
    }
    pushState(mst, [], null, [], labels, `✅ Dijkstra Complete. Shortest Path Tree shown in green.`);
  };

  const runDFS = (adj, pushState) => {
    const visited = new Set();
    const mst = []; // DFS tree edges
    
    const dfs = (u) => {
      visited.add(u);
      pushState(mst, [], null, [u], {}, `Visited Node ${nodes[u].id}`);
      
      for (const neighbor of adj[u]) {
        const v = neighbor.v;
        if (!visited.has(v)) {
          pushState(mst, [], neighbor.edge, [u, v], {}, `Traversing to unvisited neighbor ${nodes[v].id}`);
          mst.push(neighbor.edge);
          dfs(v);
          pushState(mst, [], null, [u], {}, `Backtracked to Node ${nodes[u].id}`);
        }
      }
    };
    
    dfs(0);
    pushState(mst, [], null, [], {}, `✅ DFS Complete.`);
  };

  const runBFS = (adj, pushState) => {
    const visited = new Set([0]);
    const queue = [0];
    const mst = []; // BFS tree edges
    
    pushState(mst, [], null, [0], {}, `Start BFS at Node ${nodes[0].id}`);
    
    while (queue.length > 0) {
      const u = queue.shift();
      pushState(mst, [], null, [u], {}, `Dequeued Node ${nodes[u].id}. Checking neighbors...`);
      
      for (const neighbor of adj[u]) {
        const v = neighbor.v;
        if (!visited.has(v)) {
          visited.add(v);
          queue.push(v);
          mst.push(neighbor.edge);
          pushState(mst, [], neighbor.edge, [u, v], {}, `Discovered Node ${nodes[v].id}. Enqueuing.`);
        }
      }
    }
    pushState(mst, [], null, [], {}, `✅ BFS Complete.`);
  };

  const runBipartite = (adj, pushState) => {
    const color = new Array(nodes.length).fill(-1);
    const labels = {};
    const mst = [];
    const rej = [];
    
    color[0] = 0;
    labels[0] = 'C0';
    const queue = [0];
    pushState(mst, rej, null, [0], labels, `Start Bipartite Check. Coloring Node ${nodes[0].id} as C0`);

    while (queue.length > 0) {
      const u = queue.shift();
      for (const neighbor of adj[u]) {
        const v = neighbor.v;
        pushState(mst, rej, neighbor.edge, [u, v], labels, `Checking neighbor ${nodes[v].id}`);
        
        if (color[v] === -1) {
          color[v] = 1 - color[u];
          labels[v] = `C${color[v]}`;
          mst.push(neighbor.edge);
          queue.push(v);
          pushState(mst, rej, null, [v], labels, `Uncolored. Assigning alternate color C${color[v]}`);
        } else if (color[v] === color[u]) {
          rej.push(neighbor.edge);
          pushState(mst, rej, neighbor.edge, [u, v], labels, `❌ Conflict! Node ${nodes[v].id} has same color as Node ${nodes[u].id}. Graph is NOT Bipartite.`);
          return;
        } else {
          pushState(mst, rej, null, [u, v], labels, `Node ${nodes[v].id} already has different color. Valid edge.`);
        }
      }
    }
    pushState(mst, rej, null, [], labels, `✅ Graph is Bipartite!`);
  };

  const runTopoSort = (pushState) => {
    // Topo Sort requires Directed graph. We treat edges as directed u -> v.
    const inDegree = new Array(nodes.length).fill(0);
    const labels = {};
    
    edges.forEach(e => { inDegree[e.v]++; });
    nodes.forEach(n => { labels[n.id] = `In: ${inDegree[n.id]}`; });
    
    pushState([], [], null, [], labels, 'Calculated In-Degrees for all nodes.');
    
    const queue = [];
    nodes.forEach((n, i) => { if (inDegree[i] === 0) queue.push(i); });
    
    const result = [];
    const mst = []; // represents processed edges
    
    while(queue.length > 0) {
      const u = queue.shift();
      result.push(nodes[u].id);
      pushState(mst, [], null, [u], labels, `Node ${nodes[u].id} has In-Degree 0. Processing and adding to Topo Sort.`);
      
      const outgoing = edges.filter(e => e.u === u);
      for (const edge of outgoing) {
        const v = edge.v;
        inDegree[v]--;
        labels[v] = `In: ${inDegree[v]}`;
        mst.push(edge);
        pushState(mst, [], edge, [u, v], labels, `Removed edge ${nodes[u].id}→${nodes[v].id}. Node ${nodes[v].id} in-degree is now ${inDegree[v]}`);
        
        if (inDegree[v] === 0) {
          queue.push(v);
          pushState(mst, [], null, [v], labels, `Node ${nodes[v].id} in-degree hit 0. Enqueuing.`);
        }
      }
    }
    pushState(mst, [], null, [], {}, `✅ Topo Sort Complete: [${result.join(', ')}]`);
  };


  // --- Playback Controls ---
  const handlePlayPause = () => {
    if (trace.length === 0) executeGraphAlgo();
    else setIsPlaying(!isPlaying);
  };
  const handleNext = () => {
    setIsPlaying(false);
    if (currentStep < trace.length - 1) setCurrentStep(c => c + 1);
  };
  const handlePrev = () => {
    setIsPlaying(false);
    if (currentStep > 0) setCurrentStep(c => c - 1);
  };

  // --- Rendering ---
  const currentState = trace[currentStep] || { mstEdges: [], rejectedEdges: [], currentEdge: null, activeNodes: [], nodeLabels: {}, msg: 'Ready.' };
  const historySteps = trace.slice(0, currentStep + 1).map(t => t.msg).filter(m => m);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || nodes.length === 0) return;
    const ctx = canvas.getContext('2d');
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--active-accent').trim() || '#ff00ff';

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const edgeKey = (e) => `${Math.min(e.u,e.v)}-${Math.max(e.u,e.v)}`;
    const mstSet = new Set(currentState.mstEdges.map(edgeKey));
    const rejSet = new Set(currentState.rejectedEdges.map(edgeKey));

    // Draw edges
    edges.forEach(edge => {
      const u = nodes[edge.u], v = nodes[edge.v];
      if (!u || !v) return;
      const key = edgeKey(edge);
      const isCurrent = currentState.currentEdge && edgeKey(currentState.currentEdge) === key;
      const isMST = mstSet.has(key);
      const isRej = rejSet.has(key);

      ctx.beginPath();
      // Draw directed arrows if Topo Sort
      if (algorithmId === 'topological_sort') {
        const dx = v.x - u.x, dy = v.y - u.y;
        const angle = Math.atan2(dy, dx);
        ctx.moveTo(u.x, u.y);
        ctx.lineTo(v.x - 20 * Math.cos(angle), v.y - 20 * Math.sin(angle));
      } else {
        ctx.moveTo(u.x, u.y);
        ctx.lineTo(v.x, v.y);
      }

      if (isCurrent) { ctx.strokeStyle = '#ffc800'; ctx.lineWidth = 4; ctx.shadowColor = '#ffc800'; ctx.shadowBlur = 15; }
      else if (isMST) { ctx.strokeStyle = '#00ff88'; ctx.lineWidth = 3; ctx.shadowColor = '#00ff88'; ctx.shadowBlur = 12; }
      else if (isRej) { ctx.strokeStyle = 'rgba(255,50,50,0.5)'; ctx.lineWidth = 1; ctx.shadowBlur = 0; }
      else { ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1; ctx.shadowBlur = 0; }

      ctx.stroke();
      
      if (algorithmId === 'topological_sort') {
        const dx = v.x - u.x, dy = v.y - u.y;
        const angle = Math.atan2(dy, dx);
        ctx.beginPath();
        ctx.moveTo(v.x - 16 * Math.cos(angle), v.y - 16 * Math.sin(angle));
        ctx.lineTo(v.x - 25 * Math.cos(angle - Math.PI/6), v.y - 25 * Math.sin(angle - Math.PI/6));
        ctx.lineTo(v.x - 25 * Math.cos(angle + Math.PI/6), v.y - 25 * Math.sin(angle + Math.PI/6));
        ctx.fillStyle = ctx.strokeStyle;
        ctx.fill();
      }
      
      ctx.shadowBlur = 0;

      // Weight label
      if (algorithmId !== 'topological_sort' && algorithmId !== 'graph_dfs' && algorithmId !== 'graph_bfs' && algorithmId !== 'bipartite_check') {
        const mx = (u.x + v.x) / 2, my = (u.y + v.y) / 2;
        ctx.fillStyle = isCurrent ? '#ffc800' : isMST ? '#00ff88' : 'rgba(255,255,255,0.4)';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(edge.weight, mx, my - 6);
      }
    });

    // Draw nodes
    nodes.forEach((node, i) => {
      const isActive = currentState.activeNodes.includes(i);
      
      ctx.beginPath();
      ctx.arc(node.x, node.y, 18, 0, 2 * Math.PI);
      ctx.fillStyle = isActive ? accent : '#05050a';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = isActive ? '#fff' : accent;
      ctx.shadowColor = accent;
      ctx.shadowBlur = isActive ? 15 : 6;
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.fillStyle = isActive ? '#000' : '#fff';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.id, node.x, node.y);
      
      // Node Labels (like Distance for Dijkstra)
      if (currentState.nodeLabels[i] !== undefined) {
        ctx.fillStyle = '#ff00ff';
        ctx.font = 'bold 11px monospace';
        ctx.fillText(currentState.nodeLabels[i], node.x, node.y - 28);
      }
    });
  }, [nodes, edges, trace, currentStep, algorithmId]);

  return (
    <div style={{ display: 'flex', gap: '1rem', width: '100%', height: '100%' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => { setMode('auto'); initGraph(); }}
              style={{ padding: '0.25rem 0.75rem', borderRadius: '4px', border: '1px solid var(--panel-border)', background: mode === 'auto' ? 'var(--active-accent)' : 'transparent', color: mode === 'auto' ? '#000' : '#fff', cursor: 'pointer' }}>Auto</button>
            <button onClick={() => setMode('custom')}
              style={{ padding: '0.25rem 0.75rem', borderRadius: '4px', border: '1px solid var(--panel-border)', background: mode === 'custom' ? 'var(--active-accent)' : 'transparent', color: mode === 'custom' ? '#000' : '#fff', cursor: 'pointer' }}>Custom</button>
            {mode === 'custom' && (
              <>
                <input type="text" placeholder="e.g. 0-1:4, 0-2:8" value={customInput}
                  onChange={e => setCustomInput(e.target.value)}
                  style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid var(--panel-border)', color: '#fff', padding: '0.25rem 0.5rem', borderRadius: '4px', width: '160px' }} />
                <button onClick={applyCustomGraph}
                  style={{ padding: '0.25rem 0.6rem', borderRadius: '4px', border: '1px solid var(--active-accent)', background: 'transparent', color: '#fff', cursor: 'pointer' }}>Apply</button>
              </>
            )}
            
            <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.15)', margin: '0 4px' }} />
            
            {/* Playback Controls */}
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--panel-border)', borderRadius: '4px', overflow: 'hidden' }}>
              <button onClick={handlePrev} disabled={currentStep === 0 || trace.length === 0} style={{ padding: '0.25rem 0.5rem', background: 'transparent', border: 'none', borderRight: '1px solid var(--panel-border)', color: '#fff', cursor: 'pointer', opacity: currentStep === 0 ? 0.3 : 1 }}>⏮</button>
              <button onClick={handlePlayPause} style={{ padding: '0.25rem 0.75rem', background: isPlaying ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: 'var(--active-accent)', fontWeight: 'bold', cursor: 'pointer', width: '60px' }}>
                {isPlaying ? '⏸' : '▶️'}
              </button>
              <button onClick={handleNext} disabled={currentStep >= trace.length - 1} style={{ padding: '0.25rem 0.5rem', background: 'transparent', border: 'none', borderLeft: '1px solid var(--panel-border)', color: '#fff', cursor: 'pointer', opacity: currentStep >= trace.length - 1 ? 0.3 : 1 }}>⏭</button>
            </div>

            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '8px' }}>Speed:</span>
            <input type="range" min="100" max="1500" value={1500 - speed + 100}
              onChange={e => setSpeed(1500 - parseInt(e.target.value) + 100)}
              style={{ width: '80px', accentColor: 'var(--active-accent)' }} />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={initGraph}
              style={{ background: 'transparent', border: '1px solid var(--panel-border)', color: '#fff', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer' }}>Reset</button>
          </div>
        </div>
        {errorMsg && <div style={{ color: '#ff4444', marginBottom: '0.5rem', fontSize: '0.8rem' }}>{errorMsg}</div>}

        {/* Canvas */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <canvas ref={canvasRef} width={500} height={400}
            style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', background: 'rgba(0,0,0,0.4)', maxWidth: '100%' }} />
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          <span><span style={{ color: '#ffc800' }}>■</span> Evaluating/Current</span>
          <span><span style={{ color: '#00ff88' }}>■</span> Active/Accepted Path</span>
          {algorithmId === 'kruskal' && <span><span style={{ color: 'rgba(255,50,50,0.5)' }}>■</span> Rejected (Cycle)</span>}
          <span><span style={{ color: 'rgba(255,255,255,0.15)' }}>■</span> Unvisited</span>
        </div>
      </div>

      <StepLog steps={historySteps} currentStep={currentStep} />
    </div>
  );
};

export default GraphVisualizer;
