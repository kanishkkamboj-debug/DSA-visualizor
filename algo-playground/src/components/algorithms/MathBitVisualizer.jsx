import React, { useState, useEffect, useRef } from 'react';
import StepLog from './StepLog';

const MathBitVisualizer = ({ algorithmId }) => {
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
      return customInput.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    }
    switch (algorithmId) {
      case 'sieve': return [30];
      case 'gcd_euclid': return [48, 18];
      case 'fast_expo': return [2, 10];
      case 'prime_factorization': return [60];
      case 'modular_arithmetic': return [15, 7, 4];
      case 'xor_tricks': return [2, 3, 2, 4, 3];
      case 'power_of_two': return [16];
      case 'count_set_bits': return [29];
      case 'subsets_bitmask': return [1, 2, 3];
      default: return [];
    }
  };

  const executeAlgo = () => {
    if (trace.length > 0 && currentStep === 0) { setIsPlaying(true); return; }
    if (currentStep > 0 && currentStep < trace.length - 1) { setIsPlaying(true); return; }
    if (currentStep >= trace.length - 1 && trace.length > 0) { setCurrentStep(0); setIsPlaying(true); return; }

    const newTrace = [];
    
    // items: array of objects to render
    // pointers: array indices
    const pushState = (vars={}, array=[], active=[], processed=[], msg='') => {
      newTrace.push({
        variables: { ...vars },
        array: [...array],
        activeIndices: [...active],
        processedIndices: [...processed],
        msg
      });
    };

    pushState({}, [], [], [], `Starting ${algorithmId.replaceAll('_', ' ')}...`);

    const data = getInitialData();

    switch (algorithmId) {
      case 'sieve': runSieve(data[0] || 30, pushState); break;
      case 'gcd_euclid': runGCD(data[0] || 48, data[1] || 18, pushState); break;
      case 'fast_expo': runFastExpo(data[0] || 2, data[1] || 10, pushState); break;
      case 'prime_factorization': runPrimeFactors(data[0] || 60, pushState); break;
      case 'modular_arithmetic': runModularArithmetic(data[0] || 15, data[1] || 7, data[2] || 4, pushState); break;
      case 'xor_tricks': runXORTricks(data.length ? data : [2, 3, 2, 4, 3], pushState); break;
      case 'power_of_two': runPowerOfTwo(data[0] || 16, pushState); break;
      case 'count_set_bits': runCountSetBits(data[0] || 29, pushState); break;
      case 'subsets_bitmask': runSubsetsBitmask(data.length ? data : [1, 2, 3], pushState); break;
      default: pushState({}, [], [], [], `Logic for ${algorithmId} pending.`); break;
    }

    if (newTrace.length === 1) pushState({}, [], [], [], 'Finished.');

    setTrace(newTrace);
    setCurrentStep(0);
    setIsPlaying(true);
  };

  // --- Algorithms ---

  const runSieve = (n, pushState) => {
    const isPrime = new Array(n + 1).fill(true);
    isPrime[0] = false; isPrime[1] = false;
    
    const renderArr = () => isPrime.map((p, i) => ({ val: i, prime: p }));
    pushState({ N: n }, renderArr(), [], [], `Initialize boolean array of size ${n+1} as True.`);
    
    for (let p = 2; p * p <= n; p++) {
      pushState({ P: p }, renderArr(), [p], [], `Checking if ${p} is prime...`);
      if (isPrime[p]) {
        pushState({ P: p }, renderArr(), [p], [], `${p} is prime. Marking its multiples as false.`);
        for (let i = p * p; i <= n; i += p) {
          isPrime[i] = false;
          pushState({ P: p, Multiple: i }, renderArr(), [i], [p], `Marking ${i} as false.`);
        }
      }
    }
    
    const primes = [];
    for(let i=2; i<=n; i++) if(isPrime[i]) primes.push(i);
    
    pushState({ TotalPrimes: primes.length, Primes: JSON.stringify(primes) }, renderArr(), [], [], `✅ Sieve complete.`);
  };

  const runGCD = (a, b, pushState) => {
    pushState({ A: a, B: b }, [], [], [], `Calculating GCD of ${a} and ${b}`);
    while (b !== 0) {
      const temp = b;
      b = a % b;
      pushState({ A: a, B: temp, 'A % B': b }, [], [], [], `${a} % ${temp} = ${b}`);
      a = temp;
      pushState({ A: a, B: b }, [], [], [], `A becomes ${a}, B becomes ${b}`);
    }
    pushState({ GCD: a }, [], [], [], `✅ B is 0. GCD is ${a}`);
  };

  const runFastExpo = (base, exp, pushState) => {
    let res = 1;
    let b = base;
    let e = exp;
    
    pushState({ Base: b, Exponent: e, Result: res }, [], [], [], `Calculating ${b}^${e}`);
    
    while (e > 0) {
      const isOdd = e % 2 === 1;
      pushState({ Base: b, Exponent: e, Result: res, 'Exponent is Odd?': isOdd ? 'Yes' : 'No' }, [], [], [], `Checking lowest bit of exponent.`);
      if (isOdd) {
        res = res * b;
        pushState({ Base: b, Exponent: e, Result: res }, [], [], [], `Exponent is odd. Multiply result by base. New result: ${res}`);
      }
      b = b * b;
      e = Math.floor(e / 2);
      pushState({ Base: b, Exponent: e, Result: res }, [], [], [], `Square the base to ${b}. Divide exponent by 2 to ${e}.`);
    }
    pushState({ FinalResult: res }, [], [], [], `✅ Fast Exponentiation complete.`);
  };

  const runPrimeFactors = (n, pushState) => {
    const factors = [];
    let curr = n;
    
    pushState({ N: curr }, [], [], [], `Finding prime factors of ${curr}`);
    
    while (curr % 2 === 0) {
      factors.push(2);
      curr = curr / 2;
      pushState({ N: curr, Factors: JSON.stringify(factors) }, [], [], [], `Divisible by 2. Added 2 to factors. N is now ${curr}`);
    }
    
    for (let i = 3; i <= Math.sqrt(curr); i += 2) {
      pushState({ N: curr, Factors: JSON.stringify(factors), Checking: i }, [], [], [], `Checking odd divisor ${i}`);
      while (curr % i === 0) {
        factors.push(i);
        curr = curr / i;
        pushState({ N: curr, Factors: JSON.stringify(factors), Divisor: i }, [], [], [], `Divisible by ${i}. N is now ${curr}`);
      }
    }
    
    if (curr > 2) {
      factors.push(curr);
      pushState({ Factors: JSON.stringify(factors) }, [], [], [], `Remaining N > 2 is a prime factor itself: ${curr}`);
    }
    pushState({ FinalFactors: JSON.stringify(factors) }, [], [], [], `✅ Prime Factorization complete.`);
  };

  const runModularArithmetic = (a, b, m, pushState) => {
    pushState({ A: a, B: b, Modulo: m }, [], [], [], `Demonstrating Modular Properties`);
    
    const add = (a + b) % m;
    pushState({ A: a, B: b, Modulo: m, '(A + B) % M': add }, [], [], [], `Addition: (${a} + ${b}) % ${m} = ${add}`);
    
    const sub = ((a - b) % m + m) % m;
    pushState({ A: a, B: b, Modulo: m, '(A - B) % M': sub }, [], [], [], `Subtraction: (${a} - ${b} + ${m}) % ${m} = ${sub}`);
    
    const mul = (a * b) % m;
    pushState({ A: a, B: b, Modulo: m, '(A * B) % M': mul }, [], [], [], `Multiplication: (${a} * ${b}) % ${m} = ${mul}`);
  };

  const toBinaryStr = (num) => num.toString(2).padStart(8, '0');

  const runXORTricks = (arr, pushState) => {
    let res = 0;
    pushState({ Array: JSON.stringify(arr), Result: res, Binary: toBinaryStr(res) }, [], [], [], `Find the single number in array where every other appears twice.`);
    
    for (let i = 0; i < arr.length; i++) {
      const oldRes = res;
      res = res ^ arr[i];
      pushState({ Array: JSON.stringify(arr), Result: res, Binary: toBinaryStr(res), Computation: `${oldRes} ^ ${arr[i]}` }, [], [], [], `XORing with ${arr[i]} (${toBinaryStr(arr[i])})`);
    }
    pushState({ SingleNumber: res }, [], [], [], `✅ The number appearing once is ${res}`);
  };

  const runPowerOfTwo = (n, pushState) => {
    const bin = toBinaryStr(n);
    const nMinus1 = n - 1;
    const binMinus1 = toBinaryStr(nMinus1);
    
    pushState({ N: n, Binary_N: bin }, [], [], [], `Check if ${n} is a power of 2.`);
    pushState({ N: n, Binary_N: bin, 'N - 1': nMinus1, 'Binary_(N-1)': binMinus1 }, [], [], [], `Calculate N - 1.`);
    
    const res = n & nMinus1;
    const isPower = n > 0 && res === 0;
    
    pushState({ N: n, 'N & (N-1)': res, IsPowerOfTwo: isPower ? 'True' : 'False' }, [], [], [], `Bitwise AND of N and N-1 is ${res}. If 0, it is a power of 2!`);
  };

  const runCountSetBits = (n, pushState) => {
    let count = 0;
    let curr = n;
    
    pushState({ N: curr, Binary: toBinaryStr(curr), SetBits: count }, [], [], [], `Brian Kernighan’s Algorithm to count set bits.`);
    
    while (curr > 0) {
      const oldCurr = curr;
      curr = curr & (curr - 1);
      count++;
      pushState({ N: curr, Binary: toBinaryStr(curr), SetBits: count }, [], [], [], `curr = ${oldCurr} & ${oldCurr-1}. Cleared the lowest set bit!`);
    }
    
    pushState({ FinalCount: count }, [], [], [], `✅ Total set bits: ${count}`);
  };

  const runSubsetsBitmask = (nums, pushState) => {
    const n = nums.length;
    const totalSubsets = 1 << n;
    const results = [];
    
    pushState({ Nums: JSON.stringify(nums), TotalSubsets: totalSubsets }, [], [], [], `Using Bitmask to generate all subsets. ${totalSubsets} possibilities.`);
    
    for (let mask = 0; mask < totalSubsets; mask++) {
      const subset = [];
      const binMask = mask.toString(2).padStart(n, '0');
      
      for (let i = 0; i < n; i++) {
        if ((mask & (1 << i)) !== 0) {
          subset.push(nums[i]);
        }
      }
      results.push(subset);
      pushState({ Mask: mask, BinaryMask: binMask.split('').reverse().join(''), Subset: JSON.stringify(subset) }, [], [], [], `Mask ${mask} (${binMask.split('').reverse().join('')}) maps to subset [${subset.join(', ')}]`);
    }
    
    pushState({ TotalSubsets: totalSubsets }, [], [], [], `✅ Generated all subsets using bitmask.`);
  };

  // --- Playback Controls ---
  const handlePlayPause = () => { if (trace.length === 0) executeAlgo(); else setIsPlaying(!isPlaying); };
  const handleNext = () => { setIsPlaying(false); if (currentStep < trace.length - 1) setCurrentStep(c => c + 1); };
  const handlePrev = () => { setIsPlaying(false); if (currentStep > 0) setCurrentStep(c => c - 1); };

  // --- Rendering ---
  const currentState = trace[currentStep] || { variables: {}, array: [], activeIndices: [], processedIndices: [], msg: 'Ready.' };
  const historySteps = trace.slice(0, currentStep + 1).map(t => t.msg).filter(m => m);

  const renderArray = () => {
    if (!currentState.array || currentState.array.length === 0) return null;
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center', marginTop: '2rem' }}>
        {currentState.array.map((item, i) => {
          const isActive = currentState.activeIndices.includes(i);
          const isProcessed = currentState.processedIndices.includes(i);
          
          let bg = 'rgba(255,255,255,0.05)', border = '1px solid rgba(255,255,255,0.1)', color = 'var(--text-muted)';
          
          if (algorithmId === 'sieve') {
            if (isActive) { bg = 'var(--active-accent)'; border = '1px solid var(--active-accent)'; color = '#000'; }
            else if (isProcessed) { bg = 'rgba(255,0,0,0.2)'; border = '1px solid #ff0000'; color = '#ff0000'; }
            else if (!item.prime) { bg = 'rgba(255,255,255,0.02)'; border = '1px solid rgba(255,255,255,0.05)'; color = 'rgba(255,255,255,0.2)'; }
            else { color = '#00ff88'; border = '1px solid rgba(0,255,136,0.3)'; }
          }
          
          return (
            <div key={i} style={{ width: '35px', height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: bg, border, borderRadius: '4px', color, fontSize: '0.9rem', fontFamily: 'monospace' }}>
              {item.val !== undefined ? item.val : item}
            </div>
          );
        })}
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
                <input type="text" placeholder="e.g. 15,7,4" value={customInput}
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
            <button onClick={initData} style={{ background: 'transparent', border: '1px solid var(--panel-border)', color: '#fff', padding: '0.35rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Reset</button>
          </div>
        </div>

        {/* Variables Tracker (Main UI for Math/Bit) */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflowY: 'auto' }}>
          
          {Object.keys(currentState.variables).length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '2rem', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', width: '80%', maxWidth: '600px' }}>
              <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '1rem' }}>Computation State</div>
              {Object.entries(currentState.variables).map(([key, val]) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{key}</span>
                  <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--active-accent)', fontFamily: 'Fira Code, monospace' }}>{val}</span>
                </div>
              ))}
            </div>
          )}

          {renderArray()}

        </div>
      </div>
      <StepLog steps={historySteps} currentStep={currentStep} />
    </div>
  );
};

export default MathBitVisualizer;
