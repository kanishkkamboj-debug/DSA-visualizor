import React, { useState, useEffect, useRef } from 'react';
import StepLog from './StepLog';

const GreedyVisualizer = ({ algorithmId }) => {
  const [speed, setSpeed] = useState(300);
  const [mode, setMode] = useState('auto');
  const [customInput, setCustomInput] = useState('');
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
    if (!customInput.trim()) return;
    initData();
  };

  const getInitialData = () => {
    if (mode === 'custom' && customInput) {
      if (algorithmId === 'jump_game' || algorithmId === 'candy_distribution') {
        return customInput.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
      }
      if (algorithmId === 'activity_selection') {
        return customInput.split(',').map(pair => {
          const [start, end] = pair.split('-').map(Number);
          return { start, end };
        }).filter(it => !isNaN(it.start) && !isNaN(it.end));
      }
      if (algorithmId === 'fractional_knapsack') {
        return customInput.split(',').map((pair, i) => {
          const [weight, value] = pair.split(':').map(Number);
          return { weight, value, id: `Item ${i+1}` };
        }).filter(it => !isNaN(it.weight) && !isNaN(it.value));
      }
      if (algorithmId === 'huffman') {
        return customInput.split(',').map(pair => {
          const [char, freq] = pair.split(':');
          return { char: char ? char.trim() : '?', freq: Number(freq) };
        }).filter(it => !isNaN(it.freq));
      }
    }
    switch (algorithmId) {
      case 'activity_selection':
        return [
          { start: 1, end: 4 }, { start: 3, end: 5 }, { start: 0, end: 6 },
          { start: 5, end: 7 }, { start: 3, end: 9 }, { start: 5, end: 9 },
          { start: 6, end: 10 }, { start: 8, end: 11 }, { start: 8, end: 12 },
          { start: 2, end: 14 }, { start: 12, end: 16 }
        ];
      case 'fractional_knapsack':
        return [
          { weight: 10, value: 60, id: 'Item A' },
          { weight: 20, value: 100, id: 'Item B' },
          { weight: 30, value: 120, id: 'Item C' }
        ];
      case 'jump_game':
        return [2, 3, 1, 1, 4];
      case 'candy_distribution':
        return [1, 0, 2];
      case 'huffman':
        return [
          { char: 'a', freq: 5 }, { char: 'b', freq: 9 }, { char: 'c', freq: 12 },
          { char: 'd', freq: 13 }, { char: 'e', freq: 16 }, { char: 'f', freq: 45 }
        ];
      default:
        return [1, 2, 3, 4, 5];
    }
  };

  const executeAlgo = () => {
    if (trace.length > 0 && currentStep === 0) { setIsPlaying(true); return; }
    if (currentStep > 0 && currentStep < trace.length - 1) { setIsPlaying(true); return; }
    if (currentStep >= trace.length - 1 && trace.length > 0) { setCurrentStep(0); setIsPlaying(true); return; }

    const inputData = getInitialData();
    const newTrace = [];
    
    // items: array of objects to render
    // pointers: array indices
    const pushState = (items, selectedItems=[], pointers={}, vars={}, msg='') => {
      newTrace.push({
        items: JSON.parse(JSON.stringify(items)),
        selectedItems: JSON.parse(JSON.stringify(selectedItems)),
        pointers: { ...pointers },
        variables: { ...vars },
        msg
      });
    };

    pushState(inputData, [], {}, {}, `Starting ${algorithmId.replaceAll('_', ' ')}...`);

    const arr = JSON.parse(JSON.stringify(inputData));

    switch (algorithmId) {
      case 'activity_selection': runActivitySelection(arr, pushState); break;
      case 'fractional_knapsack': runFractionalKnapsack(arr, pushState); break;
      case 'jump_game': runJumpGame(arr, pushState); break;
      case 'candy_distribution': runCandyDistribution(arr, pushState); break;
      case 'huffman': runHuffman(arr, pushState); break;
      default: pushState(arr, [], {}, {}, `Logic for ${algorithmId} pending.`); break;
    }

    if (newTrace.length === 1) pushState(arr, [], {}, {}, 'Finished.');

    setTrace(newTrace);
    setCurrentStep(0);
    setIsPlaying(true);
  };

  // --- Algorithms ---

  const runActivitySelection = (arr, pushState) => {
    // Greedy: Sort by end time
    arr.sort((a, b) => a.end - b.end);
    pushState(arr, [], {}, {}, `Sorted activities by end time.`);
    
    const selected = [];
    let lastEnd = -1;
    
    for (let i = 0; i < arr.length; i++) {
      pushState(arr, selected, { curr: i }, { LastEnd: lastEnd }, `Checking activity [${arr[i].start}, ${arr[i].end}]`);
      
      if (arr[i].start >= lastEnd) {
        selected.push(arr[i]);
        pushState(arr, selected, { curr: i }, { LastEnd: lastEnd }, `Activity starts after last end (${arr[i].start} >= ${lastEnd}). Selected!`);
        lastEnd = arr[i].end;
      } else {
        pushState(arr, selected, { curr: i }, { LastEnd: lastEnd }, `Activity overlaps (${arr[i].start} < ${lastEnd}). Skipped.`);
      }
    }
    pushState(arr, selected, {}, { TotalSelected: selected.length }, `✅ Activity Selection complete.`);
  };

  const runFractionalKnapsack = (arr, pushState) => {
    const capacity = 50;
    arr.forEach(item => item.ratio = +(item.value / item.weight).toFixed(2));
    pushState(arr, [], {}, { Capacity: capacity }, `Calculated Value/Weight ratio for each item.`);
    
    arr.sort((a, b) => b.ratio - a.ratio);
    pushState(arr, [], {}, { Capacity: capacity }, `Sorted items descending by ratio.`);
    
    const selected = [];
    let currentWeight = 0;
    let totalValue = 0;
    
    for (let i = 0; i < arr.length; i++) {
      pushState(arr, selected, { curr: i }, { Capacity: capacity, CurrentWeight: currentWeight, TotalValue: totalValue.toFixed(2) }, `Checking ${arr[i].id} (Weight: ${arr[i].weight}, Value: ${arr[i].value}, Ratio: ${arr[i].ratio})`);
      
      if (currentWeight + arr[i].weight <= capacity) {
        currentWeight += arr[i].weight;
        totalValue += arr[i].value;
        selected.push({ ...arr[i], fraction: 1 });
        pushState(arr, selected, { curr: i }, { Capacity: capacity, CurrentWeight: currentWeight, TotalValue: totalValue.toFixed(2) }, `Can take full item. Taken!`);
      } else {
        const remain = capacity - currentWeight;
        const fraction = +(remain / arr[i].weight).toFixed(2);
        currentWeight += remain;
        totalValue += arr[i].value * fraction;
        selected.push({ ...arr[i], fraction });
        pushState(arr, selected, { curr: i }, { Capacity: capacity, CurrentWeight: currentWeight, TotalValue: totalValue.toFixed(2) }, `Knapsack almost full. Taking ${fraction*100}% of item.`);
        break;
      }
    }
    pushState(arr, selected, {}, { FinalValue: totalValue.toFixed(2) }, `✅ Fractional Knapsack complete.`);
  };

  const runJumpGame = (arr, pushState) => {
    let maxReach = 0;
    pushState(arr, [], {}, { MaxReach: maxReach }, `Goal is to reach index ${arr.length - 1}`);
    
    for (let i = 0; i < arr.length; i++) {
      pushState(arr, [], { curr: i, maxReach: Math.min(maxReach, arr.length-1) }, { MaxReach: maxReach, Curr: i, Val: arr[i] }, `At index ${i}. Max reach so far is ${maxReach}`);
      
      if (i > maxReach) {
        pushState(arr, [], { curr: i }, { MaxReach: maxReach }, `❌ Index ${i} is beyond maxReach ${maxReach}. Cannot proceed.`);
        return;
      }
      
      maxReach = Math.max(maxReach, i + arr[i]);
      pushState(arr, [], { curr: i, maxReach: Math.min(maxReach, arr.length-1) }, { MaxReach: maxReach }, `Updated max reach to ${maxReach}`);
      
      if (maxReach >= arr.length - 1) {
        pushState(arr, [], {}, { MaxReach: maxReach }, `✅ Max reach ${maxReach} covers end index. Success!`);
        return;
      }
    }
  };

  const runCandyDistribution = (arr, pushState) => {
    const n = arr.length;
    const candies = new Array(n).fill(1);
    const renderItems = (cnds) => arr.map((rating, i) => ({ rating, candy: cnds[i] }));
    
    pushState(renderItems(candies), [], {}, {}, `Initialized everyone with 1 candy.`);
    
    // L to R
    pushState(renderItems(candies), [], {}, {}, `Pass 1: Left to Right. Check if rating > left neighbor.`);
    for (let i = 1; i < n; i++) {
      pushState(renderItems(candies), [], { curr: i, prev: i-1 }, {}, `Checking if ${arr[i]} > ${arr[i-1]}`);
      if (arr[i] > arr[i - 1]) {
        candies[i] = candies[i - 1] + 1;
        pushState(renderItems(candies), [], { curr: i }, {}, `Yes. Updated candy[${i}] to ${candies[i]}`);
      }
    }
    
    // R to L
    pushState(renderItems(candies), [], {}, {}, `Pass 2: Right to Left. Check if rating > right neighbor.`);
    for (let i = n - 2; i >= 0; i--) {
      pushState(renderItems(candies), [], { curr: i, next: i+1 }, {}, `Checking if ${arr[i]} > ${arr[i+1]}`);
      if (arr[i] > arr[i + 1]) {
        if (candies[i] <= candies[i + 1]) {
          candies[i] = candies[i + 1] + 1;
          pushState(renderItems(candies), [], { curr: i }, {}, `Yes. Updated candy[${i}] to max(${candies[i]}, ${candies[i+1]+1}) = ${candies[i]}`);
        } else {
          pushState(renderItems(candies), [], { curr: i }, {}, `Yes, but candy is already sufficient (${candies[i]} > ${candies[i+1]}).`);
        }
      }
    }
    
    const sum = candies.reduce((a,b)=>a+b,0);
    pushState(renderItems(candies), [], {}, { TotalCandies: sum }, `✅ Candy Distribution complete. Minimum candies required: ${sum}`);
  };

  const runHuffman = (arr, pushState) => {
    // Array of objects { char, freq, tree }
    let forest = arr.map(item => ({ ...item, display: `${item.char}(${item.freq})` }));
    
    pushState(forest, [], {}, {}, `Initial Forest of Character Frequencies.`);
    
    while (forest.length > 1) {
      forest.sort((a, b) => a.freq - b.freq);
      pushState(forest, [], {}, {}, `Sorted forest nodes by frequency.`);
      
      const left = forest.shift();
      const right = forest.shift();
      
      pushState(forest, [left, right], {}, {}, `Extracted two nodes with lowest frequency: ${left.display} and ${right.display}`);
      
      const merged = {
        char: left.char + right.char,
        freq: left.freq + right.freq,
        display: `[${left.display} + ${right.display}] = ${left.freq + right.freq}`
      };
      
      forest.push(merged);
      pushState(forest, [], {}, {}, `Merged into new node with freq ${merged.freq}. Pushed back to forest.`);
    }
    pushState(forest, [], {}, { RootFreq: forest[0].freq }, `✅ Huffman Tree root built.`);
  };

  // --- Playback Controls ---
  const handlePlayPause = () => { if (trace.length === 0) executeAlgo(); else setIsPlaying(!isPlaying); };
  const handleNext = () => { setIsPlaying(false); if (currentStep < trace.length - 1) setCurrentStep(c => c + 1); };
  const handlePrev = () => { setIsPlaying(false); if (currentStep > 0) setCurrentStep(c => c - 1); };

  // --- Rendering ---
  const currentState = trace[currentStep] || { items: getInitialData(), selectedItems: [], pointers: {}, variables: {}, msg: 'Ready.' };
  const historySteps = trace.slice(0, currentStep + 1).map(t => t.msg).filter(m => m);

  const renderItems = () => {
    if (algorithmId === 'activity_selection') {
      return currentState.items.map((it, i) => (
        <div key={i} style={{ padding: '8px', background: currentState.pointers.curr === i ? 'var(--active-accent)' : 'rgba(255,255,255,0.05)', color: currentState.pointers.curr === i ? '#000' : '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', fontFamily: 'monospace' }}>
          [{it.start}, {it.end}]
        </div>
      ));
    }
    if (algorithmId === 'fractional_knapsack') {
      return currentState.items.map((it, i) => (
        <div key={i} style={{ padding: '8px', background: currentState.pointers.curr === i ? 'var(--active-accent)' : 'rgba(255,255,255,0.05)', color: currentState.pointers.curr === i ? '#000' : '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', textAlign: 'center' }}>
          <div>{it.id}</div>
          <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>W:{it.weight} V:{it.value}</div>
          {it.ratio && <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>R:{it.ratio}</div>}
        </div>
      ));
    }
    if (algorithmId === 'jump_game') {
      return currentState.items.map((val, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ height: '20px', fontSize: '0.6rem', color: '#ff00ff' }}>{currentState.pointers.curr === i ? 'Curr↓' : currentState.pointers.maxReach === i ? 'Max↓' : ''}</div>
          <div style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: currentState.pointers.curr === i ? 'var(--active-accent)' : 'rgba(255,255,255,0.05)', color: currentState.pointers.curr === i ? '#000' : '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', fontSize: '1.2rem', fontFamily: 'monospace' }}>
            {val}
          </div>
          <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>Idx:{i}</div>
        </div>
      ));
    }
    if (algorithmId === 'candy_distribution') {
      return currentState.items.map((it, i) => (
        <div key={i} style={{ padding: '8px', background: currentState.pointers.curr === i ? 'var(--active-accent)' : 'rgba(255,255,255,0.05)', color: currentState.pointers.curr === i ? '#000' : '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Rate: {it.rating}</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginTop: '4px', color: currentState.pointers.curr === i ? '#000' : '#00ff88' }}>🍬 {it.candy}</div>
        </div>
      ));
    }
    if (algorithmId === 'huffman') {
      return currentState.items.map((it, i) => (
        <div key={i} style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', textAlign: 'center', fontFamily: 'monospace' }}>
          {it.display}
        </div>
      ));
    }
    return null;
  };

  const renderSelected = () => {
    if (currentState.selectedItems.length === 0) return null;
    return (
      <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Selected Items</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', background: 'rgba(0, 255, 136, 0.05)', border: '1px solid rgba(0, 255, 136, 0.3)', padding: '1rem', borderRadius: '8px' }}>
          {currentState.selectedItems.map((it, i) => {
            if (algorithmId === 'activity_selection') return <div key={i} style={{ padding: '4px 8px', background: '#00ff88', color: '#000', borderRadius: '4px', fontSize: '0.9rem', fontFamily: 'monospace' }}>[{it.start}, {it.end}]</div>;
            if (algorithmId === 'fractional_knapsack') return <div key={i} style={{ padding: '4px 8px', background: '#00ff88', color: '#000', borderRadius: '4px', fontSize: '0.9rem', fontFamily: 'monospace' }}>{it.id} ({it.fraction * 100}%)</div>;
            if (algorithmId === 'huffman') return <div key={i} style={{ padding: '4px 8px', background: '#ff00ff', color: '#fff', borderRadius: '4px', fontSize: '0.9rem', fontFamily: 'monospace' }}>{it.display}</div>;
            return null;
          })}
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
                <input type="text" placeholder="e.g. 2,3,1 or 1-4,3-5" value={customInput}
                  onChange={e => setCustomInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && applyCustom()}
                  style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid var(--panel-border)', color: '#fff', padding: '0.25rem 0.5rem', borderRadius: '4px', width: '150px', fontSize: '0.8rem' }} />
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
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '1rem', alignItems: 'center' }}>
          
          <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {algorithmId === 'huffman' ? 'Forest / Queue' : 'Items'}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
            {renderItems()}
          </div>
          
          {renderSelected()}

        </div>
      </div>
      <StepLog steps={historySteps} currentStep={currentStep} />
    </div>
  );
};

export default GreedyVisualizer;
