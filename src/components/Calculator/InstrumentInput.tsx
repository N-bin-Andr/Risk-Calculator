import React from 'react';

interface InstrumentInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

const InstrumentInput: React.FC<InstrumentInputProps> = ({
  value,
  onChange,
  error,
  disabled = false
}) => {
  return (
    <div style={{ margin: '10px 0' }}>
      <label>
        Инструмент:
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="Например: EURUSD"
          style={{
            width: '100%',
            padding: '8px',
            marginTop: '5px',
            border: error ? '1px solid red' : '1px solid #ccc',
            borderRadius: '4px',
            opacity: disabled ? 0.6 : 1
          }}
        />
      </label>
      {error && <div style={{ color: 'red', fontSize: '12px', marginTop: '2px' }}>{error}</div>}
    </div>
  );
};

export default InstrumentInput;
