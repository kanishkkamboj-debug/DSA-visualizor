import React, { useState, useEffect, useRef } from 'react';
import StepLog from './StepLog';

const AdvancedDSAVisualizer = ({ algorithmId }) => {
  const [speed, setSpeed] = useState(300);
  const [mode, setMode] = useState('auto');
  const [customInput, setCustomInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // --- Snapshot Animation Engine State ---
  const [trace, setTrace] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    initData();
  }, [algorithmId]);

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

  const initData = () => {
    setIsPlaying(false);
    setTrace([]);
    setCurrentStep(0);
    setErrorMsg('');
  };

  const applyCustom = () => {
    if (!customInput.trim()) return;
    initData();
  };

  const getInitialData = () => {
    if (mode === 'custom' && customInput) {
      if (algorithmId === 'rolling_hash') return customInput;
      if (algorithmId === 'trie') return customInput.split(',').map(s => s.trim());
      return customInput.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    }
    switch (algorithmId) {
      case 'segment_tree': return [1, 3, 5, 7, 9, 11];
      case 'fenwick_tree': return [3, 2, -1, 6, 5, 4, -3, 3, 7, 2];
      case 'sparse_table': return [4, 6, 1, 5, 7, 3];
      case 'rolling_hash': return "ababa";
      case 'trie': return ["apple", "app", "bat"];
      default: return [];
    }
  };

  const executeAlgo = () => {
    if (trace.length > 0 && currentStep === 0) { setIsPlaying(true); return; }
    if (currentStep > 0 && currentStep < trace.length - 1) { setIsPlaying(true); return; }
    if (currentStep >= trace.length - 1 && trace.length > 0) { setCurrentStep(0); setIsPlaying(true); return; }

    const newTrace = [];
    
    const pushState = (vars={}, array=[], active=[], processed=[], graphNodes=[], table=[], msg='') => {
      newTrace.push({
        variables: { ...vars },
        array: [...array],
        activeIndices: [...active],
        processedIndices: [...processed],
        graphNodes: JSON.parse(JSON.stringify(graphNodes)),
        table: JSON.parse(JSON.stringify(table)),
        msg
      });
    };

    pushState({}, [], [], [], [], [], `Starting ${algorithmId.replaceAll('_', ' ')}...`);

    const data = getInitialData();

    switch (algorithmId) {
      case 'trie': runTrie(data, pushState); break;
      case 'segment_tree': runSegmentTree(data, pushState); break;
      case 'fenwick_tree': runFenwickTree(data, pushState); break;
      case 'sparse_table': runSparseTable(data, pushState); break;
      case 'rolling_hash': runRollingHash(data, pushState); break;
      default: pushState({}, [], [], [], [], [], `Logic for ${algorithmId} pending.`); break;
    }

    if (newTrace.length === 1) pushState({}, [], [], [], [], [], 'Finished.');

    setTrace(newTrace);
    setCurrentStep(0);
    setIsPlaying(true);
  };

  // --- Algorithms ---

  const runTrie = (words, pushState) => {
    const root = { char: 'Root', children: {}, isEnd: false, id: 0 };
    let idCounter = 1;
    const searchWord = words.length > 0 ? words[words.length - 1] : "app";
    const graphNodes = [root]; // Flattened for rendering state
    
    pushState({ WordsToInsert: JSON.stringify(words) }, [], [], [], graphNodes, [], `Initializing Empty Trie.`);
    
    // Insert
    for (const word of words) {
      pushState({ Inserting: word }, [], [], [], graphNodes, [], `Inserting word: "${word}"`);
      let node = root;
      let pathStr = "";
      for (const char of word) {
        pathStr += char;
        if (!node.children[char]) {
          const newNode = { char, children: {}, isEnd: false, path: pathStr, id: idCounter++ };
          node.children[char] = newNode;
          graphNodes.push(newNode);
          pushState({ Inserting: word, Char: char }, [], [], [], graphNodes, [], `Created new node for '${char}'`);
        } else {
          pushState({ Inserting: word, Char: char }, [], [], [], graphNodes, [], `Node for '${char}' already exists. Moving down.`);
        }
        node = node.children[char];
      }
      node.isEnd = true;
      pushState({ Inserting: word }, [], [], [], graphNodes, [], `Reached end of "${word}". Marked as EndOfWord.`);
    }

    // Search
    pushState({ Searching: searchWord }, [], [], [], graphNodes, [], `Searching for word: "${searchWord}"`);
    let node = root;
    let found = true;
    for (const char of searchWord) {
      if (!node.children[char]) {
        found = false;
        pushState({ Searching: searchWord, Char: char }, [], [], [], graphNodes, [], `❌ Character '${char}' not found. Search failed.`);
        break;
      }
      pushState({ Searching: searchWord, Char: char }, [], [], [], graphNodes, [], `Found character '${char}'. Moving down.`);
      node = node.children[char];
    }
    
    if (found) {
      if (node.isEnd) pushState({ Searching: searchWord }, [], [], [], graphNodes, [], `✅ Found end of word flag. Search successful!`);
      else pushState({ Searching: searchWord }, [], [], [], graphNodes, [], `❌ Found prefix, but isEnd flag is false.`);
    }
  };

  const runSegmentTree = (arr, pushState) => {
    const n = arr.length;
    const tree = new Array(4 * n).fill(null);
    
    pushState({ Array: JSON.stringify(arr), N: n }, tree, [], [], [], [], `Building Segment Tree for array of size ${n}`);

    const build = (node, start, end) => {
      pushState({ Array: JSON.stringify(arr), NodeIdx: node, Range: `[${start}, ${end}]` }, tree, [node], [], [], [], `Building tree node ${node} for range [${start}, ${end}]`);
      if (start === end) {
        tree[node] = arr[start];
        pushState({ Array: JSON.stringify(arr) }, tree, [node], [], [], [], `Leaf node reached. tree[${node}] = ${arr[start]}`);
        return;
      }
      const mid = Math.floor((start + end) / 2);
      build(2 * node + 1, start, mid);
      build(2 * node + 2, mid + 1, end);
      tree[node] = tree[2 * node + 1] + tree[2 * node + 2];
      pushState({ Array: JSON.stringify(arr), SumCalculated: `${tree[2*node+1]} + ${tree[2*node+2]}` }, tree, [node], [2*node+1, 2*node+2], [], [], `tree[${node}] = ${tree[node]} (Sum of children)`);
    };

    build(0, 0, n - 1);
    pushState({ Built: 'True' }, tree, [], [], [], [], `✅ Segment Tree build complete.`);
    
    // Query Example
    const qStart = 1, qEnd = 3;
    let totalSum = 0;
    const query = (node, start, end, l, r) => {
      pushState({ QueryRange: `[${l}, ${r}]`, NodeRange: `[${start}, ${end}]` }, tree, [node], [], [], [], `Querying node ${node}`);
      if (r < start || end < l) {
        pushState({ QueryRange: `[${l}, ${r}]`, NodeRange: `[${start}, ${end}]` }, tree, [node], [], [], [], `Completely outside range. Return 0.`);
        return 0;
      }
      if (l <= start && end <= r) {
        pushState({ QueryRange: `[${l}, ${r}]`, NodeRange: `[${start}, ${end}]` }, tree, [node], [], [], [], `Completely inside range. Return ${tree[node]}.`);
        return tree[node];
      }
      const mid = Math.floor((start + end) / 2);
      const p1 = query(2 * node + 1, start, mid, l, r);
      const p2 = query(2 * node + 2, mid + 1, end, l, r);
      pushState({ QueryRange: `[${l}, ${r}]`, NodeRange: `[${start}, ${end}]`, PartialSums: `${p1} + ${p2}` }, tree, [node], [], [], [], `Partial overlap. Summing children: ${p1 + p2}`);
      return p1 + p2;
    };
    
    totalSum = query(0, 0, n - 1, qStart, qEnd);
    pushState({ Query: `Sum [${qStart}, ${qEnd}]`, Result: totalSum }, tree, [], [], [], [], `✅ Query complete. Sum is ${totalSum}`);
  };

  const runFenwickTree = (arr, pushState) => {
    const n = arr.length;
    const tree = new Array(n + 1).fill(0); // 1-indexed
    
    pushState({ Array: JSON.stringify(arr), N: n }, tree, [], [], [], [], `Building Fenwick Tree (Binary Indexed Tree)`);
    
    const update = (i, delta) => {
      pushState({ Array: JSON.stringify(arr), UpdateIdx: i, Delta: delta }, tree, [i], [], [], [], `Updating index ${i} with delta ${delta}`);
      for (; i <= n; i += i & (-i)) {
        tree[i] += delta;
        pushState({ Array: JSON.stringify(arr), UpdateIdx: i, Delta: delta, TreeUpdated: `tree[${i}] = ${tree[i]}` }, tree, [i], [], [], [], `Added ${delta} to tree[${i}]`);
      }
    };
    
    for (let i = 0; i < n; i++) update(i + 1, arr[i]);
    pushState({ Built: 'True' }, tree, [], [], [], [], `✅ Fenwick Tree built.`);
    
    // Query
    const qStart = 2, qEnd = 5; // array indices 1 to 4 (1-based: 2 to 5)
    
    const query = (i) => {
      let sum = 0;
      pushState({ QueryIdx: i }, tree, [i], [], [], [], `Querying prefix sum up to ${i}`);
      for (; i > 0; i -= i & (-i)) {
        sum += tree[i];
        pushState({ QueryIdx: i, SumSoFar: sum, Added: tree[i] }, tree, [i], [], [], [], `Added tree[${i}] to sum.`);
      }
      return sum;
    };
    
    const r = query(qEnd);
    const l = query(qStart - 1);
    pushState({ QueryRange: `[${qStart}, ${qEnd}]`, Result: r - l }, tree, [], [], [], [], `✅ Range Sum Query = Query(${qEnd}) - Query(${qStart - 1}) = ${r} - ${l} = ${r - l}`);
  };

  const runSparseTable = (arr, pushState) => {
    const n = arr.length;
    const LOG = Math.floor(Math.log2(n)) + 1;
    const table = Array.from({length: LOG}, () => new Array(n).fill(null));
    
    pushState({ Array: JSON.stringify(arr), N: n, LOG_N: LOG }, [], [], [], [], table, `Building Sparse Table for Range Minimum Query.`);
    
    for (let i = 0; i < n; i++) table[0][i] = arr[i];
    pushState({ Step: 'Initialization' }, [], [], [], [], table, `Initialized Level 0 with array elements.`);
    
    for (let j = 1; j < LOG; j++) {
      for (let i = 0; i + (1 << j) <= n; i++) {
        const left = table[j-1][i];
        const right = table[j-1][i + (1 << (j-1))];
        table[j][i] = Math.min(left, right);
        pushState({ Level: j, Index: i, Length: 1 << j }, [], [], [], [], table, `table[${j}][${i}] = min(${left}, ${right}) = ${table[j][i]}`);
      }
    }
    
    pushState({ Built: 'True' }, [], [], [], [], table, `✅ Sparse Table built in O(N log N).`);
    
    const l = 1, r = 4;
    const len = r - l + 1;
    const k = Math.floor(Math.log2(len));
    const minVal = Math.min(table[k][l], table[k][r - (1 << k) + 1]);
    
    pushState({ Query: `[${l}, ${r}]`, Length: len, K: k, Min: minVal }, [], [], [], [], table, `✅ Query [${l}, ${r}]. min(table[${k}][${l}], table[${k}][${r - (1<<k) + 1}]) = ${minVal}`);
  };

  const runRollingHash = (s, pushState) => {
    const base = 31, mod = 1e9 + 7;
    const n = s.length;
    const h = new Array(n + 1).fill(0);
    const pw = new Array(n + 1).fill(1);
    
    pushState({ String: s, Base: base, Modulo: '1e9+7' }, [], [], [], [], [], `Building Rolling Hash arrays.`);
    
    for (let i = 0; i < n; i++) {
      h[i+1] = (h[i] * base + s.charCodeAt(i)) % mod;
      pw[i+1] = (pw[i] * base) % mod;
      pushState({ Index: i, Char: s[i], Ascii: s.charCodeAt(i) }, [], [], [], [], [], `Calculated hash prefix for "${s.slice(0, i+1)}"`);
    }
    
    pushState({ Built: 'True', HashArray: JSON.stringify(h), Powers: JSON.stringify(pw) }, [], [], [], [], [], `✅ Hash and Powers arrays built.`);
    
    const getHash = (l, r) => {
      let res = (h[r+1] - h[l] * pw[r-l+1] % mod + mod) % mod;
      return res;
    };
    
    const l1 = 0, r1 = 2; // "aba"
    const l2 = 2, r2 = 4; // "aba"
    const h1 = getHash(l1, r1);
    const h2 = getHash(l2, r2);
    
    pushState({ Substring1: s.slice(l1, r1+1), Substring2: s.slice(l2, r2+1), Match: h1 === h2 ? 'Yes' : 'No' }, [], [], [], [], [], `O(1) Hash Comparison: Hash("${s.slice(l1, r1+1)}") = ${h1}, Hash("${s.slice(l2, r2+1)}") = ${h2}`);
  };


  // --- Playback Controls ---
  const handlePlayPause = () => { if (trace.length === 0) executeAlgo(); else setIsPlaying(!isPlaying); };
  const handleNext = () => { setIsPlaying(false); if (currentStep < trace.length - 1) setCurrentStep(c => c + 1); };
  const handlePrev = () => { setIsPlaying(false); if (currentStep > 0) setCurrentStep(c => c - 1); };

  // --- Rendering ---
  const currentState = trace[currentStep] || { variables: {}, array: [], activeIndices: [], processedIndices: [], graphNodes: [], table: [], msg: 'Ready.' };
  const historySteps = trace.slice(0, currentStep + 1).map(t => t.msg).filter(m => m);

  const renderArray = () => {
    if (!currentState.array || currentState.array.length === 0) return null;
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center', marginTop: '2rem' }}>
        {currentState.array.map((item, i) => {
          if (item === null) return null; 
          const isActive = currentState.activeIndices.includes(i);
          const isProcessed = currentState.processedIndices.includes(i);
          
          let bg = 'rgba(255,255,255,0.05)', border = '1px solid rgba(255,255,255,0.1)', color = '#fff';
          if (isActive) { bg = 'var(--active-accent)'; border = '1px solid var(--active-accent)'; color = '#000'; }
          else if (isProcessed) { bg = 'rgba(0,255,136,0.1)'; border = '1px solid rgba(0,255,136,0.3)'; color = '#00ff88'; }
          
          return (
            <div key={i} style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: bg, border, borderRadius: '4px', color, fontSize: '0.9rem', fontFamily: 'monospace' }}>
              <div>{item}</div>
              <div style={{ fontSize: '0.6rem', opacity: 0.5, marginTop: '4px' }}>[{i}]</div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderTrie = () => {
    if (algorithmId !== 'trie' || currentState.graphNodes.length === 0) return null;
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginTop: '2rem' }}>
        {currentState.graphNodes.map((node, i) => (
          <div key={i} style={{ padding: '12px', background: node.isEnd ? 'rgba(0,255,136,0.1)' : 'rgba(255,255,255,0.05)', border: `1px solid ${node.isEnd ? '#00ff88' : 'rgba(255,255,255,0.1)'}`, borderRadius: '8px', color: '#fff', fontSize: '1.2rem', fontFamily: 'monospace', textAlign: 'center' }}>
            <div style={{ fontWeight: 'bold', color: 'var(--active-accent)' }}>{node.char}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Path: {node.path || 'ROOT'}</div>
          </div>
        ))}
      </div>
    );
  };

  const renderTable = () => {
    if (algorithmId !== 'sparse_table' || currentState.table.length === 0) return null;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', justifyContent: 'center', marginTop: '2rem' }}>
        {currentState.table.map((row, j) => (
          <div key={j} style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <div style={{ width: '60px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Row {j}:</div>
            {row.map((val, i) => (
              <div key={i} style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: val !== null ? '#fff' : 'transparent', fontSize: '1rem', fontFamily: 'monospace' }}>
                {val}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', gap: '1rem', width: '100%', height: '100%' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        
        {/* Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => { setMode('auto'); initData(); setTimeout(executeAlgo, 100); }}
              style={{ padding: '0.25rem 0.65rem', borderRadius: '4px', border: '1px solid var(--panel-border)', background: mode === 'auto' ? 'var(--active-accent)' : 'transparent', color: mode === 'auto' ? '#000' : '#fff', cursor: 'pointer', fontSize: '0.8rem' }}>
              Auto
            </button>
            <button onClick={() => setMode('custom')}
              style={{ padding: '0.25rem 0.65rem', borderRadius: '4px', border: '1px solid var(--panel-border)', background: mode === 'custom' ? 'var(--active-accent)' : 'transparent', color: mode === 'custom' ? '#000' : '#fff', cursor: 'pointer', fontSize: '0.8rem' }}>
              Custom
            </button>
            {mode === 'custom' && (
              <>
                <input type="text" placeholder="e.g. 1,3,5 or apple,app" value={customInput}
                  onChange={e => setCustomInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && applyCustom()}
                  style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid var(--panel-border)', color: '#fff', padding: '0.25rem 0.5rem', borderRadius: '4px', width: '120px', fontSize: '0.8rem' }} />
                <button onClick={applyCustom}
                  style={{ padding: '0.25rem 0.6rem', borderRadius: '4px', border: '1px solid var(--active-accent)', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: '0.8rem' }}>
                  Apply
                </button>
              </>
            )}
            <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.15)', margin: '0 4px' }} />
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--panel-border)', borderRadius: '4px', overflow: 'hidden' }}>
              <button onClick={handlePrev} disabled={currentStep === 0 || trace.length === 0} style={{ padding: '0.25rem 0.5rem', background: 'transparent', border: 'none', borderRight: '1px solid var(--panel-border)', color: '#fff', cursor: 'pointer', opacity: currentStep === 0 ? 0.3 : 1 }}>⏮</button>
              <button onClick={handlePlayPause} style={{ padding: '0.25rem 0.75rem', background: isPlaying ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: 'var(--active-accent)', fontWeight: 'bold', cursor: 'pointer', width: '60px' }}>{isPlaying ? '⏸' : '▶️'}</button>
              <button onClick={handleNext} disabled={currentStep >= trace.length - 1} style={{ padding: '0.25rem 0.5rem', background: 'transparent', border: 'none', borderLeft: '1px solid var(--panel-border)', color: '#fff', cursor: 'pointer', opacity: currentStep >= trace.length - 1 ? 0.3 : 1 }}>⏭</button>
            </div>
            <input type="range" min="100" max="1500" value={1500 - speed + 100} onChange={e => setSpeed(1500 - parseInt(e.target.value) + 100)} style={{ width: '80px', accentColor: 'var(--active-accent)' }} />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={initData} style={{ background: 'transparent', border: '1px solid var(--panel-border)', color: '#fff', padding: '0.35rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Reset</button>
          </div>
        </div>

        {/* Variables Tracker */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflowY: 'auto' }}>
          
          {Object.keys(currentState.variables).length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '2rem', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', width: '80%', maxWidth: '600px' }}>
              <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '1rem' }}>Computation State</div>
              {Object.entries(currentState.variables).map(([key, val]) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{key}</span>
                  <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--active-accent)', fontFamily: 'Fira Code, monospace' }}>{val}</span>
                </div>
              ))}
            </div>
          )}

          {renderArray()}
          {renderTrie()}
          {renderTable()}

        </div>
      </div>
      <StepLog steps={historySteps} currentStep={currentStep} />
    </div>
  );
};

export default AdvancedDSAVisualizer;
