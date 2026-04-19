import React, { useState, useEffect, useRef } from 'react';
import StepLog from './StepLog';
import MergeSortTree from './MergeSortTree';

const generateArray = (size = 16) =>
  Array.from({ length: size }, () => Math.floor(Math.random() * 90) + 10);

const SortVisualizer = ({ algorithmId }) => {
  const [array, setArray] = useState(() => generateArray());
  const [comparingIdx, setComparingIdx] = useState([]);
  const [sortedIdx, setSortedIdx] = useState([]);
  const [pivotIdx, setPivotIdx] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [steps, setSteps] = useState([]);
  const [speed, setSpeed] = useState(80);
  const [vizView, setVizView] = useState('bars'); // 'bars' | 'tree'
  const [mode, setMode] = useState('auto');
  const [customInput, setCustomInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const abortRef = useRef(null);

  useEffect(() => {
    reset();
    return () => abort();
  }, [algorithmId]);

  const abort = () => {
    if (abortRef.current) abortRef.current.abort();
    setIsRunning(false);
  };

  const reset = () => {
    abort();
    setArray(generateArray());
    setComparingIdx([]);
    setSortedIdx([]);
    setPivotIdx(null);
    setSteps([]);
    setErrorMsg('');
  };

  const applyCustom = () => {
    const parsed = customInput.split(',').map(s => parseInt(s.trim(), 10));
    if (parsed.some(isNaN) || parsed.length < 2) {
      setErrorMsg('Enter at least 2 comma-separated numbers e.g. 15,8,42,4');
      return;
    }
    setErrorMsg('');
    abort();
    setArray(parsed);
    setComparingIdx([]);
    setSortedIdx([]);
    setPivotIdx(null);
    setSteps([]);
  };

  const sleep = ms => new Promise((res, rej) => {
    const t = setTimeout(res, ms);
    abortRef.current?.signal.addEventListener('abort', () => { clearTimeout(t); rej(); });
  });

  const addStep = (msg, stepsArr) => { stepsArr.push(msg); };

  // ---- Merge Sort ----
  const runMergeSort = async () => {
    const arr = [...array];
    const stepsArr = [];
    setSteps([]);

    const merge = async (left, mid, right) => {
      const L = arr.slice(left, mid + 1);
      const R = arr.slice(mid + 1, right + 1);
      let i = 0, j = 0, k = left;
      addStep(`Merging subarrays [${L.join(',')}] and [${R.join(',')}]`, stepsArr);
      setSteps([...stepsArr]);

      while (i < L.length && j < R.length) {
        setComparingIdx([left + i, mid + 1 + j]);
        await sleep(speed);
        if (L[i] <= R[j]) {
          addStep(`Compare ${L[i]} ≤ ${R[j]} → place ${L[i]} at index ${k}`, stepsArr);
          arr[k++] = L[i++];
        } else {
          addStep(`Compare ${L[i]} > ${R[j]} → place ${R[j]} at index ${k}`, stepsArr);
          arr[k++] = R[j++];
        }
        setArray([...arr]);
        setSteps([...stepsArr]);
      }
      while (i < L.length) { arr[k++] = L[i++]; setArray([...arr]); await sleep(speed / 2); }
      while (j < R.length) { arr[k++] = R[j++]; setArray([...arr]); await sleep(speed / 2); }
    };

    const sort = async (left, right) => {
      if (left >= right) return;
      const mid = Math.floor((left + right) / 2);
      addStep(`Divide [${arr.slice(left, right+1).join(',')}] at mid=${mid}`, stepsArr);
      setSteps([...stepsArr]);
      await sort(left, mid);
      await sort(mid + 1, right);
      await merge(left, mid, right);
    };

    await sort(0, arr.length - 1);
    setSortedIdx(arr.map((_, i) => i));
    setComparingIdx([]);
    addStep(`✅ Sort complete! Result: [${arr.join(',')}]`, stepsArr);
    setSteps([...stepsArr]);
  };

  // ---- Quick Sort ----
  const runQuickSort = async () => {
    const arr = [...array];
    const stepsArr = [];
    setSteps([]);
    const sorted = new Set();

    const partition = async (low, high) => {
      const pivot = arr[high];
      setPivotIdx(high);
      addStep(`Pivot selected: ${pivot} at index ${high}`, stepsArr);
      setSteps([...stepsArr]);
      let i = low - 1;

      for (let j = low; j < high; j++) {
        setComparingIdx([j, high]);
        await sleep(speed);
        if (arr[j] <= pivot) {
          i++;
          addStep(`arr[${j}]=${arr[j]} ≤ pivot=${pivot} → swap arr[${i}]=${arr[i]} with arr[${j}]=${arr[j]}`, stepsArr);
          [arr[i], arr[j]] = [arr[j], arr[i]];
          setArray([...arr]);
          setSteps([...stepsArr]);
        } else {
          addStep(`arr[${j}]=${arr[j]} > pivot=${pivot} → no swap`, stepsArr);
          setSteps([...stepsArr]);
        }
      }
      [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
      setArray([...arr]);
      const pi = i + 1;
      addStep(`Pivot ${pivot} placed at final position ${pi}`, stepsArr);
      setSteps([...stepsArr]);
      sorted.add(pi);
      setSortedIdx([...sorted]);
      return pi;
    };

    const sort = async (low, high) => {
      if (low < high) {
        const pi = await partition(low, high);
        await sort(low, pi - 1);
        await sort(pi + 1, high);
      }
    };

    await sort(0, arr.length - 1);
    setSortedIdx(arr.map((_, i) => i));
    setPivotIdx(null);
    setComparingIdx([]);
    addStep(`✅ Sort complete! Result: [${arr.join(',')}]`, stepsArr);
    setSteps([...stepsArr]);
  };

  // ---- Binary Search ----
  const runBinarySearch = async () => {
    const sortedArr = [...array].sort((a, b) => a - b);
    setArray(sortedArr);
    const target = sortedArr[Math.floor(Math.random() * sortedArr.length)];
    const stepsArr = [];
    addStep(`Searching for target: ${target} in sorted array [${sortedArr.join(',')}]`, stepsArr);
    setSteps([...stepsArr]);

    let left = 0, right = sortedArr.length - 1;
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      setComparingIdx([mid]);
      await sleep(speed * 3);
      addStep(`Left=${left}, Right=${right}, Mid=${mid} → arr[mid]=${sortedArr[mid]}`, stepsArr);
      setSteps([...stepsArr]);

      if (sortedArr[mid] === target) {
        setSortedIdx([mid]);
        addStep(`✅ Found ${target} at index ${mid}!`, stepsArr);
        setSteps([...stepsArr]);
        return;
      } else if (sortedArr[mid] < target) {
        addStep(`${sortedArr[mid]} < ${target} → search RIGHT half`, stepsArr);
        left = mid + 1;
      } else {
        addStep(`${sortedArr[mid]} > ${target} → search LEFT half`, stepsArr);
        right = mid - 1;
      }
      setSteps([...stepsArr]);
    }
    addStep(`❌ ${target} not found`, stepsArr);
    setSteps([...stepsArr]);
  };

  const execute = async () => {
    if (isRunning) return;
    abortRef.current = new AbortController();
    setIsRunning(true);
    setSortedIdx([]);
    setComparingIdx([]);
    setPivotIdx(null);
    setSteps([]);
    try {
      if (algorithmId === 'merge_sort') await runMergeSort();
      else if (algorithmId === 'quick_sort') await runQuickSort();
      else if (algorithmId === 'binary_search') await runBinarySearch();
    } catch (_) {}
    setIsRunning(false);
  };


  const maxVal = Math.max(...array, 1);

  return (
    <div style={{ display: 'flex', gap: '1rem', width: '100%', height: '100%' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* ── Shared Controls ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => { setMode('auto'); reset(); }}
              style={{ padding: '0.25rem 0.65rem', borderRadius: '4px', border: '1px solid var(--panel-border)', background: mode === 'auto' ? 'var(--active-accent)' : 'transparent', color: mode === 'auto' ? '#000' : '#fff', cursor: 'pointer', fontSize: '0.8rem' }}>
              Auto
            </button>
            <button onClick={() => setMode('custom')}
              style={{ padding: '0.25rem 0.65rem', borderRadius: '4px', border: '1px solid var(--panel-border)', background: mode === 'custom' ? 'var(--active-accent)' : 'transparent', color: mode === 'custom' ? '#000' : '#fff', cursor: 'pointer', fontSize: '0.8rem' }}>
              Custom
            </button>
            {mode === 'custom' && (
              <>
                <input type="text" placeholder="e.g. 15,8,42,4" value={customInput}
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
            <button onClick={() => setVizView('bars')}
              style={{ padding: '0.25rem 0.65rem', borderRadius: '4px', border: `1px solid ${vizView === 'bars' ? 'var(--active-accent)' : 'var(--panel-border)'}`, background: vizView === 'bars' ? 'rgba(255,255,255,0.1)' : 'transparent', color: vizView === 'bars' ? '#fff' : 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}>
              ▦ Bars
            </button>
            <button onClick={() => setVizView('tree')}
              style={{ padding: '0.25rem 0.65rem', borderRadius: '4px', border: `1px solid ${vizView === 'tree' ? 'var(--active-accent)' : 'var(--panel-border)'}`, background: vizView === 'tree' ? 'rgba(255,255,255,0.1)' : 'transparent', color: vizView === 'tree' ? '#fff' : 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}>
              🌲 Tree
            </button>
            {vizView === 'bars' && (
              <>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '4px' }}>Speed:</span>
                <input type="range" min="20" max="400" value={400 - speed + 20}
                  onChange={e => setSpeed(400 - parseInt(e.target.value) + 20)}
                  style={{ width: '70px', accentColor: 'var(--active-accent)' }} />
              </>
            )}
          </div>
          {vizView === 'bars' && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={reset} disabled={isRunning}
                style={{ background: 'transparent', border: '1px solid var(--panel-border)', color: '#fff', padding: '0.35rem 0.8rem', borderRadius: '4px', cursor: isRunning ? 'not-allowed' : 'pointer', opacity: isRunning ? 0.5 : 1, fontSize: '0.8rem' }}>
                Reset
              </button>
              <button onClick={isRunning ? abort : execute}
                style={{ background: isRunning ? '#ff4444' : 'var(--active-accent)', border: 'none', color: '#000', fontWeight: 'bold', padding: '0.35rem 1rem', borderRadius: '4px', cursor: 'pointer', boxShadow: '0 0 10px var(--active-accent)', fontSize: '0.8rem' }}>
                {isRunning ? 'Stop' : 'Execute'}
              </button>
            </div>
          )}
        </div>
        {errorMsg && <div style={{ color: '#ff4444', marginBottom: '0.5rem', fontSize: '0.8rem' }}>{errorMsg}</div>}

        {/* ── Bars View ── */}
        {vizView === 'bars' && (
          <>
            <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '3px', padding: '0 4px', minHeight: 0 }}>
              {array.map((val, idx) => {
                const isComparing = comparingIdx.includes(idx);
                const isSorted = sortedIdx.includes(idx);
                const isPivot = pivotIdx === idx;
                let bg = 'rgba(255,255,255,0.15)';
                let shadow = 'none';
                if (isPivot) { bg = '#ff9900'; shadow = '0 0 12px #ff9900'; }
                else if (isComparing) { bg = 'var(--active-accent)'; shadow = '0 0 12px var(--active-accent)'; }
                else if (isSorted) { bg = '#00ff88'; shadow = '0 0 8px #00ff88'; }
                return (
                  <div key={idx} title={`[${idx}] = ${val}`}
                    style={{ flex: 1, height: `${Math.max((val / maxVal) * 100, 3)}%`, background: bg, boxShadow: shadow, borderRadius: '3px 3px 0 0', transition: 'height 0.15s ease, background 0.1s ease', position: 'relative' }}>
                    {array.length <= 20 && (
                      <span style={{ position: 'absolute', top: '-18px', left: '50%', transform: 'translateX(-50%)', fontSize: '9px', color: isComparing ? '#fff' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {val}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.6rem', fontSize: '0.7rem', color: 'var(--text-muted)', flexShrink: 0 }}>
              <span><span style={{ color: 'var(--active-accent)' }}>■</span> Comparing</span>
              {algorithmId === 'quick_sort' && <span><span style={{ color: '#ff9900' }}>■</span> Pivot</span>}
              <span><span style={{ color: '#00ff88' }}>■</span> Sorted</span>
              <span><span style={{ color: 'rgba(255,255,255,0.15)' }}>■</span> Unsorted</span>
            </div>
          </>
        )}

        {/* ── Tree View ── */}
        {vizView === 'tree' && (algorithmId === 'merge_sort' || algorithmId === 'quick_sort') && (
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <MergeSortTree array={array} />
          </div>
        )}
        {vizView === 'tree' && algorithmId === 'binary_search' && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            <span style={{ fontSize: '2rem' }}>🔍</span>
            <div>Binary Search divides linearly. Switch to <strong style={{ color: 'var(--active-accent)' }}>Bars</strong> and Execute to see left/right pointer narrowing in the log.</div>
          </div>
        )}
      </div>

      {vizView === 'bars' && <StepLog steps={steps} />}
    </div>
  );
};

export default SortVisualizer;

