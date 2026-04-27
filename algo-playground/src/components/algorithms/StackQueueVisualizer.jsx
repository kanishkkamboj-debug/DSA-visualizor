import React, { useState, useEffect, useRef } from 'react';
import StepLog from './StepLog';

const StackQueueVisualizer = ({ algorithmId }) => {
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
      if (algorithmId === 'valid_parens' || algorithmId === 'infix_postfix') {
        return customInputA.split('');
      } else {
        return customInputA.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
      }
    }
    
    switch (algorithmId) {
      case 'valid_parens': return "({[]})".split('');
      case 'largest_rectangle': return [2, 1, 5, 6, 2, 3];
      case 'infix_postfix': return "A+B*C".split('');
      case 'sliding_window_max': return [1, 3, -1, -3, 5, 3, 6, 7];
      case 'next_greater':
      case 'prev_greater': return [4, 5, 2, 10, 8];
      case 'min_stack':
      case 'queue_using_stack':
      case 'stack_using_queue':
      case 'circular_queue':
        return [10, 20, 30, 40, 50]; // Represents sequence of items to Push/Enqueue
      default: return [1, 2, 3, 4, 5];
    }
  };

  const executeAlgo = () => {
    if (trace.length > 0 && currentStep === 0) { setIsPlaying(true); return; }
    if (currentStep > 0 && currentStep < trace.length - 1) { setIsPlaying(true); return; }
    if (currentStep >= trace.length - 1 && trace.length > 0) { setCurrentStep(0); setIsPlaying(true); return; }

    const inputData = getInitialData();
    const newTrace = [];
    
    // Arrays for visualization:
    // primary: usually the stack or main queue
    // secondary: second stack/queue or result array
    // inputData: the array being processed
    const pushState = (primary, secondary, inputArr, ptrs={}, actInput=[], actPrimary=[], actSecondary=[], vars={}, msg='') => {
      newTrace.push({
        primary: [...primary],
        secondary: [...secondary],
        inputArr: [...inputArr],
        pointers: { ...ptrs },
        activeInput: [...actInput],
        activePrimary: [...actPrimary],
        activeSecondary: [...actSecondary],
        variables: { ...vars },
        msg
      });
    };

    pushState([], [], inputData, {}, [], [], [], {}, `Starting ${algorithmId.replaceAll('_', ' ')}...`);

    const arr = [...inputData];

    switch (algorithmId) {
      case 'next_greater': runNextGreater(arr, pushState); break;
      case 'prev_greater': runPrevGreater(arr, pushState); break;
      case 'valid_parens': runValidParens(arr, pushState); break;
      case 'largest_rectangle': runLargestRectangle(arr, pushState); break;
      case 'min_stack': runMinStack(arr, pushState); break;
      case 'infix_postfix': runInfixPostfix(arr, pushState); break;
      case 'queue_using_stack': runQueueUsingStack(arr, pushState); break;
      case 'stack_using_queue': runStackUsingQueue(arr, pushState); break;
      case 'sliding_window_max': runSlidingWindowMax(arr, pushState); break;
      case 'circular_queue': runCircularQueue(arr, pushState); break;
      default: pushState([], [], arr, {}, [], [], [], {}, `Logic for ${algorithmId} pending.`); break;
    }

    if (newTrace.length === 1) pushState([], [], arr, {}, [], [], [], {}, 'Finished.');

    setTrace(newTrace);
    setCurrentStep(0);
    setIsPlaying(true);
  };

  // --- Algorithms ---

  const runNextGreater = (arr, pushState) => {
    const stack = []; // will store indices
    const res = new Array(arr.length).fill(-1);
    
    for (let i = 0; i < arr.length; i++) {
      pushState(stack.map(idx => arr[idx]), res, arr, { i }, [i], [], [], { Result: JSON.stringify(res) }, `Processing element ${arr[i]} at index ${i}`);
      
      while (stack.length > 0 && arr[stack[stack.length - 1]] < arr[i]) {
        const topIdx = stack.pop();
        res[topIdx] = arr[i];
        pushState(stack.map(idx => arr[idx]), res, arr, { i }, [i, topIdx], [stack.length], [topIdx], { Result: JSON.stringify(res) }, `Found next greater for ${arr[topIdx]}: ${arr[i]}. Popping stack.`);
      }
      
      stack.push(i);
      pushState(stack.map(idx => arr[idx]), res, arr, { i }, [i], [stack.length - 1], [], { Result: JSON.stringify(res) }, `Pushing ${arr[i]} to stack.`);
    }
    pushState(stack.map(idx => arr[idx]), res, arr, {}, [], [], [], { FinalResult: JSON.stringify(res) }, `✅ Next Greater Element complete.`);
  };

  const runPrevGreater = (arr, pushState) => {
    const stack = []; 
    const res = new Array(arr.length).fill(-1);
    
    for (let i = 0; i < arr.length; i++) {
      pushState(stack.map(idx => arr[idx]), res, arr, { i }, [i], [], [], { Result: JSON.stringify(res) }, `Processing element ${arr[i]}`);
      
      while (stack.length > 0 && arr[stack[stack.length - 1]] <= arr[i]) {
        const popped = stack.pop();
        pushState(stack.map(idx => arr[idx]), res, arr, { i }, [i], [stack.length], [], { Result: JSON.stringify(res) }, `${arr[popped]} <= ${arr[i]}. Popping stack.`);
      }
      
      if (stack.length > 0) {
        res[i] = arr[stack[stack.length - 1]];
        pushState(stack.map(idx => arr[idx]), res, arr, { i }, [i], [stack.length - 1], [i], { Result: JSON.stringify(res) }, `Previous greater for ${arr[i]} is ${res[i]}.`);
      } else {
        pushState(stack.map(idx => arr[idx]), res, arr, { i }, [i], [], [i], { Result: JSON.stringify(res) }, `Stack empty. No previous greater for ${arr[i]}.`);
      }
      
      stack.push(i);
      pushState(stack.map(idx => arr[idx]), res, arr, { i }, [i], [stack.length - 1], [], { Result: JSON.stringify(res) }, `Pushing ${arr[i]} to stack.`);
    }
    pushState(stack.map(idx => arr[idx]), res, arr, {}, [], [], [], { FinalResult: JSON.stringify(res) }, `✅ Previous Greater Element complete.`);
  };

  const runValidParens = (arr, pushState) => {
    const stack = [];
    const map = { ')': '(', '}': '{', ']': '[' };
    
    for (let i = 0; i < arr.length; i++) {
      const c = arr[i];
      pushState(stack, [], arr, { i }, [i], [], [], {}, `Checking '${c}'`);
      
      if (['(', '{', '['].includes(c)) {
        stack.push(c);
        pushState(stack, [], arr, { i }, [i], [stack.length - 1], [], {}, `Pushed '${c}' to stack.`);
      } else {
        if (stack.length === 0) {
          pushState(stack, [], arr, { i }, [i], [], [], {}, `❌ Stack is empty but found closing '${c}'. Invalid!`);
          return;
        }
        const top = stack.pop();
        pushState(stack, [], arr, { i }, [i], [stack.length], [], {}, `Popped '${top}' for comparison with '${c}'`);
        
        if (map[c] !== top) {
          pushState(stack, [], arr, { i }, [i], [], [], {}, `❌ Mismatch! Expected '${map[c]}' but found '${top}'. Invalid!`);
          return;
        }
        pushState(stack, [], arr, { i }, [i], [], [], {}, `✅ Match found.`);
      }
    }
    
    if (stack.length === 0) pushState(stack, [], arr, {}, [], [], [], {}, `✅ Stack empty. Parentheses are Valid!`);
    else pushState(stack, [], arr, {}, [], [], [], {}, `❌ Stack not empty. Unmatched opening parentheses remain.`);
  };

  const runLargestRectangle = (arr, pushState) => {
    const stack = []; // stores indices
    let maxArea = 0;
    let i = 0;
    
    while (i < arr.length) {
      pushState(stack.map(idx => `${arr[idx]}(idx:${idx})`), [], arr, { i }, [i], [], [], { MaxArea: maxArea }, `Checking bar of height ${arr[i]} at index ${i}`);
      
      if (stack.length === 0 || arr[stack[stack.length - 1]] <= arr[i]) {
        stack.push(i);
        pushState(stack.map(idx => `${arr[idx]}(idx:${idx})`), [], arr, { i }, [i], [stack.length - 1], [], { MaxArea: maxArea }, `Pushing index ${i} to stack.`);
        i++;
      } else {
        const topIdx = stack.pop();
        const height = arr[topIdx];
        const width = stack.length === 0 ? i : i - stack[stack.length - 1] - 1;
        const area = height * width;
        maxArea = Math.max(maxArea, area);
        
        pushState(stack.map(idx => `${arr[idx]}(idx:${idx})`), [], arr, { i }, [topIdx], [stack.length], [], { MaxArea: maxArea, AreaCalculated: `${height} * ${width} = ${area}` }, `Popped index ${topIdx} (height ${height}). Area = ${area}`);
      }
    }
    
    while (stack.length > 0) {
      const topIdx = stack.pop();
      const height = arr[topIdx];
      const width = stack.length === 0 ? i : i - stack[stack.length - 1] - 1;
      const area = height * width;
      maxArea = Math.max(maxArea, area);
      pushState(stack.map(idx => `${arr[idx]}(idx:${idx})`), [], arr, {}, [topIdx], [stack.length], [], { MaxArea: maxArea, AreaCalculated: `${height} * ${width} = ${area}` }, `Emptying stack. Popped index ${topIdx}. Area = ${area}`);
    }
    
    pushState([], [], arr, {}, [], [], [], { FinalMaxArea: maxArea }, `✅ Largest Rectangle Area is ${maxArea}`);
  };

  const runMinStack = (arr, pushState) => {
    const stack = [];
    const minStack = [];
    
    for (let i = 0; i < arr.length; i++) {
      const val = arr[i];
      pushState(stack, minStack, arr, { i }, [i], [], [], {}, `Pushing ${val}`);
      
      stack.push(val);
      if (minStack.length === 0 || val <= minStack[minStack.length - 1]) {
        minStack.push(val);
        pushState(stack, minStack, arr, { i }, [i], [stack.length - 1], [minStack.length - 1], {}, `${val} is new min. Pushed to MinStack.`);
      } else {
        minStack.push(minStack[minStack.length - 1]);
        pushState(stack, minStack, arr, { i }, [i], [stack.length - 1], [minStack.length - 1], {}, `Min unchanged. Duplicated top of MinStack.`);
      }
    }
    
    pushState(stack, minStack, arr, {}, [], [], [], {}, `✅ MinStack simulation populated. Elements pop in reverse order.`);
  };

  const runInfixPostfix = (arr, pushState) => {
    const prec = { '+': 1, '-': 1, '*': 2, '/': 2, '^': 3 };
    const stack = [];
    let postfix = "";
    
    for (let i = 0; i < arr.length; i++) {
      const c = arr[i];
      pushState(stack, [postfix], arr, { i }, [i], [], [], {}, `Processing '${c}'`);
      
      if (/[a-zA-Z0-9]/.test(c)) {
        postfix += c;
        pushState(stack, [postfix], arr, { i }, [i], [], [0], {}, `Operand '${c}' added directly to postfix.`);
      } else if (c === '(') {
        stack.push(c);
        pushState(stack, [postfix], arr, { i }, [i], [stack.length - 1], [], {}, `Pushed '(' to stack.`);
      } else if (c === ')') {
        while (stack.length > 0 && stack[stack.length - 1] !== '(') {
          postfix += stack.pop();
          pushState(stack, [postfix], arr, { i }, [i], [stack.length], [0], {}, `Popping until '('. Postfix: ${postfix}`);
        }
        stack.pop(); // pop '('
        pushState(stack, [postfix], arr, { i }, [i], [], [], {}, `Popped '(' and discarded.`);
      } else {
        while (stack.length > 0 && (c === '^' ? prec[c] < prec[stack[stack.length - 1]] : prec[c] <= prec[stack[stack.length - 1]])) {
          postfix += stack.pop();
          pushState(stack, [postfix], arr, { i }, [i], [stack.length], [0], {}, `Popped higher/eq precedence operator. Postfix: ${postfix}`);
        }
        stack.push(c);
        pushState(stack, [postfix], arr, { i }, [i], [stack.length - 1], [], {}, `Pushed '${c}' to stack.`);
      }
    }
    
    while (stack.length > 0) {
      postfix += stack.pop();
      pushState(stack, [postfix], arr, {}, [], [stack.length], [0], {}, `Emptying remaining operators from stack. Postfix: ${postfix}`);
    }
    pushState([], [postfix], arr, {}, [], [], [], { Postfix: postfix }, `✅ Conversion complete!`);
  };

  const runQueueUsingStack = (arr, pushState) => {
    const s1 = []; // primary
    const s2 = []; // secondary
    
    // Simulate Enqueue
    for (let i = 0; i < 3; i++) {
      s1.push(arr[i]);
      pushState(s1, s2, arr, { idx: i }, [i], [s1.length - 1], [], { Operation: `Enqueue(${arr[i]})` }, `Pushed ${arr[i]} directly to S1.`);
    }
    
    // Simulate Dequeue
    pushState(s1, s2, arr, {}, [], [], [], { Operation: `Dequeue()` }, `Dequeue requested. Transferring S1 to S2...`);
    while (s1.length > 0) {
      s2.push(s1.pop());
      pushState(s1, s2, arr, {}, [], [s1.length], [s2.length - 1], { Operation: `Dequeue()` }, `Popped from S1, Pushed to S2.`);
    }
    
    const dequeued = s2.pop();
    pushState(s1, s2, arr, {}, [], [], [s2.length], { Operation: `Dequeue()`, Result: dequeued }, `✅ Popped ${dequeued} from S2. (Oldest element)`);
  };

  const runStackUsingQueue = (arr, pushState) => {
    let q1 = []; // primary
    let q2 = []; // secondary
    
    // Simulate Push
    for (let i = 0; i < 3; i++) {
      q2.push(arr[i]);
      pushState(q1, q2, arr, { idx: i }, [i], [], [q2.length - 1], { Operation: `Push(${arr[i]})` }, `Enqueued ${arr[i]} to Q2 (empty).`);
      
      while (q1.length > 0) {
        q2.push(q1.shift());
        pushState(q1, q2, arr, { idx: i }, [i], [0], [q2.length - 1], { Operation: `Push(${arr[i]})` }, `Transferred from Q1 to Q2.`);
      }
      
      // Swap names
      let temp = q1; q1 = q2; q2 = temp;
      pushState(q1, q2, arr, { idx: i }, [i], [], [], { Operation: `Push(${arr[i]})` }, `Swapped Q1 and Q2. Q1 now holds elements in Stack order.`);
    }
    
    // Simulate Pop
    const popped = q1.shift();
    pushState(q1, q2, arr, {}, [], [0], [], { Operation: `Pop()`, Result: popped }, `✅ Dequeued ${popped} from Q1. (Most recently added)`);
  };

  const runSlidingWindowMax = (arr, pushState) => {
    const k = 3;
    const deque = []; // primary array
    const res = []; // secondary array
    
    for (let i = 0; i < arr.length; i++) {
      pushState(deque.map(idx => arr[idx]), res, arr, { i }, [i], [], [], { K: k, DequeIndices: JSON.stringify(deque) }, `Processing element ${arr[i]} at index ${i}`);
      
      // Remove elements out of window
      if (deque.length > 0 && deque[0] === i - k) {
        const removed = deque.shift();
        pushState(deque.map(idx => arr[idx]), res, arr, { i }, [i], [0], [], { K: k }, `Index ${removed} is out of window [${i-k+1}, ${i}]. Removed from front of deque.`);
      }
      
      // Remove smaller elements
      while (deque.length > 0 && arr[deque[deque.length - 1]] < arr[i]) {
        const popped = deque.pop();
        pushState(deque.map(idx => arr[idx]), res, arr, { i }, [i], [deque.length], [], { K: k }, `${arr[popped]} < ${arr[i]}. Removed from back of deque.`);
      }
      
      deque.push(i);
      pushState(deque.map(idx => arr[idx]), res, arr, { i }, [i], [deque.length - 1], [], { K: k }, `Added index ${i} to deque.`);
      
      if (i >= k - 1) {
        res.push(arr[deque[0]]);
        pushState(deque.map(idx => arr[idx]), res, arr, { i }, [deque[0]], [], [res.length - 1], { K: k }, `Max for this window is ${arr[deque[0]]}. Added to result.`);
      }
    }
    pushState(deque.map(idx => arr[idx]), res, arr, {}, [], [], [], { Result: JSON.stringify(res) }, `✅ Sliding Window Maximum complete.`);
  };

  const runCircularQueue = (arr, pushState) => {
    const k = 4; // Capacity
    const q = new Array(k).fill(null);
    let head = -1, tail = -1, size = 0;
    
    pushState(q, [], arr, {}, [], [], [], { Capacity: k, Size: size, Head: head, Tail: tail }, `Initialized Circular Queue of size ${k}`);
    
    // Enqueue
    for (let i = 0; i < 5; i++) {
      if (size === k) {
        pushState(q, [], arr, { input: i }, [i], [], [], { Capacity: k, Size: size, Head: head, Tail: tail }, `Queue is FULL! Cannot enqueue ${arr[i]}`);
      } else {
        if (head === -1) head = 0;
        tail = (tail + 1) % k;
        q[tail] = arr[i];
        size++;
        pushState(q, [], arr, { input: i, Head: head, Tail: tail }, [i], [tail], [], { Capacity: k, Size: size }, `Enqueued ${arr[i]} at index ${tail}`);
      }
    }
    
    // Dequeue
    for (let i = 0; i < 2; i++) {
      const removed = q[head];
      q[head] = null;
      if (head === tail) { head = -1; tail = -1; }
      else head = (head + 1) % k;
      size--;
      pushState(q, [], arr, { Head: head, Tail: tail }, [], [head === -1 ? 0 : (head-1+k)%k], [], { Capacity: k, Size: size }, `Dequeued ${removed}. Head moved.`);
    }
    
    // Enqueue wrapping around
    tail = (tail + 1) % k;
    q[tail] = 99;
    size++;
    pushState(q, [], arr, { Head: head, Tail: tail }, [], [tail], [], { Capacity: k, Size: size }, `Enqueued 99 at index ${tail} (Wrapped around!).`);
    
    pushState(q, [], arr, {}, [], [], [], {}, `✅ Circular Queue operations complete.`);
  };


  // --- Playback Controls ---
  const handlePlayPause = () => { if (trace.length === 0) executeAlgo(); else setIsPlaying(!isPlaying); };
  const handleNext = () => { setIsPlaying(false); if (currentStep < trace.length - 1) setCurrentStep(c => c + 1); };
  const handlePrev = () => { setIsPlaying(false); if (currentStep > 0) setCurrentStep(c => c - 1); };

  // --- Rendering ---
  const currentState = trace[currentStep] || { primary: [], secondary: [], inputArr: getInitialData(), pointers: {}, activeInput: [], activePrimary: [], activeSecondary: [], variables: {}, msg: 'Ready.' };
  const historySteps = trace.slice(0, currentStep + 1).map(t => t.msg).filter(m => m);

  const renderArrayHorizontal = (arr, title, activeIndices, pointersObj, prefix) => {
    if (!arr || arr.length === 0) return null;
    return (
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{title}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center' }}>
          {arr.map((val, idx) => {
            const isActive = activeIndices.includes(idx);
            let bg = 'rgba(255,255,255,0.05)', border = '1px solid rgba(255,255,255,0.1)', color = 'var(--text-muted)', shadow = 'none';
            if (isActive) { bg = 'var(--active-accent)'; border = '1px solid var(--active-accent)'; color = '#000'; shadow = '0 0 15px var(--active-accent)'; }
            else if (val !== null && val !== -1) { bg = 'rgba(0,255,136,0.1)'; border = '1px solid rgba(0,255,136,0.3)'; color = '#00ff88'; }

            const myPointers = Object.entries(pointersObj).filter(([_, p]) => p === idx);

            return (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ height: '20px', display: 'flex', gap: '2px', alignItems: 'flex-end', marginBottom: '4px' }}>
                  {myPointers.map(([pName]) => <div key={pName} style={{ background: '#ff00ff', color: '#fff', fontSize: '0.55rem', padding: '2px 4px', borderRadius: '4px' }}>{pName}↓</div>)}
                </div>
                <div style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: bg, border, borderRadius: '6px', color, fontSize: '1.1rem', fontWeight: isActive ? 'bold' : 'normal', boxShadow: shadow, fontFamily: 'Fira Code, monospace' }}>
                  {val === null ? '⊘' : val}
                </div>
                <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>{idx}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderStack = (arr, title, activeIndices) => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '120px' }}>
        <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{title}</div>
        <div style={{ border: '2px solid var(--panel-border)', borderTop: 'none', borderRadius: '0 0 8px 8px', width: '80px', minHeight: '150px', display: 'flex', flexDirection: 'column-reverse', padding: '8px', gap: '4px', background: 'rgba(0,0,0,0.2)' }}>
          {arr.map((val, idx) => {
            const isActive = activeIndices.includes(idx);
            let bg = 'rgba(255,255,255,0.05)', border = '1px solid rgba(255,255,255,0.1)', color = 'var(--text-muted)', shadow = 'none';
            if (isActive) { bg = 'var(--active-accent)'; border = '1px solid var(--active-accent)'; color = '#000'; shadow = '0 0 10px var(--active-accent)'; }
            else { bg = 'rgba(0,255,136,0.1)'; border = '1px solid rgba(0,255,136,0.3)'; color = '#00ff88'; }

            return (
              <div key={idx} style={{ width: '100%', height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: bg, border, borderRadius: '4px', color, fontSize: '1rem', fontWeight: isActive ? 'bold' : 'normal', boxShadow: shadow, fontFamily: 'Fira Code, monospace' }}>
                {val}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const isStackAlgo = ['next_greater', 'prev_greater', 'valid_parens', 'largest_rectangle', 'min_stack', 'infix_postfix'].includes(algorithmId);
  const isQueueStackAlgo = ['queue_using_stack', 'stack_using_queue'].includes(algorithmId);

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
                <input type="text" placeholder="e.g. 1,2,3 or ()[]{}" value={customInputA}
                  onChange={e => setCustomInputA(e.target.value)}
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
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          
          {renderArrayHorizontal(currentState.inputArr, 'Input Data', currentState.activeInput, currentState.pointers, 'input')}
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '4rem', marginTop: '1rem' }}>
            {isStackAlgo ? (
              <>
                {renderStack(currentState.primary, 'Stack', currentState.activePrimary)}
                {currentState.secondary.length > 0 && (
                  algorithmId === 'min_stack' ? renderStack(currentState.secondary, 'Min Stack', currentState.activeSecondary) : 
                  renderArrayHorizontal(currentState.secondary, 'Result Array', currentState.activeSecondary, {}, 'sec')
                )}
              </>
            ) : isQueueStackAlgo ? (
              <>
                {renderStack(currentState.primary, 'S1 / Q1', currentState.activePrimary)}
                {renderStack(currentState.secondary, 'S2 / Q2', currentState.activeSecondary)}
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', width: '100%', alignItems: 'center' }}>
                {renderArrayHorizontal(currentState.primary, 'Queue / Deque', currentState.activePrimary, currentState.pointers, 'q')}
                {renderArrayHorizontal(currentState.secondary, 'Result Array', currentState.activeSecondary, {}, 'res')}
              </div>
            )}
          </div>

        </div>
      </div>
      <StepLog steps={historySteps} currentStep={currentStep} />
    </div>
  );
};

export default StackQueueVisualizer;
