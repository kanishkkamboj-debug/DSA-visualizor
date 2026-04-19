import React, { useEffect, useRef } from 'react';

const StepLog = ({ steps, currentStep }) => {
  const bottomRef = useRef(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [steps]);

  return (
    <div style={{
      width: '280px',
      minWidth: '280px',
      background: 'rgba(0,0,0,0.6)',
      border: '1px solid var(--panel-border)',
      borderRadius: '8px',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '0.75rem 1rem',
        borderBottom: '1px solid var(--panel-border)',
        fontSize: '0.75rem',
        letterSpacing: '2px',
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
      }}>
        Execution Log
      </div>
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '0.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
      }}>
        {steps.length === 0 && (
          <div style={{ color: 'var(--text-muted)', padding: '1rem', textAlign: 'center', fontSize: '0.85rem' }}>
            Press Execute to start tracing...
          </div>
        )}
        {steps.map((step, i) => {
          const isLatest = i === steps.length - 1;
          return (
            <div key={i} style={{
              padding: '0.4rem 0.6rem',
              borderRadius: '4px',
              background: isLatest ? 'rgba(var(--accent-rgb, 0,255,255), 0.1)' : 'transparent',
              borderLeft: isLatest ? '3px solid var(--active-accent)' : '3px solid transparent',
              transition: 'all 0.3s ease',
            }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                Step {i + 1}
              </div>
              <div style={{
                fontSize: '0.8rem',
                color: isLatest ? '#fff' : 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
                lineHeight: '1.4',
              }}>
                {step}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default StepLog;
