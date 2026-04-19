import React, { useEffect, useRef, useState } from 'react';
import StepLog from './StepLog';

// ---- Union-Find for Kruskal ----
const makeUF = (n) => {
  const parent = Array.from({ length: n }, (_, i) => i);
  const rank = Array(n).fill(0);
  const find = (x) => { if (parent[x] !== x) parent[x] = find(parent[x]); return parent[x]; };
  const union = (a, b) => {
    const ra = find(a), rb = find(b);
    if (ra === rb) return false;
    if (rank[ra] < rank[rb]) parent[ra] = rb;
    else if (rank[ra] > rank[rb]) parent[rb] = ra;
    else { parent[rb] = ra; rank[ra]++; }
    return true;
  };
  return { find, union };
};

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
  const [mstEdges, setMstEdges] = useState([]); // green — accepted
  const [rejectedEdges, setRejectedEdges] = useState([]); // red — cycle
  const [currentEdge, setCurrentEdge] = useState(null); // yellow — currently evaluating
  const [isRunning, setIsRunning] = useState(false);
  const [steps, setSteps] = useState([]);
  const [mode, setMode] = useState('auto');
  const [customInput, setCustomInput] = useState('0-1:4, 0-5:2, 1-2:5, 1-5:3, 2-3:6, 3-4:7, 4-5:9');
  const [errorMsg, setErrorMsg] = useState('');
  const [speed, setSpeed] = useState(600);
  const [result, setResult] = useState(null);
  const abortRef = useRef(null);

  useEffect(() => {
    initGraph();
    return () => { if (abortRef.current) abortRef.current.abort(); };
  }, [algorithmId]);

  const initGraph = () => {
    if (abortRef.current) abortRef.current.abort();
    setIsRunning(false);
    setMstEdges([]); setRejectedEdges([]); setCurrentEdge(null);
    setSteps([]); setResult(null); setErrorMsg('');
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
      setMstEdges([]); setRejectedEdges([]); setCurrentEdge(null);
      setSteps([]); setResult(null); setErrorMsg('');
    } catch(_) {
      setErrorMsg('Invalid format. Use: U-V:W, e.g. 0-1:4, 0-2:8');
    }
  };

  const sleep = ms => new Promise((res, rej) => {
    const t = setTimeout(res, ms);
    abortRef.current?.signal.addEventListener('abort', () => { clearTimeout(t); rej(); });
  });

  const runKruskal = async (nodesArr, edgesArr) => {
    const stepsArr = [];
    const uf = makeUF(nodesArr.length);
    const sorted = [...edgesArr].sort((a, b) => a.weight - b.weight);
    const mst = [];
    const rejected = [];
    let totalWeight = 0;

    stepsArr.push(`Kruskal MST on ${nodesArr.length} nodes, ${edgesArr.length} edges`);
    stepsArr.push(`Step 1: Sort all edges by weight → [${sorted.map(e => `(${nodesArr[e.u]?.id}→${nodesArr[e.v]?.id}:${e.weight})`).join(', ')}]`);
    setSteps([...stepsArr]);
    await sleep(speed);

    for (const edge of sorted) {
      const uNode = nodesArr[edge.u];
      const vNode = nodesArr[edge.v];
      setCurrentEdge(edge);
      stepsArr.push(`Evaluate edge (${uNode?.id}→${vNode?.id}) weight=${edge.weight} — check if adds cycle...`);
      setSteps([...stepsArr]);
      await sleep(speed);

      const canAdd = uf.union(edge.u, edge.v);
      if (canAdd) {
        mst.push(edge);
        totalWeight += edge.weight;
        stepsArr.push(`✅ Added (${uNode?.id}→${vNode?.id}). No cycle. MST weight so far = ${totalWeight}`);
        setMstEdges([...mst]);
      } else {
        rejected.push(edge);
        stepsArr.push(`❌ Skipped (${uNode?.id}→${vNode?.id}). Would create a cycle!`);
        setRejectedEdges([...rejected]);
      }
      setCurrentEdge(null);
      setSteps([...stepsArr]);
      await sleep(speed / 2);

      if (mst.length === nodesArr.length - 1) break;
    }

    stepsArr.push(`✅ MST complete! Total weight = ${totalWeight}. Edges: ${mst.length}`);
    setSteps([...stepsArr]);
    setResult(`MST Total Weight: ${totalWeight}`);
  };

  const execute = async () => {
    if (isRunning) return;
    abortRef.current = new AbortController();
    setIsRunning(true);
    setMstEdges([]); setRejectedEdges([]); setCurrentEdge(null);
    setSteps([]); setResult(null);
    try {
      await runKruskal(nodes, edges);
    } catch (_) {}
    setIsRunning(false);
  };

  // ---- Canvas Drawing ----
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || nodes.length === 0) return;
    const ctx = canvas.getContext('2d');
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--active-accent').trim() || '#ff00ff';

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const edgeKey = (e) => `${Math.min(e.u,e.v)}-${Math.max(e.u,e.v)}`;
    const mstSet = new Set(mstEdges.map(edgeKey));
    const rejSet = new Set(rejectedEdges.map(edgeKey));

    // Draw edges
    edges.forEach(edge => {
      const u = nodes[edge.u], v = nodes[edge.v];
      if (!u || !v) return;
      const key = edgeKey(edge);
      const isCurrent = currentEdge && edgeKey(currentEdge) === key;
      const isMST = mstSet.has(key);
      const isRej = rejSet.has(key);

      ctx.beginPath();
      ctx.moveTo(u.x, u.y);
      ctx.lineTo(v.x, v.y);

      if (isCurrent) { ctx.strokeStyle = '#ffc800'; ctx.lineWidth = 4; ctx.shadowColor = '#ffc800'; ctx.shadowBlur = 15; }
      else if (isMST) { ctx.strokeStyle = '#00ff88'; ctx.lineWidth = 3; ctx.shadowColor = '#00ff88'; ctx.shadowBlur = 12; }
      else if (isRej) { ctx.strokeStyle = 'rgba(255,50,50,0.5)'; ctx.lineWidth = 1; ctx.shadowBlur = 0; }
      else { ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1; ctx.shadowBlur = 0; }

      ctx.stroke();
      ctx.shadowBlur = 0;

      // Weight label
      const mx = (u.x + v.x) / 2, my = (u.y + v.y) / 2;
      ctx.fillStyle = isCurrent ? '#ffc800' : isMST ? '#00ff88' : 'rgba(255,255,255,0.4)';
      ctx.font = 'bold 11px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(edge.weight, mx, my - 6);
    });

    // Draw nodes
    nodes.forEach(node => {
      const inMST = mstEdges.some(e => e.u === node._idx || e.v === node._idx);
      ctx.beginPath();
      ctx.arc(node.x, node.y, 16, 0, 2 * Math.PI);
      ctx.fillStyle = '#05050a';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = accent;
      ctx.shadowColor = accent;
      ctx.shadowBlur = 6;
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px Inter';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.id, node.x, node.y);
    });
  }, [nodes, edges, mstEdges, rejectedEdges, currentEdge]);

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
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '8px' }}>Speed:</span>
            <input type="range" min="100" max="1200" value={1200 - speed + 100}
              onChange={e => setSpeed(1200 - parseInt(e.target.value) + 100)}
              style={{ width: '80px', accentColor: 'var(--active-accent)' }} />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={initGraph} disabled={isRunning}
              style={{ background: 'transparent', border: '1px solid var(--panel-border)', color: '#fff', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', opacity: isRunning ? 0.5 : 1 }}>Reset</button>
            <button onClick={execute} disabled={isRunning}
              style={{ background: 'var(--active-accent)', border: 'none', color: '#000', fontWeight: 'bold', padding: '0.4rem 1.2rem', borderRadius: '4px', cursor: 'pointer', boxShadow: '0 0 10px var(--active-accent)' }}>
              {isRunning ? 'Running...' : 'Execute'}
            </button>
          </div>
        </div>
        {errorMsg && <div style={{ color: '#ff4444', marginBottom: '0.5rem', fontSize: '0.8rem' }}>{errorMsg}</div>}
        {result && <div style={{ color: '#00ff88', marginBottom: '0.5rem', fontWeight: 'bold', textShadow: '0 0 8px #00ff88' }}>{result}</div>}

        {/* Canvas */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <canvas ref={canvasRef} width={500} height={400}
            style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', background: 'rgba(0,0,0,0.4)', maxWidth: '100%' }} />
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          <span><span style={{ color: '#ffc800' }}>■</span> Evaluating</span>
          <span><span style={{ color: '#00ff88' }}>■</span> MST Edge</span>
          <span><span style={{ color: 'rgba(255,50,50,0.5)' }}>■</span> Rejected (Cycle)</span>
          <span><span style={{ color: 'rgba(255,255,255,0.15)' }}>■</span> Unvisited</span>
        </div>
      </div>

      <StepLog steps={steps} />
    </div>
  );
};

export default GraphVisualizer;
