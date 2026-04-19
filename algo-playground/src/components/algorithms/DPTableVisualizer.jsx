import React, { useState, useEffect, useRef } from 'react';
import StepLog from './StepLog';

// ---- LCS Logic ----
const DEFAULT_X = 'ABCBDAB';
const DEFAULT_Y = 'BDCABA';

// ---- Matrix Chain default dimensions ----
const DEFAULT_DIMS = [10, 30, 5, 60]; // 3 matrices: 10x30, 30x5, 5x60

const DPTableVisualizer = ({ algorithmId }) => {
  const [table, setTable] = useState([]);
  const [activeCell, setActiveCell] = useState(null);
  const [highlightCells, setHighlightCells] = useState([]); // [{r,c,type}]
  const [steps, setSteps] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState('auto');
  const [inputX, setInputX] = useState(algorithmId === 'lcs' ? DEFAULT_X : '10,30,5,60');
  const [inputY, setInputY] = useState(algorithmId === 'lcs' ? DEFAULT_Y : '');
  const [errorMsg, setErrorMsg] = useState('');
  const [result, setResult] = useState(null);
  const abortRef = useRef(null);

  useEffect(() => {
    setInputX(algorithmId === 'lcs' ? DEFAULT_X : '10,30,5,60');
    setInputY(algorithmId === 'lcs' ? DEFAULT_Y : '');
    reset();
  }, [algorithmId]);

  const reset = () => {
    if (abortRef.current) abortRef.current.abort();
    setIsRunning(false);
    setTable([]);
    setHighlightCells([]);
    setSteps([]);
    setActiveCell(null);
    setResult(null);
    setErrorMsg('');
  };

  const sleep = ms => new Promise((res, rej) => {
    const t = setTimeout(res, ms);
    abortRef.current?.signal.addEventListener('abort', () => { clearTimeout(t); rej(); });
  });

  // ---- LCS Computation ----
  const runLCS = async (X, Y) => {
    const m = X.length, n = Y.length;
    const L = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    setTable(L.map(r => [...r]));
    const stepsArr = [];
    stepsArr.push(`Start LCS("${X}", "${Y}")`);
    stepsArr.push(`Building ${m+1}×${n+1} DP table. Row = X chars, Col = Y chars.`);
    setSteps([...stepsArr]);

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        setHighlightCells([{ r: i, c: j, type: 'active' }]);
        await sleep(120);
        if (X[i - 1] === Y[j - 1]) {
          L[i][j] = L[i - 1][j - 1] + 1;
          stepsArr.push(`L[${i}][${j}]: X[${i-1}]="${X[i-1]}" == Y[${j-1}]="${Y[j-1]}" → diagonal+1 = ${L[i][j]}`);
          setHighlightCells([{ r: i, c: j, type: 'match' }, { r: i-1, c: j-1, type: 'from' }]);
        } else {
          L[i][j] = Math.max(L[i - 1][j], L[i][j - 1]);
          stepsArr.push(`L[${i}][${j}]: X[${i-1}]="${X[i-1]}" ≠ Y[${j-1}]="${Y[j-1]}" → max(L[${i-1}][${j}]=${L[i-1][j]}, L[${i}][${j-1}]=${L[i][j-1]}) = ${L[i][j]}`);
          setHighlightCells([{ r: i, c: j, type: 'active' }, { r: i-1, c: j, type: 'from' }, { r: i, c: j-1, type: 'from' }]);
        }
        setTable(L.map(r => [...r]));
        setSteps([...stepsArr]);
        await sleep(60);
      }
    }

    setHighlightCells([{ r: m, c: n, type: 'result' }]);
    stepsArr.push(`✅ LCS length = ${L[m][n]}`);
    setSteps([...stepsArr]);
    setResult(`LCS Length: ${L[m][n]}`);
  };

  // ---- Matrix Chain Multiplication ----
  const runMatrixChain = async (p) => {
    const n = p.length - 1;
    const m = Array.from({ length: n + 1 }, () => Array(n + 1).fill(0));
    setTable(m.map(r => [...r]));
    const stepsArr = [];
    stepsArr.push(`Matrix chain: ${n} matrices with dims [${p.join(',')}]`);
    stepsArr.push(`m[i][j] = min cost to multiply matrices i..j`);
    setSteps([...stepsArr]);

    for (let l = 2; l <= n; l++) {
      for (let i = 1; i <= n - l + 1; i++) {
        const j = i + l - 1;
        m[i][j] = Infinity;
        setHighlightCells([{ r: i, c: j, type: 'active' }]);
        await sleep(150);
        for (let k = i; k <= j - 1; k++) {
          const q = m[i][k] + m[k + 1][j] + p[i - 1] * p[k] * p[j];
          stepsArr.push(`m[${i}][${j}]: split at k=${k} → m[${i}][${k}]+m[${k+1}][${j}]+${p[i-1]}×${p[k]}×${p[j]} = ${q} (current min: ${m[i][j] === Infinity ? '∞' : m[i][j]})`);
          if (q < m[i][j]) {
            m[i][j] = q;
            stepsArr.push(`  → New min ${q} at k=${k}`);
          }
          setTable(m.map(r => [...r]));
          setSteps([...stepsArr]);
          setHighlightCells([{ r: i, c: j, type: 'active' }, { r: i, c: k, type: 'from' }, { r: k+1, c: j, type: 'from' }]);
          await sleep(100);
        }
      }
    }

    setHighlightCells([{ r: 1, c: n, type: 'result' }]);
    stepsArr.push(`✅ Min multiplications = ${m[1][n]}`);
    setSteps([...stepsArr]);
    setResult(`Min Operations: ${m[1][n]}`);
  };

  const execute = async () => {
    if (isRunning) return;
    reset();
    abortRef.current = new AbortController();
    setIsRunning(true);
    try {
      if (algorithmId === 'lcs') {
        const X = (mode === 'auto' ? DEFAULT_X : inputX).toUpperCase().replace(/\s/g, '');
        const Y = (mode === 'auto' ? DEFAULT_Y : inputY).toUpperCase().replace(/\s/g, '');
        if (!X || !Y) { setErrorMsg('Enter both strings'); setIsRunning(false); return; }
        setErrorMsg('');
        await runLCS(X, Y);
      } else if (algorithmId === 'matrix_chain') {
        const src = mode === 'auto' ? '10,30,5,60' : inputX;
        const dims = src.split(',').map(s => parseInt(s.trim(), 10));
        if (dims.some(isNaN) || dims.length < 3) { setErrorMsg('Enter at least 3 dimensions e.g. 10,30,5'); setIsRunning(false); return; }
        setErrorMsg('');
        await runMatrixChain(dims);
      }
    } catch (_) {}
    setIsRunning(false);
  };

  const getCellStyle = (r, c) => {
    const hl = highlightCells.find(h => h.r === r && h.c === c);
    if (!hl) return { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-muted)' };
    if (hl.type === 'match') return { background: 'var(--active-accent)', border: '2px solid var(--active-accent)', color: '#000', fontWeight: 'bold', boxShadow: '0 0 12px var(--active-accent)' };
    if (hl.type === 'result') return { background: '#00ff88', border: '2px solid #00ff88', color: '#000', fontWeight: 'bold', boxShadow: '0 0 16px #00ff88' };
    if (hl.type === 'from') return { background: 'rgba(var(--accent-rgb,0,255,255),0.15)', border: '1px solid var(--active-accent)', color: '#fff' };
    if (hl.type === 'active') return { background: 'rgba(255,200,0,0.2)', border: '2px solid #ffc800', color: '#ffc800' };
    return {};
  };

  const X = (mode === 'auto' ? DEFAULT_X : inputX).toUpperCase().replace(/\s/g, '');
  const Y = (mode === 'auto' ? DEFAULT_Y : inputY).toUpperCase().replace(/\s/g, '');
  const colLabels = algorithmId === 'lcs' ? ['', '', ...Y.split('')] : null;
  const rowLabels = algorithmId === 'lcs' ? ['', '', ...X.split('')] : null;

  return (
    <div style={{ display: 'flex', gap: '1rem', width: '100%', height: '100%' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => setMode('auto')}
              style={{ padding: '0.25rem 0.75rem', borderRadius: '4px', border: '1px solid var(--panel-border)', background: mode === 'auto' ? 'var(--active-accent)' : 'transparent', color: mode === 'auto' ? '#000' : '#fff', cursor: 'pointer' }}>Auto</button>
            <button onClick={() => setMode('custom')}
              style={{ padding: '0.25rem 0.75rem', borderRadius: '4px', border: '1px solid var(--panel-border)', background: mode === 'custom' ? 'var(--active-accent)' : 'transparent', color: mode === 'custom' ? '#000' : '#fff', cursor: 'pointer' }}>Custom</button>
            {mode === 'custom' && algorithmId === 'lcs' && (
              <>
                <input type="text" placeholder="String X" value={inputX} onChange={e => setInputX(e.target.value)}
                  style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid var(--panel-border)', color: '#fff', padding: '0.25rem 0.5rem', borderRadius: '4px', width: '80px' }} />
                <input type="text" placeholder="String Y" value={inputY} onChange={e => setInputY(e.target.value)}
                  style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid var(--panel-border)', color: '#fff', padding: '0.25rem 0.5rem', borderRadius: '4px', width: '80px' }} />
              </>
            )}
            {mode === 'custom' && algorithmId === 'matrix_chain' && (
              <input type="text" placeholder="Dims e.g. 10,30,5" value={inputX} onChange={e => setInputX(e.target.value)}
                style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid var(--panel-border)', color: '#fff', padding: '0.25rem 0.5rem', borderRadius: '4px', width: '140px' }} />
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={reset} disabled={isRunning}
              style={{ background: 'transparent', border: '1px solid var(--panel-border)', color: '#fff', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', opacity: isRunning ? 0.5 : 1 }}>Reset</button>
            <button onClick={execute} disabled={isRunning}
              style={{ background: 'var(--active-accent)', border: 'none', color: '#000', fontWeight: 'bold', padding: '0.4rem 1.2rem', borderRadius: '4px', cursor: 'pointer', boxShadow: '0 0 10px var(--active-accent)' }}>
              {isRunning ? 'Running...' : 'Execute'}
            </button>
          </div>
        </div>
        {errorMsg && <div style={{ color: '#ff4444', marginBottom: '0.5rem', fontSize: '0.8rem' }}>{errorMsg}</div>}
        {result && <div style={{ color: '#00ff88', marginBottom: '0.5rem', fontWeight: 'bold', textShadow: '0 0 8px #00ff88' }}>{result}</div>}

        {/* Table */}
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
          {table.length > 0 && (
            <div>
              {algorithmId === 'lcs' && (
                <div style={{ display: 'flex', marginBottom: '2px' }}>
                  {colLabels?.map((label, ci) => (
                    <div key={ci} style={{ width: '40px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: 'var(--active-accent)', fontWeight: 'bold' }}>
                      {label}
                    </div>
                  ))}
                </div>
              )}
              {table.map((row, ri) => (
                <div key={ri} style={{ display: 'flex', gap: '2px', marginBottom: '2px' }}>
                  {algorithmId === 'lcs' && (
                    <div style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: 'var(--active-accent)', fontWeight: 'bold' }}>
                      {rowLabels?.[ri] || ''}
                    </div>
                  )}
                  {row.map((cell, ci) => {
                    const cellStyle = getCellStyle(ri, ci);
                    return (
                      <div key={ci}
                        onMouseEnter={() => setActiveCell([ri, ci])}
                        onMouseLeave={() => setActiveCell(null)}
                        style={{
                          width: '40px', height: '40px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          transition: 'all 0.15s ease',
                          cursor: 'default',
                          ...cellStyle,
                        }}>
                        {cell === Infinity ? '∞' : cell}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
          {table.length === 0 && (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
              Press <strong style={{ color: 'var(--active-accent)' }}>Execute</strong> to start the step-by-step table fill
            </div>
          )}
        </div>
      </div>

      <StepLog steps={steps} />
    </div>
  );
};

export default DPTableVisualizer;
