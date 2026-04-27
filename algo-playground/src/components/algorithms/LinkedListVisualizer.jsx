import React, { useState, useEffect, useRef } from 'react';
import StepLog from './StepLog';

const LinkedListVisualizer = ({ algorithmId }) => {
  const [speed, setSpeed] = useState(300);
  const [mode, setMode] = useState('auto');
  const [customInputA, setCustomInputA] = useState('');
  const [customInputB, setCustomInputB] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // --- Snapshot Animation Engine State ---
  const [trace, setTrace] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const needsTwoLists = ['ll_merge_sorted', 'll_intersection'].includes(algorithmId);
  const isLRU = algorithmId === 'll_lru';

  useEffect(() => {
    initLists();
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

  const initLists = () => {
    setIsPlaying(false);
    setTrace([]);
    setCurrentStep(0);
    setErrorMsg('');
  };

  const applyCustom = () => {
    if (!customInputA.trim()) return;
    initLists();
  };

  const getInitialData = () => {
    if (mode === 'custom' && customInputA) {
      const L1 = customInputA.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
      const L2 = needsTwoLists && customInputB ? customInputB.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n)) : [];
      return { lists: { L1, ...(L2.length ? { L2 } : {}) }, conns: {} };
    }
    
    switch (algorithmId) {
      case 'll_cycle': return { lists: { L1: [3, 2, 0, -4, 5, 8] }, conns: { 'L1_5': 'L1_1' } };
      case 'll_merge_sorted': return { lists: { L1: [1, 2, 4], L2: [1, 3, 4] }, conns: {} };
      case 'll_intersection': return { lists: { L1: [4, 1, 8, 4, 5], L2: [5, 6, 1] }, conns: { 'L2_2': 'L1_2' } };
      case 'll_reverse_k': return { lists: { L1: [1, 2, 3, 4, 5, 6, 7, 8] }, conns: {} };
      case 'll_lru': return { lists: { L1: [] }, conns: {} };
      default: return { lists: { L1: [1, 2, 3, 4, 5] }, conns: {} };
    }
  };

  const executeAlgo = () => {
    if (trace.length > 0 && currentStep === 0) { setIsPlaying(true); return; }
    if (currentStep > 0 && currentStep < trace.length - 1) { setIsPlaying(true); return; }
    if (currentStep >= trace.length - 1 && trace.length > 0) { setCurrentStep(0); setIsPlaying(true); return; }

    const { lists: initListsObj, conns: initConns } = getInitialData();
    const newTrace = [];
    
    const pushState = (lists, conns, ptrs={}, act=[], proc=[], vars={}, msg='') => {
      newTrace.push({
        lists: JSON.parse(JSON.stringify(lists)),
        conns: { ...conns },
        pointers: { ...ptrs },
        activeNodes: [...act],
        processedNodes: [...proc],
        variables: { ...vars },
        msg
      });
    };

    pushState(initListsObj, initConns, {}, [], [], {}, `Starting ${algorithmId.replaceAll('_', ' ')}...`);

    const workingLists = JSON.parse(JSON.stringify(initListsObj));
    const workingConns = { ...initConns };

    switch (algorithmId) {
      case 'll_reverse': runReverse(workingLists, pushState); break;
      case 'll_cycle': runCycle(workingLists, workingConns, pushState); break;
      case 'll_middle': runMiddle(workingLists, pushState); break;
      case 'll_merge_sorted': runMerge(workingLists, pushState); break;
      case 'll_remove_nth': runRemoveNth(workingLists, pushState); break;
      case 'll_intersection': runIntersection(workingLists, workingConns, pushState); break;
      case 'll_reverse_k': runReverseK(workingLists, pushState); break;
      case 'll_lru': runLRU(pushState); break;
      default: pushState(workingLists, workingConns, {}, [], [], {}, `Logic for ${algorithmId} pending.`); break;
    }

    if (newTrace.length === 1) pushState(workingLists, workingConns, {}, [], [], {}, 'Finished.');

    setTrace(newTrace);
    setCurrentStep(0);
    setIsPlaying(true);
  };

  // --- Algorithms ---

  const runReverse = (listsObj, pushState) => {
    let l1 = listsObj.L1;
    let prev = null, curr = 0;
    const conns = {};
    for (let i = 0; i < l1.length - 1; i++) conns[`L1_${i}`] = `L1_${i+1}`;
    
    pushState(listsObj, conns, {}, [], [], { Prev: 'null', Curr: `Node(${l1[curr]})` }, `Initializing pointers...`);

    const proc = [];
    while (curr < l1.length) {
      const next = curr + 1;
      const ptrs = { 
        prev: prev !== null ? { listId: 'L1', idx: prev } : null,
        curr: { listId: 'L1', idx: curr },
        next: next < l1.length ? { listId: 'L1', idx: next } : null
      };
      
      pushState(listsObj, conns, ptrs, [`L1_${curr}`], proc, { Prev: prev !== null ? l1[prev] : 'null', Curr: l1[curr], Next: next < l1.length ? l1[next] : 'null' }, `Saving next node, changing curr.next to prev.`);
      
      delete conns[`L1_${curr}`];
      conns[`L1_${curr}`] = prev !== null ? `L1_${prev}` : 'null';
      
      proc.push(`L1_${curr}`);
      pushState(listsObj, conns, ptrs, [`L1_${curr}`], proc, { Prev: prev !== null ? l1[prev] : 'null', Curr: l1[curr] }, `Moved pointers forward.`);
      
      prev = curr;
      curr = next;
    }
    pushState(listsObj, conns, { head: { listId: 'L1', idx: prev } }, [], proc, {}, `✅ Reversal complete.`);
  };

  const runCycle = (listsObj, conns, pushState) => {
    let slow = 0, fast = 0;
    
    const getNext = (idx) => {
      const c = conns[`L1_${idx}`];
      if (c) return parseInt(c.split('_')[1]);
      return idx + 1 < listsObj.L1.length ? idx + 1 : null;
    };

    while (true) {
      pushState(listsObj, conns, { Slow: { listId: 'L1', idx: slow }, Fast: { listId: 'L1', idx: fast } }, [`L1_${slow}`, `L1_${fast}`], [], {}, `Slow at ${slow}, Fast at ${fast}`);
      
      const fastNext1 = getNext(fast);
      if (fastNext1 === null) {
        pushState(listsObj, conns, {}, [], [], {}, `❌ Fast reached end. No cycle.`);
        return;
      }
      const fastNext2 = getNext(fastNext1);
      if (fastNext2 === null) {
        pushState(listsObj, conns, {}, [], [], {}, `❌ Fast reached end. No cycle.`);
        return;
      }

      slow = getNext(slow);
      fast = fastNext2;

      if (slow === fast) {
        pushState(listsObj, conns, { SlowFast: { listId: 'L1', idx: slow } }, [`L1_${slow}`], [`L1_${slow}`], {}, `✅ Slow and Fast met at index ${slow}. Cycle detected!`);
        return;
      }
    }
  };

  const runMiddle = (listsObj, pushState) => {
    let slow = 0, fast = 0;
    const len = listsObj.L1.length;

    while (fast !== null && fast + 1 < len) {
      pushState(listsObj, {}, { Slow: { listId: 'L1', idx: slow }, Fast: { listId: 'L1', idx: fast } }, [`L1_${slow}`, `L1_${fast}`], [], {}, `Slow moves 1 step, Fast moves 2.`);
      slow += 1;
      fast += 2;
      if (fast >= len) fast = null;
    }
    
    const finalPtrs = { Slow: { listId: 'L1', idx: slow } };
    if (fast !== null) finalPtrs.Fast = { listId: 'L1', idx: fast };
    
    pushState(listsObj, {}, finalPtrs, [], [`L1_${slow}`], {}, `✅ Middle node is ${listsObj.L1[slow]} at index ${slow}.`);
  };

  const runMerge = (listsObj, pushState) => {
    let p1 = 0, p2 = 0;
    const res = [];
    const proc = [];
    
    while (p1 < listsObj.L1.length && p2 < listsObj.L2.length) {
      pushState(listsObj, {}, { P1: { listId: 'L1', idx: p1 }, P2: { listId: 'L2', idx: p2 } }, [`L1_${p1}`, `L2_${p2}`], proc, { Merged: JSON.stringify(res) }, `Comparing ${listsObj.L1[p1]} and ${listsObj.L2[p2]}`);
      if (listsObj.L1[p1] <= listsObj.L2[p2]) {
        res.push(listsObj.L1[p1]);
        proc.push(`L1_${p1}`);
        p1++;
      } else {
        res.push(listsObj.L2[p2]);
        proc.push(`L2_${p2}`);
        p2++;
      }
    }
    
    while (p1 < listsObj.L1.length) {
      res.push(listsObj.L1[p1]);
      proc.push(`L1_${p1}`);
      pushState(listsObj, {}, { P1: { listId: 'L1', idx: p1 } }, [`L1_${p1}`], proc, { Merged: JSON.stringify(res) }, `Appending remainder of L1`);
      p1++;
    }
    while (p2 < listsObj.L2.length) {
      res.push(listsObj.L2[p2]);
      proc.push(`L2_${p2}`);
      pushState(listsObj, {}, { P2: { listId: 'L2', idx: p2 } }, [`L2_${p2}`], proc, { Merged: JSON.stringify(res) }, `Appending remainder of L2`);
      p2++;
    }
    pushState(listsObj, {}, {}, [], proc, { FinalMergedList: JSON.stringify(res) }, `✅ Merge complete.`);
  };

  const runRemoveNth = (listsObj, pushState) => {
    const n = 2;
    let fast = 0, slow = 0;
    
    pushState(listsObj, {}, {}, [], [], { N: n }, `Removing ${n}nd node from end.`);
    for (let i = 0; i < n; i++) {
      pushState(listsObj, {}, { Fast: { listId: 'L1', idx: fast } }, [`L1_${fast}`], [], { N: n }, `Moving Fast pointer ${n} steps ahead.`);
      fast++;
    }
    
    while (fast < listsObj.L1.length) {
      pushState(listsObj, {}, { Slow: { listId: 'L1', idx: slow }, Fast: { listId: 'L1', idx: fast } }, [`L1_${slow}`, `L1_${fast}`], [], {}, `Moving Slow and Fast together...`);
      slow++; fast++;
    }
    
    const targetIdx = slow;
    pushState(listsObj, {}, { Slow: { listId: 'L1', idx: slow-1 }, Target: { listId: 'L1', idx: targetIdx } }, [`L1_${targetIdx}`], [], {}, `Fast hit end. Target identified at index ${targetIdx}.`);
    
    const conns = {};
    for (let i = 0; i < listsObj.L1.length - 1; i++) {
      if (i === slow - 1) conns[`L1_${i}`] = targetIdx + 1 < listsObj.L1.length ? `L1_${targetIdx+1}` : 'null';
      else if (i !== targetIdx) conns[`L1_${i}`] = `L1_${i+1}`;
    }
    
    pushState(listsObj, conns, {}, [], [`L1_${targetIdx}`], {}, `✅ Bypassed target node to remove it.`);
  };

  const runIntersection = (listsObj, conns, pushState) => {
    let pA = { listId: 'L1', idx: 0 };
    let pB = { listId: 'L2', idx: 0 };

    const getNext = (p) => {
      const c = conns[`${p.listId}_${p.idx}`];
      if (c) {
        const [lid, i] = c.split('_');
        return { listId: lid, idx: parseInt(i) };
      }
      return p.idx + 1 < listsObj[p.listId].length ? { listId: p.listId, idx: p.idx + 1 } : null;
    };

    while (true) {
      pushState(listsObj, conns, { PA: pA, PB: pB }, [`${pA.listId}_${pA.idx}`, `${pB.listId}_${pB.idx}`], [], {}, `PA at ${pA.listId}[${pA.idx}], PB at ${pB.listId}[${pB.idx}]`);
      
      if (pA.listId === pB.listId && pA.idx === pB.idx) {
        pushState(listsObj, conns, { Intersection: pA }, [], [`${pA.listId}_${pA.idx}`], {}, `✅ Intersection found at ${pA.listId}[${pA.idx}]!`);
        return;
      }

      pA = getNext(pA);
      pB = getNext(pB);

      if (pA === null && pB === null) {
        pushState(listsObj, conns, {}, [], [], {}, `❌ Reached ends without intersection.`);
        return;
      }

      if (pA === null) {
        pushState(listsObj, conns, { PB: pB }, [], [], {}, `PA reached end, redirecting to Head of L2.`);
        pA = { listId: 'L2', idx: 0 };
      }
      if (pB === null) {
        pushState(listsObj, conns, { PA: pA }, [], [], {}, `PB reached end, redirecting to Head of L1.`);
        pB = { listId: 'L1', idx: 0 };
      }
    }
  };

  const runReverseK = (listsObj, pushState) => {
    const k = 3;
    let l1 = [...listsObj.L1];
    const proc = [];
    
    pushState({ L1: l1 }, {}, {}, [], [], { K: k }, `Reversing by K=${k} groups.`);
    
    for (let i = 0; i < l1.length; i += k) {
      if (i + k <= l1.length) {
        const act = Array.from({length: k}, (_, x) => `L1_${i+x}`);
        pushState({ L1: l1 }, {}, {}, act, proc, { K: k }, `Identifying group from index ${i} to ${i + k - 1}`);
        
        const sub = l1.slice(i, i+k).reverse();
        for (let j = 0; j < k; j++) l1[i+j] = sub[j];
        
        proc.push(...act);
        pushState({ L1: [...l1] }, {}, {}, [], proc, { K: k }, `Reversed group in place.`);
      } else {
        pushState({ L1: l1 }, {}, {}, [], proc, { K: k }, `Remaining nodes (< ${k}) are left as is.`);
      }
    }
    pushState({ L1: l1 }, {}, {}, [], proc, {}, `✅ Reverse K-Group complete.`);
  };

  const runLRU = (pushState) => {
    const cap = 3;
    const ops = [
      { type: 'PUT', key: 1, val: 10 }, { type: 'PUT', key: 2, val: 20 },
      { type: 'PUT', key: 3, val: 30 }, { type: 'GET', key: 2, expected: 20 },
      { type: 'PUT', key: 4, val: 40 }, { type: 'GET', key: 1, expected: -1 }
    ];
    let cache = []; 
    
    pushState({ L1: [] }, {}, {}, [], [], { Capacity: cap }, `Initializing LRU Cache with capacity ${cap}`);
    
    for (const op of ops) {
      pushState({ L1: [] }, {}, {}, [], [], { Capacity: cap, Operation: `${op.type}(${op.key})` }, `Executing ${op.type} key ${op.key}...`);
      if (op.type === 'PUT') {
        const idx = cache.findIndex(item => item.key === op.key);
        if (idx !== -1) cache.splice(idx, 1);
        else if (cache.length >= cap) cache.pop();
        cache.unshift({ key: op.key, val: op.val });
      } else {
        const idx = cache.findIndex(item => item.key === op.key);
        if (idx !== -1) {
          const item = cache.splice(idx, 1)[0];
          cache.unshift(item);
        }
      }
      pushState({ L1: [] }, {}, {}, [], [], { Capacity: cap, 'Cache (MRU->LRU)': JSON.stringify(cache) }, `${op.type} done.`);
    }
    pushState({ L1: [] }, {}, {}, [], [], { FinalCache: JSON.stringify(cache) }, `✅ LRU Sequence complete.`);
  };


  // --- Playback Controls ---
  const handlePlayPause = () => { if (trace.length === 0) executeAlgo(); else setIsPlaying(!isPlaying); };
  const handleNext = () => { setIsPlaying(false); if (currentStep < trace.length - 1) setCurrentStep(c => c + 1); };
  const handlePrev = () => { setIsPlaying(false); if (currentStep > 0) setCurrentStep(c => c - 1); };

  // --- Rendering Helpers ---
  const currentState = trace[currentStep] || { lists: getInitialData().lists, conns: getInitialData().conns, pointers: {}, activeNodes: [], processedNodes: [], variables: {}, msg: 'Ready.' };
  const historySteps = trace.slice(0, currentStep + 1).map(t => t.msg).filter(m => m);

  const renderList = (listId, array) => {
    if (!array || array.length === 0) return null;
    return (
      <div key={listId} style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'center', marginBottom: '2rem', position: 'relative' }}>
        {array.map((val, idx) => {
          const nodeId = `${listId}_${idx}`;
          const isActive = currentState.activeNodes.includes(nodeId);
          const isProcessed = currentState.processedNodes.includes(nodeId);
          
          let bg = 'rgba(255,255,255,0.05)', border = '1px solid rgba(255,255,255,0.1)';
          let color = 'var(--text-muted)', shadow = 'none';

          if (isActive) { bg = 'var(--active-accent)'; border = '1px solid var(--active-accent)'; color = '#000'; shadow = '0 0 15px var(--active-accent)'; }
          else if (isProcessed) { bg = 'rgba(0, 255, 136, 0.2)'; border = '1px solid #00ff88'; color = '#00ff88'; }

          const myPointers = Object.entries(currentState.pointers).filter(([_, p]) => p?.listId === listId && p?.idx === idx);
          
          const customTarget = currentState.conns[nodeId];
          let arrowText = '→', arrowColor = 'rgba(255,255,255,0.2)';
          if (customTarget) {
            if (customTarget === 'null') arrowText = '⊘';
            else { arrowText = '⤻'; arrowColor = 'var(--active-accent)'; }
          }

          return (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
              <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ height: '24px', display: 'flex', gap: '2px', alignItems: 'flex-end', marginBottom: '4px' }}>
                  {myPointers.map(([pName]) => (
                    <div key={pName} style={{ background: '#ff00ff', color: '#fff', fontSize: '0.65rem', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace' }}>{pName} ↓</div>
                  ))}
                </div>
                
                <div style={{ display: 'flex' }}>
                  <div style={{ width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: bg, border, borderRadius: '6px 0 0 6px', color, fontSize: '1.1rem', fontWeight: isActive || isProcessed ? 'bold' : 'normal', boxShadow: shadow, transition: 'all 0.2s ease', fontFamily: 'Fira Code, monospace' }}>{val}</div>
                  <div style={{ width: '20px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.02)', border, borderLeft: 'none', borderRadius: '0 6px 6px 0', color: 'rgba(255,255,255,0.2)' }}>•</div>
                </div>
                <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>{listId}[{idx}]</div>
              </div>

              {idx < array.length - 1 && <div style={{ fontSize: '1.5rem', margin: '0 0.5rem', color: arrowColor, marginTop: '12px' }}>{arrowText}</div>}
              {idx === array.length - 1 && !customTarget && <div style={{ fontSize: '1.2rem', margin: '0 0.5rem', color: 'rgba(255,255,255,0.2)', marginTop: '12px' }}>⊘</div>}
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
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => { setMode('auto'); initLists(); setTimeout(executeAlgo, 100); }}
              style={{ padding: '0.25rem 0.65rem', borderRadius: '4px', border: '1px solid var(--panel-border)', background: mode === 'auto' ? 'var(--active-accent)' : 'transparent', color: mode === 'auto' ? '#000' : '#fff', cursor: 'pointer', fontSize: '0.8rem' }}>
              Auto
            </button>
            <button onClick={() => setMode('custom')}
              style={{ padding: '0.25rem 0.65rem', borderRadius: '4px', border: '1px solid var(--panel-border)', background: mode === 'custom' ? 'var(--active-accent)' : 'transparent', color: mode === 'custom' ? '#000' : '#fff', cursor: 'pointer', fontSize: '0.8rem' }}>
              Custom
            </button>
            {mode === 'custom' && (
              <>
                <input type="text" placeholder="L1 (e.g. 1,2,3)" value={customInputA}
                  onChange={e => setCustomInputA(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && applyCustom()}
                  style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid var(--panel-border)', color: '#fff', padding: '0.25rem 0.5rem', borderRadius: '4px', width: '120px', fontSize: '0.8rem' }} />
                {needsTwoLists && (
                  <input type="text" placeholder="L2 (e.g. 4,5,6)" value={customInputB}
                    onChange={e => setCustomInputB(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && applyCustom()}
                    style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid var(--panel-border)', color: '#fff', padding: '0.25rem 0.5rem', borderRadius: '4px', width: '120px', fontSize: '0.8rem' }} />
                )}
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
            <button onClick={initLists} style={{ background: 'transparent', border: '1px solid var(--panel-border)', color: '#fff', padding: '0.35rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Reset</button>
          </div>
        </div>

        {/* Variables Tracker */}
        {Object.keys(currentState.variables).length > 0 && (
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', padding: '0.75rem', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)', flexWrap: 'wrap' }}>
            {Object.entries(currentState.variables).map(([key, val]) => (
              <div key={key} style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>{key}</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--active-accent)', fontFamily: 'Fira Code, monospace' }}>{val}</span>
              </div>
            ))}
          </div>
        )}

        {/* Visualization Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', overflowY: 'auto' }}>
          {isLRU ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Watch Variables Tracker for Cache State History</div>
          ) : (
            <>
              {Object.entries(currentState.lists).map(([listId, array]) => renderList(listId, array))}
            </>
          )}
        </div>
      </div>
      <StepLog steps={historySteps} currentStep={currentStep} />
    </div>
  );
};

export default LinkedListVisualizer;
