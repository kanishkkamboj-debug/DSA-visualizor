import React, { useState, useEffect, useRef } from 'react';
import StepLog from './StepLog';
import MergeSortTree from './MergeSortTree';

const generateArray = (size = 20) =>
  Array.from({ length: size }, () => Math.floor(Math.random() * 90) + 10);

const SortVisualizer = ({ algorithmId }) => {
  const [array, setArray] = useState(() => generateArray());
  const [speed, setSpeed] = useState(80);
  const [vizView, setVizView] = useState('bars'); // 'bars' | 'tree'
  const [mode, setMode] = useState('auto');
  const [customInput, setCustomInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // --- Snapshot Animation Engine State ---
  const [trace, setTrace] = useState([]); // Array of snapshots
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSorted, setIsSorted] = useState(false);

  // Playback loop
  useEffect(() => {
    let timer;
    if (isPlaying && currentStep < trace.length - 1) {
      timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, speed);
    } else if (currentStep >= trace.length - 1 && trace.length > 0) {
      setIsPlaying(false);
      setIsSorted(true);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentStep, trace, speed]);

  useEffect(() => {
    reset();
  }, [algorithmId]);

  const reset = () => {
    setIsPlaying(false);
    setTrace([]);
    setCurrentStep(0);
    setIsSorted(false);
    setArray(generateArray());
    setErrorMsg('');
  };

  const applyCustom = () => {
    const parsed = customInput.split(',').map(s => parseInt(s.trim(), 10));
    if (parsed.some(isNaN) || parsed.length < 2) {
      setErrorMsg('Enter at least 2 comma-separated numbers e.g. 15,8,42,4');
      return;
    }
    setErrorMsg('');
    setIsPlaying(false);
    setTrace([]);
    setCurrentStep(0);
    setIsSorted(false);
    setArray(parsed);
  };

  // --- Snapshot Builder ---
  const executeSort = () => {
    if (trace.length > 0 && currentStep === 0) {
      // Already generated, just play
      setIsPlaying(true);
      return;
    }
    if (currentStep > 0 && currentStep < trace.length - 1) {
      // Resume
      setIsPlaying(true);
      return;
    }
    if (currentStep >= trace.length - 1 && trace.length > 0) {
      // Already finished, restart
      setCurrentStep(0);
      setIsPlaying(true);
      return;
    }

    // Generate Trace
    const newTrace = [];
    const arr = [...array];
    
    const pushState = (a, comp = [], sorted = [], pivot = null, msg = '', secondary = []) => {
      newTrace.push({
        array: [...a],
        comparingIdx: [...comp],
        sortedIdx: [...sorted],
        pivotIdx: pivot,
        secondaryIdx: [...secondary], // for buckets or boundaries
        msg
      });
    };

    pushState(arr, [], [], null, 'Starting sort...');

    switch (algorithmId) {
      case 'bubble_sort': runBubbleSort(arr, pushState); break;
      case 'selection_sort': runSelectionSort(arr, pushState); break;
      case 'insertion_sort': runInsertionSort(arr, pushState); break;
      case 'merge_sort': runMergeSort(arr, pushState); break;
      case 'quick_sort': runQuickSort(arr, pushState); break;
      case 'heap_sort': runHeapSort(arr, pushState); break;
      case 'counting_sort': runCountingSort(arr, pushState); break;
      case 'radix_sort': runRadixSort(arr, pushState); break;
      case 'bucket_sort': runBucketSort(arr, pushState); break;
      case 'quick_select': runQuickSelect(arr, pushState); break;
      case 'binary_search': runBinarySearch(arr, pushState); break;
      default: pushState(arr, [], [], null, `Logic for ${algorithmId} coming soon.`); break;
    }

    pushState(arr, [], arr.map((_, i) => i), null, '✅ Algorithm Complete!');
    setTrace(newTrace);
    setCurrentStep(0);
    setIsPlaying(true);
    setIsSorted(false);
  };

  // --- Algorithms ---

  const runBubbleSort = (arr, pushState) => {
    const n = arr.length;
    const sorted = [];
    for (let i = 0; i < n - 1; i++) {
      let swapped = false;
      for (let j = 0; j < n - i - 1; j++) {
        pushState(arr, [j, j + 1], sorted, null, `Comparing ${arr[j]} and ${arr[j + 1]}`);
        if (arr[j] > arr[j + 1]) {
          [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
          swapped = true;
          pushState(arr, [j, j + 1], sorted, null, `Swapped ${arr[j + 1]} and ${arr[j]}`);
        }
      }
      sorted.push(n - i - 1);
      pushState(arr, [], sorted, null, `${arr[n - i - 1]} is in its final position.`);
      if (!swapped) break;
    }
    for (let i = 0; i < n; i++) if (!sorted.includes(i)) sorted.push(i);
  };

  const runSelectionSort = (arr, pushState) => {
    const n = arr.length;
    const sorted = [];
    for (let i = 0; i < n; i++) {
      let minIdx = i;
      pushState(arr, [i], sorted, minIdx, `Finding minimum for index ${i}`);
      for (let j = i + 1; j < n; j++) {
        pushState(arr, [j], sorted, minIdx, `Comparing with current min ${arr[minIdx]}`);
        if (arr[j] < arr[minIdx]) {
          minIdx = j;
          pushState(arr, [j], sorted, minIdx, `New minimum found: ${arr[minIdx]}`);
        }
      }
      if (minIdx !== i) {
        [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
        pushState(arr, [i, minIdx], sorted, null, `Swapping ${arr[minIdx]} and ${arr[i]}`);
      }
      sorted.push(i);
    }
  };

  const runInsertionSort = (arr, pushState) => {
    const n = arr.length;
    for (let i = 1; i < n; i++) {
      let key = arr[i];
      let j = i - 1;
      pushState(arr, [i], [], null, `Inserting ${key} into sorted portion`);
      while (j >= 0 && arr[j] > key) {
        pushState(arr, [j, j + 1], [], null, `${arr[j]} > ${key}, shifting ${arr[j]} right`);
        arr[j + 1] = arr[j];
        j--;
      }
      arr[j + 1] = key;
      pushState(arr, [j + 1], [], null, `Placed ${key} at index ${j + 1}`);
    }
  };

  const runMergeSort = (arr, pushState) => {
    const sort = (left, right) => {
      if (left >= right) return;
      const mid = Math.floor((left + right) / 2);
      sort(left, mid);
      sort(mid + 1, right);
      merge(left, mid, right);
    };

    const merge = (left, mid, right) => {
      const L = arr.slice(left, mid + 1);
      const R = arr.slice(mid + 1, right + 1);
      let i = 0, j = 0, k = left;
      
      pushState(arr, [], [], null, `Merging [${L.join(',')}] and [${R.join(',')}]`, [left, right]);

      while (i < L.length && j < R.length) {
        pushState(arr, [left + i, mid + 1 + j], [], null, `Compare ${L[i]} & ${R[j]}`);
        if (L[i] <= R[j]) {
          arr[k++] = L[i++];
        } else {
          arr[k++] = R[j++];
        }
        pushState(arr, [k - 1], [], null, `Placed ${arr[k - 1]}`);
      }
      while (i < L.length) { arr[k++] = L[i++]; pushState(arr, [k - 1], [], null, `Placed remaining ${arr[k - 1]}`); }
      while (j < R.length) { arr[k++] = R[j++]; pushState(arr, [k - 1], [], null, `Placed remaining ${arr[k - 1]}`); }
    };
    sort(0, arr.length - 1);
  };

  const runQuickSort = (arr, pushState) => {
    const sorted = [];
    const sort = (low, high) => {
      if (low < high) {
        const pi = partition(low, high);
        sort(low, pi - 1);
        sort(pi + 1, high);
      } else if (low === high) {
        sorted.push(low);
      }
    };
    const partition = (low, high) => {
      const pivot = arr[high];
      let i = low - 1;
      pushState(arr, [], sorted, high, `Pivot selected: ${pivot}`);
      for (let j = low; j < high; j++) {
        pushState(arr, [j], sorted, high, `Compare ${arr[j]} with pivot ${pivot}`);
        if (arr[j] <= pivot) {
          i++;
          [arr[i], arr[j]] = [arr[j], arr[i]];
          pushState(arr, [i, j], sorted, high, `Swapped ${arr[i]} and ${arr[j]}`);
        }
      }
      [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
      sorted.push(i + 1);
      pushState(arr, [i + 1], sorted, null, `Pivot ${pivot} placed at final pos ${i + 1}`);
      return i + 1;
    };
    sort(0, arr.length - 1);
  };

  const runHeapSort = (arr, pushState) => {
    const n = arr.length;
    const sorted = [];
    
    const heapify = (len, i) => {
      let largest = i;
      const l = 2 * i + 1;
      const r = 2 * i + 2;
      
      pushState(arr, [i, l, r].filter(x => x < len), sorted, null, `Heapifying subtree at index ${i}`);
      
      if (l < len && arr[l] > arr[largest]) largest = l;
      if (r < len && arr[r] > arr[largest]) largest = r;
      
      if (largest !== i) {
        [arr[i], arr[largest]] = [arr[largest], arr[i]];
        pushState(arr, [i, largest], sorted, null, `Swapped ${arr[i]} and ${arr[largest]} to maintain Max Heap`);
        heapify(len, largest);
      }
    };

    pushState(arr, [], [], null, 'Phase 1: Building Max Heap');
    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) heapify(n, i);
    
    pushState(arr, [], [], null, 'Phase 2: Extracting elements from Heap');
    for (let i = n - 1; i > 0; i--) {
      [arr[0], arr[i]] = [arr[i], arr[0]];
      sorted.push(i);
      pushState(arr, [0, i], sorted, null, `Moved max element ${arr[i]} to end`);
      heapify(i, 0);
    }
    sorted.push(0);
  };

  const runCountingSort = (arr, pushState) => {
    const max = Math.max(...arr);
    pushState(arr, [], [], null, `Max value is ${max}. Creating count array.`);
    const count = new Array(max + 1).fill(0);
    for (let i = 0; i < arr.length; i++) {
      count[arr[i]]++;
      pushState(arr, [i], [], null, `Count of ${arr[i]} is now ${count[arr[i]]}`);
    }
    let idx = 0;
    for (let i = 0; i <= max; i++) {
      while (count[i] > 0) {
        arr[idx] = i;
        pushState(arr, [idx], [], null, `Placing ${i} at index ${idx}`);
        idx++;
        count[i]--;
      }
    }
  };

  const runRadixSort = (arr, pushState) => {
    const max = Math.max(...arr);
    for (let exp = 1; Math.floor(max / exp) > 0; exp *= 10) {
      pushState(arr, [], [], null, `Sorting by digit: ${exp}s place`);
      const output = new Array(arr.length).fill(0);
      const count = new Array(10).fill(0);
      
      for (let i = 0; i < arr.length; i++) count[Math.floor(arr[i] / exp) % 10]++;
      for (let i = 1; i < 10; i++) count[i] += count[i - 1];
      
      for (let i = arr.length - 1; i >= 0; i--) {
        const digit = Math.floor(arr[i] / exp) % 10;
        output[count[digit] - 1] = arr[i];
        pushState(arr, [i], [], null, `Moving ${arr[i]} based on digit ${digit}`);
        count[digit]--;
      }
      for (let i = 0; i < arr.length; i++) {
        arr[i] = output[i];
        pushState(arr, [i], [], null, `Updating array with sorted element ${arr[i]}`);
      }
    }
  };

  const runBucketSort = (arr, pushState) => {
    pushState(arr, [], [], null, 'Bucket Sort visualization simplifies the bucket distribution');
    const n = arr.length;
    const max = Math.max(...arr);
    const buckets = Array.from({ length: n }, () => []);
    
    for (let i = 0; i < n; i++) {
      const idx = Math.floor((arr[i] / (max + 1)) * n);
      buckets[idx].push(arr[i]);
      pushState(arr, [i], [], null, `Distributed ${arr[i]} to bucket ${idx}`);
    }
    
    let arrIdx = 0;
    for (let i = 0; i < n; i++) {
      buckets[i].sort((a, b) => a - b);
      for (const num of buckets[i]) {
        arr[arrIdx++] = num;
        pushState(arr, [arrIdx - 1], [], null, `Restored ${num} from bucket ${i}`);
      }
    }
  };

  const runQuickSelect = (arr, pushState) => {
    const k = Math.floor(arr.length / 2);
    pushState(arr, [], [], null, `Quick Select: Finding the ${k}th element (Median)`);
    
    const partition = (low, high) => {
      const pivot = arr[high];
      let i = low - 1;
      pushState(arr, [], [], high, `Pivot selected: ${pivot}`);
      for (let j = low; j < high; j++) {
        if (arr[j] <= pivot) {
          i++;
          [arr[i], arr[j]] = [arr[j], arr[i]];
          pushState(arr, [i, j], [], high, `Swapped ${arr[i]} and ${arr[j]}`);
        }
      }
      [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
      pushState(arr, [i + 1], [], null, `Pivot ${pivot} placed at pos ${i + 1}`);
      return i + 1;
    };
    
    let low = 0, high = arr.length - 1;
    while (low <= high) {
      const pi = partition(low, high);
      if (pi === k) {
        pushState(arr, [pi], [pi], null, `Found ${k}th element: ${arr[pi]}!`);
        break;
      } else if (pi < k) {
        low = pi + 1;
      } else {
        high = pi - 1;
      }
    }
  };

  const runBinarySearch = (arr, pushState) => {
    arr.sort((a, b) => a - b);
    const target = arr[Math.floor(Math.random() * arr.length)];
    pushState(arr, [], [], null, `Sorted array. Searching for target: ${target}`);
    
    let left = 0, right = arr.length - 1;
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      pushState(arr, [mid], [], null, `Left=${left}, Right=${right}. Checking Mid=${arr[mid]}`, [left, right]);
      
      if (arr[mid] === target) {
        pushState(arr, [mid], [mid], null, `✅ Found ${target} at index ${mid}!`);
        return;
      } else if (arr[mid] < target) {
        pushState(arr, [mid], [], null, `${arr[mid]} < ${target} → search RIGHT`);
        left = mid + 1;
      } else {
        pushState(arr, [mid], [], null, `${arr[mid]} > ${target} → search LEFT`);
        right = mid - 1;
      }
    }
    pushState(arr, [], [], null, `❌ ${target} not found`);
  };

  // --- Playback Controls ---
  const handlePlayPause = () => {
    if (trace.length === 0) executeSort();
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
  const currentState = trace[currentStep] || { array, comparingIdx: [], sortedIdx: [], pivotIdx: null, secondaryIdx: [], msg: 'Ready.' };
  const maxVal = Math.max(...currentState.array, 1);

  // Derive steps array for StepLog (show history up to currentStep)
  const historySteps = trace.slice(0, currentStep + 1).map(t => t.msg).filter(m => m);

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
            
            {/* Playback Controls */}
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--panel-border)', borderRadius: '4px', overflow: 'hidden' }}>
              <button onClick={handlePrev} disabled={currentStep === 0 || trace.length === 0} style={{ padding: '0.25rem 0.5rem', background: 'transparent', border: 'none', borderRight: '1px solid var(--panel-border)', color: '#fff', cursor: 'pointer', opacity: currentStep === 0 ? 0.3 : 1 }}>⏮</button>
              <button onClick={handlePlayPause} style={{ padding: '0.25rem 0.75rem', background: isPlaying ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: 'var(--active-accent)', fontWeight: 'bold', cursor: 'pointer', width: '60px' }}>
                {isPlaying ? '⏸' : '▶️'}
              </button>
              <button onClick={handleNext} disabled={currentStep >= trace.length - 1} style={{ padding: '0.25rem 0.5rem', background: 'transparent', border: 'none', borderLeft: '1px solid var(--panel-border)', color: '#fff', cursor: 'pointer', opacity: currentStep >= trace.length - 1 ? 0.3 : 1 }}>⏭</button>
            </div>
            
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '4px' }}>Speed:</span>
            <input type="range" min="10" max="800" value={800 - speed + 10}
              onChange={e => setSpeed(800 - parseInt(e.target.value) + 10)}
              style={{ width: '70px', accentColor: 'var(--active-accent)' }} />
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={reset}
              style={{ background: 'transparent', border: '1px solid var(--panel-border)', color: '#fff', padding: '0.35rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>
              Reset
            </button>
          </div>
        </div>
        {errorMsg && <div style={{ color: '#ff4444', marginBottom: '0.5rem', fontSize: '0.8rem' }}>{errorMsg}</div>}

        {/* ── Bars View ── */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '3px', padding: '0 4px', minHeight: 0, marginTop: '2rem' }}>
          {currentState.array.map((val, idx) => {
            const isComparing = currentState.comparingIdx.includes(idx);
            const isSorted = currentState.sortedIdx.includes(idx);
            const isPivot = currentState.pivotIdx === idx;
            const isSecondary = currentState.secondaryIdx.includes(idx);
            
            let bg = 'rgba(255,255,255,0.15)';
            let shadow = 'none';
            let border = 'none';
            
            if (isPivot) { bg = '#ff9900'; shadow = '0 0 12px #ff9900'; }
            else if (isComparing) { bg = 'var(--active-accent)'; shadow = '0 0 12px var(--active-accent)'; }
            else if (isSorted) { bg = '#00ff88'; shadow = '0 0 8px #00ff88'; }
            
            if (isSecondary && !isComparing && !isPivot) {
              border = '2px solid #ff00ff';
            }

            return (
              <div key={idx} title={`[${idx}] = ${val}`}
                style={{ flex: 1, height: `${Math.max((val / maxVal) * 100, 3)}%`, background: bg, boxShadow: shadow, border, borderRadius: '3px 3px 0 0', transition: 'height 0.15s ease, background 0.1s ease', position: 'relative' }}>
                {currentState.array.length <= 40 && (
                  <span style={{ position: 'absolute', top: '-18px', left: '50%', transform: 'translateX(-50%)', fontSize: '9px', color: isComparing ? '#fff' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {val}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.6rem', fontSize: '0.7rem', color: 'var(--text-muted)', flexShrink: 0 }}>
          <span><span style={{ color: 'var(--active-accent)' }}>■</span> Active/Comparing</span>
          {['quick_sort', 'quick_select'].includes(algorithmId) && <span><span style={{ color: '#ff9900' }}>■</span> Pivot</span>}
          <span><span style={{ color: '#00ff88' }}>■</span> Sorted</span>
          {algorithmId === 'binary_search' && <span><span style={{ color: '#ff00ff' }}>■</span> Search Boundaries</span>}
        </div>
      </div>

      <StepLog steps={historySteps} currentStep={currentStep} />
    </div>
  );
};

export default SortVisualizer;
