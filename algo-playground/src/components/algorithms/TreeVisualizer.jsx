import React, { useState, useEffect, useRef } from 'react';
import StepLog from './StepLog';

const TreeVisualizer = ({ algorithmId }) => {
  const [speed, setSpeed] = useState(400);
  const [mode, setMode] = useState('auto');
  const [customInput, setCustomInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // --- Snapshot Animation Engine State ---
  const [trace, setTrace] = useState([]); // Array of snapshots
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    initTree();
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

  const initTree = () => {
    setIsPlaying(false);
    setTrace([]);
    setCurrentStep(0);
    setErrorMsg('');
  };

  const applyCustom = () => {
    if (!customInput.trim()) return;
    initTree();
  };

  const getInitialArray = () => {
    if (mode === 'custom' && customInput) {
      return customInput.split(',').map(s => {
        const t = s.trim().toLowerCase();
        return (t === 'null' || t === 'n') ? null : parseInt(t);
      });
    }
    if (algorithmId.startsWith('bst_')) {
      if (algorithmId === 'bst_insert') return [10, 5, 15, 2, 7]; // leaving space to insert
      return [10, 5, 15, 2, 7, 12, 20];
    } else if (algorithmId.startsWith('heap_')) {
      return [50, 30, 40, 10, 20, 35, 15];
    } else {
      return [1, 2, 3, 4, 5, 6, 7];
    }
  };

  const executeTreeAlgo = () => {
    if (trace.length > 0 && currentStep === 0) { setIsPlaying(true); return; }
    if (currentStep > 0 && currentStep < trace.length - 1) { setIsPlaying(true); return; }
    if (currentStep >= trace.length - 1 && trace.length > 0) { setCurrentStep(0); setIsPlaying(true); return; }

    const initArr = getInitialArray();
    const newTrace = [];
    
    const pushState = (arr, ptrs = {}, active = [], proc = [], path = [], vars = {}, msg = '') => {
      newTrace.push({
        treeArray: [...arr], pointers: { ...ptrs }, activeNodes: [...active],
        processedNodes: [...proc], pathNodes: [...path], variables: { ...vars }, msg
      });
    };

    pushState(initArr, {}, [], [], [], {}, `Starting ${algorithmId.replaceAll('_', ' ')}...`);

    const arrCopy = [...initArr];

    switch (algorithmId) {
      case 'tree_inorder': runInorder(arrCopy, 0, pushState); break;
      case 'tree_preorder': runPreorder(arrCopy, 0, pushState); break;
      case 'tree_postorder': runPostorder(arrCopy, 0, pushState); break;
      case 'tree_level_order': runBFS(arrCopy, pushState); break;
      case 'tree_max_depth': runMaxDepth(arrCopy, 0, pushState); break;
      case 'bst_validate': runValidateBST(arrCopy, 0, -Infinity, Infinity, pushState); break;
      case 'bst_search': runBSTSearch(arrCopy, pushState); break;
      case 'bst_insert': runBSTInsert(arrCopy, pushState); break;
      case 'heap_max': runHeapify(arrCopy, pushState); break;
      default: pushState(arrCopy, {}, [], [], [], {}, `Logic for ${algorithmId} coming soon.`); break;
    }

    if (newTrace.length === 1) pushState(arrCopy, {}, [], [], [], {}, 'Finished.');

    setTrace(newTrace);
    setCurrentStep(0);
    setIsPlaying(true);
  };

  // --- Algorithms ---

  const isValid = (arr, idx) => idx < arr.length && arr[idx] !== null && arr[idx] !== undefined;

  const runInorder = (arr, rootIdx, pushState, proc = []) => {
    if (!isValid(arr, rootIdx)) return proc;
    pushState(arr, { Curr: rootIdx }, [rootIdx], proc, [], {}, `Visiting Node(${arr[rootIdx]})`);
    
    proc = runInorder(arr, 2 * rootIdx + 1, pushState, proc);
    
    proc.push(rootIdx);
    pushState(arr, { Curr: rootIdx }, [rootIdx], proc, [], {}, `Processing Node(${arr[rootIdx]})`);
    
    proc = runInorder(arr, 2 * rootIdx + 2, pushState, proc);
    return proc;
  };

  const runPreorder = (arr, rootIdx, pushState, proc = []) => {
    if (!isValid(arr, rootIdx)) return proc;
    
    proc.push(rootIdx);
    pushState(arr, { Curr: rootIdx }, [rootIdx], proc, [], {}, `Processing Node(${arr[rootIdx]})`);
    
    proc = runPreorder(arr, 2 * rootIdx + 1, pushState, proc);
    proc = runPreorder(arr, 2 * rootIdx + 2, pushState, proc);
    return proc;
  };

  const runPostorder = (arr, rootIdx, pushState, proc = []) => {
    if (!isValid(arr, rootIdx)) return proc;
    
    pushState(arr, { Curr: rootIdx }, [rootIdx], proc, [], {}, `Visiting Node(${arr[rootIdx]})`);
    proc = runPostorder(arr, 2 * rootIdx + 1, pushState, proc);
    proc = runPostorder(arr, 2 * rootIdx + 2, pushState, proc);
    
    proc.push(rootIdx);
    pushState(arr, { Curr: rootIdx }, [rootIdx], proc, [], {}, `Processing Node(${arr[rootIdx]})`);
    return proc;
  };

  const runBFS = (arr, pushState) => {
    if (!isValid(arr, 0)) return;
    const queue = [0];
    const proc = [];
    
    while (queue.length > 0) {
      const curr = queue.shift();
      proc.push(curr);
      pushState(arr, { Curr: curr }, [curr], proc, [], { QueueSize: queue.length }, `Dequeued Node(${arr[curr]})`);
      
      const left = 2 * curr + 1;
      const right = 2 * curr + 2;
      if (isValid(arr, left)) queue.push(left);
      if (isValid(arr, right)) queue.push(right);
    }
    pushState(arr, {}, [], proc, [], {}, `BFS Complete.`);
  };

  const runMaxDepth = (arr, rootIdx, pushState) => {
    const dfs = (idx) => {
      if (!isValid(arr, idx)) return 0;
      pushState(arr, { Curr: idx }, [idx], [], [], {}, `Checking Node(${arr[idx]})`);
      const left = dfs(2 * idx + 1);
      const right = dfs(2 * idx + 2);
      const depth = Math.max(left, right) + 1;
      pushState(arr, { Curr: idx }, [idx], [], [], { Node: arr[idx], LeftD: left, RightD: right, Max: depth }, `Depth of Node(${arr[idx]}) is ${depth}`);
      return depth;
    };
    dfs(0);
    pushState(arr, {}, [], [], [], {}, `Max Depth Complete.`);
  };

  const runValidateBST = (arr, rootIdx, min, max, pushState) => {
    let isValidBST = true;
    const dfs = (idx, minV, maxV) => {
      if (!isValid(arr, idx) || !isValidBST) return;
      const val = arr[idx];
      pushState(arr, { Curr: idx }, [idx], [], [], { Min: minV, Max: maxV, Val: val }, `Checking if ${minV} < ${val} < ${maxV}`);
      if (val <= minV || val >= maxV) {
        isValidBST = false;
        pushState(arr, { Curr: idx }, [idx], [], [], {}, `❌ Invalid BST! Node(${val}) out of bounds.`);
        return;
      }
      dfs(2 * idx + 1, minV, val);
      dfs(2 * idx + 2, val, maxV);
    };
    dfs(0, -Infinity, Infinity);
    if (isValidBST) pushState(arr, {}, [], [], [], {}, `✅ Tree is a valid BST.`);
  };

  const runBSTSearch = (arr, pushState) => {
    const target = (mode === 'custom' && customInput && customInput.split('|')[1]) ? parseInt(customInput.split('|')[1]) : arr[Math.floor(Math.random() * arr.length)];
    let curr = 0;
    const path = [];
    
    pushState(arr, { Curr: curr }, [curr], [], path, { Target: target }, `Searching for ${target}`);
    
    while (isValid(arr, curr)) {
      path.push(curr);
      pushState(arr, { Curr: curr }, [curr], [], path, { Target: target, Val: arr[curr] }, `Checking Node(${arr[curr]}) against Target(${target})`);
      
      if (arr[curr] === target) {
        pushState(arr, { Curr: curr }, [curr], [curr], path, { Target: target }, `✅ Found ${target}!`);
        return;
      } else if (target < arr[curr]) {
        pushState(arr, { Curr: curr }, [curr], [], path, { Target: target }, `${target} < ${arr[curr]}. Going Left.`);
        curr = 2 * curr + 1;
      } else {
        pushState(arr, { Curr: curr }, [curr], [], path, { Target: target }, `${target} > ${arr[curr]}. Going Right.`);
        curr = 2 * curr + 2;
      }
    }
    pushState(arr, {}, [], [], path, { Target: target }, `❌ ${target} not found in BST.`);
  };

  const runBSTInsert = (arr, pushState) => {
    const valsToInsert = [12, 17, 1];
    
    for (const val of valsToInsert) {
      let curr = 0;
      pushState(arr, { Curr: curr }, [curr], [], [], { Inserting: val }, `Starting insertion of ${val}`);
      
      while (true) {
        if (!isValid(arr, curr)) {
          // Found empty spot
          arr[curr] = val;
          pushState(arr, { Curr: curr }, [curr], [curr], [], { Inserted: val }, `✅ Inserted ${val} at index ${curr}. Tree recalculating layout!`);
          break;
        }
        
        pushState(arr, { Curr: curr }, [curr], [], [], { Inserting: val, Val: arr[curr] }, `Comparing ${val} with ${arr[curr]}`);
        if (val < arr[curr]) {
          pushState(arr, { Curr: curr }, [curr], [], [], { Inserting: val }, `${val} < ${arr[curr]}. Going Left.`);
          curr = 2 * curr + 1;
        } else {
          pushState(arr, { Curr: curr }, [curr], [], [], { Inserting: val }, `${val} >= ${arr[curr]}. Going Right.`);
          curr = 2 * curr + 2;
        }
      }
    }
    pushState(arr, {}, [], [], [], {}, `✅ Insertions complete.`);
  };

  const runHeapify = (arr, pushState) => {
    const n = arr.length;
    const proc = [];
    
    const heapifyDown = (i) => {
      let largest = i;
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      
      if (left < n && arr[left] !== null && arr[left] > arr[largest]) largest = left;
      if (right < n && arr[right] !== null && arr[right] > arr[largest]) largest = right;
      
      pushState(arr, { Curr: i, Largest: largest }, [i, largest], proc, [], {}, `Comparing ${arr[i]} with children... Largest is ${arr[largest]}`);
      
      if (largest !== i) {
        pushState(arr, { Curr: i }, [i, largest], proc, [], {}, `Swapping ${arr[i]} and ${arr[largest]}`);
        [arr[i], arr[largest]] = [arr[largest], arr[i]];
        pushState(arr, { Curr: largest }, [largest], proc, [], {}, `Swapped.`);
        heapifyDown(largest);
      }
    };

    pushState(arr, {}, [], proc, [], {}, `Building Max Heap...`);
    const startIdx = Math.floor(n / 2) - 1;
    for (let i = startIdx; i >= 0; i--) {
      heapifyDown(i);
    }
    pushState(arr, {}, [], arr.map((_, i) => i), [], {}, `✅ Max Heap built successfully.`);
  };


  // --- Playback Controls ---
  const handlePlayPause = () => {
    if (trace.length === 0) executeTreeAlgo();
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
  const currentState = trace[currentStep] || { treeArray: getInitialArray(), pointers: {}, activeNodes: [], processedNodes: [], pathNodes: [], variables: {}, msg: 'Ready.' };
  const historySteps = trace.slice(0, currentStep + 1).map(t => t.msg).filter(m => m);

  const getDepth = (arr) => {
    let d = 0;
    while ((1 << d) - 1 < arr.length) d++;
    return d;
  };

  const renderTree = () => {
    const treeArr = currentState.treeArray;
    if (!treeArr || treeArr.length === 0) return null;
    
    const depth = getDepth(treeArr);
    const canvasWidth = Math.max(600, (1 << (depth - 1)) * 60);
    const canvasHeight = Math.max(300, depth * 80 + 40);
    const nodeRadius = 20;

    const nodes = [];
    const edges = [];

    const getPos = (idx) => {
      let level = 0;
      let temp = idx + 1;
      while (temp > 1) { temp >>= 1; level++; }
      
      const nodesInLevel = 1 << level;
      const posInLevel = (idx + 1) - (1 << level);
      
      const y = 40 + level * 80;
      const spacing = canvasWidth / nodesInLevel;
      const x = spacing / 2 + posInLevel * spacing;
      
      return { x, y };
    };

    treeArr.forEach((val, idx) => {
      if (val === null || val === undefined) return;
      
      const { x, y } = getPos(idx);
      
      const leftIdx = 2 * idx + 1;
      const rightIdx = 2 * idx + 2;
      
      if (leftIdx < treeArr.length && treeArr[leftIdx] !== null && treeArr[leftIdx] !== undefined) {
        const leftPos = getPos(leftIdx);
        edges.push(<line key={`e_${idx}_l`} x1={x} y1={y} x2={leftPos.x} y2={leftPos.y} stroke="rgba(255,255,255,0.2)" strokeWidth="2" style={{ transition: 'all 0.3s ease' }} />);
      }
      if (rightIdx < treeArr.length && treeArr[rightIdx] !== null && treeArr[rightIdx] !== undefined) {
        const rightPos = getPos(rightIdx);
        edges.push(<line key={`e_${idx}_r`} x1={x} y1={y} x2={rightPos.x} y2={rightPos.y} stroke="rgba(255,255,255,0.2)" strokeWidth="2" style={{ transition: 'all 0.3s ease' }} />);
      }

      const isActive = currentState.activeNodes.includes(idx);
      const isProcessed = currentState.processedNodes.includes(idx);
      const isPath = currentState.pathNodes.includes(idx);
      
      let fill = 'rgba(0,0,0,0.8)';
      let stroke = 'rgba(255,255,255,0.2)';
      let textColor = 'var(--text-muted)';
      let filter = 'none';

      if (isActive) { fill = 'var(--active-accent)'; stroke = 'var(--active-accent)'; textColor = '#000'; filter = 'drop-shadow(0 0 8px var(--active-accent))'; }
      else if (isProcessed) { fill = 'rgba(0, 255, 136, 0.2)'; stroke = '#00ff88'; textColor = '#00ff88'; }
      else if (isPath) { fill = 'rgba(255, 0, 255, 0.2)'; stroke = '#ff00ff'; textColor = '#ff00ff'; }

      const myPointers = Object.entries(currentState.pointers).filter(([_, pIdx]) => pIdx === idx);

      nodes.push(
        <g key={`n_${idx}`} style={{ transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
          <circle cx={x} cy={y} r={nodeRadius} fill={fill} stroke={stroke} strokeWidth="2" filter={filter} />
          <text x={x} y={y} textAnchor="middle" dy=".3em" fill={textColor} fontSize="14" fontFamily="monospace" fontWeight={isActive||isProcessed ? "bold" : "normal"}>
            {val}
          </text>
          {myPointers.map(([pName], i) => (
             <text key={`p_${idx}_${i}`} x={x} y={y - nodeRadius - 10 - (i*15)} textAnchor="middle" fill="#ff00ff" fontSize="12" fontWeight="bold">
               {pName} ↓
             </text>
          ))}
          <text x={x + nodeRadius + 5} y={y - nodeRadius} fill="rgba(255,255,255,0.3)" fontSize="10">{idx}</text>
        </g>
      );
    });

    return (
      <svg width="100%" height={canvasHeight} viewBox={`0 0 ${canvasWidth} ${canvasHeight}`} style={{ background: 'transparent' }}>
        {edges}
        {nodes}
      </svg>
    );
  };

  return (
    <div style={{ display: 'flex', gap: '1rem', width: '100%', height: '100%' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        
        {/* Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => { setMode('auto'); initTree(); setTimeout(executeTreeAlgo, 100); }}
              style={{ padding: '0.25rem 0.65rem', borderRadius: '4px', border: '1px solid var(--panel-border)', background: mode === 'auto' ? 'var(--active-accent)' : 'transparent', color: mode === 'auto' ? '#000' : '#fff', cursor: 'pointer', fontSize: '0.8rem' }}>
              Auto Demo
            </button>
            <button onClick={() => setMode('custom')}
              style={{ padding: '0.25rem 0.65rem', borderRadius: '4px', border: '1px solid var(--panel-border)', background: mode === 'custom' ? 'var(--active-accent)' : 'transparent', color: mode === 'custom' ? '#000' : '#fff', cursor: 'pointer', fontSize: '0.8rem' }}>
              Custom
            </button>
            {mode === 'custom' && (
              <>
                <input type="text" placeholder={algorithmId === 'bst_search' ? "Tree | Target" : "e.g. 10,5,15,null,7"} value={customInput}
                  onChange={e => setCustomInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && applyCustom()}
                  style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid var(--panel-border)', color: '#fff', padding: '0.25rem 0.5rem', borderRadius: '4px', width: '150px', fontSize: '0.8rem' }} />
                <button onClick={applyCustom}
                  style={{ padding: '0.25rem 0.6rem', borderRadius: '4px', border: '1px solid var(--active-accent)', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: '0.8rem' }}>
                  Apply
                </button>
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

            <input type="range" min="100" max="1500" value={1500 - speed + 100} onChange={e => setSpeed(1500 - parseInt(e.target.value) + 100)} style={{ width: '80px', accentColor: 'var(--active-accent)' }} />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={initTree} style={{ background: 'transparent', border: '1px solid var(--panel-border)', color: '#fff', padding: '0.35rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Reset</button>
          </div>
        </div>

        {/* Variables Tracker */}
        {Object.keys(currentState.variables).length > 0 && (
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', padding: '0.75rem', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)', flexWrap: 'wrap' }}>
            {Object.entries(currentState.variables).map(([key, val]) => (
              <div key={key} style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>{key}</span>
                <span style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--active-accent)', fontFamily: 'Fira Code, monospace' }}>{val}</span>
              </div>
            ))}
          </div>
        )}

        {/* SVG Tree Area */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'auto', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
          {renderTree()}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          <span><span style={{ color: 'var(--active-accent)' }}>■</span> Active</span>
          <span><span style={{ color: '#00ff88' }}>■</span> Processed/Inserted</span>
          <span><span style={{ color: '#ff00ff' }}>■</span> Path/Target</span>
        </div>
      </div>
      <StepLog steps={historySteps} currentStep={currentStep} />
    </div>
  );
};

export default TreeVisualizer;
