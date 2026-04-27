import React, { useState, useEffect, useRef } from 'react';
import StepLog from './StepLog';

const StringVisualizer = ({ algorithmId }) => {
  const [speed, setSpeed] = useState(300);
  const [mode, setMode] = useState('auto');
  const [customInputA, setCustomInputA] = useState('');
  const [customInputB, setCustomInputB] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // --- Snapshot Animation Engine State ---
  const [trace, setTrace] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const needsTwoStrings = ['anagram_check', 'kmp', 'rabin_karp', 'min_window_substr', 'string_matching'].includes(algorithmId);

  useEffect(() => {
    initStrings();
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

  const initStrings = () => {
    setIsPlaying(false);
    setTrace([]);
    setCurrentStep(0);
    setErrorMsg('');
  };

  const applyCustom = () => {
    if (!customInputA.trim()) return;
    initStrings();
  };

  const getInitialData = () => {
    let a = [], b = [];
    if (mode === 'custom' && customInputA) {
      if (algorithmId === 'longest_common_prefix') {
        a = customInputA.split(',').map(s => s.trim());
      } else {
        a = customInputA.split('');
      }
      if (needsTwoStrings) b = customInputB.split('');
      return { a, b };
    }
    
    switch (algorithmId) {
      case 'palindrome_check': a = "racecar".split(''); break;
      case 'manacher': a = "babad".split(''); break;
      case 'anagram_check': a = "listen".split(''); b = "silent".split(''); break;
      case 'longest_common_prefix': a = "flower,flow,flight".split(','); break; // Special case: array of strings
      case 'sliding_window_str': a = "abcabcbb".split(''); break;
      case 'min_window_substr': a = "ADOBECODEBANC".split(''); b = "ABC".split(''); break;
      case 'kmp': 
      case 'rabin_karp': 
      case 'string_matching': 
        a = "ABABDABACDABABCABAB".split(''); b = "ABABCABAB".split(''); break;
      case 'z_algorithm': a = "aabcaabxaaaz".split(''); break;
      default: a = "algorithms".split('');
    }
    return { a, b };
  };

  const executeAlgo = () => {
    if (trace.length > 0 && currentStep === 0) { setIsPlaying(true); return; }
    if (currentStep > 0 && currentStep < trace.length - 1) { setIsPlaying(true); return; }
    if (currentStep >= trace.length - 1 && trace.length > 0) { setCurrentStep(0); setIsPlaying(true); return; }

    const { a: initA, b: initB } = getInitialData();
    const newTrace = [];
    
    const pushState = (arrA, arrB, ptrA={}, ptrB={}, actA=[], actB=[], procA=[], procB=[], winA=null, vars={}, sec=null, msg='') => {
      newTrace.push({
        strA: [...arrA], strB: [...arrB],
        pointersA: {...ptrA}, pointersB: {...ptrB},
        activeA: [...actA], activeB: [...actB],
        processedA: [...procA], processedB: [...procB],
        windowRangeA: winA, variables: {...vars},
        secondaryArray: sec ? {...sec, data: [...sec.data]} : null, msg
      });
    };

    pushState(initA, initB, {}, {}, [], [], [], [], null, {}, null, `Starting ${algorithmId.replaceAll('_', ' ')}...`);

    const a = [...initA], b = [...initB];

    switch (algorithmId) {
      case 'reverse_string': runReverseString(a, pushState); break;
      case 'palindrome_check': runPalindrome(a, pushState); break;
      case 'anagram_check': runAnagram(a, b, pushState); break;
      case 'longest_common_prefix': runLCP(a, pushState); break; // 'a' is an array of strings here
      case 'sliding_window_str': runSlidingWindow(a, pushState); break;
      case 'min_window_substr': runMinWindow(a, b, pushState); break;
      case 'kmp': runKMP(a, b, pushState); break;
      case 'rabin_karp': runRabinKarp(a, b, pushState); break;
      case 'z_algorithm': runZAlgorithm(a, pushState); break;
      case 'manacher': runManacher(a, pushState); break;
      case 'string_matching': runNaiveMatch(a, b, pushState); break;
      default: pushState(a, b, {}, {}, [], [], [], [], null, {}, null, `Logic for ${algorithmId} pending.`); break;
    }

    if (newTrace.length === 1) pushState(a, b, {}, {}, [], [], [], [], null, {}, null, 'Finished.');

    setTrace(newTrace);
    setCurrentStep(0);
    setIsPlaying(true);
  };

  // --- Algorithms ---

  const runReverseString = (arr, pushState) => {
    let l = 0, r = arr.length - 1;
    while (l < r) {
      pushState(arr, [], { L: l, R: r }, {}, [l, r], [], [], [], null, {}, null, `Swapping '${arr[l]}' and '${arr[r]}'`);
      [arr[l], arr[r]] = [arr[r], arr[l]];
      pushState(arr, [], { L: l, R: r }, {}, [l, r], [], [], [], null, {}, null, `Swapped.`);
      l++; r--;
    }
    pushState(arr, [], {}, {}, [], [], arr.map((_, i) => i), [], null, {}, null, `✅ String reversed.`);
  };

  const runPalindrome = (arr, pushState) => {
    let l = 0, r = arr.length - 1;
    while (l < r) {
      pushState(arr, [], { L: l, R: r }, {}, [l, r], [], [], [], null, {}, null, `Comparing '${arr[l]}' and '${arr[r]}'`);
      if (arr[l] !== arr[r]) {
        pushState(arr, [], { L: l, R: r }, {}, [l, r], [], [], [], null, {}, null, `❌ Mismatch! Not a palindrome.`);
        return;
      }
      l++; r--;
    }
    pushState(arr, [], {}, {}, [], [], arr.map((_, i) => i), [], null, {}, null, `✅ All characters match. It is a palindrome!`);
  };

  const runAnagram = (a, b, pushState) => {
    if (a.length !== b.length) {
      pushState(a, b, {}, {}, [], [], [], [], null, {}, null, `❌ Lengths differ, cannot be anagrams.`);
      return;
    }
    const count = {};
    for (let i = 0; i < a.length; i++) {
      count[a[i]] = (count[a[i]] || 0) + 1;
      pushState(a, b, { i }, {}, [i], [], Array.from({length:i}, (_,idx)=>idx), [], null, { ...count }, null, `Counting char '${a[i]}' from string 1`);
    }
    for (let i = 0; i < b.length; i++) {
      if (!count[b[i]]) {
        pushState(a, b, {}, { i }, [], [i], a.map((_,x)=>x), Array.from({length:i}, (_,idx)=>idx), null, { ...count }, null, `❌ '${b[i]}' not found or overused. Not an anagram.`);
        return;
      }
      count[b[i]]--;
      if (count[b[i]] === 0) delete count[b[i]];
      pushState(a, b, {}, { i }, [], [i], a.map((_,x)=>x), Array.from({length:i}, (_,idx)=>idx), null, { ...count }, null, `Decrementing count for '${b[i]}'`);
    }
    pushState(a, b, {}, {}, [], [], a.map((_,x)=>x), b.map((_,x)=>x), null, {}, null, `✅ All counts reached zero. They are anagrams!`);
  };

  const runLCP = (strs, pushState) => {
    // Treat 'strs' array elements as chars in our visualizer for this specific algo
    // Normally LCP takes array of strings. We will visualize the prefix shrinking.
    if (!strs.length) return;
    let prefix = strs[0];
    pushState(prefix.split(''), [], {}, {}, [], [], [], [], null, { Strings: JSON.stringify(strs) }, null, `Initial prefix: "${prefix}"`);
    
    for (let i = 1; i < strs.length; i++) {
      while (!strs[i].startsWith(prefix)) {
        pushState(prefix.split(''), [], {}, {}, [], [], [], [], null, { Target: strs[i] }, null, `"${strs[i]}" does not start with "${prefix}". Shrinking prefix.`);
        prefix = prefix.slice(0, -1);
        if (!prefix) {
          pushState([], [], {}, {}, [], [], [], [], null, {}, null, `❌ No common prefix found.`);
          return;
        }
      }
      pushState(prefix.split(''), [], {}, {}, prefix.split('').map((_,x)=>x), [], [], [], null, { Target: strs[i] }, null, `✅ "${strs[i]}" starts with "${prefix}"`);
    }
    pushState(prefix.split(''), [], {}, {}, [], [], prefix.split('').map((_,x)=>x), [], null, {}, null, `✅ Longest Common Prefix: "${prefix}"`);
  };

  const runSlidingWindow = (arr, pushState) => {
    const map = {};
    let maxLen = 0, l = 0;
    for (let r = 0; r < arr.length; r++) {
      const c = arr[r];
      if (map[c] !== undefined && map[c] >= l) {
        pushState(arr, [], { L: l, R: r }, {}, [r], [], [], [], [l, r], { MaxLen: maxLen }, null, `Duplicate '${c}' found! Shrinking window from left.`);
        l = map[c] + 1;
      }
      map[c] = r;
      maxLen = Math.max(maxLen, r - l + 1);
      pushState(arr, [], { L: l, R: r }, {}, [r], [], [], [], [l, r], { MaxLen: maxLen, Char: c }, null, `Window is "${arr.slice(l, r+1).join('')}". MaxLen: ${maxLen}`);
    }
    pushState(arr, [], {}, {}, [], [], arr.map((_,i)=>i), [], null, { FinalMaxLen: maxLen }, null, `✅ Sliding window complete.`);
  };

  const runMinWindow = (s, t, pushState) => {
    const need = {}, have = {};
    for (const c of t) need[c] = (need[c] || 0) + 1;
    let required = Object.keys(need).length, formed = 0;
    let l = 0, minLen = Infinity, bestL = 0, bestR = 0;

    for (let r = 0; r < s.length; r++) {
      const c = s[r];
      have[c] = (have[c] || 0) + 1;
      if (need[c] && have[c] === need[c]) formed++;
      
      pushState(s, t, { L: l, R: r }, {}, [r], [], [], [], [l, r], { Formed: `${formed}/${required}` }, null, `Expanding window right. Added '${c}'`);
      
      while (formed === required && l <= r) {
        if (r - l + 1 < minLen) {
          minLen = r - l + 1;
          bestL = l; bestR = r;
          pushState(s, t, { L: l, R: r }, {}, [l, r], [], [], [], [l, r], { MinLen: minLen, Best: s.slice(bestL, bestR+1).join('') }, null, `✅ New min window found: "${s.slice(bestL, bestR+1).join('')}"`);
        }
        
        const leftC = s[l];
        have[leftC]--;
        if (need[leftC] && have[leftC] < need[leftC]) formed--;
        l++;
        pushState(s, t, { L: l, R: r }, {}, [l], [], [], [], [l, r], { Formed: `${formed}/${required}` }, null, `Shrinking window left. Removed '${leftC}'`);
      }
    }
    pushState(s, t, {}, {}, [], [], Array.from({length: minLen}, (_,i)=>bestL+i), [], null, { Final: s.slice(bestL, bestR+1).join('') }, null, `✅ Min Window: "${s.slice(bestL, bestR+1).join('')}"`);
  };

  const runNaiveMatch = (txt, pat, pushState) => {
    for (let i = 0; i <= txt.length - pat.length; i++) {
      let match = true;
      pushState(txt, pat, { txtStart: i }, { patStart: 0 }, [i], [0], [], [], null, {}, null, `Testing pattern starting at index ${i}`);
      for (let j = 0; j < pat.length; j++) {
        pushState(txt, pat, { txtCurr: i+j }, { patCurr: j }, [i+j], [j], [], [], null, {}, null, `Comparing '${txt[i+j]}' and '${pat[j]}'`);
        if (txt[i+j] !== pat[j]) {
          match = false;
          pushState(txt, pat, { txtCurr: i+j }, { patCurr: j }, [i+j], [j], [], [], null, {}, null, `❌ Mismatch at index ${i+j}.`);
          break;
        }
      }
      if (match) {
        pushState(txt, pat, {}, {}, [], [], Array.from({length:pat.length}, (_,idx)=>i+idx), pat.map((_,idx)=>idx), null, {}, null, `✅ Pattern found at index ${i}!`);
        return;
      }
    }
    pushState(txt, pat, {}, {}, [], [], [], [], null, {}, null, `❌ Pattern not found.`);
  };

  const runKMP = (txt, pat, pushState) => {
    const lps = new Array(pat.length).fill(0);
    let len = 0, i = 1;
    pushState(txt, pat, {}, {}, [], [], [], [], null, {}, { name: 'LPS', data: [...lps] }, `Building LPS Array...`);
    while (i < pat.length) {
      if (pat[i] === pat[len]) {
        len++; lps[i] = len; i++;
      } else {
        if (len !== 0) len = lps[len - 1];
        else { lps[i] = 0; i++; }
      }
    }
    pushState(txt, pat, {}, {}, [], [], [], [], null, {}, { name: 'LPS', data: [...lps] }, `✅ LPS Built: [${lps.join(',')}]`);

    let iTxt = 0, jPat = 0;
    while (iTxt < txt.length) {
      pushState(txt, pat, { txt: iTxt }, { pat: jPat }, [iTxt], [jPat], [], [], null, {}, { name: 'LPS', data: [...lps] }, `Comparing txt[${iTxt}]='${txt[iTxt]}' and pat[${jPat}]='${pat[jPat]}'`);
      if (txt[iTxt] === pat[jPat]) { iTxt++; jPat++; }
      if (jPat === pat.length) {
        pushState(txt, pat, {}, {}, [], [], Array.from({length:pat.length}, (_,idx)=>iTxt-jPat+idx), pat.map((_,x)=>x), null, {}, { name: 'LPS', data: [...lps] }, `✅ Pattern found at index ${iTxt - jPat}!`);
        return;
      } else if (iTxt < txt.length && txt[iTxt] !== pat[jPat]) {
        if (jPat !== 0) {
          jPat = lps[jPat - 1];
          pushState(txt, pat, { txt: iTxt }, { pat: jPat }, [iTxt], [jPat], [], [], null, {}, { name: 'LPS', data: [...lps] }, `Mismatch. LPS says skip to pat[${jPat}]`);
        } else {
          iTxt++;
        }
      }
    }
    pushState(txt, pat, {}, {}, [], [], [], [], null, {}, { name: 'LPS', data: [...lps] }, `❌ Pattern not found.`);
  };

  const runRabinKarp = (txt, pat, pushState) => {
    const d = 256, q = 101;
    const M = pat.length, N = txt.length;
    let p = 0, t = 0, h = 1;
    
    for (let i = 0; i < M - 1; i++) h = (h * d) % q;
    for (let i = 0; i < M; i++) {
      p = (d * p + pat[i].charCodeAt(0)) % q;
      t = (d * t + txt[i].charCodeAt(0)) % q;
    }
    
    pushState(txt, pat, {}, {}, [], [], [], [], null, { PatHash: p, TxtHash: t }, null, `Initial Hash Pat: ${p}, Window: ${t}`);
    
    for (let i = 0; i <= N - M; i++) {
      pushState(txt, pat, { start: i }, {}, [], [], [], [], [i, i+M-1], { PatHash: p, TxtHash: t }, null, `Comparing hashes at index ${i}`);
      if (p === t) {
        pushState(txt, pat, { start: i }, {}, [], [], [], [], [i, i+M-1], { PatHash: p, TxtHash: t }, null, `Hash Match! Double checking string...`);
        let match = true;
        for (let j = 0; j < M; j++) if (txt[i+j] !== pat[j]) match = false;
        if (match) {
          pushState(txt, pat, {}, {}, [], [], Array.from({length:M}, (_,idx)=>i+idx), pat.map((_,x)=>x), null, {}, null, `✅ Exact Match at index ${i}!`);
          return;
        }
      }
      if (i < N - M) {
        t = (d * (t - txt[i].charCodeAt(0) * h) + txt[i + M].charCodeAt(0)) % q;
        if (t < 0) t = t + q;
      }
    }
    pushState(txt, pat, {}, {}, [], [], [], [], null, {}, null, `❌ Pattern not found.`);
  };

  const runZAlgorithm = (s, pushState) => {
    const n = s.length;
    const z = new Array(n).fill(0);
    let l = 0, r = 0;
    
    pushState(s, [], {}, {}, [], [], [], [], null, {}, { name: 'Z Array', data: [...z] }, `Building Z Array...`);
    
    for (let i = 1; i < n; i++) {
      if (i <= r) z[i] = Math.min(r - i + 1, z[i - l]);
      while (i + z[i] < n && s[z[i]] === s[i + z[i]]) z[i]++;
      if (i + z[i] - 1 > r) { l = i; r = i + z[i] - 1; }
      pushState(s, [], { i, L: l, R: r }, {}, [i], [], [], [], [l, r], {}, { name: 'Z Array', data: [...z] }, `Computed Z[${i}] = ${z[i]}`);
    }
    pushState(s, [], {}, {}, [], [], [], [], null, {}, { name: 'Z Array', data: [...z] }, `✅ Z Array complete.`);
  };

  const runManacher = (arr, pushState) => {
    const t = '#' + arr.join('#') + '#';
    const n = t.length;
    const p = new Array(n).fill(0);
    let c = 0, r = 0;
    
    pushState(t.split(''), [], {}, {}, [], [], [], [], null, {}, { name: 'Palin Radii', data: [...p] }, `Transformed string with '#' to handle evens.`);
    
    for (let i = 0; i < n; i++) {
      let mirror = 2 * c - i;
      if (i < r) p[i] = Math.min(r - i, p[mirror]);
      while (i + p[i] + 1 < n && i - p[i] - 1 >= 0 && t[i + p[i] + 1] === t[i - p[i] - 1]) p[i]++;
      if (i + p[i] > r) { c = i; r = i + p[i]; }
      pushState(t.split(''), [], { i, C: c, R: r }, {}, [i], [], [], [], [i - p[i], i + p[i]], {}, { name: 'Palin Radii', data: [...p] }, `Radii at ${i} is ${p[i]}`);
    }
    
    let maxL = Math.max(...p);
    pushState(t.split(''), [], {}, {}, [], [], [], [], null, {}, { name: 'Palin Radii', data: [...p] }, `✅ Manacher complete. Max length: ${maxL}`);
  };


  // --- Playback Controls ---
  const handlePlayPause = () => { if (trace.length === 0) executeAlgo(); else setIsPlaying(!isPlaying); };
  const handleNext = () => { setIsPlaying(false); if (currentStep < trace.length - 1) setCurrentStep(c => c + 1); };
  const handlePrev = () => { setIsPlaying(false); if (currentStep > 0) setCurrentStep(c => c - 1); };

  // --- Rendering ---
  const currentState = trace[currentStep] || { strA: getInitialData().a, strB: getInitialData().b, pointersA: {}, pointersB: {}, activeA: [], activeB: [], processedA: [], processedB: [], windowRangeA: null, variables: {}, secondaryArray: null, msg: 'Ready.' };
  const historySteps = trace.slice(0, currentStep + 1).map(t => t.msg).filter(m => m);

  const renderString = (arr, pointers, active, processed, windowRng) => (
    <div style={{ position: 'relative', display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center' }}>
      {arr.map((val, idx) => {
        const isActive = active.includes(idx);
        const isProcessed = processed.includes(idx);
        const inWindow = windowRng && idx >= windowRng[0] && idx <= windowRng[1];
        let bg = 'rgba(255,255,255,0.05)', border = '1px solid rgba(255,255,255,0.1)', color = 'var(--text-muted)', shadow = 'none';
        if (isActive) { bg = 'var(--active-accent)'; border = '1px solid var(--active-accent)'; color = '#000'; shadow = '0 0 15px var(--active-accent)'; }
        else if (inWindow) { bg = 'rgba(255,255,255,0.15)'; border = '1px solid var(--active-accent)'; color = '#fff'; }
        else if (isProcessed) { bg = 'rgba(0, 255, 136, 0.2)'; border = '1px solid #00ff88'; color = '#00ff88'; }
        const myPointers = Object.entries(pointers).filter(([_, pIdx]) => pIdx === idx);

        return (
          <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ height: '20px', display: 'flex', gap: '2px', alignItems: 'flex-end', marginBottom: '4px' }}>
              {myPointers.map(([pName]) => (
                <div key={pName} style={{ background: '#ff00ff', color: '#fff', fontSize: '0.6rem', padding: '2px 4px', borderRadius: '4px', fontFamily: 'monospace' }}>{pName} ↓</div>
              ))}
            </div>
            <div style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: bg, border, borderRadius: '6px', color, fontSize: '1.2rem', fontWeight: isActive || isProcessed || inWindow ? 'bold' : 'normal', boxShadow: shadow, transition: 'all 0.2s ease', fontFamily: 'Fira Code, monospace' }}>
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
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => { setMode('auto'); initStrings(); setTimeout(executeAlgo, 100); }}
              style={{ padding: '0.25rem 0.65rem', borderRadius: '4px', border: '1px solid var(--panel-border)', background: mode === 'auto' ? 'var(--active-accent)' : 'transparent', color: mode === 'auto' ? '#000' : '#fff', cursor: 'pointer', fontSize: '0.8rem' }}>
              Auto Demo
            </button>
            <button onClick={() => setMode('custom')}
              style={{ padding: '0.25rem 0.65rem', borderRadius: '4px', border: '1px solid var(--panel-border)', background: mode === 'custom' ? 'var(--active-accent)' : 'transparent', color: mode === 'custom' ? '#000' : '#fff', cursor: 'pointer', fontSize: '0.8rem' }}>
              Custom
            </button>
            {mode === 'custom' && (
              <>
                <input type="text" placeholder={algorithmId === 'longest_common_prefix' ? "e.g. flow,flight" : "String 1"} value={customInputA}
                  onChange={e => setCustomInputA(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && applyCustom()}
                  style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid var(--panel-border)', color: '#fff', padding: '0.25rem 0.5rem', borderRadius: '4px', width: '120px', fontSize: '0.8rem' }} />
                {needsTwoStrings && (
                  <input type="text" placeholder="String 2" value={customInputB}
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
            <button onClick={initStrings} style={{ background: 'transparent', border: '1px solid var(--panel-border)', color: '#fff', padding: '0.35rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Reset</button>
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
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2rem', overflowY: 'auto' }}>
          <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{needsTwoStrings ? 'Text / Target String' : 'String'}</div>
          {renderString(currentState.strA, currentState.pointersA, currentState.activeA, currentState.processedA, currentState.windowRangeA)}
          
          {needsTwoStrings && (
            <>
              <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1rem' }}>Pattern / Match String</div>
              {renderString(currentState.strB, currentState.pointersB, currentState.activeB, currentState.processedB, null)}
            </>
          )}

          {currentState.secondaryArray && (
            <div style={{ position: 'relative', marginTop: '1rem' }}>
              <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{currentState.secondaryArray.name}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center' }}>
                {currentState.secondaryArray.data.map((val, idx) => (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)', borderRadius: '6px', color: '#00ff88', fontSize: '1.1rem', fontFamily: 'Fira Code, monospace' }}>{val}</div>
                    <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>{idx}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
      <StepLog steps={historySteps} currentStep={currentStep} />
    </div>
  );
};

export default StringVisualizer;
