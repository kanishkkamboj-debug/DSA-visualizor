import React, { useState, useEffect, useRef } from 'react';
import StepLog from './StepLog';

const LinkedListVisualizer = ({ algorithmId }) => {
  // lists: { L1: [1,2,3,4], L2: [5,6] }
  const [lists, setLists] = useState({ L1: [] });
  // connections: custom next pointers if not sequential. e.g. cycle: { 'L1_4': 'L1_2' }
  const [connections, setConnections] = useState({});
  
  const [speed, setSpeed] = useState(300);
  const [mode, setMode] = useState('auto');
  const [customInputA, setCustomInputA] = useState('');
  const [customInputB, setCustomInputB] = useState('');
  
  const [isRunning, setIsRunning] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Visualization State
  const [steps, setSteps] = useState([]);
  // pointers: { name: { listId: 'L1', idx: 0 } }
  const [pointers, setPointers] = useState({});
  const [activeNodes, setActiveNodes] = useState([]); // Array of string IDs e.g. ['L1_0', 'L1_1']
  const [processedNodes, setProcessedNodes] = useState([]);
  const [variables, setVariables] = useState({});

  const abortController = useRef(null);

  useEffect(() => {
    reset();
  }, [algorithmId]);

  const needsTwoLists = ['ll_merge_sorted', 'll_intersection'].includes(algorithmId);
  const isLRU = algorithmId === 'll_lru';

  const reset = () => {
    if (abortController.current) abortController.current.abort();
    generateData();
    setIsRunning(false);
    setSteps([]);
    setPointers({});
    setActiveNodes([]);
    setProcessedNodes([]);
    setVariables({});
    setErrorMsg('');
  };

  const generateData = () => {
    if (mode === 'custom' && customInputA) {
      setLists({
        L1: customInputA.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n)),
        ...(needsTwoLists && customInputB ? { L2: customInputB.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n)) } : {})
      });
      setConnections({});
      return;
    }
    
    // Auto generation
    if (algorithmId === 'll_cycle') {
      setLists({ L1: [3, 2, 0, -4, 5, 8] });
      setConnections({ 'L1_5': 'L1_1' }); // tail points to index 1
    } else if (algorithmId === 'll_merge_sorted') {
      setLists({ L1: [1, 2, 4], L2: [1, 3, 4] });
      setConnections({});
    } else if (algorithmId === 'll_intersection') {
      // Y-shape. L1 is main. L2 merges into L1 at index 3.
      setLists({ L1: [4, 1, 8, 4, 5], L2: [5, 6, 1] });
      setConnections({ 'L2_2': 'L1_2' });
    } else if (algorithmId === 'll_reverse_k') {
      setLists({ L1: [1, 2, 3, 4, 5, 6, 7, 8] });
      setConnections({});
    } else if (isLRU) {
      setLists({ L1: [] }); // LRU manages its own internal state visualization
      setConnections({});
    } else {
      setLists({ L1: [1, 2, 3, 4, 5] });
      setConnections({});
    }
  };

  const applyCustom = () => {
    const parsedA = customInputA.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    if (parsedA.length === 0) {
      setErrorMsg('Please enter valid numbers for List 1.');
      return;
    }
    setErrorMsg('');
    if (abortController.current) abortController.current.abort();
    setIsRunning(false);
    setSteps([]); setPointers({}); setActiveNodes([]); setProcessedNodes([]); setVariables({});
    
    setLists({
      L1: parsedA,
      ...(needsTwoLists ? { L2: customInputB.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n)) } : {})
    });
    setConnections({});
  };

  const sleep = (ms, signal) => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(resolve, ms);
      signal.addEventListener('abort', () => {
        clearTimeout(timeout);
        reject(new DOMException('Aborted', 'AbortError'));
      });
    });
  };

  const addStep = (msg) => setSteps(prev => [...prev, msg]);

  const execute = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setSteps([]); setPointers({}); setActiveNodes([]); setProcessedNodes([]); setVariables({});
    
    abortController.current = new AbortController();
    const signal = abortController.current.signal;

    try {
      // Deep copy lists and connections for manipulation
      const workingLists = JSON.parse(JSON.stringify(lists));
      const workingConns = JSON.parse(JSON.stringify(connections));
      
      switch (algorithmId) {
        case 'll_reverse': await runReverse(workingLists, signal); break;
        case 'll_cycle': await runCycle(workingLists, workingConns, signal); break;
        case 'll_middle': await runMiddle(workingLists, signal); break;
        case 'll_merge_sorted': await runMerge(workingLists, signal); break;
        case 'll_remove_nth': await runRemoveNth(workingLists, signal); break;
        case 'll_intersection': await runIntersection(workingLists, workingConns, signal); break;
        case 'll_reverse_k': await runReverseK(workingLists, signal); break;
        case 'll_lru': await runLRU(signal); break;
        default: addStep(`Logic for ${algorithmId} coming soon.`);
      }
      if (!signal.aborted) addStep('Algorithm complete.');
    } catch (err) {
      if (err.name !== 'AbortError') console.error(err);
      addStep('Execution stopped.');
    } finally {
      setIsRunning(false);
    }
  };

  const abort = () => { if (abortController.current) abortController.current.abort(); };

  // --- Algorithm Implementations ---

  const runReverse = async (listsObj, signal) => {
    addStep('Iterative Reverse Linked List');
    let l1 = listsObj.L1;
    let prev = null;
    let curr = 0; // index acts as pointer for our array representation
    
    setVariables({ prev: 'null', curr: `Node(${l1[curr]})`, next: 'null' });

    // In a visualizer, to show reversing, we can flip arrows. 
    // We'll manage connections: initially L1_0 -> L1_1. We change to L1_1 -> L1_0.
    const conns = {};
    for(let i=0; i<l1.length-1; i++) conns[`L1_${i}`] = `L1_${i+1}`;
    setConnections({...conns});

    while (curr < l1.length) {
      setPointers({ 
        prev: prev !== null ? { listId: 'L1', idx: prev } : null,
        curr: { listId: 'L1', idx: curr }
      });
      setActiveNodes([`L1_${curr}`]);
      
      const next = curr + 1;
      setVariables({ 
        prev: prev !== null ? `Node(${l1[prev]})` : 'null', 
        curr: `Node(${l1[curr]})`, 
        next: next < l1.length ? `Node(${l1[next]})` : 'null' 
      });
      
      addStep(`Saving next node. Changing curr.next to point to prev.`);
      await sleep(speed * 1.5, signal);
      
      // Flip connection
      delete conns[`L1_${curr}`];
      if (prev !== null) {
        conns[`L1_${curr}`] = `L1_${prev}`;
      } else {
        conns[`L1_${curr}`] = 'null';
      }
      setConnections({...conns});
      
      addStep(`Moving prev to curr, and curr to next.`);
      setProcessedNodes(p => [...p, `L1_${curr}`]);
      prev = curr;
      curr = next;
      await sleep(speed * 1.2, signal);
    }
    
    setPointers({ prev: { listId: 'L1', idx: prev } });
    addStep(`Curr is null. Prev is the new head.`);
  };

  const runCycle = async (listsObj, conns, signal) => {
    addStep('Floyd\'s Cycle Finding Algorithm (Tortoise and Hare)');
    let slow = 0, fast = 0;
    
    // Helper to get next node based on sequential array and custom connections
    const getNext = (idx) => {
      const conn = conns[`L1_${idx}`];
      if (conn) {
        return parseInt(conn.split('_')[1]);
      }
      return idx + 1 < listsObj.L1.length ? idx + 1 : null;
    };

    while (true) {
      setPointers({ Slow: { listId: 'L1', idx: slow }, Fast: { listId: 'L1', idx: fast } });
      setActiveNodes([`L1_${slow}`, `L1_${fast}`]);
      addStep(`Slow at Node(${listsObj.L1[slow]}), Fast at Node(${listsObj.L1[fast]})`);
      await sleep(speed * 1.5, signal);

      const fastNext1 = getNext(fast);
      if (fastNext1 === null) {
        addStep('Fast reached end. No cycle detected.');
        return;
      }
      const fastNext2 = getNext(fastNext1);
      if (fastNext2 === null) {
        addStep('Fast reached end. No cycle detected.');
        return;
      }

      slow = getNext(slow);
      fast = fastNext2;

      addStep('Moving Slow by 1, Fast by 2.');
      await sleep(speed, signal);

      if (slow === fast) {
        setPointers({ Slow_and_Fast: { listId: 'L1', idx: slow } });
        setActiveNodes([`L1_${slow}`]);
        addStep(`Slow and Fast met at Node(${listsObj.L1[slow]}). Cycle detected!`);
        return;
      }
    }
  };

  const runMiddle = async (listsObj, signal) => {
    addStep('Find Middle Node (Fast and Slow Pointers)');
    let slow = 0, fast = 0;
    const len = listsObj.L1.length;

    while (fast !== null && fast + 1 < len) {
      setPointers({ Slow: { listId: 'L1', idx: slow }, Fast: { listId: 'L1', idx: fast } });
      setActiveNodes([`L1_${slow}`, `L1_${fast}`]);
      addStep(`Slow at Node(${listsObj.L1[slow]}), Fast at Node(${listsObj.L1[fast]})`);
      await sleep(speed * 1.2, signal);

      slow += 1;
      fast += 2;
      if (fast >= len) fast = null;
      
      addStep('Moving Slow by 1, Fast by 2.');
      await sleep(speed, signal);
    }
    
    setPointers({ Slow: { listId: 'L1', idx: slow } });
    if (fast !== null) setPointers({ Slow: { listId: 'L1', idx: slow }, Fast: { listId: 'L1', idx: fast } });
    
    addStep(`Fast cannot move 2 steps. Middle node is Slow: Node(${listsObj.L1[slow]}).`);
    setProcessedNodes([`L1_${slow}`]);
  };

  const runMerge = async (listsObj, signal) => {
    addStep('Merge Two Sorted Lists using a Dummy Node');
    let p1 = 0, p2 = 0;
    const res = [];
    
    while (p1 < listsObj.L1.length && p2 < listsObj.L2.length) {
      setPointers({ P1: { listId: 'L1', idx: p1 }, P2: { listId: 'L2', idx: p2 } });
      setActiveNodes([`L1_${p1}`, `L2_${p2}`]);
      
      const val1 = listsObj.L1[p1];
      const val2 = listsObj.L2[p2];
      
      addStep(`Comparing P1(${val1}) and P2(${val2})`);
      await sleep(speed * 1.5, signal);
      
      if (val1 <= val2) {
        addStep(`P1 <= P2. Adding ${val1} to result, moving P1.`);
        res.push(val1);
        setProcessedNodes(p => [...p, `L1_${p1}`]);
        p1++;
      } else {
        addStep(`P2 < P1. Adding ${val2} to result, moving P2.`);
        res.push(val2);
        setProcessedNodes(p => [...p, `L2_${p2}`]);
        p2++;
      }
      setVariables({ 'Merged List': JSON.stringify(res) });
      await sleep(speed, signal);
    }
    
    if (p1 < listsObj.L1.length) {
      addStep('L2 exhausted. Appending remainder of L1.');
      while (p1 < listsObj.L1.length) {
        res.push(listsObj.L1[p1]);
        setProcessedNodes(p => [...p, `L1_${p1}`]);
        p1++;
      }
    } else if (p2 < listsObj.L2.length) {
      addStep('L1 exhausted. Appending remainder of L2.');
      while (p2 < listsObj.L2.length) {
        res.push(listsObj.L2[p2]);
        setProcessedNodes(p => [...p, `L2_${p2}`]);
        p2++;
      }
    }
    setVariables({ 'Merged List': JSON.stringify(res) });
    setPointers({});
  };

  const runRemoveNth = async (listsObj, signal) => {
    const n = 2; // Hardcoded N=2 for visualizer
    setVariables({ N: n });
    addStep(`Remove Nth Node from End (N=${n}). Using dummy node and two pointers.`);
    
    let fast = 0;
    addStep(`Moving Fast pointer ${n} steps ahead.`);
    for(let i=0; i<n; i++) {
      setPointers({ Fast: { listId: 'L1', idx: fast } });
      await sleep(speed * 1.2, signal);
      fast++;
    }
    
    let slow = 0; // Represents dummy node conceptually initially, but we map to array index
    // To properly show dummy, we'd need a phantom node. We will approximate by stopping early.
    addStep('Moving Slow and Fast together until Fast reaches end.');
    while (fast < listsObj.L1.length) {
      setPointers({ Slow: { listId: 'L1', idx: slow }, Fast: { listId: 'L1', idx: fast } });
      setActiveNodes([`L1_${slow}`, `L1_${fast}`]);
      await sleep(speed * 1.5, signal);
      slow++;
      fast++;
    }
    
    // slow is now pointing to node BEFORE the one to delete
    const targetIdx = slow; 
    addStep(`Fast reached end. Slow is pointing to node before target. Removing index ${targetIdx}.`);
    setPointers({ Slow: { listId: 'L1', idx: slow-1 }, Target: { listId: 'L1', idx: targetIdx } });
    setActiveNodes([`L1_${targetIdx}`]);
    
    await sleep(speed * 2, signal);
    
    // Visually bypass the node
    const conns = {};
    for(let i=0; i<listsObj.L1.length-1; i++) {
      if (i === slow - 1) {
        conns[`L1_${i}`] = targetIdx + 1 < listsObj.L1.length ? `L1_${targetIdx+1}` : 'null';
      } else if (i !== targetIdx) {
        conns[`L1_${i}`] = `L1_${i+1}`;
      }
    }
    setConnections(conns);
    setProcessedNodes([`L1_${targetIdx}`]); // Highlight deleted node as "processed/gone"
    addStep('Node bypassed. Algorithm complete.');
  };

  const runIntersection = async (listsObj, conns, signal) => {
    addStep('Find Intersection Point (Two Pointers Method)');
    let pA = { listId: 'L1', idx: 0 };
    let pB = { listId: 'L2', idx: 0 };

    const getNext = (p) => {
      const conn = conns[`${p.listId}_${p.idx}`];
      if (conn) {
        const [lid, i] = conn.split('_');
        return { listId: lid, idx: parseInt(i) };
      }
      return p.idx + 1 < listsObj[p.listId].length ? { listId: p.listId, idx: p.idx + 1 } : null;
    };

    while (true) {
      setPointers({ PA: pA, PB: pB });
      setActiveNodes([`${pA.listId}_${pA.idx}`, `${pB.listId}_${pB.idx}`]);
      
      addStep(`PA at ${pA.listId}[${pA.idx}], PB at ${pB.listId}[${pB.idx}]`);
      await sleep(speed * 1.5, signal);

      if (pA.listId === pB.listId && pA.idx === pB.idx) {
        addStep(`Intersection found at ${pA.listId}[${pA.idx}]!`);
        setProcessedNodes([`${pA.listId}_${pA.idx}`]);
        return;
      }

      pA = getNext(pA);
      pB = getNext(pB);

      if (pA === null && pB === null) {
        addStep('Reached ends without intersection.');
        return;
      }

      if (pA === null) {
        addStep('PA reached end, redirecting to Head of L2.');
        pA = { listId: 'L2', idx: 0 };
      }
      if (pB === null) {
        addStep('PB reached end, redirecting to Head of L1.');
        pB = { listId: 'L1', idx: 0 };
      }
      await sleep(speed * 0.5, signal);
    }
  };

  const runReverseK = async (listsObj, signal) => {
    const k = 3;
    setVariables({ K: k });
    addStep(`Reverse Nodes in k-Group (K=${k}).`);
    addStep('Requires complex pointer manipulation. Check the Code tab for implementation specifics.');
    
    // Simplify visual for K-group
    let l1 = [...listsObj.L1];
    for (let i = 0; i < l1.length; i += k) {
      if (i + k <= l1.length) {
        addStep(`Reversing group from index ${i} to ${i + k - 1}`);
        setActiveNodes(Array.from({length: k}, (_, x) => `L1_${i+x}`));
        await sleep(speed * 1.5, signal);
        
        // reverse subarray visually
        const sub = l1.slice(i, i+k).reverse();
        for(let j=0; j<k; j++) l1[i+j] = sub[j];
        
        setLists({ L1: [...l1] });
        setProcessedNodes(p => [...p, ...Array.from({length: k}, (_, x) => `L1_${i+x}`)]);
        await sleep(speed, signal);
      } else {
        addStep(`Remaining nodes (< ${k}) are left as is.`);
      }
    }
  };

  const runLRU = async (signal) => {
    const cap = 3;
    setVariables({ Capacity: cap });
    addStep(`LRU Cache implementation (Capacity = ${cap}).`);
    
    const ops = [
      { type: 'PUT', key: 1, val: 10 },
      { type: 'PUT', key: 2, val: 20 },
      { type: 'PUT', key: 3, val: 30 },
      { type: 'GET', key: 2, expected: 20 },
      { type: 'PUT', key: 4, val: 40 }, // Evicts 1
      { type: 'GET', key: 1, expected: -1 },
    ];
    
    let cache = []; // visually represent doubly linked list as array [most recent ... least recent]
    
    for (const op of ops) {
      addStep(`Executing ${op.type}(${op.key}${op.val ? `, ${op.val}` : ''})`);
      
      if (op.type === 'PUT') {
        const idx = cache.findIndex(item => item.key === op.key);
        if (idx !== -1) {
          cache.splice(idx, 1);
        } else if (cache.length >= cap) {
          const evicted = cache.pop();
          addStep(`Capacity reached. Evicting LRU key: ${evicted.key}`);
        }
        cache.unshift({ key: op.key, val: op.val });
      } else {
        const idx = cache.findIndex(item => item.key === op.key);
        if (idx !== -1) {
          const item = cache.splice(idx, 1)[0];
          cache.unshift(item);
          addStep(`Found key ${op.key}. Moving to Most Recently Used position.`);
        } else {
          addStep(`Key ${op.key} not found.`);
        }
      }
      
      setVariables({ Capacity: cap, 'Cache State (MRU -> LRU)': JSON.stringify(cache.map(c => `{${c.key}:${c.val}}`)) });
      await sleep(speed * 2, signal);
    }
    addStep('LRU Sequence complete.');
  };

  // --- Rendering Helpers ---

  const renderList = (listId, array) => {
    if (!array || array.length === 0) return null;
    return (
      <div key={listId} style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'center', marginBottom: '2rem', position: 'relative' }}>
        {array.map((val, idx) => {
          const nodeId = `${listId}_${idx}`;
          const isActive = activeNodes.includes(nodeId);
          const isProcessed = processedNodes.includes(nodeId);
          
          let bg = 'rgba(255,255,255,0.05)', border = '1px solid rgba(255,255,255,0.1)';
          let color = 'var(--text-muted)', shadow = 'none';

          if (isActive) {
            bg = 'var(--active-accent)'; border = '1px solid var(--active-accent)';
            color = '#000'; shadow = '0 0 15px var(--active-accent)';
          } else if (isProcessed) {
            bg = 'rgba(0, 255, 136, 0.2)'; border = '1px solid #00ff88';
            color = '#00ff88';
          }

          const myPointers = Object.entries(pointers).filter(([_, p]) => p?.listId === listId && p?.idx === idx);
          
          // Determine where arrow points
          const customTarget = connections[nodeId];
          let arrowText = '→';
          let arrowColor = 'rgba(255,255,255,0.2)';
          if (customTarget) {
            if (customTarget === 'null') arrowText = '⊘';
            else {
              arrowText = '⤻'; // cycle/jump indicator
              arrowColor = 'var(--active-accent)';
            }
          }

          return (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
              <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ height: '24px', display: 'flex', gap: '2px', alignItems: 'flex-end', marginBottom: '4px' }}>
                  {myPointers.map(([pName]) => (
                    <div key={pName} style={{ background: '#ff00ff', color: '#fff', fontSize: '0.65rem', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace' }}>
                      {pName} ↓
                    </div>
                  ))}
                </div>
                
                <div style={{ display: 'flex' }}>
                  <div style={{
                    width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: bg, border: border, borderRadius: '6px 0 0 6px', color: color,
                    fontSize: '1.1rem', fontWeight: isActive || isProcessed ? 'bold' : 'normal',
                    boxShadow: shadow, transition: 'all 0.2s ease', fontFamily: 'Fira Code, monospace'
                  }}>
                    {val}
                  </div>
                  <div style={{
                    width: '20px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(255,255,255,0.02)', border: border, borderLeft: 'none', borderRadius: '0 6px 6px 0',
                    color: 'rgba(255,255,255,0.2)'
                  }}>
                    •
                  </div>
                </div>
                <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>{listId}[{idx}]</div>
              </div>

              {/* Next Arrow */}
              {idx < array.length - 1 && (
                <div style={{ fontSize: '1.5rem', margin: '0 0.5rem', color: arrowColor, marginTop: '12px' }}>
                  {arrowText}
                </div>
              )}
              {/* Null terminator if last node and no cycle */}
              {idx === array.length - 1 && !customTarget && (
                <div style={{ fontSize: '1.2rem', margin: '0 0.5rem', color: 'rgba(255,255,255,0.2)', marginTop: '12px' }}>
                  ⊘
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', gap: '1rem', width: '100%', height: '100%' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        
        {/* Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button onClick={() => { setMode('auto'); reset(); }} style={{ padding: '0.25rem 0.65rem', borderRadius: '4px', border: '1px solid var(--panel-border)', background: mode === 'auto' ? 'var(--active-accent)' : 'transparent', color: mode === 'auto' ? '#000' : '#fff', cursor: 'pointer', fontSize: '0.8rem' }}>Auto</button>
            <button onClick={() => setMode('custom')} style={{ padding: '0.25rem 0.65rem', borderRadius: '4px', border: '1px solid var(--panel-border)', background: mode === 'custom' ? 'var(--active-accent)' : 'transparent', color: mode === 'custom' ? '#000' : '#fff', cursor: 'pointer', fontSize: '0.8rem' }}>Custom</button>
            {mode === 'custom' && (
              <div style={{ display: 'flex', gap: '4px' }}>
                <input type="text" placeholder="L1 (e.g. 1,2,3)" value={customInputA} onChange={e => setCustomInputA(e.target.value)} style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid var(--panel-border)', color: '#fff', padding: '0.25rem 0.5rem', borderRadius: '4px', width: '100px', fontSize: '0.8rem' }} />
                {needsTwoLists && (
                  <input type="text" placeholder="L2 (e.g. 4,5,6)" value={customInputB} onChange={e => setCustomInputB(e.target.value)} style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid var(--panel-border)', color: '#fff', padding: '0.25rem 0.5rem', borderRadius: '4px', width: '100px', fontSize: '0.8rem' }} />
                )}
                <button onClick={applyCustom} style={{ padding: '0.25rem 0.6rem', borderRadius: '4px', border: '1px solid var(--active-accent)', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: '0.8rem' }}>Apply</button>
              </div>
            )}
            <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.15)', margin: '0 4px' }} />
            <input type="range" min="20" max="600" value={600 - speed + 20} onChange={e => setSpeed(600 - parseInt(e.target.value) + 20)} style={{ width: '80px', accentColor: 'var(--active-accent)' }} />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={reset} disabled={isRunning} style={{ background: 'transparent', border: '1px solid var(--panel-border)', color: '#fff', padding: '0.35rem 0.8rem', borderRadius: '4px', cursor: isRunning ? 'not-allowed' : 'pointer', opacity: isRunning ? 0.5 : 1, fontSize: '0.8rem' }}>Reset</button>
            <button onClick={isRunning ? abort : execute} style={{ background: isRunning ? '#ff4444' : 'var(--active-accent)', border: 'none', color: '#000', fontWeight: 'bold', padding: '0.35rem 1.2rem', borderRadius: '4px', cursor: 'pointer', boxShadow: '0 0 10px var(--active-accent)', fontSize: '0.8rem' }}>{isRunning ? 'Stop' : 'Execute'}</button>
          </div>
        </div>
        {errorMsg && <div style={{ color: '#ff4444', marginBottom: '0.5rem', fontSize: '0.8rem' }}>{errorMsg}</div>}

        {/* Variables Tracker */}
        {Object.keys(variables).length > 0 && (
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', padding: '0.75rem', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)', flexWrap: 'wrap' }}>
            {Object.entries(variables).map(([key, val]) => (
              <div key={key} style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>{key}</span>
                <span style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--active-accent)', fontFamily: 'Fira Code, monospace' }}>{val}</span>
              </div>
            ))}
          </div>
        )}

        {/* Visualization Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', overflowY: 'auto' }}>
          {isLRU ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Watch Variables Tracker for Cache State</div>
          ) : (
            <>
              {Object.entries(lists).map(([listId, array]) => renderList(listId, array))}
            </>
          )}
        </div>
      </div>
      <StepLog steps={steps} currentStep={steps.length - 1} />
    </div>
  );
};

export default LinkedListVisualizer;
