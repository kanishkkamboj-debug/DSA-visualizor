import React, { useState, useEffect, useRef } from 'react';
import StepLog from './StepLog';

const ArrayVisualizer = ({ algorithmId }) => {
  const [array, setArray] = useState([]);
  const [speed, setSpeed] = useState(200);
  const [mode, setMode] = useState('auto'); // 'auto' | 'custom'
  const [customInput, setCustomInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Visualization State
  const [steps, setSteps] = useState([]);
  const [pointers, setPointers] = useState({}); // { name: index } e.g. { i: 2, j: 5 }
  const [activeIndices, setActiveIndices] = useState([]); // indices currently being processed/highlighted
  const [processedIndices, setProcessedIndices] = useState([]); // indices fully processed
  const [variables, setVariables] = useState({}); // generic variable tracking e.g. { currentSum: 15, target: 10 }
  const [windowRange, setWindowRange] = useState(null); // [start, end] for sliding window
  const [secondaryArray, setSecondaryArray] = useState(null); // For prefix sum, suffix sum

  const abortController = useRef(null);

  useEffect(() => {
    reset();
  }, [algorithmId]);

  const reset = () => {
    if (abortController.current) {
      abortController.current.abort();
    }
    generateData();
    setIsRunning(false);
    setSteps([]);
    setPointers({});
    setActiveIndices([]);
    setProcessedIndices([]);
    setVariables({});
    setWindowRange(null);
    setSecondaryArray(null);
    setErrorMsg('');
  };

  const generateData = () => {
    if (mode === 'custom' && customInput) {
      const parsed = customInput.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
      if (parsed.length > 0) {
        setArray(parsed);
        return;
      }
    }
    
    // Auto generation tailored to algorithm
    let newArr = [];
    if (algorithmId === 'two_pointer') {
      newArr = Array.from({ length: 12 }, () => Math.floor(Math.random() * 20) + 1).sort((a,b) => a-b);
    } else if (algorithmId === 'dutch_flag') {
      newArr = Array.from({ length: 15 }, () => Math.floor(Math.random() * 3));
    } else if (algorithmId === 'kadane' || algorithmId === 'max_product_subarray') {
      newArr = Array.from({ length: 10 }, () => Math.floor(Math.random() * 20) - 10);
    } else if (algorithmId === 'merge_intervals') {
      // Create interval pairs [start, end] encoded sequentially e.g., 1,3, 2,6
      newArr = [1,3, 2,6, 8,10, 15,18];
    } else if (algorithmId === 'next_permutation') {
      newArr = [1, 3, 5, 4, 2];
    } else if (algorithmId === 'boyer_moore') {
      newArr = [2, 2, 1, 1, 1, 2, 2];
    } else if (algorithmId === 'trapping_rain') {
      newArr = [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1];
    } else {
      newArr = Array.from({ length: 12 }, () => Math.floor(Math.random() * 50) + 5);
    }
    setArray(newArr);
  };

  const applyCustom = () => {
    const parsed = customInput.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    if (parsed.length < 2) {
      setErrorMsg('Please enter at least 2 numbers separated by commas.');
      return;
    }
    if (parsed.length > 25) {
      setErrorMsg('Maximum 25 numbers allowed for clear visualization.');
      return;
    }
    setErrorMsg('');
    if (abortController.current) abortController.current.abort();
    setIsRunning(false);
    setSteps([]);
    setPointers({});
    setActiveIndices([]);
    setProcessedIndices([]);
    setVariables({});
    setWindowRange(null);
    setSecondaryArray(null);
    setArray(parsed);
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

  const addStep = (msg) => {
    setSteps(prev => [...prev, msg]);
  };

  const execute = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setSteps([]);
    setPointers({});
    setActiveIndices([]);
    setProcessedIndices([]);
    setVariables({});
    setWindowRange(null);
    setSecondaryArray(null);
    
    abortController.current = new AbortController();
    const signal = abortController.current.signal;

    try {
      const workingArr = [...array];
      
      switch (algorithmId) {
        case 'traversal':
          await runTraversal(workingArr, signal);
          break;
        case 'prefix_sum':
          await runPrefixSum(workingArr, signal);
          break;
        case 'suffix_sum':
          await runSuffixSum(workingArr, signal);
          break;
        case 'two_pointer':
          await runTwoPointer(workingArr, signal);
          break;
        case 'sliding_window':
          await runSlidingWindow(workingArr, signal);
          break;
        case 'kadane':
          await runKadane(workingArr, signal);
          break;
        case 'dutch_flag':
          await runDutchFlag(workingArr, signal);
          break;
        case 'merge_intervals':
          await runMergeIntervals(workingArr, signal);
          break;
        case 'next_permutation':
          await runNextPermutation(workingArr, signal);
          break;
        case 'boyer_moore':
          await runBoyerMoore(workingArr, signal);
          break;
        case 'rotate_array':
          await runRotateArray(workingArr, signal);
          break;
        case 'trapping_rain':
          await runTrappingRain(workingArr, signal);
          break;
        case 'stock_buy_sell':
          await runStockBuySell(workingArr, signal);
          break;
        case 'max_product_subarray':
          await runMaxProduct(workingArr, signal);
          break;
        case 'subarray_sum':
          await runSubarraySum(workingArr, signal);
          break;
        default:
          addStep(`Visualization logic for ${algorithmId} is under construction.`);
      }
      
      if (!signal.aborted) {
        addStep('Algorithm complete.');
        setPointers({});
        setActiveIndices([]);
      }
    } catch (err) {
      if (err.name !== 'AbortError') console.error(err);
      addStep('Execution stopped.');
    } finally {
      setIsRunning(false);
    }
  };

  const abort = () => {
    if (abortController.current) {
      abortController.current.abort();
    }
  };

  // --- Algorithm Implementations ---

  const runTraversal = async (arr, signal) => {
    addStep('Starting linear traversal of the array.');
    for (let i = 0; i < arr.length; i++) {
      setPointers({ i });
      setActiveIndices([i]);
      addStep(`Processing element at index ${i}: value ${arr[i]}`);
      await sleep(speed, signal);
      
      setProcessedIndices(prev => [...prev, i]);
    }
  };

  const runPrefixSum = async (arr, signal) => {
    addStep('Building prefix sum array.');
    const prefix = [0];
    setSecondaryArray({ name: 'Prefix Sum', data: [0] });
    await sleep(speed, signal);

    let sum = 0;
    for (let i = 0; i < arr.length; i++) {
      setPointers({ i });
      setActiveIndices([i]);
      sum += arr[i];
      addStep(`Adding arr[${i}] (${arr[i]}) to running sum. New sum: ${sum}`);
      await sleep(speed, signal);
      
      prefix.push(sum);
      setSecondaryArray({ name: 'Prefix Sum', data: [...prefix] });
      setProcessedIndices(prev => [...prev, i]);
      await sleep(speed, signal);
    }
    addStep('Prefix sum array completed. Queries can now be answered in O(1).');
  };

  const runTwoPointer = async (arr, signal) => {
    if (arr.length < 2) return;
    // We assume array is sorted for standard Two Sum
    const target = arr[0] + arr[arr.length - 1]; // Pick a valid target
    setVariables({ target });
    addStep(`Starting two-pointer search for target sum: ${target}`);
    
    let left = 0;
    let right = arr.length - 1;
    
    while (left < right) {
      setPointers({ L: left, R: right });
      setActiveIndices([left, right]);
      const sum = arr[left] + arr[right];
      setVariables({ target, currentSum: sum });
      
      addStep(`Checking L=${left}(${arr[left]}) and R=${right}(${arr[right]}). Sum = ${sum}`);
      await sleep(speed * 1.5, signal);
      
      if (sum === target) {
        addStep(`Target found at indices ${left} and ${right}!`);
        setActiveIndices([]);
        setProcessedIndices([left, right]);
        return;
      }
      
      if (sum < target) {
        addStep(`Sum ${sum} < Target ${target}. Moving Left pointer right to increase sum.`);
        left++;
      } else {
        addStep(`Sum ${sum} > Target ${target}. Moving Right pointer left to decrease sum.`);
        right--;
      }
      await sleep(speed, signal);
    }
    addStep('Target not found in array.');
  };

  const runSlidingWindow = async (arr, signal) => {
    const k = Math.min(3, arr.length);
    setVariables({ windowSize_K: k, max_sum: 0 });
    addStep(`Finding maximum sum subarray of size K=${k}`);
    
    let windowSum = 0;
    for (let i = 0; i < k; i++) {
      windowSum += arr[i];
      setActiveIndices(Array.from({length: i+1}, (_, idx) => idx));
      setWindowRange([0, i]);
    }
    
    let maxSum = windowSum;
    setVariables({ windowSize_K: k, current_sum: windowSum, max_sum: maxSum });
    addStep(`Initial window sum [0..${k-1}] is ${windowSum}`);
    await sleep(speed * 1.5, signal);
    
    for (let i = k; i < arr.length; i++) {
      const prevEl = arr[i - k];
      const nextEl = arr[i];
      windowSum = windowSum - prevEl + nextEl;
      
      setWindowRange([i - k + 1, i]);
      setActiveIndices(Array.from({length: k}, (_, idx) => i - k + 1 + idx));
      setVariables({ windowSize_K: k, current_sum: windowSum, max_sum: maxSum });
      
      addStep(`Sliding window right. Removed ${prevEl}, Added ${nextEl}. New sum: ${windowSum}`);
      await sleep(speed * 1.2, signal);
      
      if (windowSum > maxSum) {
        maxSum = windowSum;
        setVariables({ windowSize_K: k, current_sum: windowSum, max_sum: maxSum });
        addStep(`New max sum found: ${maxSum}`);
        await sleep(speed, signal);
      }
    }
  };

  const runKadane = async (arr, signal) => {
    addStep("Kadane's Algorithm: Finding maximum contiguous subarray sum");
    let maxSum = arr[0];
    let currentSum = arr[0];
    setVariables({ currentSum, maxSum });
    
    setPointers({ i: 0 });
    setActiveIndices([0]);
    await sleep(speed, signal);

    for (let i = 1; i < arr.length; i++) {
      setPointers({ i });
      setActiveIndices([i]);
      
      // Should we start fresh or add to current sub array?
      if (arr[i] > currentSum + arr[i]) {
        currentSum = arr[i];
        addStep(`arr[${i}] (${arr[i]}) > currentSum + arr[i]. Starting new subarray here.`);
        setWindowRange([i, i]); // visually show start of new subarray tracker
      } else {
        currentSum = currentSum + arr[i];
        addStep(`Adding arr[${i}] to current subarray sum. currentSum = ${currentSum}`);
        setWindowRange([windowRange ? windowRange[0] : 0, i]);
      }
      
      setVariables({ currentSum, maxSum });
      await sleep(speed * 1.2, signal);
      
      if (currentSum > maxSum) {
        maxSum = currentSum;
        setVariables({ currentSum, maxSum });
        addStep(`New max sum found: ${maxSum}`);
        setProcessedIndices(Array.from({length: i - (windowRange?.[0]||0) + 1}, (_, idx) => (windowRange?.[0]||0) + idx));
        await sleep(speed, signal);
      }
    }
  };

  const runDutchFlag = async (arr, signal) => {
    addStep('Dutch National Flag (0,1,2 sort). Pointers: low (0 boundary), mid (scanner), high (2 boundary)');
    let low = 0;
    let mid = 0;
    let high = arr.length - 1;

    while (mid <= high) {
      setPointers({ L: low, M: mid, H: high });
      setActiveIndices([mid]);
      setArray([...arr]);
      
      addStep(`Checking arr[${mid}] which is ${arr[mid]}`);
      await sleep(speed * 1.2, signal);
      
      if (arr[mid] === 0) {
        addStep(`Found 0. Swapping arr[${low}] and arr[${mid}], moving both L and M right.`);
        [arr[low], arr[mid]] = [arr[mid], arr[low]];
        low++;
        mid++;
      } else if (arr[mid] === 1) {
        addStep(`Found 1. Leaving in place, moving M right.`);
        mid++;
      } else {
        addStep(`Found 2. Swapping arr[${mid}] and arr[${high}], moving H left.`);
        [arr[mid], arr[high]] = [arr[high], arr[mid]];
        high--;
      }
      setArray([...arr]);
      await sleep(speed * 1.2, signal);
    }
    addStep('Array successfully partitioned into 0s, 1s, and 2s!');
    setProcessedIndices(arr.map((_, i) => i));
    setArray([...arr]);
  };

  const runSuffixSum = async (arr, signal) => {
    addStep('Building suffix sum array from right to left.');
    const suffix = new Array(arr.length + 1).fill(0);
    setSecondaryArray({ name: 'Suffix Sum', data: [...suffix] });
    await sleep(speed, signal);

    for (let i = arr.length - 1; i >= 0; i--) {
      setPointers({ i });
      setActiveIndices([i]);
      suffix[i] = suffix[i + 1] + arr[i];
      addStep(`Adding arr[${i}] (${arr[i]}) to suffix[${i+1}] (${suffix[i+1]}). New suffix[${i}] = ${suffix[i]}`);
      
      setSecondaryArray({ name: 'Suffix Sum', data: [...suffix] });
      setProcessedIndices(prev => [...prev, i]);
      await sleep(speed, signal);
    }
    addStep('Suffix sum array completed.');
  };

  const runMergeIntervals = async (arr, signal) => {
    addStep('Assuming inputs are sequential pairs (e.g. [1,3], [2,6]).');
    const intervals = [];
    for (let i=0; i<arr.length; i+=2) {
      if (i+1 < arr.length) intervals.push([arr[i], arr[i+1]]);
    }
    
    // Sort logic is usually first, we assume sorted for simple visualization or show it
    intervals.sort((a,b) => a[0] - b[0]);
    addStep('Intervals sorted by start time: ' + JSON.stringify(intervals));
    
    // Replace array view with flattened sorted intervals
    const flatSorted = intervals.flat();
    setArray(flatSorted);
    await sleep(speed, signal);

    const merged = [intervals[0]];
    setVariables({ merged_intervals: JSON.stringify(merged) });
    setProcessedIndices([0, 1]);
    addStep(`Initial merged set: ${JSON.stringify(merged)}`);
    await sleep(speed, signal);

    for (let i = 1; i < intervals.length; i++) {
      const current = intervals[i];
      const last = merged[merged.length - 1];
      setPointers({ currStart: i*2, currEnd: i*2 + 1 });
      setActiveIndices([i*2, i*2 + 1]);
      
      addStep(`Comparing current interval ${JSON.stringify(current)} with last merged ${JSON.stringify(last)}`);
      await sleep(speed * 1.5, signal);

      if (current[0] <= last[1]) {
        last[1] = Math.max(last[1], current[1]);
        addStep(`Overlap detected (${current[0]} <= ${last[1]}). Merging into ${JSON.stringify(last)}`);
      } else {
        merged.push(current);
        addStep(`No overlap. Adding new interval ${JSON.stringify(current)}`);
      }
      setVariables({ merged_intervals: JSON.stringify(merged) });
      setProcessedIndices(prev => [...prev, i*2, i*2 + 1]);
      await sleep(speed, signal);
    }
    addStep('Merge Complete!');
  };

  const runNextPermutation = async (arr, signal) => {
    addStep('Next Permutation: Find first decreasing element from right.');
    let i = arr.length - 2;
    while (i >= 0 && arr[i] >= arr[i + 1]) {
      setPointers({ i });
      setActiveIndices([i]);
      await sleep(speed * 0.5, signal);
      i--;
    }
    
    if (i >= 0) {
      addStep(`Found decreasing element arr[${i}] = ${arr[i]}. Now finding element just larger from right.`);
      let j = arr.length - 1;
      while (arr[j] <= arr[i]) {
        setPointers({ i, j });
        setActiveIndices([i, j]);
        await sleep(speed * 0.5, signal);
        j--;
      }
      addStep(`Found arr[${j}] = ${arr[j]}. Swapping arr[${i}] and arr[${j}].`);
      setPointers({ i, j });
      setActiveIndices([i, j]);
      [arr[i], arr[j]] = [arr[j], arr[i]];
      setArray([...arr]);
      await sleep(speed * 1.5, signal);
    } else {
      addStep('Array is fully descending (last permutation). Reversing whole array.');
    }

    addStep(`Reversing suffix from index ${i + 1} to end.`);
    let l = i + 1, r = arr.length - 1;
    while (l < r) {
      setPointers({ L: l, R: r });
      setActiveIndices([l, r]);
      await sleep(speed, signal);
      [arr[l], arr[r]] = [arr[r], arr[l]];
      setArray([...arr]);
      l++; r--;
    }
    addStep('Next permutation generated.');
    setProcessedIndices(arr.map((_, idx) => idx));
  };

  const runBoyerMoore = async (arr, signal) => {
    addStep('Boyer-Moore Majority Vote: Finding majority element (n/2 occurrences).');
    let candidate = null;
    let count = 0;
    
    for (let i = 0; i < arr.length; i++) {
      setPointers({ i });
      setActiveIndices([i]);
      
      if (count === 0) {
        candidate = arr[i];
        count = 1;
        addStep(`Count is 0. Setting new candidate to ${candidate}.`);
      } else {
        if (arr[i] === candidate) {
          count++;
          addStep(`arr[${i}] matches candidate ${candidate}. Count increases to ${count}.`);
        } else {
          count--;
          addStep(`arr[${i}] does NOT match candidate ${candidate}. Count decreases to ${count}.`);
        }
      }
      
      setVariables({ candidate: candidate, count: count });
      await sleep(speed * 1.2, signal);
    }
    
    addStep(`Candidate is ${candidate}. (Requires second pass to verify if not guaranteed)`);
    setProcessedIndices(arr.map((_, idx) => idx));
  };

  const runRotateArray = async (arr, signal) => {
    const k = 3 % arr.length; // Hardcoded k=3 for visualization
    setVariables({ K: k });
    addStep(`Rotating array to the right by K=${k} steps.`);
    
    const reverse = async (start, end) => {
      let l = start, r = end;
      while (l < r) {
        setPointers({ L: l, R: r });
        setActiveIndices([l, r]);
        await sleep(speed, signal);
        [arr[l], arr[r]] = [arr[r], arr[l]];
        setArray([...arr]);
        l++; r--;
      }
    };

    addStep('Step 1: Reverse the entire array.');
    await reverse(0, arr.length - 1);
    
    addStep(`Step 2: Reverse the first K (${k}) elements.`);
    await reverse(0, k - 1);
    
    addStep(`Step 3: Reverse the remaining elements.`);
    await reverse(k, arr.length - 1);
    
    addStep('Rotation complete.');
    setProcessedIndices(arr.map((_, idx) => idx));
    setPointers({});
    setActiveIndices([]);
  };

  const runTrappingRain = async (arr, signal) => {
    addStep('Trapping Rain Water: Two-pointer approach.');
    let l = 0, r = arr.length - 1;
    let maxL = 0, maxR = 0, water = 0;
    
    while (l < r) {
      setPointers({ L: l, R: r });
      setActiveIndices([l, r]);
      setVariables({ maxL, maxR, water });
      
      addStep(`Comparing height[L]=${arr[l]} and height[R]=${arr[r]}`);
      await sleep(speed * 1.2, signal);
      
      if (arr[l] < arr[r]) {
        if (arr[l] >= maxL) {
          maxL = arr[l];
          addStep(`height[L] >= maxL. Updating maxL to ${maxL}.`);
        } else {
          const trapped = maxL - arr[l];
          water += trapped;
          addStep(`Trapped ${trapped} units of water at L=${l}. Total: ${water}`);
        }
        setProcessedIndices(prev => [...prev, l]);
        l++;
      } else {
        if (arr[r] >= maxR) {
          maxR = arr[r];
          addStep(`height[R] >= maxR. Updating maxR to ${maxR}.`);
        } else {
          const trapped = maxR - arr[r];
          water += trapped;
          addStep(`Trapped ${trapped} units of water at R=${r}. Total: ${water}`);
        }
        setProcessedIndices(prev => [...prev, r]);
        r--;
      }
      setVariables({ maxL, maxR, water });
      await sleep(speed, signal);
    }
    addStep(`Completed. Total water trapped: ${water}`);
    setProcessedIndices(arr.map((_, idx) => idx));
  };

  const runStockBuySell = async (arr, signal) => {
    addStep('Stock Buy and Sell: Tracking minimum price and maximum profit.');
    let minPrice = Infinity;
    let maxProfit = 0;
    
    for (let i = 0; i < arr.length; i++) {
      setPointers({ i });
      setActiveIndices([i]);
      
      if (arr[i] < minPrice) {
        minPrice = arr[i];
        addStep(`arr[${i}] (${arr[i]}) < minPrice. New minPrice is ${minPrice}.`);
      } else {
        const profit = arr[i] - minPrice;
        if (profit > maxProfit) {
          maxProfit = profit;
          addStep(`arr[${i}] - minPrice = ${profit}. New maxProfit is ${maxProfit}.`);
        } else {
          addStep(`arr[${i}] - minPrice = ${profit}. maxProfit remains ${maxProfit}.`);
        }
      }
      
      setVariables({ minPrice, maxProfit });
      setProcessedIndices(prev => [...prev, i]);
      await sleep(speed * 1.2, signal);
    }
    addStep(`Done. Maximum profit is ${maxProfit}.`);
  };

  const runMaxProduct = async (arr, signal) => {
    addStep('Maximum Product Subarray: Tracking both min and max products.');
    let maxProd = arr[0];
    let minProd = arr[0];
    let result = arr[0];
    
    setVariables({ maxProd, minProd, result });
    setPointers({ i: 0 });
    setActiveIndices([0]);
    await sleep(speed, signal);

    for (let i = 1; i < arr.length; i++) {
      setPointers({ i });
      setActiveIndices([i]);
      
      const val = arr[i];
      const tempMax = maxProd;
      
      maxProd = Math.max(val, tempMax * val, minProd * val);
      minProd = Math.min(val, tempMax * val, minProd * val);
      result = Math.max(result, maxProd);
      
      setVariables({ maxProd, minProd, result });
      addStep(`Processing ${val}. Current maxProd: ${maxProd}, minProd: ${minProd}, Result: ${result}`);
      
      setProcessedIndices(prev => [...prev, i]);
      await sleep(speed * 1.5, signal);
    }
    addStep(`Done. Max product is ${result}.`);
  };

  const runSubarraySum = async (arr, signal) => {
    const k = 10; // Hardcoded target sum for visualizer
    setVariables({ target_K: k, count: 0, prefix_sum: 0 });
    addStep(`Subarray Sum Equals K=${k}: Using prefix sum + hash map.`);
    
    let count = 0;
    let prefix = 0;
    // We visualize the map stringified
    const mapObj = { 0: 1 };
    
    for (let i = 0; i < arr.length; i++) {
      setPointers({ i });
      setActiveIndices([i]);
      
      prefix += arr[i];
      const complement = prefix - k;
      
      addStep(`arr[${i}]=${arr[i]}, Prefix=${prefix}. Checking if complement ${complement} exists in map.`);
      
      if (mapObj[complement]) {
        count += mapObj[complement];
        addStep(`Found complement ${complement} occurring ${mapObj[complement]} times. Count = ${count}.`);
      } else {
        addStep(`Complement ${complement} not found in map.`);
      }
      
      mapObj[prefix] = (mapObj[prefix] || 0) + 1;
      setVariables({ target_K: k, prefix_sum: prefix, count: count, hash_map: JSON.stringify(mapObj) });
      
      setProcessedIndices(prev => [...prev, i]);
      await sleep(speed * 1.5, signal);
    }
    addStep(`Total contiguous subarrays with sum ${k} is ${count}.`);
  };

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
              <>
                <input type="text" placeholder="e.g. 1,5,2,8,3" value={customInput}
                  onChange={e => setCustomInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && applyCustom()}
                  style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid var(--panel-border)', color: '#fff', padding: '0.25rem 0.5rem', borderRadius: '4px', width: '130px', fontSize: '0.8rem' }} />
                <button onClick={applyCustom}
                  style={{ padding: '0.25rem 0.6rem', borderRadius: '4px', border: '1px solid var(--active-accent)', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: '0.8rem' }}>
                  Apply
                </button>
              </>
            )}
            <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.15)', margin: '0 4px' }} />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Speed:</span>
            <input type="range" min="20" max="600" value={600 - speed + 20}
              onChange={e => setSpeed(600 - parseInt(e.target.value) + 20)}
              style={{ width: '80px', accentColor: 'var(--active-accent)' }} />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={reset} disabled={isRunning}
              style={{ background: 'transparent', border: '1px solid var(--panel-border)', color: '#fff', padding: '0.35rem 0.8rem', borderRadius: '4px', cursor: isRunning ? 'not-allowed' : 'pointer', opacity: isRunning ? 0.5 : 1, fontSize: '0.8rem' }}>
              Reset
            </button>
            <button onClick={isRunning ? abort : execute}
              style={{ background: isRunning ? '#ff4444' : 'var(--active-accent)', border: 'none', color: '#000', fontWeight: 'bold', padding: '0.35rem 1.2rem', borderRadius: '4px', cursor: 'pointer', boxShadow: `0 0 10px var(--active-accent)`, fontSize: '0.8rem' }}>
              {isRunning ? 'Stop' : 'Execute'}
            </button>
          </div>
        </div>
        {errorMsg && <div style={{ color: '#ff4444', marginBottom: '0.5rem', fontSize: '0.8rem' }}>{errorMsg}</div>}

        {/* Generic Variables Tracker */}
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

        {/* Array Visualization Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '3rem', overflowY: 'auto' }}>
          
          {/* Main Array */}
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center' }}>
              {array.map((val, idx) => {
                const isActive = activeIndices.includes(idx);
                const isProcessed = processedIndices.includes(idx);
                const inWindow = windowRange && idx >= windowRange[0] && idx <= windowRange[1];
                
                let bg = 'rgba(255,255,255,0.05)';
                let border = '1px solid rgba(255,255,255,0.1)';
                let color = 'var(--text-muted)';
                let shadow = 'none';

                if (isActive) {
                  bg = 'var(--active-accent)';
                  border = '1px solid var(--active-accent)';
                  color = '#000';
                  shadow = '0 0 15px var(--active-accent)';
                } else if (inWindow) {
                  bg = 'rgba(255,255,255,0.15)';
                  border = '1px solid var(--active-accent)';
                  color = '#fff';
                } else if (isProcessed) {
                  bg = 'rgba(0, 255, 136, 0.2)';
                  border = '1px solid #00ff88';
                  color = '#00ff88';
                }

                // Render Pointers targeting this index
                const myPointers = Object.entries(pointers).filter(([_, pIdx]) => pIdx === idx);

                return (
                  <div key={idx} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {/* Top Pointers */}
                    <div style={{ height: '24px', display: 'flex', gap: '2px', alignItems: 'flex-end', marginBottom: '4px' }}>
                      {myPointers.map(([pName]) => (
                        <div key={pName} style={{ background: '#ff00ff', color: '#fff', fontSize: '0.65rem', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace' }}>
                          {pName} ↓
                        </div>
                      ))}
                    </div>
                    
                    {/* The Cell */}
                    <div style={{
                      width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: bg, border: border, borderRadius: '6px', color: color,
                      fontSize: '1.1rem', fontWeight: isActive || isProcessed || inWindow ? 'bold' : 'normal',
                      boxShadow: shadow, transition: 'all 0.2s ease', fontFamily: 'Fira Code, monospace'
                    }}>
                      {val}
                    </div>
                    
                    {/* Index Label */}
                    <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>
                      {idx}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Secondary Array (e.g. for Prefix Sum) */}
          {secondaryArray && (
            <div style={{ position: 'relative', marginTop: '1rem' }}>
              <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {secondaryArray.name}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center' }}>
                {secondaryArray.data.map((val, idx) => (
                  <div key={idx} style={{
                    width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)', borderRadius: '6px',
                    color: '#00ff88', fontSize: '1.1rem', fontFamily: 'Fira Code, monospace', transition: 'all 0.3s'
                  }}>
                    {val}
                  </div>
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

export default ArrayVisualizer;
