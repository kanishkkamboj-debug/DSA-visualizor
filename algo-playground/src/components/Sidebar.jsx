import React, { useState } from 'react';

const Sidebar = ({ categories, activeCategory, setActiveCategory, activeAlgorithm, setActiveAlgorithm }) => {
  // Keep active category expanded by default; allow toggling others
  const [expandedIds, setExpandedIds] = useState(() => new Set([activeCategory?.id]));

  const toggleCategory = (id) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <aside className="sidebar glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' }}>
      {/* Header */}
      <div style={{ paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '0.75rem', flexShrink: 0 }}>
        <h2 className="neon-text" style={{ margin: 0, fontSize: '1.1rem', letterSpacing: '2px' }}>
          ALGO_GRID v2.0
        </h2>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px', letterSpacing: '1px' }}>
          COMMAND SYSTEM ONLINE
        </div>
      </div>

      {/* Scrollable category list */}
      <div style={{ overflowY: 'auto', flex: 1, paddingRight: '2px' }}>
        {Object.values(categories).map(cat => {
          const isExpanded = expandedIds.has(cat.id);
          const isActiveCategory = activeCategory?.id === cat.id;
          const accent = cat.color || 'var(--active-accent)';

          return (
            <div key={cat.id} style={{ marginBottom: '2px' }}>
              {/* Category header — clickable, accordion toggle */}
              <button
                onClick={() => toggleCategory(cat.id)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  width: '100%',
                  background: isActiveCategory ? `${accent}18` : 'transparent',
                  border: 'none',
                  borderLeft: isActiveCategory ? `3px solid ${accent}` : '3px solid transparent',
                  borderRadius: '4px',
                  padding: '0.35rem 0.5rem',
                  cursor: 'pointer',
                  color: isActiveCategory ? accent : 'rgba(255,255,255,0.5)',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                }}
              >
                <span>{cat.name}</span>
                <span style={{ fontSize: '0.6rem', opacity: 0.7, transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', display: 'inline-block' }}>▼</span>
              </button>

              {/* Algorithm list */}
              {isExpanded && (
                <div style={{ paddingLeft: '8px', paddingBottom: '4px' }}>
                  {cat.algorithms.map(algo => {
                    const isActive = activeAlgorithm?.id === algo.id && activeCategory?.id === cat.id;
                    return (
                      <button
                        key={algo.id}
                        onClick={() => {
                          setActiveCategory(cat);
                          setActiveAlgorithm(algo);
                          // Collapse all but this
                          setExpandedIds(prev => new Set([...prev, cat.id]));
                        }}
                        style={{
                          display: 'block',
                          width: '100%',
                          textAlign: 'left',
                          background: isActive ? `${accent}22` : 'transparent',
                          border: 'none',
                          borderLeft: isActive ? `2px solid ${accent}` : '2px solid transparent',
                          borderRadius: '3px',
                          color: isActive ? '#fff' : 'rgba(255,255,255,0.55)',
                          padding: '0.28rem 0.5rem',
                          cursor: 'pointer',
                          fontSize: '0.78rem',
                          transition: 'all 0.15s ease',
                          textShadow: isActive ? `0 0 6px ${accent}` : 'none',
                        }}
                        onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = '#fff'; }}
                        onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; }}
                      >
                        {algo.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: '0.5rem', flexShrink: 0, fontSize: '0.58rem', color: 'rgba(255,255,255,0.2)', letterSpacing: '1px' }}>
        {Object.values(categories).reduce((acc, c) => acc + c.algorithms.length, 0)} ALGORITHMS LOADED
      </div>
    </aside>
  );
};

export default Sidebar;
