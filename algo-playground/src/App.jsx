import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import CodeView from './components/CodeView';
import RecurrenceView from './components/RecurrenceView';
import VizView from './components/VizView';
import { ALGORITHM_CATEGORIES } from './data/algorithms';
import { Terminal, FunctionSquare, LayoutDashboard } from 'lucide-react';

const FIRST_CATEGORY = Object.values(ALGORITHM_CATEGORIES)[0];
const FIRST_ALGO = FIRST_CATEGORY.algorithms[0];

function App() {
  const [activeCategory, setActiveCategory] = useState(FIRST_CATEGORY);
  const [activeAlgorithm, setActiveAlgorithm] = useState(FIRST_ALGO);
  const [activeTab, setActiveTab] = useState('CODE');

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--active-accent', activeCategory.color || '#00ffff');
  }, [activeCategory]);

  return (
    <div className="app-container">
      <Sidebar
        categories={ALGORITHM_CATEGORIES}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        activeAlgorithm={activeAlgorithm}
        setActiveAlgorithm={setActiveAlgorithm}
      />

      <main className="dashboard glass-panel">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.75rem', flexShrink: 0 }}>
          <div>
            <h1 className="neon-text" style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700 }}>{activeAlgorithm.name}</h1>
            {activeAlgorithm.complexity && (
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', marginTop: '2px', fontFamily: 'Fira Code, monospace' }}>
                ⏱ {activeAlgorithm.complexity}
              </div>
            )}
          </div>
          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '3px', color: 'rgba(255,255,255,0.3)', textAlign: 'right' }}>
            {activeCategory.name}
          </div>
        </header>

        <div className="tabs">
          <button className={`tab ${activeTab === 'CODE' ? 'active' : ''}`} onClick={() => setActiveTab('CODE')}>
            <Terminal size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />Code
          </button>
          <button className={`tab ${activeTab === 'RECURRENCE' ? 'active' : ''}`} onClick={() => setActiveTab('RECURRENCE')}>
            <FunctionSquare size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />Recurrence
          </button>
          <button className={`tab ${activeTab === 'VIZ' ? 'active' : ''}`} onClick={() => setActiveTab('VIZ')}>
            <LayoutDashboard size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />Visualization
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', minHeight: 0 }}>
          {activeTab === 'CODE' && <CodeView code={activeAlgorithm.code} />}
          {activeTab === 'RECURRENCE' && <RecurrenceView algorithm={activeAlgorithm} />}
          {activeTab === 'VIZ' && <VizView algorithm={activeAlgorithm} category={activeCategory} />}
        </div>
      </main>
    </div>
  );
}

export default App;
