import React, { useEffect, useRef, useState } from 'react';
import StepLog from './StepLog';

const DPTableVisualizer = ({ algorithmId }) => {
  const [speed, setSpeed] = useState(300);
  const [mode, setMode] = useState('auto');
  const [customInput, setCustomInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // --- Snapshot Animation Engine State ---
  const [trace, setTrace] = useState([]); // Array of snapshots
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    initDP();
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

  const initDP = () => {
    setIsPlaying(false);
    setTrace([]);
    setCurrentStep(0);
    setErrorMsg('');
    if (mode === 'custom') setMode('auto'); // Custom inputs for DP vary heavily by algo, limiting to auto for robust visualization
  };

  const executeDPAlgo = () => {
    if (trace.length > 0 && currentStep === 0) { setIsPlaying(true); return; }
    if (currentStep > 0 && currentStep < trace.length - 1) { setIsPlaying(true); return; }
    if (currentStep >= trace.length - 1 && trace.length > 0) { setCurrentStep(0); setIsPlaying(true); return; }

    const newTrace = [];
    const pushState = (grid, type, currR, currC, readCells, rLabels, cLabels, msg) => {
      // Deep copy grid
      const gridCopy = type === '2D' ? grid.map(row => [...row]) : [...grid];
      newTrace.push({
        grid: gridCopy, type,
        currR, currC, readCells: [...readCells],
        rLabels: [...rLabels], cLabels: [...cLabels], msg
      });
    };

    switch (algorithmId) {
      case 'fib_dp': case 'climbing_stairs': runFib(pushState); break;
      case 'knapsack_01': runKnapsack(pushState); break;
      case 'lcs': runLCS(pushState); break;
      case 'edit_distance': runEditDistance(pushState); break;
      case 'lis': runLIS(pushState); break;
      case 'house_robber': runHouseRobber(pushState); break;
      default: pushState([], '1D', -1, -1, [], [], [], `Logic for ${algorithmId} coming soon.`); break;
    }

    setTrace(newTrace);
    setCurrentStep(0);
    setIsPlaying(true);
  };

  // --- Algorithms ---

  const runFib = (pushState) => {
    const n = 10;
    const dp = new Array(n + 1).fill('');
    const labels = Array.from({length: n + 1}, (_, i) => i);
    
    dp[0] = 0; dp[1] = 1;
    pushState(dp, '1D', -1, -1, [], [], labels, 'Base cases: dp[0] = 0, dp[1] = 1');

    for (let i = 2; i <= n; i++) {
      pushState(dp, '1D', -1, i, [i-1, i-2], [], labels, `dp[${i}] = dp[${i-1}] + dp[${i-2}]`);
      dp[i] = dp[i-1] + dp[i-2];
      pushState(dp, '1D', -1, i, [], [], labels, `Calculated dp[${i}] = ${dp[i]}`);
    }
    pushState(dp, '1D', -1, -1, [], [], labels, `✅ Sequence generated. Result: ${dp[n]}`);
  };

  const runHouseRobber = (pushState) => {
    const nums = [2, 7, 9, 3, 1];
    const dp = new Array(nums.length).fill('');
    const labels = nums;
    
    dp[0] = nums[0];
    pushState(dp, '1D', -1, 0, [], [], labels, `Base case: dp[0] = ${nums[0]}`);
    
    dp[1] = Math.max(nums[0], nums[1]);
    pushState(dp, '1D', -1, 1, [0], [], labels, `Base case: dp[1] = max(${nums[0]}, ${nums[1]}) = ${dp[1]}`);

    for (let i = 2; i < nums.length; i++) {
      pushState(dp, '1D', -1, i, [i-1, i-2], [], labels, `Rob house ${i}? dp[${i}] = max(dp[${i-1}], dp[${i-2}] + ${nums[i]})`);
      dp[i] = Math.max(dp[i-1], dp[i-2] + nums[i]);
      pushState(dp, '1D', -1, i, [], [], labels, `Calculated dp[${i}] = ${dp[i]}`);
    }
    pushState(dp, '1D', -1, -1, [], [], labels, `✅ House Robber DP Complete. Max Loot: ${dp[nums.length - 1]}`);
  };

  const runLIS = (pushState) => {
    const nums = [10, 9, 2, 5, 3, 7, 101, 18];
    const n = nums.length;
    const dp = new Array(n).fill(1);
    const labels = nums;
    
    pushState(dp, '1D', -1, -1, [], [], labels, 'Initialize LIS table with 1s');

    for (let i = 1; i < n; i++) {
      for (let j = 0; j < i; j++) {
        pushState(dp, '1D', -1, i, [j], [], labels, `Comparing nums[${i}] (${nums[i]}) with nums[${j}] (${nums[j]})`);
        if (nums[i] > nums[j] && dp[i] < dp[j] + 1) {
          dp[i] = dp[j] + 1;
          pushState(dp, '1D', -1, i, [j], [], labels, `Updated dp[${i}] to ${dp[i]}`);
        }
      }
    }
    const max = Math.max(...dp);
    pushState(dp, '1D', -1, -1, [], [], labels, `✅ LIS Complete. Max Length: ${max}`);
  };

  const runKnapsack = (pushState) => {
    const W = 8;
    const wt = [3, 4, 5];
    const val = [30, 50, 60];
    const n = wt.length;
    
    const dp = Array.from({length: n + 1}, () => new Array(W + 1).fill(''));
    const rLabels = ['0', ...wt.map((w,i) => `Wt:${w} V:${val[i]}`)];
    const cLabels = Array.from({length: W + 1}, (_, i) => i);

    for (let i = 0; i <= n; i++) {
      for (let w = 0; w <= W; w++) {
        if (i === 0 || w === 0) {
          dp[i][w] = 0;
        } else {
          pushState(dp, '2D', i, w, [{r: i-1, c: w}], rLabels, cLabels, `Checking if we can include item ${i} (Wt: ${wt[i-1]})`);
          if (wt[i-1] <= w) {
            pushState(dp, '2D', i, w, [{r: i-1, c: w}, {r: i-1, c: w - wt[i-1]}], rLabels, cLabels, `dp[${i}][${w}] = max(exclude, include) = max(${dp[i-1][w]}, ${val[i-1]} + ${dp[i-1][w - wt[i-1]]})`);
            dp[i][w] = Math.max(dp[i-1][w], dp[i-1][w - wt[i-1]] + val[i-1]);
          } else {
            dp[i][w] = dp[i-1][w];
          }
        }
      }
      pushState(dp, '2D', i, -1, [], rLabels, cLabels, `Row ${i} completed.`);
    }
    pushState(dp, '2D', -1, -1, [], rLabels, cLabels, `✅ 0/1 Knapsack Complete. Max Value: ${dp[n][W]}`);
  };

  const runLCS = (pushState) => {
    const s1 = "ABCDGH";
    const s2 = "AEDFHR";
    const m = s1.length, n = s2.length;
    
    const dp = Array.from({length: m + 1}, () => new Array(n + 1).fill(''));
    const rLabels = ['Ø', ...s1.split('')];
    const cLabels = ['Ø', ...s2.split('')];

    for (let i = 0; i <= m; i++) {
      for (let j = 0; j <= n; j++) {
        if (i === 0 || j === 0) {
          dp[i][j] = 0;
        } else {
          pushState(dp, '2D', i, j, [{r: i-1, c: j-1}, {r: i-1, c: j}, {r: i, c: j-1}], rLabels, cLabels, `Comparing '${s1[i-1]}' and '${s2[j-1]}'`);
          if (s1[i-1] === s2[j-1]) {
            dp[i][j] = dp[i-1][j-1] + 1;
            pushState(dp, '2D', i, j, [{r: i-1, c: j-1}], rLabels, cLabels, `Match! dp[${i}][${j}] = dp[${i-1}][${j-1}] + 1`);
          } else {
            dp[i][j] = Math.max(dp[i-1][j], dp[i][j-1]);
            pushState(dp, '2D', i, j, [{r: i-1, c: j}, {r: i, c: j-1}], rLabels, cLabels, `No match. max(above, left) = ${dp[i][j]}`);
          }
        }
      }
    }
    pushState(dp, '2D', -1, -1, [], rLabels, cLabels, `✅ LCS Complete. Length: ${dp[m][n]}`);
  };

  const runEditDistance = (pushState) => {
    const s1 = "horse";
    const s2 = "ros";
    const m = s1.length, n = s2.length;
    
    const dp = Array.from({length: m + 1}, () => new Array(n + 1).fill(''));
    const rLabels = ['Ø', ...s1.split('')];
    const cLabels = ['Ø', ...s2.split('')];

    for (let i = 0; i <= m; i++) {
      for (let j = 0; j <= n; j++) {
        if (i === 0) dp[i][j] = j;
        else if (j === 0) dp[i][j] = i;
        else {
          pushState(dp, '2D', i, j, [{r: i-1, c: j-1}, {r: i-1, c: j}, {r: i, c: j-1}], rLabels, cLabels, `Evaluating '${s1[i-1]}' vs '${s2[j-1]}'`);
          if (s1[i-1] === s2[j-1]) {
            dp[i][j] = dp[i-1][j-1];
            pushState(dp, '2D', i, j, [{r: i-1, c: j-1}], rLabels, cLabels, `Chars match. Cost is ${dp[i][j]}`);
          } else {
            dp[i][j] = 1 + Math.min(dp[i][j-1], dp[i-1][j], dp[i-1][j-1]);
            pushState(dp, '2D', i, j, [{r: i-1, c: j-1}, {r: i-1, c: j}, {r: i, c: j-1}], rLabels, cLabels, `Mismatch. 1 + min(insert, delete, replace) = ${dp[i][j]}`);
          }
        }
      }
    }
    pushState(dp, '2D', -1, -1, [], rLabels, cLabels, `✅ Edit Distance Complete. Operations: ${dp[m][n]}`);
  };


  // --- Playback Controls ---
  const handlePlayPause = () => {
    if (trace.length === 0) executeDPAlgo();
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
  const currentState = trace[currentStep] || { grid: [], type: '1D', currR: -1, currC: -1, readCells: [], rLabels: [], cLabels: [], msg: 'Ready. Use Auto mode for DP Demos.' };
  const historySteps = trace.slice(0, currentStep + 1).map(t => t.msg).filter(m => m);

  const render1D = () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', padding: '10px' }}>
        {currentState.grid.map((val, idx) => {
          const isCurr = currentState.currC === idx;
          const isRead = currentState.readCells.includes(idx);
          let bg = 'rgba(255,255,255,0.05)';
          let border = '1px solid rgba(255,255,255,0.1)';
          let color = '#fff';

          if (isCurr) { bg = 'var(--active-accent)'; border = '1px solid var(--active-accent)'; color = '#000'; }
          else if (isRead) { bg = 'rgba(255, 0, 255, 0.2)'; border = '1px solid #ff00ff'; color = '#ff00ff'; }
          else if (val !== '') { bg = 'rgba(0, 255, 136, 0.1)'; border = '1px solid #00ff88'; color = '#00ff88'; }

          return (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '45px' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                {currentState.cLabels[idx] !== undefined ? currentState.cLabels[idx] : idx}
              </div>
              <div style={{
                width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: bg, border: border, borderRadius: '6px', color: color,
                fontFamily: 'monospace', fontWeight: isCurr||isRead ? 'bold' : 'normal',
                boxShadow: isCurr ? '0 0 10px var(--active-accent)' : 'none', transition: 'all 0.2s ease'
              }}>
                {val}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const render2D = () => {
    if (!currentState.grid || currentState.grid.length === 0) return null;
    return (
      <div style={{ overflow: 'auto', padding: '10px' }}>
        <table style={{ borderCollapse: 'collapse', borderSpacing: 0 }}>
          <thead>
            <tr>
              <th></th>
              {currentState.cLabels.map((l, i) => (
                <th key={i} style={{ padding: '8px', color: 'var(--text-muted)', fontSize: '0.8rem', minWidth: '40px' }}>{l}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentState.grid.map((row, rIdx) => (
              <tr key={rIdx}>
                <td style={{ padding: '8px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 'bold', textAlign: 'right' }}>
                  {currentState.rLabels[rIdx]}
                </td>
                {row.map((val, cIdx) => {
                  const isCurr = currentState.currR === rIdx && currentState.currC === cIdx;
                  const isRead = currentState.readCells.some(rc => rc.r === rIdx && rc.c === cIdx);
                  
                  let bg = 'rgba(255,255,255,0.02)';
                  let color = '#fff';
                  
                  if (isCurr) { bg = 'var(--active-accent)'; color = '#000'; }
                  else if (isRead) { bg = 'rgba(255, 0, 255, 0.3)'; color = '#ff00ff'; }
                  else if (val !== '') { bg = 'rgba(0, 255, 136, 0.1)'; color = '#00ff88'; }

                  return (
                    <td key={cIdx} style={{
                      width: '40px', height: '40px', textAlign: 'center', verticalAlign: 'middle',
                      background: bg, color: color, border: '1px solid rgba(255,255,255,0.1)',
                      fontFamily: 'monospace', fontWeight: isCurr ? 'bold' : 'normal',
                      transition: 'all 0.15s ease'
                    }}>
                      {val}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', gap: '1rem', width: '100%', height: '100%' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button style={{ padding: '0.25rem 0.75rem', borderRadius: '4px', border: '1px solid var(--panel-border)', background: 'var(--active-accent)', color: '#000', cursor: 'pointer' }}>Auto Demo Mode</button>
            
            <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.15)', margin: '0 4px' }} />
            
            {/* Playback Controls */}
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--panel-border)', borderRadius: '4px', overflow: 'hidden' }}>
              <button onClick={handlePrev} disabled={currentStep === 0 || trace.length === 0} style={{ padding: '0.25rem 0.5rem', background: 'transparent', border: 'none', borderRight: '1px solid var(--panel-border)', color: '#fff', cursor: 'pointer', opacity: currentStep === 0 ? 0.3 : 1 }}>⏮</button>
              <button onClick={handlePlayPause} style={{ padding: '0.25rem 0.75rem', background: isPlaying ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: 'var(--active-accent)', fontWeight: 'bold', cursor: 'pointer', width: '60px' }}>
                {isPlaying ? '⏸' : '▶️'}
              </button>
              <button onClick={handleNext} disabled={currentStep >= trace.length - 1} style={{ padding: '0.25rem 0.5rem', background: 'transparent', border: 'none', borderLeft: '1px solid var(--panel-border)', color: '#fff', cursor: 'pointer', opacity: currentStep >= trace.length - 1 ? 0.3 : 1 }}>⏭</button>
            </div>

            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '8px' }}>Speed:</span>
            <input type="range" min="50" max="1000" value={1000 - speed + 50}
              onChange={e => setSpeed(1000 - parseInt(e.target.value) + 50)}
              style={{ width: '80px', accentColor: 'var(--active-accent)' }} />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={initDP}
              style={{ background: 'transparent', border: '1px solid var(--panel-border)', color: '#fff', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer' }}>Reset</button>
          </div>
        </div>
        {errorMsg && <div style={{ color: '#ff4444', marginBottom: '0.5rem', fontSize: '0.8rem' }}>{errorMsg}</div>}

        {/* Matrix / Array Area */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
          {currentState.type === '1D' ? render1D() : render2D()}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          <span><span style={{ color: 'var(--active-accent)' }}>■</span> Current Cell</span>
          <span><span style={{ color: '#ff00ff' }}>■</span> Reading Dependencies</span>
          <span><span style={{ color: '#00ff88' }}>■</span> Computed</span>
        </div>
      </div>

      <StepLog steps={historySteps} currentStep={currentStep} />
    </div>
  );
};

export default DPTableVisualizer;
