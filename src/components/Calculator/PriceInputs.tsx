import React from 'react';

interface PriceInputsProps {
  entryPrice: string;
  stopLossPrice: string;
  takeProfitPrice: string;
  onEntryPriceChange: (value: string) => void;
  onStopLossChange: (value: string) => void;
  onTakeProfitChange: (value: string) => void;
  direction: 'long' | 'short';
  errors?: {
    entryPrice?: string;
    stopLossPrice?: string;
    takeProfitPrice?: string;
  };
  disabled?: boolean;
}

const PriceInputs: React.FC<PriceInputsProps> = ({
  entryPrice,
  stopLossPrice,
  takeProfitPrice,
  onEntryPriceChange,
  onStopLossChange,
  onTakeProfitChange,
  direction,
  errors = {},
  disabled = false
}) => {
  return (
    <div style={{ margin: '10px 0' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div>
          <label>
            Цена входа:
            <input
              type="number"
              value={entryPrice}
              onChange={(e) => onEntryPriceChange(e.target.value)}
              disabled={disabled}
              step="0.00001"
              style={{
                width: '100%',
                padding: '8px',
                marginTop: '5px',
                border: errors.entryPrice ? '1px solid red' : '1px solid #ccc',
                borderRadius: '4px',
                opacity: disabled ? 0.6 : 1
              }}
            />
          </label>
          {errors.entryPrice && <div style={{ color: 'red', fontSize: '12px' }}>{errors.entryPrice}</div>}
        </div>

        <div>
          <label>
            Стоп-лосс:
            <input
              type="number"
              value={stopLossPrice}
              onChange={(e) => onStopLossChange(e.target.value)}
              disabled={disabled}
              step="0.00001"
              style={{
                width: '100%',
                padding: '8px',
                marginTop: '5px',
                border: errors.stopLossPrice ? '1px solid red' : '1px solid #ccc',
                borderRadius: '4px',
                opacity: disabled ? 0.6 : 1
              }}
            />
          </label>
          {errors.stopLossPrice && <div style={{ color: 'red', fontSize: '12px' }}>{errors.stopLossPrice}</div>}
        </div>

        <div>
          <label>
            Тейк-профит:
            <input
              type="number"
              value={takeProfitPrice}
              onChange={(e) => onTakeProfitChange(e.target.value)}
              disabled={disabled}
              step="0.00001"
              style={{
                width: '100%',
                padding: '8px',
                marginTop: '5px',
                border: errors.takeProfitPrice ? '1px solid red' : '1px solid #ccc',
                borderRadius: '4px',
                opacity: disabled ? 0.6 : 1
              }}
            />
          </label>
          {errors.takeProfitPrice && <div style={{ color: 'red', fontSize: '12px' }}>{errors.takeProfitPrice}</div>}
        </div>
      </div>

      {direction === 'long' && (
        <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
          Для LONG: Стоп-лосс должен быть ниже цены входа, Тейк-профит - выше
        </div>
      )}
      {direction === 'short' && (
        <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
          Для SHORT: Стоп-лосс должен быть выше цены входа, Тейк-профит - ниже
        </div>
      )}
    </div>
  );
};

export default PriceInputs;
