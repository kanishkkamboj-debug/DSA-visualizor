import React, { useState, useEffect, useRef } from 'react';
import StepLog from './StepLog';

const HashVisualizer = ({ algorithmId }) => {
  const [speed, setSpeed] = useState(300);
  const [mode, setMode] = useState('auto');
  const [customInputA, setCustomInputA] = useState('');
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
    if (!customInputA.trim()) return;
    initData();
  };

  const getInitialData = () => {
    if (mode === 'custom' && customInputA) {
      if (algorithmId === 'group_anagrams') {
        return customInputA.split(',').map(s => s.trim());
      } else {
        return customInputA.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
      }
    }
    
    switch (algorithmId) {
      case 'freq_count': return [2, 1, 2, 3, 1, 1, 4];
      case 'two_sum_hash': return [2, 7, 11, 15];
      case 'subarray_sum_k': return [1, 1, 1]; // K will be 2
      case 'longest_consecutive': return [100, 4, 200, 1, 3, 2];
      case 'group_anagrams': return ["eat", "tea", "tan", "ate", "nat", "bat"];
      default: return [1, 2, 3, 4, 5];
    }
  };

  const executeAlgo = () => {
    if (trace.length > 0 && currentStep === 0) { setIsPlaying(true); return; }
    if (currentStep > 0 && currentStep < trace.length - 1) { setIsPlaying(true); return; }
    if (currentStep >= trace.length - 1 && trace.length > 0) { setCurrentStep(0); setIsPlaying(true); return; }

    const inputData = getInitialData();
    const newTrace = [];
    
    const pushState = (inputArr, hashMap, ptrs={}, actInput=[], procInput=[], vars={}, msg='') => {
      newTrace.push({
        inputArr: [...inputArr],
        hashMap: { ...hashMap }, // visual representation object
        pointers: { ...ptrs },
        activeInput: [...actInput],
        processedInput: [...procInput],
        variables: { ...vars },
        msg
      });
    };

    pushState(inputData, {}, {}, [], [], {}, `Starting ${algorithmId.replaceAll('_', ' ')}...`);

    const arr = [...inputData];

    switch (algorithmId) {
      case 'freq_count': runFreqCount(arr, pushState); break;
      case 'two_sum_hash': runTwoSumHash(arr, pushState); break;
      case 'subarray_sum_k': runSubarraySumK(arr, pushState); break;
      case 'longest_consecutive': runLongestConsecutive(arr, pushState); break;
      case 'group_anagrams': runGroupAnagrams(arr, pushState); break;
      default: pushState(arr, {}, {}, [], [], {}, `Logic for ${algorithmId} pending.`); break;
    }

    if (newTrace.length === 1) pushState(arr, {}, {}, [], [], {}, 'Finished.');

    setTrace(newTrace);
    setCurrentStep(0);
    setIsPlaying(true);
  };

  // --- Algorithms ---

  const runFreqCount = (arr, pushState) => {
    const map = {};
    const proc = [];
    
    for (let i = 0; i < arr.length; i++) {
      const val = arr[i];
      pushState(arr, map, { i }, [i], proc, {}, `Reading ${val}`);
      
      map[val] = (map[val] || 0) + 1;
      proc.push(i);
      
      pushState(arr, map, { i }, [i], proc, {}, `Updated count for ${val} to ${map[val]}`);
    }
    pushState(arr, map, {}, [], proc, {}, `✅ Frequency Count complete.`);
  };

  const runTwoSumHash = (arr, pushState) => {
    const target = 9; // Hardcoded for visualizer if array doesn't inherently imply one
    const map = {}; // val -> index
    const proc = [];
    
    pushState(arr, map, {}, [], [], { Target: target }, `Searching for Two Sum target: ${target}`);
    
    for (let i = 0; i < arr.length; i++) {
      const val = arr[i];
      const comp = target - val;
      pushState(arr, map, { i }, [i], proc, { Target: target, Complement: comp }, `Checking ${val}. Need complement ${comp}`);
      
      if (map[comp] !== undefined) {
        pushState(arr, map, { i }, [i, map[comp]], proc, { Target: target, Complement: comp }, `✅ Found complement ${comp} at index ${map[comp]}!`);
        return;
      }
      
      map[val] = i;
      proc.push(i);
      pushState(arr, map, { i }, [i], proc, { Target: target }, `Complement not found. Added ${val} to map.`);
    }
    pushState(arr, map, {}, [], proc, { Target: target }, `❌ No two elements sum to ${target}.`);
  };

  const runSubarraySumK = (arr, pushState) => {
    const k = 2; // target
    let count = 0, prefix = 0;
    const map = { 0: 1 };
    const proc = [];
    
    pushState(arr, map, {}, [], [], { Target_K: k, PrefixSum: prefix, Count: count }, `Subarray Sum Equals K. Initialized map with 0:1`);
    
    for (let i = 0; i < arr.length; i++) {
      const val = arr[i];
      prefix += val;
      const comp = prefix - k;
      
      pushState(arr, map, { i }, [i], proc, { Target_K: k, PrefixSum: prefix, Complement: comp, Count: count }, `Added ${val} to prefix. Checking map for complement ${comp}`);
      
      if (map[comp]) {
        count += map[comp];
        pushState(arr, map, { i }, [i], proc, { Target_K: k, PrefixSum: prefix, Complement: comp, Count: count }, `✅ Found ${comp} in map ${map[comp]} time(s). Count is now ${count}`);
      } else {
        pushState(arr, map, { i }, [i], proc, { Target_K: k, PrefixSum: prefix, Complement: comp, Count: count }, `Complement not in map.`);
      }
      
      map[prefix] = (map[prefix] || 0) + 1;
      proc.push(i);
      pushState(arr, map, { i }, [i], proc, { Target_K: k, PrefixSum: prefix, Count: count }, `Added/updated prefix sum ${prefix} in map.`);
    }
    pushState(arr, map, {}, [], proc, { FinalCount: count }, `✅ Total subarrays sum to ${k}: ${count}`);
  };

  const runLongestConsecutive = (arr, pushState) => {
    const set = {};
    for (let i = 0; i < arr.length; i++) set[arr[i]] = 'present';
    
    pushState(arr, set, {}, [], [], {}, `Added all elements to HashSet for O(1) lookups.`);
    
    let longest = 0;
    const proc = [];
    
    for (let i = 0; i < arr.length; i++) {
      const num = arr[i];
      pushState(arr, set, { i }, [i], proc, { Longest: longest }, `Checking if ${num} is the start of a sequence.`);
      
      if (!set[num - 1]) {
        pushState(arr, set, { i }, [i], proc, { Longest: longest, CurrentSeq: num }, `${num-1} not in set. ${num} IS a start!`);
        let currNum = num;
        let currLen = 1;
        
        while (set[currNum + 1]) {
          currNum += 1;
          currLen += 1;
          pushState(arr, set, { i }, [i], proc, { Longest: longest, CurrentSeq: `${num}..${currNum}`, Len: currLen }, `Found next consecutive ${currNum} in set.`);
        }
        
        longest = Math.max(longest, currLen);
        pushState(arr, set, { i }, [i], proc, { Longest: longest }, `Sequence stopped. Max length so far: ${longest}`);
      } else {
        pushState(arr, set, { i }, [i], proc, { Longest: longest }, `${num-1} is in set. ${num} is NOT a start, skipping.`);
      }
      proc.push(i);
    }
    pushState(arr, set, {}, [], proc, { FinalLongest: longest }, `✅ Longest Consecutive Sequence length is ${longest}.`);
  };

  const runGroupAnagrams = (arr, pushState) => {
    const map = {};
    const proc = [];
    
    for (let i = 0; i < arr.length; i++) {
      const str = arr[i];
      pushState(arr, map, { i }, [i], proc, {}, `Processing string "${str}"`);
      
      const key = str.split('').sort().join('');
      pushState(arr, map, { i }, [i], proc, { SortedKey: key }, `Sorted representation: "${key}"`);
      
      if (!map[key]) map[key] = [];
      map[key].push(str);
      proc.push(i);
      
      pushState(arr, map, { i }, [i], proc, { SortedKey: key }, `Grouped "${str}" under key "${key}"`);
    }
    pushState(arr, map, {}, [], proc, { TotalGroups: Object.keys(map).length }, `✅ Grouping complete.`);
  };


  // --- Playback Controls ---
  const handlePlayPause = () => { if (trace.length === 0) executeAlgo(); else setIsPlaying(!isPlaying); };
  const handleNext = () => { setIsPlaying(false); if (currentStep < trace.length - 1) setCurrentStep(c => c + 1); };
  const handlePrev = () => { setIsPlaying(false); if (currentStep > 0) setCurrentStep(c => c - 1); };

  // --- Rendering ---
  const currentState = trace[currentStep] || { inputArr: getInitialData(), hashMap: {}, pointers: {}, activeInput: [], processedInput: [], variables: {}, msg: 'Ready.' };
  const historySteps = trace.slice(0, currentStep + 1).map(t => t.msg).filter(m => m);

  const renderArrayHorizontal = (arr, title, activeIndices, processedIndices, pointersObj) => {
    if (!arr || arr.length === 0) return null;
    return (
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{title}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center' }}>
          {arr.map((val, idx) => {
            const isActive = activeIndices.includes(idx);
            const isProcessed = processedIndices.includes(idx);
            
            let bg = 'rgba(255,255,255,0.05)', border = '1px solid rgba(255,255,255,0.1)', color = 'var(--text-muted)', shadow = 'none';
            if (isActive) { bg = 'var(--active-accent)'; border = '1px solid var(--active-accent)'; color = '#000'; shadow = '0 0 15px var(--active-accent)'; }
            else if (isProcessed) { bg = 'rgba(0,255,136,0.1)'; border = '1px solid rgba(0,255,136,0.3)'; color = '#00ff88'; }

            const myPointers = Object.entries(pointersObj).filter(([_, p]) => p === idx);

            return (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ height: '20px', display: 'flex', gap: '2px', alignItems: 'flex-end', marginBottom: '4px' }}>
                  {myPointers.map(([pName]) => <div key={pName} style={{ background: '#ff00ff', color: '#fff', fontSize: '0.55rem', padding: '2px 4px', borderRadius: '4px' }}>{pName}↓</div>)}
                </div>
                <div style={{ minWidth: '40px', padding: '0 8px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: bg, border, borderRadius: '6px', color, fontSize: '1.1rem', fontWeight: isActive ? 'bold' : 'normal', boxShadow: shadow, fontFamily: 'Fira Code, monospace' }}>
                  {val}
                </div>
                <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>{idx}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderHashMap = (map) => {
    const entries = Object.entries(map);
    if (entries.length === 0) return null;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', marginTop: '1rem' }}>
        <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Hash Map / Set State</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '8px', width: '100%', maxWidth: '600px' }}>
          {entries.map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--panel-border)', borderRadius: '6px', padding: '6px 12px' }}>
              <span style={{ color: 'var(--active-accent)', fontFamily: 'Fira Code, monospace', fontSize: '0.9rem' }}>{k}</span>
              <span style={{ color: '#fff', fontSize: '0.8rem', fontFamily: 'monospace' }}>{Array.isArray(v) ? `[${v.join(', ')}]` : v}</span>
            </div>
          ))}
        </div>
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
              Auto Demo
            </button>
            <button onClick={() => setMode('custom')}
              style={{ padding: '0.25rem 0.65rem', borderRadius: '4px', border: '1px solid var(--panel-border)', background: mode === 'custom' ? 'var(--active-accent)' : 'transparent', color: mode === 'custom' ? '#000' : '#fff', cursor: 'pointer', fontSize: '0.8rem' }}>
              Custom
            </button>
            {mode === 'custom' && (
              <>
                <input type="text" placeholder="e.g. 2,1,2,3 or eat,tea" value={customInputA}
                  onChange={e => setCustomInputA(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && applyCustom()}
                  style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid var(--panel-border)', color: '#fff', padding: '0.25rem 0.5rem', borderRadius: '4px', width: '130px', fontSize: '0.8rem' }} />
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
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '1rem' }}>
          {renderArrayHorizontal(currentState.inputArr, 'Input Data', currentState.activeInput, currentState.processedInput, currentState.pointers)}
          {renderHashMap(currentState.hashMap)}
        </div>
      </div>
      <StepLog steps={historySteps} currentStep={currentStep} />
    </div>
  );
};

export default HashVisualizer;
