import React, { useState, useEffect, useRef } from 'react';
import StepLog from './StepLog';

const StringVisualizer = ({ algorithmId }) => {
  const [strA, setStrA] = useState([]);
  const [strB, setStrB] = useState([]); // For anagram, matching, min window
  
  const [speed, setSpeed] = useState(200);
  const [mode, setMode] = useState('auto');
  const [customInputA, setCustomInputA] = useState('');
  const [customInputB, setCustomInputB] = useState('');
  
  const [isRunning, setIsRunning] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Visualization State
  const [steps, setSteps] = useState([]);
  const [pointersA, setPointersA] = useState({});
  const [pointersB, setPointersB] = useState({});
  const [activeA, setActiveA] = useState([]);
  const [activeB, setActiveB] = useState([]);
  const [processedA, setProcessedA] = useState([]);
  const [processedB, setProcessedB] = useState([]);
  const [variables, setVariables] = useState({});
  const [windowRangeA, setWindowRangeA] = useState(null);
  const [secondaryArray, setSecondaryArray] = useState(null);

  const abortController = useRef(null);

  useEffect(() => {
    reset();
  }, [algorithmId]);

  const needsTwoStrings = ['anagram_check', 'kmp', 'rabin_karp', 'min_window_substr', 'string_matching'].includes(algorithmId);

  const reset = () => {
    if (abortController.current) abortController.current.abort();
    generateData();
    setIsRunning(false);
    setSteps([]);
    setPointersA({});
    setPointersB({});
    setActiveA([]);
    setActiveB([]);
    setProcessedA([]);
    setProcessedB([]);
    setVariables({});
    setWindowRangeA(null);
    setSecondaryArray(null);
    setErrorMsg('');
  };

  const generateData = () => {
    if (mode === 'custom' && customInputA) {
      setStrA(customInputA.split(''));
      if (needsTwoStrings) setStrB(customInputB.split(''));
      return;
    }
    
    if (algorithmId === 'palindrome_check' || algorithmId === 'manacher') {
      setStrA("racecar".split(''));
    } else if (algorithmId === 'anagram_check') {
      setStrA("listen".split(''));
      setStrB("silent".split(''));
    } else if (algorithmId === 'longest_common_prefix') {
      setStrA("flower".split('')); // Simplify to one string vs prefix string variable
    } else if (algorithmId === 'sliding_window_str') {
      setStrA("abcabcbb".split(''));
    } else if (algorithmId === 'min_window_substr') {
      setStrA("ADOBECODEBANC".split(''));
      setStrB("ABC".split(''));
    } else if (algorithmId === 'kmp' || algorithmId === 'rabin_karp' || algorithmId === 'string_matching') {
      setStrA("ABABDABACDABABCABAB".split(''));
      setStrB("ABABCABAB".split(''));
    } else if (algorithmId === 'z_algorithm') {
      setStrA("aabcaabxaaaz".split(''));
    } else {
      setStrA("algorithms".split(''));
    }
  };

  const applyCustom = () => {
    if (!customInputA) {
      setErrorMsg('Please enter a string.');
      return;
    }
    setErrorMsg('');
    if (abortController.current) abortController.current.abort();
    setIsRunning(false);
    setSteps([]);
    setPointersA({}); setPointersB({});
    setActiveA([]); setActiveB([]);
    setProcessedA([]); setProcessedB([]);
    setVariables({});
    setWindowRangeA(null);
    setSecondaryArray(null);
    setStrA(customInputA.split(''));
    if (needsTwoStrings) setStrB(customInputB.split(''));
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
    setSteps([]); setPointersA({}); setPointersB({});
    setActiveA([]); setActiveB([]); setProcessedA([]); setProcessedB([]);
    setVariables({}); setWindowRangeA(null); setSecondaryArray(null);
    
    abortController.current = new AbortController();
    const signal = abortController.current.signal;

    try {
      const workingA = [...strA];
      const workingB = [...strB];
      
      switch (algorithmId) {
        case 'reverse_string': await runReverseString(workingA, signal); break;
        case 'palindrome_check': await runPalindrome(workingA, signal); break;
        case 'anagram_check': await runAnagram(workingA, workingB, signal); break;
        case 'sliding_window_str': await runSlidingWindow(workingA, signal); break;
        case 'min_window_substr': await runMinWindow(workingA, workingB, signal); break;
        case 'kmp': await runKMP(workingA, workingB, signal); break;
        default: addStep(`Visualization for ${algorithmId} is coming soon.`);
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

  const runReverseString = async (arr, signal) => {
    addStep('Reversing String: Two-pointer swap.');
    let l = 0, r = arr.length - 1;
    while (l < r) {
      setPointersA({ L: l, R: r });
      setActiveA([l, r]);
      await sleep(speed, signal);
      [arr[l], arr[r]] = [arr[r], arr[l]];
      setStrA([...arr]);
      addStep(`Swapped arr[${l}] and arr[${r}]`);
      setProcessedA(prev => [...prev, l, r]);
      l++; r--;
      await sleep(speed, signal);
    }
  };

  const runPalindrome = async (arr, signal) => {
    addStep('Palindrome Check: Two pointers converging from ends.');
    let l = 0, r = arr.length - 1;
    while (l < r) {
      setPointersA({ L: l, R: r });
      setActiveA([l, r]);
      addStep(`Comparing ${arr[l]} and ${arr[r]}`);
      await sleep(speed * 1.5, signal);
      if (arr[l] !== arr[r]) {
        addStep('Mismatch found! Not a palindrome.');
        return;
      }
      setProcessedA(prev => [...prev, l, r]);
      l++; r--;
    }
    addStep('All characters match. It is a palindrome!');
  };

  const runAnagram = async (arrA, arrB, signal) => {
    if (arrA.length !== arrB.length) {
      addStep('Lengths differ, not anagrams.');
      return;
    }
    addStep('Anagram Check: Frequency map counting.');
    const count = {};
    
    addStep('Pass 1: Incrementing counts for String A');
    for (let i = 0; i < arrA.length; i++) {
      setPointersA({ i }); setActiveA([i]);
      const c = arrA[i];
      count[c] = (count[c] || 0) + 1;
      setVariables({ ...count });
      setProcessedA(prev => [...prev, i]);
      await sleep(speed, signal);
    }
    
    addStep('Pass 2: Decrementing counts for String B');
    for (let i = 0; i < arrB.length; i++) {
      setPointersB({ i }); setActiveB([i]);
      const c = arrB[i];
      if (!count[c]) {
        addStep(`Character '${c}' not found or overused. Not an anagram!`);
        return;
      }
      count[c]--;
      if (count[c] === 0) delete count[c];
      setVariables({ ...count });
      setProcessedB(prev => [...prev, i]);
      await sleep(speed, signal);
    }
    addStep('All counts reached zero. They are anagrams!');
  };

  const runSlidingWindow = async (arr, signal) => {
    addStep('Longest Substring Without Repeating Characters.');
    const map = {};
    let maxLen = 0, l = 0;
    
    for (let r = 0; r < arr.length; r++) {
      setPointersA({ L: l, R: r });
      setActiveA([r]);
      const c = arr[r];
      
      if (map[c] !== undefined && map[c] >= l) {
        addStep(`Duplicate '${c}' found. Shrinking window from left to ${map[c] + 1}.`);
        l = map[c] + 1;
      }
      
      map[c] = r;
      setWindowRangeA([l, r]);
      const currentLen = r - l + 1;
      maxLen = Math.max(maxLen, currentLen);
      
      setVariables({ maxLen, window: `[${l}, ${r}]`, length: currentLen });
      addStep(`Window is "${arr.slice(l, r+1).join('')}". Length: ${currentLen}`);
      await sleep(speed * 1.5, signal);
    }
  };

  const runMinWindow = async (arrA, arrB, signal) => {
    addStep(`Minimum Window Substring: Finding "${arrB.join('')}" in "${arrA.join('')}"`);
    const need = {}; const have = {};
    for (const c of arrB) need[c] = (need[c] || 0) + 1;
    let required = Object.keys(need).length;
    let formed = 0;
    
    let l = 0, minLen = Infinity, bestL = -1, bestR = -1;
    
    for (let r = 0; r < arrA.length; r++) {
      const c = arrA[r];
      have[c] = (have[c] || 0) + 1;
      if (need[c] && have[c] === need[c]) formed++;
      
      setPointersA({ L: l, R: r });
      setWindowRangeA([l, r]);
      setVariables({ formed_req: `${formed}/${required}`, minLen: minLen === Infinity ? 'None' : minLen });
      await sleep(speed * 0.5, signal);
      
      while (formed === required && l <= r) {
        addStep(`Valid window found: "${arrA.slice(l, r+1).join('')}". Trying to shrink left.`);
        if (r - l + 1 < minLen) {
          minLen = r - l + 1;
          bestL = l; bestR = r;
          setVariables({ formed_req: `${formed}/${required}`, minLen: minLen, best: `[${bestL},${bestR}]` });
          setProcessedA(Array.from({length: minLen}, (_, i) => bestL + i));
          await sleep(speed * 1.5, signal);
        }
        
        const leftC = arrA[l];
        have[leftC]--;
        if (need[leftC] && have[leftC] < need[leftC]) formed--;
        l++;
        setPointersA({ L: l, R: r });
        setWindowRangeA([l, r]);
        await sleep(speed * 0.5, signal);
      }
    }
    addStep(minLen === Infinity ? "No valid window found." : `Smallest window: "${arrA.slice(bestL, bestR+1).join('')}"`);
  };

  const runKMP = async (text, pattern, signal) => {
    addStep('KMP Algorithm: Building LPS array for pattern.');
    const lps = new Array(pattern.length).fill(0);
    setSecondaryArray({ name: 'LPS Array', data: [...lps] });
    
    let len = 0, i = 1;
    while (i < pattern.length) {
      setPointersB({ len, i });
      await sleep(speed, signal);
      if (pattern[i] === pattern[len]) {
        len++; lps[i] = len; i++;
        setSecondaryArray({ name: 'LPS Array', data: [...lps] });
      } else {
        if (len !== 0) len = lps[len - 1];
        else { lps[i] = 0; i++; }
      }
    }
    
    addStep('LPS built. Starting search in text.');
    let iTxt = 0, jPat = 0;
    while (iTxt < text.length) {
      setPointersA({ txt: iTxt });
      setPointersB({ pat: jPat });
      setActiveA([iTxt]); setActiveB([jPat]);
      
      addStep(`Comparing text[${iTxt}]='${text[iTxt]}' with pattern[${jPat}]='${pattern[jPat]}'`);
      await sleep(speed * 1.2, signal);
      
      if (text[iTxt] === pattern[jPat]) {
        iTxt++; jPat++;
      }
      
      if (jPat === pattern.length) {
        addStep(`Pattern found starting at index ${iTxt - jPat}!`);
        setProcessedA(prev => [...prev, ...Array.from({length: pattern.length}, (_, x) => iTxt - jPat + x)]);
        await sleep(speed * 2, signal);
        jPat = lps[jPat - 1];
      } else if (iTxt < text.length && text[iTxt] !== pattern[jPat]) {
        if (jPat !== 0) {
          addStep(`Mismatch. Using LPS to skip backtrack. j becomes ${lps[jPat - 1]}`);
          jPat = lps[jPat - 1];
        } else {
          iTxt++;
        }
      }
    }
    addStep('Search complete.');
  };

  // Helper to render string character cells
  const renderString = (arr, pointers, active, processed, windowRng) => (
    <div style={{ position: 'relative', display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center' }}>
      {arr.map((val, idx) => {
        const isActive = active.includes(idx);
        const isProcessed = processed.includes(idx);
        const inWindow = windowRng && idx >= windowRng[0] && idx <= windowRng[1];
        
        let bg = 'rgba(255,255,255,0.05)', border = '1px solid rgba(255,255,255,0.1)';
        let color = 'var(--text-muted)', shadow = 'none';

        if (isActive) {
          bg = 'var(--active-accent)'; border = '1px solid var(--active-accent)';
          color = '#000'; shadow = '0 0 15px var(--active-accent)';
        } else if (inWindow) {
          bg = 'rgba(255,255,255,0.15)'; border = '1px solid var(--active-accent)';
          color = '#fff';
        } else if (isProcessed) {
          bg = 'rgba(0, 255, 136, 0.2)'; border = '1px solid #00ff88';
          color = '#00ff88';
        }

        const myPointers = Object.entries(pointers).filter(([_, pIdx]) => pIdx === idx);

        return (
          <div key={idx} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ height: '20px', display: 'flex', gap: '2px', alignItems: 'flex-end', marginBottom: '4px' }}>
              {myPointers.map(([pName]) => (
                <div key={pName} style={{ background: '#ff00ff', color: '#fff', fontSize: '0.6rem', padding: '2px 4px', borderRadius: '4px', fontFamily: 'monospace' }}>
                  {pName} ↓
                </div>
              ))}
            </div>
            <div style={{
              width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: bg, border: border, borderRadius: '6px', color: color,
              fontSize: '1.2rem', fontWeight: isActive || isProcessed || inWindow ? 'bold' : 'normal',
              boxShadow: shadow, transition: 'all 0.2s ease', fontFamily: 'Fira Code, monospace'
            }}>
              {val}
            </div>
            <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>{idx}</div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div style={{ display: 'flex', gap: '1rem', width: '100%', height: '100%' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        
        {/* Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button onClick={() => { setMode('auto'); reset(); }}
              style={{ padding: '0.25rem 0.65rem', borderRadius: '4px', border: '1px solid var(--panel-border)', background: mode === 'auto' ? 'var(--active-accent)' : 'transparent', color: mode === 'auto' ? '#000' : '#fff', cursor: 'pointer', fontSize: '0.8rem' }}>
              Auto
            </button>
            <button onClick={() => setMode('custom')}
              style={{ padding: '0.25rem 0.65rem', borderRadius: '4px', border: '1px solid var(--panel-border)', background: mode === 'custom' ? 'var(--active-accent)' : 'transparent', color: mode === 'custom' ? '#000' : '#fff', cursor: 'pointer', fontSize: '0.8rem' }}>
              Custom
            </button>
            {mode === 'custom' && (
              <div style={{ display: 'flex', gap: '4px' }}>
                <input type="text" placeholder="String 1" value={customInputA} onChange={e => setCustomInputA(e.target.value)}
                  style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid var(--panel-border)', color: '#fff', padding: '0.25rem 0.5rem', borderRadius: '4px', width: '100px', fontSize: '0.8rem' }} />
                {needsTwoStrings && (
                  <input type="text" placeholder="String 2" value={customInputB} onChange={e => setCustomInputB(e.target.value)}
                    style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid var(--panel-border)', color: '#fff', padding: '0.25rem 0.5rem', borderRadius: '4px', width: '100px', fontSize: '0.8rem' }} />
                )}
                <button onClick={applyCustom}
                  style={{ padding: '0.25rem 0.6rem', borderRadius: '4px', border: '1px solid var(--active-accent)', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: '0.8rem' }}>
                  Apply
                </button>
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
                <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--active-accent)', fontFamily: 'Fira Code, monospace' }}>{val}</span>
              </div>
            ))}
          </div>
        )}

        {/* Visualization Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2rem', overflowY: 'auto' }}>
          
          <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{needsTwoStrings ? 'Text / Target String' : 'String'}</div>
          {renderString(strA, pointersA, activeA, processedA, windowRangeA)}
          
          {needsTwoStrings && (
            <>
              <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1rem' }}>Pattern / Match String</div>
              {renderString(strB, pointersB, activeB, processedB, null)}
            </>
          )}

          {secondaryArray && (
            <div style={{ position: 'relative', marginTop: '1rem' }}>
              <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{secondaryArray.name}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center' }}>
                {secondaryArray.data.map((val, idx) => (
                  <div key={idx} style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)', borderRadius: '6px', color: '#00ff88', fontSize: '1.1rem', fontFamily: 'Fira Code, monospace' }}>{val}</div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
      <StepLog steps={steps} />
    </div>
  );
};

export default StringVisualizer;
