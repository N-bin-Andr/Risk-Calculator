import React from 'react';

interface DirectionSelectorProps {
  direction: 'long' | 'short';
  onChange: (direction: 'long' | 'short') => void;
  disabled?: boolean;
}

const DirectionSelector: React.FC<DirectionSelectorProps> = ({
  direction,
  onChange,
  disabled = false
}) => {
  return (
    <div style={{ margin: '10px 0' }}>
      <label>Направление сделки:</label>
      <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
        <button
          type="button"
          onClick={() => onChange('long')}
          disabled={disabled}
          style={{
            padding: '8px 16px',
            backgroundColor: direction === 'long' ? '#4CAF50' : '#f0f0f0',
            color: direction === 'long' ? 'white' : 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.6 : 1
          }}
        >
          LONG (Покупка)
        </button>
        <button
          type="button"
          onClick={() => onChange('short')}
          disabled={disabled}
          style={{
            padding: '8px 16px',
            backgroundColor: direction === 'short' ? '#F44336' : '#f0f0f0',
            color: direction === 'short' ? 'white' : 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.6 : 1
          }}
        >
          SHORT (Продажа)
        </button>
      </div>
    </div>
  );
};

export default DirectionSelector;
