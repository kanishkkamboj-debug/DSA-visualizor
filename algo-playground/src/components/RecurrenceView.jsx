import React from 'react';

const RecurrenceView = ({ algorithm }) => {
  return (
    <div className="recurrence-view" style={{ flexDirection: 'column', gap: '2rem' }}>
      <div 
        className="glass-panel" 
        style={{ padding: '3rem', textAlign: 'center', minWidth: '50%', border: '1px solid var(--active-accent)' }}
      >
        <div style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '1rem', textShadow: 'none', fontStyle: 'normal' }}>
          MATHEMATICAL MODEL
        </div>
        <div style={{ whiteSpace: 'pre-line' }}>
          {algorithm.recurrence}
        </div>
      </div>
      
      <div 
        className="glass-panel" 
        style={{ padding: '2rem', textAlign: 'center', minWidth: '30%' }}
      >
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textShadow: 'none', fontStyle: 'normal' }}>
          TIME COMPLEXITY
        </div>
        <div style={{ color: '#fff' }}>
          {algorithm.complexity}
        </div>
      </div>
    </div>
  );
};

export default RecurrenceView;
