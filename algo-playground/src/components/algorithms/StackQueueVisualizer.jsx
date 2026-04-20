import React, { useState, useEffect, useRef } from 'react';
import StepLog from './StepLog';

const StackQueueVisualizer = ({ algorithmId }) => {
  // We can render multiple stacks or queues
  const [structures, setStructures] = useState({ 
    main: { type: 'stack', data: [] } 
  });
  
  // For algorithms that process an input string/array while using a stack/queue
  const [inputArray, setInputArray] = useState([]);
  
  const [speed, setSpeed] = useState(300);
  const [mode, setMode] = useState('auto');
  const [customInput, setCustomInput] = useState('');
  
  const [isRunning, setIsRunning] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Visualization State
  const [steps, setSteps] = useState([]);
  const [pointers, setPointers] = useState({});
  const [activeIndices, setActiveIndices] = useState([]); // for input array
  const [variables, setVariables] = useState({});

  const abortController = useRef(null);

  useEffect(() => {
    reset();
  }, [algorithmId]);

  const reset = () => {
    if (abortController.current) abortController.current.abort();
    generateData();
    setIsRunning(false);
    setSteps([]); setPointers({}); setActiveIndices([]); setVariables({});
    setErrorMsg('');
  };

  const generateData = () => {
    if (mode === 'custom' && customInput) {
      if (algorithmId === 'valid_parens' || algorithmId === 'infix_postfix') {
        setInputArray(customInput.split(''));
      } else {
        setInputArray(customInput.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n)));
      }
      return;
    }
    
    if (algorithmId === 'valid_parens') {
      setInputArray("()[]{}".split(''));
      setStructures({ main: { type: 'stack', data: [] } });
    } else if (algorithmId === 'next_greater' || algorithmId === 'prev_greater') {
      setInputArray([4, 12, 5, 3, 1, 2, 5, 3, 1, 2, 4, 6]);
      setStructures({ main: { type: 'stack', data: [] }, result: { type: 'array', data: [] } });
    } else if (algorithmId === 'min_stack') {
      setInputArray([]); // operations driven
      setStructures({ main: { type: 'stack', data: [] }, minMap: { type: 'stack', data: [] } });
    } else if (algorithmId === 'queue_using_stack') {
      setInputArray([]);
      setStructures({ inStack: { type: 'stack', data: [] }, outStack: { type: 'stack', data: [] } });
    } else if (algorithmId === 'circular_queue') {
      setInputArray([]);
      setStructures({ main: { type: 'queue', data: new Array(5).fill(null), max: 5 } });
    } else if (algorithmId === 'largest_rectangle') {
      setInputArray([2, 1, 5, 6, 2, 3]);
      setStructures({ main: { type: 'stack', data: [] } });
    } else if (algorithmId === 'infix_postfix') {
      setInputArray("A*(B+C)/D".split(''));
      setStructures({ main: { type: 'stack', data: [] }, result: { type: 'array', data: [] } });
    } else {
      setInputArray([1, 2, 3, 4, 5]);
      setStructures({ main: { type: 'stack', data: [] } });
    }
  };

  const applyCustom = () => {
    if (!customInput) return;
    setErrorMsg('');
    reset();
    if (algorithmId === 'valid_parens' || algorithmId === 'infix_postfix') {
      setInputArray(customInput.split(''));
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

  const execute = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setSteps([]); setPointers({}); setActiveIndices([]); setVariables({});
    
    abortController.current = new AbortController();
    const signal = abortController.current.signal;

    try {
      const arr = [...inputArray];
      switch (algorithmId) {
        case 'valid_parens': await runValidParens(arr, signal); break;
        case 'next_greater': await runNextGreater(arr, signal); break;
        case 'prev_greater': await runPrevGreater(arr, signal); break;
        case 'largest_rectangle': await runHistogram(arr, signal); break;
        case 'min_stack': await runMinStack(signal); break;
        case 'queue_using_stack': await runQueueUsingStack(signal); break;
        case 'circular_queue': await runCircularQueue(signal); break;
        case 'infix_postfix': await runInfixPostfix(arr, signal); break;
        default: addStep(`Logic for ${algorithmId} coming soon.`);
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

  const runValidParens = async (arr, signal) => {
    addStep('Valid Parentheses: Use stack to track open brackets.');
    const stack = [];
    const map = { ')': '(', '}': '{', ']': '[' };
    
    for (let i = 0; i < arr.length; i++) {
      setPointers({ i }); setActiveIndices([i]);
      const c = arr[i];
      
      if ('([{'.includes(c)) {
        addStep(`Found open bracket '${c}'. Pushing to stack.`);
        stack.push(c);
        setStructures({ main: { type: 'stack', data: [...stack] } });
        await sleep(speed, signal);
      } else {
        if (stack.length === 0) {
          addStep(`Found closing bracket '${c}' but stack is empty. Invalid!`);
          return;
        }
        const top = stack[stack.length - 1];
        if (map[c] === top) {
          addStep(`Closing bracket '${c}' matches top '${top}'. Popping stack.`);
          stack.pop();
          setStructures({ main: { type: 'stack', data: [...stack] } });
          await sleep(speed, signal);
        } else {
          addStep(`Closing bracket '${c}' does NOT match top '${top}'. Invalid!`);
          return;
        }
      }
    }
    
    if (stack.length === 0) addStep('String is fully processed and stack is empty. Valid!');
    else addStep('String processed but stack is not empty. Invalid!');
  };

  const runNextGreater = async (arr, signal) => {
    addStep('Next Greater Element: Using a Monotonic Decreasing Stack.');
    const res = new Array(arr.length).fill(-1);
    const stack = []; // will store indices
    
    setStructures({ main: { type: 'stack', data: [] }, result: { type: 'array', data: [...res] } });

    for (let i = 0; i < arr.length; i++) {
      setPointers({ i }); setActiveIndices([i]);
      addStep(`Processing arr[${i}] = ${arr[i]}`);
      await sleep(speed, signal);
      
      while (stack.length > 0 && arr[stack[stack.length - 1]] < arr[i]) {
        const poppedIdx = stack.pop();
        addStep(`arr[${i}] (${arr[i]}) > arr[${poppedIdx}] (${arr[poppedIdx]}). Next Greater Element for ${arr[poppedIdx]} is ${arr[i]}.`);
        res[poppedIdx] = arr[i];
        
        setStructures({ 
          main: { type: 'stack', data: stack.map(idx => arr[idx]) }, 
          result: { type: 'array', data: [...res] } 
        });
        await sleep(speed, signal);
      }
      
      addStep(`Pushing index ${i} (value ${arr[i]}) to stack.`);
      stack.push(i);
      setStructures({ 
        main: { type: 'stack', data: stack.map(idx => arr[idx]) }, 
        result: { type: 'array', data: [...res] } 
      });
      await sleep(speed, signal);
    }
  };

  const runPrevGreater = async (arr, signal) => {
    addStep('Previous Greater Element: Monotonic Decreasing Stack.');
    const res = new Array(arr.length).fill(-1);
    const stack = []; 
    
    setStructures({ main: { type: 'stack', data: [] }, result: { type: 'array', data: [...res] } });

    for (let i = 0; i < arr.length; i++) {
      setPointers({ i }); setActiveIndices([i]);
      addStep(`Processing arr[${i}] = ${arr[i]}`);
      await sleep(speed, signal);
      
      while (stack.length > 0 && stack[stack.length - 1] <= arr[i]) {
        const popped = stack.pop();
        addStep(`arr[${i}] (${arr[i]}) >= top (${popped}). Popping ${popped}.`);
        setStructures({ main: { type: 'stack', data: [...stack] }, result: { type: 'array', data: [...res] } });
        await sleep(speed, signal);
      }
      
      if (stack.length > 0) {
        res[i] = stack[stack.length - 1];
        addStep(`Top of stack is ${res[i]}. Previous Greater for ${arr[i]} is ${res[i]}.`);
      } else {
        addStep(`Stack is empty. No Previous Greater for ${arr[i]}.`);
      }
      
      stack.push(arr[i]);
      setStructures({ main: { type: 'stack', data: [...stack] }, result: { type: 'array', data: [...res] } });
      await sleep(speed, signal);
    }
  };

  const runMinStack = async (signal) => {
    addStep('Min Stack operations simulation.');
    const ops = [
      { type: 'push', val: -2 },
      { type: 'push', val: 0 },
      { type: 'push', val: -3 },
      { type: 'getMin', val: -3 },
      { type: 'pop' },
      { type: 'top', val: 0 },
      { type: 'getMin', val: -2 }
    ];
    
    const stack = [];
    
    for (const op of ops) {
      addStep(`Executing ${op.type}(${op.val !== undefined ? op.val : ''})`);
      await sleep(speed, signal);
      
      if (op.type === 'push') {
        const currentMin = stack.length > 0 ? stack[stack.length - 1].min : Infinity;
        const newMin = Math.min(op.val, currentMin);
        stack.push({ val: op.val, min: newMin });
        addStep(`Pushed ${op.val}. New Min is ${newMin}`);
      } else if (op.type === 'pop') {
        stack.pop();
        addStep(`Popped top element.`);
      } else if (op.type === 'getMin') {
        addStep(`Current Min is ${stack[stack.length - 1].min}`);
      } else if (op.type === 'top') {
        addStep(`Top element is ${stack[stack.length - 1].val}`);
      }
      
      setStructures({ 
        main: { type: 'stack', data: stack.map(s => s.val) }, 
        minMap: { type: 'stack', data: stack.map(s => s.min) } 
      });
      await sleep(speed * 1.5, signal);
    }
  };

  const runHistogram = async (arr, signal) => {
    addStep('Largest Rectangle in Histogram (Monotonic Increasing Stack).');
    const stack = [];
    let maxArea = 0;
    const heights = [...arr, 0]; // append 0 to flush remaining
    
    setStructures({ main: { type: 'stack', data: [] } });

    for (let i = 0; i < heights.length; i++) {
      setPointers({ i }); setActiveIndices([i]);
      
      while (stack.length > 0 && heights[stack[stack.length - 1]] > heights[i]) {
        const poppedIdx = stack.pop();
        const h = heights[poppedIdx];
        const w = stack.length === 0 ? i : i - stack[stack.length - 1] - 1;
        const area = h * w;
        maxArea = Math.max(maxArea, area);
        
        addStep(`Popped height ${h}. Width = ${w}. Area = ${area}. MaxArea = ${maxArea}`);
        setVariables({ maxArea, lastArea: area, h, w });
        setStructures({ main: { type: 'stack', data: stack.map(idx => heights[idx]) } });
        await sleep(speed * 1.5, signal);
      }
      
      if (i < arr.length) addStep(`Pushing height ${heights[i]} to stack.`);
      stack.push(i);
      setStructures({ main: { type: 'stack', data: stack.map(idx => heights[idx]) } });
      await sleep(speed, signal);
    }
  };

  const runQueueUsingStack = async (signal) => {
    addStep('Queue using Two Stacks (Amortized O(1) Dequeue)');
    const ops = ['push(1)', 'push(2)', 'peek()', 'pop()', 'isEmpty()'];
    setInputArray(ops);
    
    let inSt = [];
    let outSt = [];
    
    for (let i=0; i<ops.length; i++) {
      const op = ops[i];
      setPointers({ i }); setActiveIndices([i]);
      addStep(`Executing ${op}`);
      await sleep(speed, signal);
      
      if (op.startsWith('push')) {
        const val = parseInt(op.match(/\d+/)[0]);
        inSt.push(val);
        addStep(`Pushed ${val} to InStack`);
      } else if (op.startsWith('pop') || op.startsWith('peek')) {
        if (outSt.length === 0) {
          addStep(`OutStack is empty. Transferring all elements from InStack to OutStack.`);
          while(inSt.length > 0) {
            outSt.push(inSt.pop());
            setStructures({ inStack: { type: 'stack', data: [...inSt] }, outStack: { type: 'stack', data: [...outSt] } });
            await sleep(speed * 0.5, signal);
          }
        }
        if (op.startsWith('pop')) {
          const val = outSt.pop();
          addStep(`Popped ${val} from OutStack`);
        } else {
          addStep(`Peeked ${outSt[outSt.length - 1]} from OutStack`);
        }
      }
      setStructures({ inStack: { type: 'stack', data: [...inSt] }, outStack: { type: 'stack', data: [...outSt] } });
      await sleep(speed * 1.5, signal);
    }
  };

  const runCircularQueue = async (signal) => {
    const k = 5;
    addStep(`Circular Queue (Size ${k})`);
    
    const data = new Array(k).fill(null);
    let head = -1, tail = -1;
    
    const ops = [
      { t: 'enQ', v: 10 }, { t: 'enQ', v: 20 }, { t: 'enQ', v: 30 }, { t: 'enQ', v: 40 },
      { t: 'deQ' }, { t: 'deQ' }, { t: 'enQ', v: 50 }, { t: 'enQ', v: 60 }, { t: 'enQ', v: 70 } // 70 should wrap around
    ];
    
    const updateQ = () => {
      setStructures({ main: { type: 'queue', data: [...data], max: k } });
      setVariables({ head, tail });
    };
    updateQ();

    for (const op of ops) {
      addStep(`Executing ${op.t}(${op.v || ''})`);
      await sleep(speed, signal);
      
      if (op.t === 'enQ') {
        if ((tail + 1) % k === head) {
          addStep('Queue is Full!');
        } else {
          if (head === -1) head = 0;
          tail = (tail + 1) % k;
          data[tail] = op.v;
          addStep(`Inserted ${op.v} at index ${tail}`);
        }
      } else {
        if (head === -1) {
          addStep('Queue is Empty!');
        } else {
          addStep(`Removed ${data[head]} from index ${head}`);
          data[head] = null;
          if (head === tail) { head = -1; tail = -1; }
          else head = (head + 1) % k;
        }
      }
      updateQ();
      await sleep(speed * 1.5, signal);
    }
  };

  const runInfixPostfix = async (arr, signal) => {
    addStep('Infix to Postfix Conversion');
    const prec = { '+': 1, '-': 1, '*': 2, '/': 2, '^': 3 };
    const stack = [];
    const output = [];
    
    setStructures({ main: { type: 'stack', data: [] }, result: { type: 'array', data: [] } });

    for (let i = 0; i < arr.length; i++) {
      setPointers({ i }); setActiveIndices([i]);
      const c = arr[i];
      
      if (/[a-zA-Z0-9]/.test(c)) {
        addStep(`'${c}' is an operand. Adding to output.`);
        output.push(c);
      } else if (c === '(') {
        addStep(`'${c}' is open parenthesis. Pushing to stack.`);
        stack.push(c);
      } else if (c === ')') {
        addStep(`'${c}' is closing parenthesis. Popping stack to output until '('.`);
        while (stack.length && stack[stack.length - 1] !== '(') {
          output.push(stack.pop());
          setStructures({ main: { type: 'stack', data: [...stack] }, result: { type: 'array', data: [...output] } });
          await sleep(speed, signal);
        }
        stack.pop(); // discard '('
      } else {
        addStep(`'${c}' is an operator. Checking precedence.`);
        while (stack.length && prec[stack[stack.length - 1]] >= prec[c]) {
          const popped = stack.pop();
          addStep(`Top '${popped}' has >= precedence than '${c}'. Popping to output.`);
          output.push(popped);
          setStructures({ main: { type: 'stack', data: [...stack] }, result: { type: 'array', data: [...output] } });
          await sleep(speed, signal);
        }
        addStep(`Pushing '${c}' to stack.`);
        stack.push(c);
      }
      
      setStructures({ main: { type: 'stack', data: [...stack] }, result: { type: 'array', data: [...output] } });
      await sleep(speed * 1.2, signal);
    }
    
    addStep('Expression parsed. Popping remaining operators.');
    while (stack.length) {
      output.push(stack.pop());
      setStructures({ main: { type: 'stack', data: [...stack] }, result: { type: 'array', data: [...output] } });
      await sleep(speed, signal);
    }
  };


  // --- Render Helpers ---

  const renderStack = (key, dataObj) => {
    const isMinStack = key === 'minMap';
    const arr = dataObj.data;
    
    return (
      <div key={key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0 2rem' }}>
        <div style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>{key}</div>
        <div style={{
          width: '100px', 
          minHeight: '200px',
          border: '2px solid var(--panel-border)',
          borderTop: 'none',
          borderRadius: '0 0 12px 12px',
          display: 'flex',
          flexDirection: 'column-reverse',
          padding: '4px',
          gap: '4px',
          background: 'rgba(0,0,0,0.2)'
        }}>
          {arr.map((val, idx) => (
            <div key={idx} style={{
              width: '100%', height: '40px',
              background: isMinStack ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 255, 255, 0.1)',
              border: isMinStack ? '1px solid #00ff88' : '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '4px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: isMinStack ? '#00ff88' : '#fff',
              fontFamily: 'monospace', fontWeight: 'bold'
            }}>
              {val}
            </div>
          ))}
          {arr.length === 0 && <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', marginTop: 'auto', marginBottom: '10px' }}>Empty</div>}
        </div>
      </div>
    );
  };

  const renderQueue = (key, dataObj) => {
    const arr = dataObj.data;
    return (
      <div key={key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', margin: '2rem 0' }}>
        <div style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>{key}</div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {arr.map((val, idx) => {
            const isHead = variables.head === idx;
            const isTail = variables.tail === idx;
            return (
              <div key={idx} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ height: '20px', display: 'flex', gap: '2px', color: '#ff00ff', fontSize: '0.6rem', fontWeight: 'bold' }}>
                  {isHead && <span>HEAD</span>}
                  {isTail && <span>TAIL</span>}
                </div>
                <div style={{
                  width: '50px', height: '50px',
                  background: val !== null ? 'var(--active-accent)' : 'rgba(255,255,255,0.05)',
                  border: val !== null ? '1px solid var(--active-accent)' : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: val !== null ? '#000' : 'rgba(255,255,255,0.2)',
                  fontFamily: 'monospace', fontWeight: 'bold'
                }}>
                  {val !== null ? val : '∅'}
                </div>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '4px' }}>{idx}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderArray = (key, dataObj) => {
    return (
      <div key={key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', margin: '1rem 0' }}>
        <div style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>{key}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center' }}>
          {dataObj.data.map((val, idx) => (
            <div key={idx} style={{
              width: '40px', height: '40px',
              background: 'rgba(0, 255, 136, 0.1)',
              border: '1px solid rgba(0, 255, 136, 0.3)',
              borderRadius: '4px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#00ff88', fontFamily: 'monospace'
            }}>
              {val}
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
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button onClick={() => { setMode('auto'); reset(); }} style={{ padding: '0.25rem 0.65rem', borderRadius: '4px', border: '1px solid var(--panel-border)', background: mode === 'auto' ? 'var(--active-accent)' : 'transparent', color: mode === 'auto' ? '#000' : '#fff', cursor: 'pointer', fontSize: '0.8rem' }}>Auto</button>
            <button onClick={() => setMode('custom')} style={{ padding: '0.25rem 0.65rem', borderRadius: '4px', border: '1px solid var(--panel-border)', background: mode === 'custom' ? 'var(--active-accent)' : 'transparent', color: mode === 'custom' ? '#000' : '#fff', cursor: 'pointer', fontSize: '0.8rem' }}>Custom</button>
            {mode === 'custom' && (
              <>
                <input type="text" placeholder="e.g. (,[,]" value={customInput} onChange={e => setCustomInput(e.target.value)} style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid var(--panel-border)', color: '#fff', padding: '0.25rem 0.5rem', borderRadius: '4px', width: '150px', fontSize: '0.8rem' }} />
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

        {/* Top Array Input Display (if algorithm processes an array linearly) */}
        {inputArray.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center', marginBottom: '2rem' }}>
            {inputArray.map((val, idx) => (
              <div key={idx} style={{
                position: 'relative', width: '35px', height: '35px',
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

        {/* Variables */}
        {Object.keys(variables).length > 0 && (
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', padding: '0.75rem', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)', flexWrap: 'wrap' }}>
            {Object.entries(variables).map(([key, val]) => (
              <div key={key} style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{key}</span>
                <span style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--active-accent)', fontFamily: 'monospace' }}>{val}</span>
              </div>
            ))}
          </div>
        )}

        {/* Structures Area */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'flex-end', flexWrap: 'wrap', overflowY: 'auto' }}>
          {Object.entries(structures).map(([key, dataObj]) => {
            if (dataObj.type === 'stack') return renderStack(key, dataObj);
            if (dataObj.type === 'queue') return renderQueue(key, dataObj);
            if (dataObj.type === 'array') return renderArray(key, dataObj);
            return null;
          })}
        </div>
      </div>
      <StepLog steps={steps} currentStep={steps.length - 1} />
    </div>
  );
};

export default StackQueueVisualizer;
