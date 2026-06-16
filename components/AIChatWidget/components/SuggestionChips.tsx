import React from 'react';

interface SuggestionChipsProps {
  suggestions: string[];
  onSend: (message: string) => void;
  disabled: boolean;
}

const SuggestionChips: React.FC<SuggestionChipsProps> = ({ suggestions, onSend, disabled }) => {
  if (suggestions.length === 0) return null;

  return (
    <div className="ai-suggestions">
      <div className="suggestions-label">试试问我：</div>
      <div className="suggestions-list">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            className="suggestion-chip"
            onClick={() => onSend(suggestion)}
            disabled={disabled}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SuggestionChips;
