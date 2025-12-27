import React from 'react';

interface TPLevel {
  id: string;
  price: string;
  percent: string;
  volume?: string;
  note?: string;
}

interface TakeProfitManagerProps {
  levels: TPLevel[];
  enabled: boolean;
  onToggleEnabled: () => void;
  onAddLevel: () => void;
  onRemoveLevel: (id: string) => void;
  onUpdateLevel: (id: string, field: string, value: string) => void;
  direction: 'long' | 'short';
  entryPrice: string;
  stopLossPrice: string;
  disabled?: boolean;
}

const TakeProfitManager: React.FC<TakeProfitManagerProps> = ({
  levels,
  enabled,
  onToggleEnabled,
  onAddLevel,
  onRemoveLevel,
  onUpdateLevel,
  direction,
  entryPrice,
  stopLossPrice,
  disabled = false
}) => {
  return (
    <div style={{ margin: '10px 0' }}>
      <label>
        <input
          type="checkbox"
          checked={enabled}
          onChange={onToggleEnabled}
          disabled={disabled}
        />
        Использовать несколько уровней тейк-профита
      </label>

      {enabled && (
        <div style={{ marginTop: '15px' }}>
          <button
            type="button"
            onClick={onAddLevel}
            disabled={disabled}
            style={{
              padding: '8px 16px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.6 : 1
            }}
          >
            + Добавить уровень
          </button>

          {levels.length > 0 && (
            <div style={{ marginTop: '15px' }}>
              {levels.map((level, index) => (
                <div
                  key={level.id}
                  style={{
                    padding: '10px',
                    margin: '10px 0',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    backgroundColor: '#f9f9f9'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ margin: 0 }}>Уровень {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => onRemoveLevel(level.id)}
                      disabled={disabled}
                      style={{
                        padding: '5px 10px',
                        backgroundColor: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: disabled ? 'not-allowed' : 'pointer'
                      }}
                    >
                      Удалить
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                    <div>
                      <label>
                        Цена:
                        <input
                          type="number"
                          value={level.price}
                          onChange={(e) => onUpdateLevel(level.id, 'price', e.target.value)}
                          disabled={disabled}
                          step="0.00001"
                          style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                        />
                      </label>
                    </div>

                    <div>
                      <label>
                        Процент объема (%):
                        <input
                          type="number"
                          value={level.percent}
                          onChange={(e) => onUpdateLevel(level.id, 'percent', e.target.value)}
                          disabled={disabled}
                          step="0.01"
                          min="0"
                          max="100"
                          style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TakeProfitManager;
