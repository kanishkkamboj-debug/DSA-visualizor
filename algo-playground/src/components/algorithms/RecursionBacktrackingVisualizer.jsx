import React, { useState, useEffect, useRef } from 'react';
import StepLog from './StepLog';

const RecursionBacktrackingVisualizer = ({ algorithmId }) => {
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

  const getCustomData = () => {
    if (mode === 'custom' && customInput) {
      if (algorithmId === 'factorial' || algorithmId === 'fibonacci' || algorithmId === 'generate_parens' || algorithmId === 'n_queens') {
        return parseInt(customInput.trim());
      }
      if (algorithmId === 'subsets' || algorithmId === 'permutations') {
        return customInput.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
      }
      if (algorithmId === 'combination_sum') {
        const parts = customInput.split('|');
        return {
          arr: parts[0] ? parts[0].split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n)) : [2, 3, 6, 7],
          target: parts[1] ? parseInt(parts[1].trim()) : 7
        };
      }
      if (algorithmId === 'palindrome_partition' || algorithmId === 'word_search') {
        return customInput.trim();
      }
    }
    return null;
  };

  const getInitialGrid = (customData) => {
    if (algorithmId === 'n_queens') {
      const N = typeof customData === 'number' && !isNaN(customData) ? customData : 4;
      return Array(N).fill(null).map(() => Array(N).fill('.'));
    }
    if (algorithmId === 'sudoku') {
      return [
        ['5','3','.','.','7','.','.','.','.'],
        ['6','.','.','1','9','5','.','.','.'],
        ['.','9','8','.','.','.','.','6','.'],
        ['8','.','.','.','6','.','.','.','3'],
        ['4','.','.','8','.','3','.','.','1'],
        ['7','.','.','.','2','.','.','.','6'],
        ['.','6','.','.','.','.','2','8','.'],
        ['.','.','.','4','1','9','.','.','5'],
        ['.','.','.','.','8','.','.','7','9']
      ];
    }
    if (algorithmId === 'word_search') {
      return [
        ['A','B','C','E'],
        ['S','F','C','S'],
        ['A','D','E','E']
      ];
    }
    return null;
  };

  const executeAlgo = () => {
    if (trace.length > 0 && currentStep === 0) { setIsPlaying(true); return; }
    if (currentStep > 0 && currentStep < trace.length - 1) { setIsPlaying(true); return; }
    if (currentStep >= trace.length - 1 && trace.length > 0) { setCurrentStep(0); setIsPlaying(true); return; }

    const newTrace = [];
    
    const pushState = (callStack, currentPath, results, grid, vars={}, highlightCells=[], msg='') => {
      newTrace.push({
        callStack: [...callStack],
        currentPath: [...currentPath],
        results: [...results],
        grid: grid ? grid.map(row => [...row]) : null,
        variables: { ...vars },
        highlightCells: [...highlightCells],
        msg
      });
    };

    const customData = getCustomData();
    const initialGrid = getInitialGrid(customData);
    pushState([], [], [], initialGrid, {}, [], `Starting ${algorithmId.replaceAll('_', ' ')}...`);

    switch (algorithmId) {
      case 'factorial': runFactorial(customData || 5, pushState); break;
      case 'fibonacci': runFibonacci(customData || 5, pushState); break;
      case 'subsets': runSubsets(customData || [1, 2, 3], pushState); break;
      case 'permutations': runPermutations(customData || [1, 2, 3], pushState); break;
      case 'combination_sum': runCombinationSum(customData?.arr || [2, 3, 6, 7], customData?.target || 7, pushState); break;
      case 'generate_parens': runGenerateParens(customData || 3, pushState); break;
      case 'n_queens': runNQueens(customData || 4, initialGrid, pushState); break;
      case 'sudoku': runSudoku(initialGrid, pushState); break;
      case 'word_search': runWordSearch(initialGrid, customData || "ABCCED", pushState); break;
      case 'palindrome_partition': runPalindromePartition(customData || "aab", pushState); break;
      default: pushState([], [], [], initialGrid, {}, [], `Logic for ${algorithmId} pending.`); break;
    }

    if (newTrace.length === 1) pushState([], [], [], initialGrid, {}, [], 'Finished.');

    setTrace(newTrace);
    setCurrentStep(0);
    setIsPlaying(true);
  };

  // --- Algorithms ---

  const MAX_FACTORIAL_N = 12;
  const MAX_FIBONACCI_N = 20;

  const runFactorial = (n, pushState) => {
    const safeN = Math.min(Math.max(0, n), MAX_FACTORIAL_N);
    if (safeN !== n) {
      pushState([], [], [], null, {}, [], `⚠️ Input capped to ${MAX_FACTORIAL_N} to prevent stack overflow. Visualizing factorial(${safeN}).`);
    }
    const stack = [];
    const recurse = (num) => {
      stack.push(`factorial(${num})`);
      pushState(stack, [], [], null, {}, [], `Calling factorial(${num})`);

      if (num === 0 || num === 1) {
        pushState(stack, [], [], null, { ReturnValue: 1 }, [], `Base case reached. factorial(${num}) returns 1.`);
        stack.pop();
        return 1;
      }

      const res = num * recurse(num - 1);
      pushState(stack, [], [], null, { Computation: `${num} * factorial(${num-1})`, ReturnValue: res }, [], `factorial(${num}) returns ${res}.`);
      stack.pop();
      return res;
    };
    try {
      const finalRes = recurse(safeN);
      pushState([], [], [], null, { FinalResult: finalRes }, [], `✅ Factorial complete. ${safeN}! = ${finalRes}`);
    } catch (e) {
      pushState([], [], [], null, { Error: e.message }, [], `❌ Recursion error: ${e.message}`);
    }
  };

  const runFibonacci = (n, pushState) => {
    const safeN = Math.min(Math.max(0, n), MAX_FIBONACCI_N);
    if (safeN !== n) {
      pushState([], [], [], null, {}, [], `⚠️ Input capped to ${MAX_FIBONACCI_N} to prevent stack overflow. Visualizing fib(${safeN}).`);
    }
    const stack = [];
    const recurse = (num) => {
      stack.push(`fib(${num})`);
      pushState(stack, [], [], null, {}, [], `Calling fib(${num})`);

      if (num === 0) {
        pushState(stack, [], [], null, { ReturnValue: 0 }, [], `Base case fib(0) returns 0.`);
        stack.pop(); return 0;
      }
      if (num === 1) {
        pushState(stack, [], [], null, { ReturnValue: 1 }, [], `Base case fib(1) returns 1.`);
        stack.pop(); return 1;
      }

      const left = recurse(num - 1);
      const right = recurse(num - 2);
      const res = left + right;

      pushState(stack, [], [], null, { Computation: `fib(${num-1}) + fib(${num-2}) = ${left} + ${right}`, ReturnValue: res }, [], `fib(${num}) returns ${res}.`);
      stack.pop();
      return res;
    };
    try {
      const finalRes = recurse(safeN);
      pushState([], [], [], null, { FinalResult: finalRes }, [], `✅ Fibonacci complete. fib(${safeN}) = ${finalRes}`);
    } catch (e) {
      pushState([], [], [], null, { Error: e.message }, [], `❌ Recursion error: ${e.message}`);
    }
  };

  const runSubsets = (nums, pushState) => {
    const results = [];
    const stack = [];
    
    const backtrack = (start, currentPath) => {
      stack.push(`backtrack(${start}, [${currentPath}])`);
      pushState(stack, currentPath, results, null, {}, [], `Exploring path: [${currentPath}]`);
      
      results.push([...currentPath]);
      pushState(stack, currentPath, results, null, {}, [], `Added [${currentPath}] to results.`);
      
      for (let i = start; i < nums.length; i++) {
        currentPath.push(nums[i]);
        pushState(stack, currentPath, results, null, {}, [], `Choose ${nums[i]}`);
        backtrack(i + 1, currentPath);
        currentPath.pop();
        pushState(stack, currentPath, results, null, {}, [], `Backtrack. Removed ${nums[i]}`);
      }
      stack.pop();
    };
    backtrack(0, []);
    pushState([], [], results, null, { TotalSubsets: results.length }, [], `✅ Subsets generation complete.`);
  };

  const runPermutations = (nums, pushState) => {
    const results = [];
    const stack = [];
    
    const backtrack = (currentPath) => {
      stack.push(`backtrack([${currentPath}])`);
      pushState(stack, currentPath, results, null, {}, [], `Current Path: [${currentPath}]`);
      
      if (currentPath.length === nums.length) {
        results.push([...currentPath]);
        pushState(stack, currentPath, results, null, {}, [], `✅ Found a complete permutation!`);
        stack.pop();
        return;
      }
      
      for (let i = 0; i < nums.length; i++) {
        if (currentPath.includes(nums[i])) continue;
        currentPath.push(nums[i]);
        pushState(stack, currentPath, results, null, {}, [], `Choose ${nums[i]}`);
        backtrack(currentPath);
        currentPath.pop();
        pushState(stack, currentPath, results, null, {}, [], `Backtrack. Removed ${nums[i]}`);
      }
      stack.pop();
    };
    backtrack([]);
    pushState([], [], results, null, { TotalPermutations: results.length }, [], `✅ Permutations generation complete.`);
  };

  const runCombinationSum = (candidates, target, pushState) => {
    const results = [];
    const stack = [];
    
    const backtrack = (start, currentPath, currentSum) => {
      stack.push(`bt([${currentPath}], sum=${currentSum})`);
      pushState(stack, currentPath, results, null, { Target: target, CurrentSum: currentSum }, [], `Exploring sum ${currentSum}...`);
      
      if (currentSum === target) {
        results.push([...currentPath]);
        pushState(stack, currentPath, results, null, { Target: target }, [], `✅ Found valid combination!`);
        stack.pop(); return;
      }
      if (currentSum > target) {
        pushState(stack, currentPath, results, null, { Target: target }, [], `❌ Sum exceeded target. Backtracking.`);
        stack.pop(); return;
      }
      
      for (let i = start; i < candidates.length; i++) {
        currentPath.push(candidates[i]);
        pushState(stack, currentPath, results, null, {}, [], `Choose ${candidates[i]}`);
        backtrack(i, currentPath, currentSum + candidates[i]);
        currentPath.pop();
        pushState(stack, currentPath, results, null, {}, [], `Backtracked choice ${candidates[i]}`);
      }
      stack.pop();
    };
    backtrack(0, [], 0);
    pushState([], [], results, null, { TotalCombinations: results.length }, [], `✅ Combination Sum complete.`);
  };

  const runGenerateParens = (n, pushState) => {
    const results = [];
    const stack = [];
    
    const backtrack = (currentStr, open, close) => {
      stack.push(`bt("${currentStr}", o=${open}, c=${close})`);
      pushState(stack, [currentStr], results, null, { N: n, Open: open, Close: close }, [], `Building: "${currentStr}"`);
      
      if (currentStr.length === n * 2) {
        results.push(currentStr);
        pushState(stack, [currentStr], results, null, {}, [], `✅ Valid parentheses combination found!`);
        stack.pop(); return;
      }
      
      if (open < n) {
        pushState(stack, [currentStr + '('], results, null, {}, [], `Adding '('`);
        backtrack(currentStr + '(', open + 1, close);
      }
      if (close < open) {
        pushState(stack, [currentStr + ')'], results, null, {}, [], `Adding ')'`);
        backtrack(currentStr + ')', open, close + 1);
      }
      stack.pop();
    };
    backtrack("", 0, 0);
    pushState([], [], results, null, { TotalValid: results.length }, [], `✅ Generate Parentheses complete.`);
  };

  const runNQueens = (n, initGrid, pushState) => {
    const results = [];
    const stack = [];
    const grid = initGrid.map(row => [...row]);
    
    const isValid = (row, col) => {
      for (let i = 0; i < row; i++) {
        if (grid[i][col] === 'Q') return false;
        if (col - (row - i) >= 0 && grid[i][col - (row - i)] === 'Q') return false;
        if (col + (row - i) < n && grid[i][col + (row - i)] === 'Q') return false;
      }
      return true;
    };

    const backtrack = (row) => {
      stack.push(`solve(row=${row})`);
      pushState(stack, [], results, grid, { Row: row }, [], `Attempting to place Queen in row ${row}`);
      
      if (row === n) {
        results.push(grid.map(r => r.join('')));
        pushState(stack, [], results, grid, {}, [], `✅ Found a valid board configuration!`);
        stack.pop(); return;
      }
      
      for (let col = 0; col < n; col++) {
        pushState(stack, [], results, grid, {}, [`${row}_${col}`], `Checking cell (${row}, ${col})`);
        if (isValid(row, col)) {
          grid[row][col] = 'Q';
          pushState(stack, [], results, grid, {}, [`${row}_${col}`], `Placed Queen at (${row}, ${col}). Proceeding to next row.`);
          backtrack(row + 1);
          grid[row][col] = '.';
          pushState(stack, [], results, grid, {}, [`${row}_${col}`], `Backtracked Queen from (${row}, ${col})`);
        } else {
          pushState(stack, [], results, grid, {}, [`${row}_${col}`], `❌ Invalid placement at (${row}, ${col}). Under attack.`);
        }
      }
      stack.pop();
    };
    backtrack(0);
    pushState([], [], results, grid, { TotalSolutions: results.length }, [], `✅ N-Queens complete.`);
  };

  const runSudoku = (initGrid, pushState) => {
    const stack = [];
    const grid = initGrid.map(row => [...row]);
    
    const isValid = (r, c, k) => {
      for (let i = 0; i < 9; i++) {
        if (grid[i][c] === k) return false;
        if (grid[r][i] === k) return false;
        if (grid[3 * Math.floor(r / 3) + Math.floor(i / 3)][3 * Math.floor(c / 3) + i % 3] === k) return false;
      }
      return true;
    };

    const solve = (r, c) => {
      if (r === 9) return true;
      if (c === 9) return solve(r + 1, 0);
      if (grid[r][c] !== '.') return solve(r, c + 1);
      
      stack.push(`solve(${r}, ${c})`);
      pushState(stack, [], [], grid, {}, [`${r}_${c}`], `Empty cell at (${r}, ${c}). Trying 1-9...`);
      
      for (let k = 1; k <= 9; k++) {
        const charK = k.toString();
        if (isValid(r, c, charK)) {
          grid[r][c] = charK;
          pushState(stack, [], [], grid, {}, [`${r}_${c}`], `Placed ${charK} at (${r}, ${c})`);
          if (solve(r, c + 1)) return true;
          grid[r][c] = '.';
          pushState(stack, [], [], grid, {}, [`${r}_${c}`], `Backtracked ${charK} from (${r}, ${c})`);
        }
      }
      stack.pop();
      return false;
    };
    
    solve(0, 0);
    pushState([], [], [], grid, {}, [], `✅ Sudoku Solver complete.`);
  };

  const runWordSearch = (initGrid, word, pushState) => {
    const grid = initGrid.map(row => [...row]);
    const R = grid.length, C = grid[0].length;
    const stack = [];
    
    const dfs = (r, c, idx) => {
      if (idx === word.length) return true;
      if (r < 0 || r >= R || c < 0 || c >= C || grid[r][c] !== word[idx]) return false;
      
      stack.push(`dfs(${r}, ${c}, '${word[idx]}')`);
      const temp = grid[r][c];
      grid[r][c] = '#'; // mark visited
      pushState(stack, [], [], grid, { Word: word, MatchIdx: idx }, [`${r}_${c}`], `Matched '${temp}' at (${r}, ${c}). Searching neighbors for '${word[idx+1] || 'End'}'`);
      
      const res = dfs(r+1, c, idx+1) || dfs(r-1, c, idx+1) || dfs(r, c+1, idx+1) || dfs(r, c-1, idx+1);
      
      grid[r][c] = temp; // unmark
      if (!res) {
        pushState(stack, [], [], grid, { Word: word }, [`${r}_${c}`], `Dead end at (${r}, ${c}). Backtracking.`);
      }
      stack.pop();
      return res;
    };

    for (let r = 0; r < R; r++) {
      for (let c = 0; c < C; c++) {
        if (grid[r][c] === word[0]) {
          pushState(stack, [], [], grid, { Word: word }, [`${r}_${c}`], `Found starting letter '${word[0]}' at (${r}, ${c})`);
          if (dfs(r, c, 0)) {
            pushState([], [], [], grid, { Found: 'Yes' }, [], `✅ Word "${word}" found in grid!`);
            return;
          }
        }
      }
    }
    pushState([], [], [], grid, { Found: 'No' }, [], `❌ Word "${word}" not found.`);
  };

  const runPalindromePartition = (s, pushState) => {
    const results = [];
    const stack = [];
    
    const isPalin = (l, r) => {
      while (l < r) { if (s[l++] !== s[r--]) return false; }
      return true;
    };

    const backtrack = (start, currentPath) => {
      stack.push(`bt(start=${start})`);
      pushState(stack, currentPath, results, null, { String: s }, [], `Current Path: [${currentPath.join(', ')}]`);
      
      if (start === s.length) {
        results.push([...currentPath]);
        pushState(stack, currentPath, results, null, {}, [], `✅ Found full partition!`);
        stack.pop(); return;
      }
      
      for (let end = start; end < s.length; end++) {
        if (isPalin(start, end)) {
          const substr = s.substring(start, end + 1);
          currentPath.push(substr);
          pushState(stack, currentPath, results, null, {}, [], `"${substr}" is a palindrome. Chose it.`);
          backtrack(end + 1, currentPath);
          currentPath.pop();
          pushState(stack, currentPath, results, null, {}, [], `Backtracked from choice "${substr}"`);
        }
      }
      stack.pop();
    };
    backtrack(0, []);
    pushState([], [], results, null, { TotalPartitions: results.length }, [], `✅ Palindrome Partitioning complete.`);
  };


  // --- Playback Controls ---
  const handlePlayPause = () => { if (trace.length === 0) executeAlgo(); else setIsPlaying(!isPlaying); };
  const handleNext = () => { setIsPlaying(false); if (currentStep < trace.length - 1) setCurrentStep(c => c + 1); };
  const handlePrev = () => { setIsPlaying(false); if (currentStep > 0) setCurrentStep(c => c - 1); };

  // --- Rendering ---
  const currentState = trace[currentStep] || { callStack: [], currentPath: [], results: [], grid: getInitialGrid(getCustomData()), variables: {}, highlightCells: [], msg: 'Ready.' };
  const historySteps = trace.slice(0, currentStep + 1).map(t => t.msg).filter(m => m);

  const renderGrid = (grid, highlights) => {
    if (!grid) return null;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>2D Grid</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
          {grid.map((row, rIdx) => (
            <div key={rIdx} style={{ display: 'flex', gap: '4px' }}>
              {row.map((val, cIdx) => {
                const cellId = `${rIdx}_${cIdx}`;
                const isHighlight = highlights.includes(cellId);
                const isQueen = val === 'Q';
                const isVisited = val === '#';
                
                let bg = 'rgba(0,0,0,0.5)', border = '1px solid rgba(255,255,255,0.1)', color = 'var(--text-muted)';
                if (isHighlight) { bg = 'var(--active-accent)'; border = '1px solid var(--active-accent)'; color = '#000'; }
                else if (isQueen) { bg = 'rgba(255, 0, 255, 0.2)'; border = '1px solid #ff00ff'; color = '#ff00ff'; }
                else if (isVisited) { bg = 'rgba(255, 0, 0, 0.2)'; border = '1px solid #ff0000'; color = '#ff0000'; }
                else if (val !== '.') { color = '#fff'; }

                return (
                  <div key={cIdx} style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: bg, border, borderRadius: '4px', color, fontSize: '1.2rem', fontWeight: isHighlight || isQueen || val !== '.' ? 'bold' : 'normal', fontFamily: 'Fira Code, monospace', transition: 'all 0.2s ease' }}>
                    {val === '#' ? '×' : (val === '.' ? '' : val)}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderCallStack = (stack) => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '220px' }}>
        <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Call Stack</div>
        <div style={{ border: '2px solid var(--panel-border)', borderTop: 'none', borderRadius: '0 0 8px 8px', width: '200px', minHeight: '200px', maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column-reverse', padding: '8px', gap: '4px', background: 'rgba(0,0,0,0.2)' }}>
          {stack.map((funcStr, idx) => (
            <div key={idx} style={{ width: '100%', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: idx === stack.length - 1 ? 'var(--active-accent)' : 'rgba(255,255,255,0.05)', border: `1px solid ${idx === stack.length - 1 ? 'var(--active-accent)' : 'rgba(255,255,255,0.1)'}`, borderRadius: '4px', color: idx === stack.length - 1 ? '#000' : '#fff', fontSize: '0.8rem', fontWeight: idx === stack.length - 1 ? 'bold' : 'normal', fontFamily: 'Fira Code, monospace', wordBreak: 'break-all', textAlign: 'center' }}>
              {funcStr}
            </div>
          ))}
          {stack.length === 0 && <div style={{ color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.8rem', alignSelf: 'center', marginTop: 'auto', marginBottom: 'auto' }}>Empty Stack</div>}
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
                <input type="text" placeholder="e.g. 5, 1,2,3 or aab" value={customInput}
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
              <button onClick={handlePrev} disabled={currentStep === 0 || trace.length === 0} aria-label="Previous Step" title="Previous Step" style={{ padding: '0.25rem 0.5rem', background: 'transparent', border: 'none', borderRight: '1px solid var(--panel-border)', color: '#fff', cursor: 'pointer', opacity: currentStep === 0 ? 0.3 : 1 }}>⏮</button>
              <button onClick={handlePlayPause} aria-label={isPlaying ? "Pause" : "Play"} title={isPlaying ? "Pause" : "Play"} style={{ padding: '0.25rem 0.75rem', background: isPlaying ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: 'var(--active-accent)', fontWeight: 'bold', cursor: 'pointer', width: '60px' }}>{isPlaying ? '⏸' : '▶️'}</button>
              <button onClick={handleNext} disabled={currentStep >= trace.length - 1} aria-label="Next Step" title="Next Step" style={{ padding: '0.25rem 0.5rem', background: 'transparent', border: 'none', borderLeft: '1px solid var(--panel-border)', color: '#fff', cursor: 'pointer', opacity: currentStep >= trace.length - 1 ? 0.3 : 1 }}>⏭</button>
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
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '2rem', overflowY: 'auto', padding: '1rem' }}>
          
          {/* Call Stack - Always visible */}
          {renderCallStack(currentState.callStack)}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', flex: 1, alignItems: 'center' }}>
            
            {/* Grid if applicable */}
            {currentState.grid && renderGrid(currentState.grid, currentState.highlightCells)}

            {/* Current Path if applicable (for permutations, subsets etc) */}
            {currentState.currentPath.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Current Path</div>
                <div style={{ padding: '12px 20px', background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)', borderRadius: '8px', color: '#00ff88', fontSize: '1.2rem', fontFamily: 'Fira Code, monospace', letterSpacing: '2px' }}>
                  [ {currentState.currentPath.join(', ')} ]
                </div>
              </div>
            )}

            {/* Results Array if applicable */}
            {currentState.results.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Collected Results ({currentState.results.length})</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.1)', width: '100%' }}>
                  {currentState.results.map((res, idx) => (
                    <div key={idx} style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: '#fff', fontSize: '0.9rem', fontFamily: 'Fira Code, monospace' }}>
                      {Array.isArray(res) ? `[${res.join(', ')}]` : res}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
      <StepLog steps={historySteps} currentStep={currentStep} />
    </div>
  );
};

export default RecursionBacktrackingVisualizer;
