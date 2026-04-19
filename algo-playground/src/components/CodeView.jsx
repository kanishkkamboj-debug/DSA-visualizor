import React from 'react';

const CodeView = ({ code }) => {
  // Ultra-simple syntax highlighting just for visual aesthetics
  const highlightCode = (text) => {
    return text.split('\n').map((line, i) => {
      // Very naive tokenization
      const parts = line.split(/(\bfunction\b|\bconst\b|\blet\b|\breturn\b|\bif\b|\belse\b|\bwhile\b|\bfor\b|\bnew\b|\bMath\b|\bInfinity\b|'.*?'|".*?"|\/\/.*)/g);
      
      return (
        <div key={i} style={{ display: 'flex', minHeight: '1.5em' }}>
          <span style={{ width: '40px', color: '#445', userSelect: 'none', textAlign: 'right', paddingRight: '1rem' }}>
            {i + 1}
          </span>
          <span style={{ whiteSpace: 'pre' }}>
            {parts.map((part, j) => {
              if (!part) return null;
              if (part.match(/\b(function|const|let|return|if|else|while|for|new)\b/)) {
                return <span key={j} className="keyword">{part}</span>;
              }
              if (part.match(/^['"]/)) {
                return <span key={j} className="string">{part}</span>;
              }
              if (part.match(/^\/\//)) {
                return <span key={j} className="comment">{part}</span>;
              }
              if (part === 'Math' || part === 'Infinity') {
                return <span key={j} className="function">{part}</span>;
              }
              // Try to highlight function calls/names roughly
              if (part.match(/^[a-zA-Z_$][0-9a-zA-Z_$]*$/) && parts[j+1] && parts[j+1].startsWith('(')) {
                return <span key={j} className="function">{part}</span>;
              }
              return <span key={j}>{part}</span>;
            })}
          </span>
        </div>
      );
    });
  };

  return (
    <div className="code-view" style={{ flex: 1 }}>
      <code>
        {highlightCode(code)}
      </code>
    </div>
  );
};

export default CodeView;
