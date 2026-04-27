import React, { useState, useEffect, useRef } from 'react';
import StepLog from './StepLog';

const ArrayVisualizer = ({ algorithmId }) => {
  const [speed, setSpeed] = useState(300);
  const [mode, setMode] = useState('auto');
  const [customInput, setCustomInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // --- Snapshot Animation Engine State ---
  const [trace, setTrace] = useState([]); // Array of snapshots
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    initArray();
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

  const initArray = () => {
    setIsPlaying(false);
    setTrace([]);
    setCurrentStep(0);
    setErrorMsg('');
  };

  const applyCustom = () => {
    if (!customInput.trim()) return;
    initArray();
  };

  const getInitialData = () => {
    if (mode === 'custom' && customInput) {
      const parsed = customInput.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
      if (parsed.length > 0) return parsed;
    }
    if (algorithmId === 'two_pointer') return [2, 7, 11, 15, 19, 21, 25];
    if (algorithmId === 'dutch_flag') return [2, 0, 2, 1, 1, 0, 2, 1, 0];
    if (algorithmId === 'kadane' || algorithmId === 'max_product_subarray') return [-2, 1, -3, 4, -1, 2, 1, -5, 4];
    if (algorithmId === 'merge_intervals') return [1, 3, 2, 6, 8, 10, 15, 18];
    if (algorithmId === 'next_permutation') return [1, 3, 5, 4, 2];
    if (algorithmId === 'boyer_moore') return [2, 2, 1, 1, 1, 2, 2];
    if (algorithmId === 'trapping_rain') return [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1];
    return [5, 12, 8, 130, 44, 3, 25];
  };

  const executeAlgo = () => {
    if (trace.length > 0 && currentStep === 0) { setIsPlaying(true); return; }
    if (currentStep > 0 && currentStep < trace.length - 1) { setIsPlaying(true); return; }
    if (currentStep >= trace.length - 1 && trace.length > 0) { setCurrentStep(0); setIsPlaying(true); return; }

    const initArr = getInitialData();
    const newTrace = [];
    
    const pushState = (arr, ptrs = {}, act = [], proc = [], win = null, vars = {}, sec = null, msg = '') => {
      newTrace.push({
        array: [...arr], pointers: { ...ptrs }, activeIndices: [...act],
        processedIndices: [...proc], windowRange: win, variables: { ...vars },
        secondaryArray: sec ? { ...sec, data: [...sec.data] } : null, msg
      });
    };

    pushState(initArr, {}, [], [], null, {}, null, `Starting ${algorithmId.replaceAll('_', ' ')}...`);

    const arr = [...initArr];

    switch (algorithmId) {
      case 'traversal': runTraversal(arr, pushState); break;
      case 'prefix_sum': runPrefixSum(arr, pushState); break;
      case 'suffix_sum': runSuffixSum(arr, pushState); break;
      case 'two_pointer': runTwoPointer(arr, pushState); break;
      case 'sliding_window': runSlidingWindow(arr, pushState); break;
      case 'kadane': runKadane(arr, pushState); break;
      case 'dutch_flag': runDutchFlag(arr, pushState); break;
      case 'merge_intervals': runMergeIntervals(arr, pushState); break;
      case 'next_permutation': runNextPermutation(arr, pushState); break;
      case 'boyer_moore': runBoyerMoore(arr, pushState); break;
      case 'rotate_array': runRotateArray(arr, pushState); break;
      case 'trapping_rain': runTrappingRain(arr, pushState); break;
      case 'stock_buy_sell': runStockBuySell(arr, pushState); break;
      case 'max_product_subarray': runMaxProduct(arr, pushState); break;
      case 'subarray_sum': runSubarraySum(arr, pushState); break;
      default: pushState(arr, {}, [], [], null, {}, null, `Logic for ${algorithmId} pending.`); break;
    }

    if (newTrace.length === 1) pushState(arr, {}, [], [], null, {}, null, 'Finished.');

    setTrace(newTrace);
    setCurrentStep(0);
    setIsPlaying(true);
  };

  // --- Algorithms ---

  const runTraversal = (arr, pushState) => {
    const proc = [];
    for (let i = 0; i < arr.length; i++) {
      pushState(arr, { i }, [i], proc, null, { val: arr[i] }, null, `Visiting index ${i}, value is ${arr[i]}`);
      proc.push(i);
    }
    pushState(arr, {}, [], proc, null, {}, null, `Traversal complete.`);
  };

  const runPrefixSum = (arr, pushState) => {
    const prefix = [0];
    const proc = [];
    let sum = 0;
    pushState(arr, {}, [], [], null, {}, { name: 'Prefix Sum', data: [0] }, 'Initialized prefix sum with 0');
    for (let i = 0; i < arr.length; i++) {
      sum += arr[i];
      prefix.push(sum);
      proc.push(i);
      pushState(arr, { i }, [i], proc, null, { sum }, { name: 'Prefix Sum', data: prefix }, `Adding ${arr[i]} to running sum. Prefix[${i+1}] = ${sum}`);
    }
    pushState(arr, {}, [], proc, null, {}, { name: 'Prefix Sum', data: prefix }, `✅ Prefix Sum built in O(n).`);
  };

  const runSuffixSum = (arr, pushState) => {
    const suffix = new Array(arr.length + 1).fill(0);
    const proc = [];
    pushState(arr, {}, [], [], null, {}, { name: 'Suffix Sum', data: suffix }, 'Initialized suffix sum array with 0s');
    for (let i = arr.length - 1; i >= 0; i--) {
      suffix[i] = suffix[i + 1] + arr[i];
      proc.push(i);
      pushState(arr, { i }, [i], proc, null, {}, { name: 'Suffix Sum', data: suffix }, `Adding ${arr[i]} to suffix[${i+1}]. Suffix[${i}] = ${suffix[i]}`);
    }
    pushState(arr, {}, [], proc, null, {}, { name: 'Suffix Sum', data: suffix }, `✅ Suffix Sum built in O(n).`);
  };

  const runTwoPointer = (arr, pushState) => {
    let l = 0, r = arr.length - 1;
    const target = arr[0] + arr[r];
    pushState(arr, { L: l, R: r }, [l, r], [], null, { target }, null, `Searching for target sum ${target}`);
    while (l < r) {
      const sum = arr[l] + arr[r];
      pushState(arr, { L: l, R: r }, [l, r], [], null, { target, sum }, null, `${arr[l]} + ${arr[r]} = ${sum}`);
      if (sum === target) {
        pushState(arr, { L: l, R: r }, [], [l, r], null, { target, sum }, null, `✅ Target found!`);
        return;
      }
      if (sum < target) {
        pushState(arr, { L: l, R: r }, [l], [], null, { target, sum }, null, `Sum < target. Move Left pointer ->`);
        l++;
      } else {
        pushState(arr, { L: l, R: r }, [r], [], null, { target, sum }, null, `Sum > target. Move Right pointer <-`);
        r--;
      }
    }
    pushState(arr, {}, [], [], null, { target }, null, `Target not found.`);
  };

  const runSlidingWindow = (arr, pushState) => {
    const k = Math.min(3, arr.length);
    let sum = 0, maxSum = 0;
    
    for (let i = 0; i < k; i++) sum += arr[i];
    maxSum = sum;
    pushState(arr, {}, Array.from({length:k},(_,i)=>i), [], [0, k-1], { K: k, sum, maxSum }, null, `Initial window sum [0..${k-1}] is ${sum}`);

    for (let i = k; i < arr.length; i++) {
      const prev = arr[i - k], next = arr[i];
      sum = sum - prev + next;
      const acts = Array.from({length:k},(_,idx)=>i-k+1+idx);
      pushState(arr, {}, acts, [], [i-k+1, i], { K: k, sum, maxSum }, null, `Slide right: -${prev} +${next}. New sum: ${sum}`);
      if (sum > maxSum) {
        maxSum = sum;
        pushState(arr, {}, acts, [], [i-k+1, i], { K: k, sum, maxSum }, null, `✅ New max sum found: ${maxSum}`);
      }
    }
    pushState(arr, {}, [], arr.map((_,i)=>i), null, { K: k, maxSum }, null, `Sliding window complete.`);
  };

  const runKadane = (arr, pushState) => {
    let currSum = arr[0], maxSum = arr[0];
    const proc = [0];
    pushState(arr, { i: 0 }, [0], proc, [0, 0], { currSum, maxSum }, null, `Start: currSum=${currSum}, maxSum=${maxSum}`);
    
    let wStart = 0;
    for (let i = 1; i < arr.length; i++) {
      if (arr[i] > currSum + arr[i]) {
        currSum = arr[i];
        wStart = i;
        pushState(arr, { i }, [i], proc, [wStart, i], { currSum, maxSum }, null, `${arr[i]} > ${currSum}+${arr[i]}. Starting new subarray!`);
      } else {
        currSum += arr[i];
        pushState(arr, { i }, [i], proc, [wStart, i], { currSum, maxSum }, null, `Added ${arr[i]} to subarray. currSum=${currSum}`);
      }
      if (currSum > maxSum) {
        maxSum = currSum;
        proc.push(i);
        pushState(arr, { i }, [i], proc, [wStart, i], { currSum, maxSum }, null, `✅ New global maxSum=${maxSum}`);
      }
    }
    pushState(arr, {}, [], proc, null, { maxSum }, null, `Kadane's algorithm complete.`);
  };

  const runDutchFlag = (arr, pushState) => {
    let low = 0, mid = 0, high = arr.length - 1;
    while (mid <= high) {
      pushState(arr, { Low: low, Mid: mid, High: high }, [mid], [], null, { Val: arr[mid] }, null, `Checking arr[mid]=${arr[mid]}`);
      if (arr[mid] === 0) {
        pushState(arr, { Low: low, Mid: mid, High: high }, [low, mid], [], null, { Val: arr[mid] }, null, `0 found. Swap low & mid, increment both.`);
        [arr[low], arr[mid]] = [arr[mid], arr[low]];
        low++; mid++;
      } else if (arr[mid] === 1) {
        pushState(arr, { Low: low, Mid: mid, High: high }, [mid], [], null, { Val: arr[mid] }, null, `1 found. It's in the middle, just increment mid.`);
        mid++;
      } else {
        pushState(arr, { Low: low, Mid: mid, High: high }, [mid, high], [], null, { Val: arr[mid] }, null, `2 found. Swap mid & high, decrement high.`);
        [arr[mid], arr[high]] = [arr[high], arr[mid]];
        high--;
      }
    }
    pushState(arr, {}, [], arr.map((_,i)=>i), null, {}, null, `✅ Array sorted in 0s, 1s, and 2s.`);
  };

  const runMergeIntervals = (arr, pushState) => {
    // Treat adjacent pairs as intervals
    const intervals = [];
    for (let i = 0; i < arr.length; i += 2) {
      if (i + 1 < arr.length) intervals.push([arr[i], arr[i+1]]);
    }
    intervals.sort((a,b) => a[0] - b[0]);
    const sortedFlat = intervals.flat();
    
    const merged = [intervals[0]];
    pushState(sortedFlat, {}, [0,1], [0,1], null, { Merged: JSON.stringify(merged) }, null, `Sorted intervals. First is ${JSON.stringify(merged[0])}`);
    
    let lastMergedIdx = 0;
    const proc = [0, 1];
    
    for (let i = 1; i < intervals.length; i++) {
      const curr = intervals[i];
      const last = merged[merged.length - 1];
      const acts = [i*2, i*2+1];
      pushState(sortedFlat, { curr: i*2 }, acts, proc, null, { Merged: JSON.stringify(merged) }, null, `Comparing ${JSON.stringify(curr)} with last merged ${JSON.stringify(last)}`);
      
      if (curr[0] <= last[1]) {
        last[1] = Math.max(last[1], curr[1]);
        pushState(sortedFlat, { curr: i*2 }, acts, proc, null, { Merged: JSON.stringify(merged) }, null, `Overlap! Merging into ${JSON.stringify(last)}`);
      } else {
        merged.push(curr);
        pushState(sortedFlat, { curr: i*2 }, acts, proc, null, { Merged: JSON.stringify(merged) }, null, `No overlap. Appending ${JSON.stringify(curr)}`);
      }
      proc.push(i*2, i*2+1);
    }
    pushState(sortedFlat, {}, [], proc, null, { Final: JSON.stringify(merged) }, null, `✅ Merge Intervals complete.`);
  };

  const runNextPermutation = (arr, pushState) => {
    let i = arr.length - 2;
    while (i >= 0 && arr[i] >= arr[i + 1]) i--;
    if (i >= 0) {
      pushState(arr, { i }, [i], [], null, {}, null, `Found first decreasing element from right at index ${i} (${arr[i]})`);
      let j = arr.length - 1;
      while (arr[j] <= arr[i]) j--;
      pushState(arr, { i, j }, [i, j], [], null, {}, null, `Element just larger than ${arr[i]} from right is ${arr[j]} at index ${j}`);
      [arr[i], arr[j]] = [arr[j], arr[i]];
      pushState(arr, { i, j }, [i, j], [], null, {}, null, `Swapped ${arr[i]} and ${arr[j]}`);
    } else {
      pushState(arr, {}, [], [], null, {}, null, `Array is in descending order (last permutation). Reverse it.`);
    }
    let l = i + 1, r = arr.length - 1;
    while (l < r) {
      pushState(arr, { L: l, R: r }, [l, r], [], null, {}, null, `Reversing suffix... swapping ${arr[l]} and ${arr[r]}`);
      [arr[l], arr[r]] = [arr[r], arr[l]];
      l++; r--;
    }
    pushState(arr, {}, [], arr.map((_,i)=>i), null, {}, null, `✅ Next permutation generated.`);
  };

  const runBoyerMoore = (arr, pushState) => {
    let candidate = null, count = 0;
    const proc = [];
    for (let i = 0; i < arr.length; i++) {
      if (count === 0) {
        candidate = arr[i]; count = 1;
        pushState(arr, { i }, [i], proc, null, { Candidate: candidate, Count: count }, null, `Count is 0. Set new candidate to ${candidate}`);
      } else if (arr[i] === candidate) {
        count++;
        pushState(arr, { i }, [i], proc, null, { Candidate: candidate, Count: count }, null, `Match! Count increments to ${count}`);
      } else {
        count--;
        pushState(arr, { i }, [i], proc, null, { Candidate: candidate, Count: count }, null, `Mismatch. Count decrements to ${count}`);
      }
      proc.push(i);
    }
    pushState(arr, {}, [], proc, null, { MajorityCandidate: candidate }, null, `✅ Boyer-Moore complete. Candidate is ${candidate}.`);
  };

  const runRotateArray = (arr, pushState) => {
    const k = 3 % arr.length;
    const reverse = (l, r, desc) => {
      pushState(arr, { L: l, R: r }, [l, r], [], null, { K: k }, null, `${desc}: Reversing from index ${l} to ${r}`);
      while (l < r) {
        [arr[l], arr[r]] = [arr[r], arr[l]];
        pushState(arr, { L: l, R: r }, [l, r], [], null, { K: k }, null, `Swapped.`);
        l++; r--;
      }
    };
    reverse(0, arr.length - 1, "Step 1 (Whole array)");
    reverse(0, k - 1, "Step 2 (First K)");
    reverse(k, arr.length - 1, "Step 3 (Rest)");
    pushState(arr, {}, [], arr.map((_,i)=>i), null, { K: k }, null, `✅ Array rotated right by ${k}.`);
  };

  const runTrappingRain = (arr, pushState) => {
    let l = 0, r = arr.length - 1;
    let maxL = 0, maxR = 0, water = 0;
    const proc = [];
    while (l < r) {
      pushState(arr, { L: l, R: r }, [l, r], proc, null, { Water: water, MaxL: maxL, MaxR: maxR }, null, `Comparing arr[L]=${arr[l]} and arr[R]=${arr[r]}`);
      if (arr[l] < arr[r]) {
        if (arr[l] >= maxL) {
          maxL = arr[l];
          pushState(arr, { L: l }, [l], proc, null, { Water: water, MaxL: maxL, MaxR: maxR }, null, `arr[L] >= MaxL. Update MaxL to ${maxL}`);
        } else {
          water += maxL - arr[l];
          pushState(arr, { L: l }, [l], proc, null, { Water: water, MaxL: maxL, MaxR: maxR }, null, `Trapped ${maxL - arr[l]} water at L!`);
        }
        proc.push(l); l++;
      } else {
        if (arr[r] >= maxR) {
          maxR = arr[r];
          pushState(arr, { R: r }, [r], proc, null, { Water: water, MaxL: maxL, MaxR: maxR }, null, `arr[R] >= MaxR. Update MaxR to ${maxR}`);
        } else {
          water += maxR - arr[r];
          pushState(arr, { R: r }, [r], proc, null, { Water: water, MaxL: maxL, MaxR: maxR }, null, `Trapped ${maxR - arr[r]} water at R!`);
        }
        proc.push(r); r--;
      }
    }
    proc.push(l); // the meeting point
    pushState(arr, {}, [], proc, null, { TotalWater: water }, null, `✅ Trapping rain water complete. Total: ${water}`);
  };

  const runStockBuySell = (arr, pushState) => {
    let minPrice = Infinity, maxProfit = 0;
    const proc = [];
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] < minPrice) {
        minPrice = arr[i];
        pushState(arr, { i }, [i], proc, null, { minPrice, maxProfit }, null, `${arr[i]} is new min price.`);
      } else {
        const profit = arr[i] - minPrice;
        if (profit > maxProfit) {
          maxProfit = profit;
          pushState(arr, { i }, [i], proc, null, { minPrice, maxProfit }, null, `${arr[i]} - ${minPrice} = ${profit}. ✅ New maxProfit!`);
        } else {
          pushState(arr, { i }, [i], proc, null, { minPrice, maxProfit }, null, `${arr[i]} - ${minPrice} = ${profit} (not max)`);
        }
      }
      proc.push(i);
    }
    pushState(arr, {}, [], proc, null, { maxProfit }, null, `✅ Max Profit possible is ${maxProfit}`);
  };

  const runMaxProduct = (arr, pushState) => {
    let maxP = arr[0], minP = arr[0], res = arr[0];
    const proc = [0];
    for (let i = 1; i < arr.length; i++) {
      const val = arr[i];
      const tempMax = maxP;
      maxP = Math.max(val, tempMax * val, minP * val);
      minP = Math.min(val, tempMax * val, minP * val);
      res = Math.max(res, maxP);
      pushState(arr, { i }, [i], proc, null, { MaxProd: maxP, MinProd: minP, Res: res }, null, `Current=${val}, MaxP=${maxP}, MinP=${minP}`);
      proc.push(i);
    }
    pushState(arr, {}, [], proc, null, { Result: res }, null, `✅ Maximum product subarray is ${res}`);
  };

  const runSubarraySum = (arr, pushState) => {
    const k = 10;
    let count = 0, prefix = 0;
    const map = { 0: 1 };
    const proc = [];
    for (let i = 0; i < arr.length; i++) {
      prefix += arr[i];
      const comp = prefix - k;
      if (map[comp]) {
        count += map[comp];
        pushState(arr, { i }, [i], proc, null, { K: k, Prefix: prefix, Count: count, Map: JSON.stringify(map) }, null, `arr[i]=${arr[i]}, Prefix=${prefix}. Found complement ${comp} in map! Count=${count}`);
      } else {
        pushState(arr, { i }, [i], proc, null, { K: k, Prefix: prefix, Count: count, Map: JSON.stringify(map) }, null, `arr[i]=${arr[i]}, Prefix=${prefix}. Complement ${comp} not in map.`);
      }
      map[prefix] = (map[prefix] || 0) + 1;
      proc.push(i);
    }
    pushState(arr, {}, [], proc, null, { TotalCount: count }, null, `✅ Found ${count} contiguous subarrays summing to ${k}.`);
  };


  // --- Playback Controls ---
  const handlePlayPause = () => {
    if (trace.length === 0) executeAlgo();
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
  const currentState = trace[currentStep] || { array: getInitialData(), pointers: {}, activeIndices: [], processedIndices: [], windowRange: null, variables: {}, secondaryArray: null, msg: 'Ready.' };
  const historySteps = trace.slice(0, currentStep + 1).map(t => t.msg).filter(m => m);

  return (
    <div style={{ display: 'flex', gap: '1rem', width: '100%', height: '100%' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        
        {/* Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => { setMode('auto'); initArray(); setTimeout(executeAlgo, 100); }}
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
            
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--panel-border)', borderRadius: '4px', overflow: 'hidden' }}>
              <button onClick={handlePrev} disabled={currentStep === 0 || trace.length === 0} style={{ padding: '0.25rem 0.5rem', background: 'transparent', border: 'none', borderRight: '1px solid var(--panel-border)', color: '#fff', cursor: 'pointer', opacity: currentStep === 0 ? 0.3 : 1 }}>⏮</button>
              <button onClick={handlePlayPause} style={{ padding: '0.25rem 0.75rem', background: isPlaying ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: 'var(--active-accent)', fontWeight: 'bold', cursor: 'pointer', width: '60px' }}>{isPlaying ? '⏸' : '▶️'}</button>
              <button onClick={handleNext} disabled={currentStep >= trace.length - 1} style={{ padding: '0.25rem 0.5rem', background: 'transparent', border: 'none', borderLeft: '1px solid var(--panel-border)', color: '#fff', cursor: 'pointer', opacity: currentStep >= trace.length - 1 ? 0.3 : 1 }}>⏭</button>
            </div>
            <input type="range" min="100" max="1500" value={1500 - speed + 100} onChange={e => setSpeed(1500 - parseInt(e.target.value) + 100)} style={{ width: '80px', accentColor: 'var(--active-accent)' }} />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={initArray} style={{ background: 'transparent', border: '1px solid var(--panel-border)', color: '#fff', padding: '0.35rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Reset</button>
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

        {/* Arrays Visualization */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '3rem', overflowY: 'auto' }}>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center' }}>
            {currentState.array.map((val, idx) => {
              const isActive = currentState.activeIndices.includes(idx);
              const isProcessed = currentState.processedIndices.includes(idx);
              const inWindow = currentState.windowRange && idx >= currentState.windowRange[0] && idx <= currentState.windowRange[1];
              
              let bg = 'rgba(255,255,255,0.05)';
              let border = '1px solid rgba(255,255,255,0.1)';
              let color = 'var(--text-muted)';
              let shadow = 'none';

              if (isActive) { bg = 'var(--active-accent)'; border = '1px solid var(--active-accent)'; color = '#000'; shadow = '0 0 15px var(--active-accent)'; }
              else if (inWindow) { bg = 'rgba(255,255,255,0.15)'; border = '1px solid var(--active-accent)'; color = '#fff'; }
              else if (isProcessed) { bg = 'rgba(0, 255, 136, 0.2)'; border = '1px solid #00ff88'; color = '#00ff88'; }

              const myPointers = Object.entries(currentState.pointers).filter(([_, pIdx]) => pIdx === idx);

              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ height: '24px', display: 'flex', gap: '2px', alignItems: 'flex-end', marginBottom: '4px' }}>
                    {myPointers.map(([pName]) => (
                      <div key={pName} style={{ background: '#ff00ff', color: '#fff', fontSize: '0.65rem', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px' }}>{pName} ↓</div>
                    ))}
                  </div>
                  <div style={{ width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: bg, border, borderRadius: '6px', color, fontSize: '1.1rem', fontWeight: isActive || isProcessed || inWindow ? 'bold' : 'normal', boxShadow: shadow, transition: 'all 0.2s ease', fontFamily: 'Fira Code, monospace' }}>
                    {val}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>{idx}</div>
                </div>
              );
            })}
          </div>

          {currentState.secondaryArray && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '1rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{currentState.secondaryArray.name}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center' }}>
                {currentState.secondaryArray.data.map((val, idx) => (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 255, 136, 0.1)', border: '1px solid rgba(0, 255, 136, 0.3)', borderRadius: '4px', color: '#00ff88', fontSize: '0.9rem', fontFamily: 'Fira Code, monospace' }}>
                      {val}
                    </div>
                    <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>{idx}</div>
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

export default ArrayVisualizer;
