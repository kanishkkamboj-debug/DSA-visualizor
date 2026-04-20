import React, { useState, useEffect, useRef } from 'react';
import StepLog from './StepLog';

const HashVisualizer = ({ algorithmId }) => {
  const [inputArray, setInputArray] = useState([]);
  
  const [speed, setSpeed] = useState(300);
  const [mode, setMode] = useState('auto');
  const [customInput, setCustomInput] = useState('');
  
  const [isRunning, setIsRunning] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Visualization State
  const [steps, setSteps] = useState([]);
  const [pointers, setPointers] = useState({}); // array pointers
  const [activeIndices, setActiveIndices] = useState([]);
  const [hashMap, setHashMap] = useState({}); // { key: { val: X, active: bool } }
  const [variables, setVariables] = useState({});
  const [result, setResult] = useState(null);

  const abortController = useRef(null);

  useEffect(() => {
    reset();
  }, [algorithmId]);

  const reset = () => {
    if (abortController.current) abortController.current.abort();
    generateData();
    setIsRunning(false);
    setSteps([]); setPointers({}); setActiveIndices([]); setHashMap({}); setVariables({}); setResult(null);
    setErrorMsg('');
  };

  const generateData = () => {
    if (mode === 'custom' && customInput) {
      if (algorithmId === 'group_anagrams') {
        setInputArray(customInput.split(',').map(s => s.trim()));
      } else {
        setInputArray(customInput.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n)));
      }
      return;
    }
    
    if (algorithmId === 'freq_count') {
      setInputArray([1, 2, 2, 3, 1, 4, 2]);
    } else if (algorithmId === 'two_sum_hash') {
      setInputArray([2, 7, 11, 15]);
    } else if (algorithmId === 'subarray_sum_k') {
      setInputArray([1, 1, 1]);
    } else if (algorithmId === 'longest_consecutive') {
      setInputArray([100, 4, 200, 1, 3, 2]);
    } else if (algorithmId === 'group_anagrams') {
      setInputArray(['eat', 'tea', 'tan', 'ate', 'nat', 'bat']);
    } else {
      setInputArray([1, 2, 3]);
    }
  };

  const applyCustom = () => {
    if (!customInput) return;
    setErrorMsg('');
    reset();
    if (algorithmId === 'group_anagrams') {
      setInputArray(customInput.split(',').map(s => s.trim()));
    } else {
      setInputArray(customInput.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n)));
    }
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

  const updateHash = (k, v, active = true) => {
    setHashMap(prev => ({
      ...prev,
      [k]: { val: v, active }
    }));
  };
  const clearHashActive = () => {
    setHashMap(prev => {
      const next = {};
      for (const k in prev) next[k] = { ...prev[k], active: false };
      return next;
    });
  };

  const execute = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setSteps([]); setPointers({}); setActiveIndices([]); setHashMap({}); setVariables({}); setResult(null);
    
    abortController.current = new AbortController();
    const signal = abortController.current.signal;

    try {
      const arr = [...inputArray];
      switch (algorithmId) {
        case 'freq_count': await runFreqCount(arr, signal); break;
        case 'two_sum_hash': await runTwoSum(arr, signal); break;
        case 'subarray_sum_k': await runSubarraySum(arr, signal); break;
        case 'longest_consecutive': await runLongestConsecutive(arr, signal); break;
        case 'group_anagrams': await runGroupAnagrams(arr, signal); break;
        default: addStep(`Logic for ${algorithmId} coming soon.`);
      }
      if (!signal.aborted) addStep('Algorithm complete.');
    } catch (err) {
      if (err.name !== 'AbortError') console.error(err);
      addStep('Execution stopped.');
    } finally {
      setIsRunning(false);
      clearHashActive();
    }
  };

  const abort = () => { if (abortController.current) abortController.current.abort(); };

  // --- Algorithm Implementations ---

  const runFreqCount = async (arr, signal) => {
    addStep('Frequency Count: O(N) using Hash Map');
    const map = {};
    for (let i = 0; i < arr.length; i++) {
      setPointers({ i }); setActiveIndices([i]);
      const val = arr[i];
      addStep(`Processing ${val}`);
      await sleep(speed, signal);
      
      clearHashActive();
      if (map[val] === undefined) {
        map[val] = 1;
        addStep(`Key ${val} not found. Inserting with count 1.`);
      } else {
        map[val]++;
        addStep(`Key ${val} found. Incrementing count to ${map[val]}.`);
      }
      updateHash(val, map[val], true);
      await sleep(speed * 1.2, signal);
    }
    clearHashActive();
  };

  const runTwoSum = async (arr, signal) => {
    const target = 9;
    setVariables({ Target: target });
    addStep(`Two Sum: Find pair that sums to ${target}. Using complement hash map.`);
    
    const map = {}; // val -> index
    
    for (let i = 0; i < arr.length; i++) {
      setPointers({ i }); setActiveIndices([i]);
      const num = arr[i];
      const complement = target - num;
      setVariables({ Target: target, Complement: `${target} - ${num} = ${complement}` });
      
      addStep(`Checking if complement ${complement} exists in map.`);
      clearHashActive();
      await sleep(speed * 1.5, signal);
      
      if (map[complement] !== undefined) {
        addStep(`Found complement ${complement} at index ${map[complement]}! Match found: [${map[complement]}, ${i}]`);
        updateHash(complement, map[complement], true);
        setResult(`[${map[complement]}, ${i}]`);
        return;
      }
      
      addStep(`Complement ${complement} not found. Storing ${num} -> index ${i}`);
      map[num] = i;
      updateHash(num, i, true);
      await sleep(speed, signal);
    }
    addStep('No valid pair found.');
  };

  const runSubarraySum = async (arr, signal) => {
    const k = 2; // target sum
    setVariables({ K: k, PrefixSum: 0, Count: 0 });
    addStep(`Subarray Sum Equals K (K=${k}). Using Prefix Sum Hash Map.`);
    
    let sum = 0;
    let count = 0;
    const map = { 0: 1 };
    updateHash(0, 1, false);
    addStep('Initialized map with { 0: 1 } to handle subarrays starting from index 0.');
    await sleep(speed * 1.5, signal);
    
    for (let i = 0; i < arr.length; i++) {
      setPointers({ i }); setActiveIndices([i]);
      sum += arr[i];
      const diff = sum - k;
      setVariables({ K: k, PrefixSum: sum, TargetDiff: diff, Count: count });
      
      addStep(`Index ${i}: val=${arr[i]}, new PrefixSum=${sum}. Searching for PrefixSum - K = ${diff} in map.`);
      clearHashActive();
      await sleep(speed * 1.5, signal);
      
      if (map[diff]) {
        count += map[diff];
        setVariables({ K: k, PrefixSum: sum, TargetDiff: diff, Count: count });
        addStep(`Found ${diff} in map! Added ${map[diff]} to count. Subarray found!`);
        updateHash(diff, map[diff], true);
        await sleep(speed * 1.5, signal);
      } else {
        addStep(`Diff ${diff} not found.`);
      }
      
      map[sum] = (map[sum] || 0) + 1;
      updateHash(sum, map[sum], true);
      addStep(`Storing PrefixSum ${sum} into map.`);
      await sleep(speed, signal);
    }
    setResult(`Total count: ${count}`);
  };

  const runLongestConsecutive = async (arr, signal) => {
    addStep('Longest Consecutive Sequence: O(N) using Hash Set');
    const set = new Set(arr);
    
    // Fill hashmap visually as a set (val -> exists)
    for (const num of arr) updateHash(num, 'exists', false);
    addStep('Inserted all elements into Hash Set.');
    await sleep(speed * 2, signal);
    
    let maxLen = 0;
    for (let i = 0; i < arr.length; i++) {
      setPointers({ i }); setActiveIndices([i]);
      const num = arr[i];
      
      clearHashActive();
      updateHash(num, 'exists', true);
      addStep(`Checking ${num}. Is it the start of a sequence?`);
      await sleep(speed, signal);
      
      if (!set.has(num - 1)) {
        addStep(`${num - 1} not in set. ${num} IS a start! Building sequence...`);
        let curr = num;
        let len = 1;
        while (set.has(curr + 1)) {
          curr++;
          len++;
          updateHash(curr, 'exists', true);
          setVariables({ CurrentSequenceStart: num, Length: len, MaxLength: maxLen });
          addStep(`Found ${curr}. Length is now ${len}.`);
          await sleep(speed, signal);
        }
        maxLen = Math.max(maxLen, len);
        setVariables({ MaxLength: maxLen });
        addStep(`Sequence ended at ${curr}. MaxLength = ${maxLen}`);
      } else {
        updateHash(num - 1, 'exists', true);
        addStep(`${num - 1} exists in set. ${num} is NOT a start, ignoring to maintain O(N).`);
      }
      await sleep(speed * 1.2, signal);
    }
    setResult(`Max Length: ${maxLen}`);
  };

  const runGroupAnagrams = async (arr, signal) => {
    addStep('Group Anagrams: Using sorted string as Hash Key.');
    const map = {};
    
    for (let i = 0; i < arr.length; i++) {
      setPointers({ i }); setActiveIndices([i]);
      const s = arr[i];
      
      const key = s.split('').sort().join('');
      setVariables({ Word: s, SortedKey: key });
      addStep(`Sorted '${s}' to get key '${key}'.`);
      await sleep(speed * 1.5, signal);
      
      clearHashActive();
      if (!map[key]) {
        map[key] = [s];
        addStep(`Key '${key}' not found. Creating new list.`);
      } else {
        map[key].push(s);
        addStep(`Key '${key}' found. Appending '${s}' to list.`);
      }
      updateHash(key, `[${map[key].join(', ')}]`, true);
      await sleep(speed * 1.5, signal);
    }
    clearHashActive();
    setResult(JSON.stringify(Object.values(map)));
  };

  // --- Render Helpers ---

  return (
    <div style={{ display: 'flex', gap: '1rem', width: '100%', height: '100%' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        
        {/* Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button onClick={() => { setMode('auto'); reset(); }} style={{ padding: '0.25rem 0.65rem', borderRadius: '4px', border: '1px solid var(--panel-border)', background: mode === 'auto' ? 'var(--active-accent)' : 'transparent', color: mode === 'auto' ? '#000' : '#fff', cursor: 'pointer', fontSize: '0.8rem' }}>Auto</button>
            <button onClick={() => setMode('custom')} style={{ padding: '0.25rem 0.65rem', borderRadius: '4px', border: '1px solid var(--panel-border)', background: mode === 'custom' ? 'var(--active-accent)' : 'transparent', color: mode === 'custom' ? '#000' : '#fff', cursor: 'pointer', fontSize: '0.8rem' }}>Custom</button>
            {mode === 'custom' && (
              <>
                <input type="text" placeholder="e.g. 1, 2, 3" value={customInput} onChange={e => setCustomInput(e.target.value)} style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid var(--panel-border)', color: '#fff', padding: '0.25rem 0.5rem', borderRadius: '4px', width: '150px', fontSize: '0.8rem' }} />
                <button onClick={applyCustom} style={{ padding: '0.25rem 0.6rem', borderRadius: '4px', border: '1px solid var(--active-accent)', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: '0.8rem' }}>Apply</button>
              </>
            )}
            <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.15)', margin: '0 4px' }} />
            <input type="range" min="20" max="600" value={600 - speed + 20} onChange={e => setSpeed(600 - parseInt(e.target.value) + 20)} style={{ width: '80px', accentColor: 'var(--active-accent)' }} />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={reset} disabled={isRunning} style={{ background: 'transparent', border: '1px solid var(--panel-border)', color: '#fff', padding: '0.35rem 0.8rem', borderRadius: '4px', cursor: isRunning ? 'not-allowed' : 'pointer', opacity: isRunning ? 0.5 : 1, fontSize: '0.8rem' }}>Reset</button>
            <button onClick={isRunning ? abort : execute} style={{ background: isRunning ? '#ff4444' : 'var(--active-accent)', border: 'none', color: '#000', fontWeight: 'bold', padding: '0.35rem 1.2rem', borderRadius: '4px', cursor: 'pointer', boxShadow: '0 0 10px var(--active-accent)', fontSize: '0.8rem' }}>{isRunning ? 'Stop' : 'Execute'}</button>
          </div>
        </div>

        {/* Input Array Display */}
        {inputArray.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center', marginBottom: '2rem' }}>
            {inputArray.map((val, idx) => (
              <div key={idx} style={{
                position: 'relative', height: '35px', minWidth: '35px', padding: '0 8px',
                background: activeIndices.includes(idx) ? 'var(--active-accent)' : 'rgba(255,255,255,0.05)',
                border: activeIndices.includes(idx) ? '1px solid var(--active-accent)' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: activeIndices.includes(idx) ? '#000' : 'var(--text-muted)', fontFamily: 'monospace'
              }}>
                {val}
                {Object.entries(pointers).find(([_, pIdx]) => pIdx === idx) && (
                  <div style={{ position: 'absolute', top: '-15px', color: '#ff00ff', fontSize: '0.6rem', fontWeight: 'bold' }}>↓</div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Variables & Result */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {Object.keys(variables).length > 0 && (
            <div style={{ display: 'flex', gap: '1rem', padding: '0.75rem', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)', flexWrap: 'wrap', flex: 1 }}>
              {Object.entries(variables).map(([key, val]) => (
                <div key={key} style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{key}</span>
                  <span style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--active-accent)', fontFamily: 'monospace' }}>{val}</span>
                </div>
              ))}
            </div>
          )}
          {result !== null && (
            <div style={{ padding: '0.75rem', background: 'rgba(0, 255, 136, 0.1)', borderRadius: '6px', border: '1px solid #00ff88', color: '#00ff88', display: 'flex', flexDirection: 'column', minWidth: '150px' }}>
              <span style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>Result</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 'bold', fontFamily: 'monospace' }}>{result}</span>
            </div>
          )}
        </div>

        {/* Hash Map Table Area */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', overflowY: 'auto' }}>
          <div style={{ minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '8px', marginBottom: '8px' }}>
              <div style={{ flex: 1, color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.8rem' }}>Key</div>
              <div style={{ flex: 1, color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.8rem' }}>Value</div>
            </div>
            {Object.keys(hashMap).length === 0 ? (
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', marginTop: '20px' }}>Map is Empty</div>
            ) : (
              Object.entries(hashMap).map(([key, obj]) => (
                <div key={key} style={{
                  display: 'flex', 
                  background: obj.active ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255,255,255,0.05)',
                  border: obj.active ? '1px solid #00ff88' : '1px solid transparent',
                  borderRadius: '4px',
                  padding: '8px 12px',
                  transition: 'all 0.2s ease',
                  boxShadow: obj.active ? '0 0 10px rgba(0, 255, 136, 0.2)' : 'none'
                }}>
                  <div style={{ flex: 1, color: obj.active ? '#00ff88' : '#fff', fontFamily: 'monospace', fontWeight: 'bold' }}>{key}</div>
                  <div style={{ flex: 1, color: obj.active ? '#00ff88' : 'var(--text-muted)', fontFamily: 'monospace' }}>{obj.val}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      <StepLog steps={steps} currentStep={steps.length - 1} />
    </div>
  );
};

export default HashVisualizer;
