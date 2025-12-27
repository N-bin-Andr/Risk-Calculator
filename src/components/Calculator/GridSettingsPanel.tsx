import React from 'react';

interface GridSettingsPanelProps {
  enabled: boolean;
  startPrice: string;
  endPrice: string;
  levels: string;
  volumeType: 'fixed' | 'multiplied';
  firstVolume: string;
  volumeMultiplier: string;
  stepType: 'percent' | 'absolute';
  stepValue: string;
  onToggleEnabled: () => void;
  onStartPriceChange: (value: string) => void;
  onEndPriceChange: (value: string) => void;
  onLevelsChange: (value: string) => void;
  onVolumeTypeChange: (value: 'fixed' | 'multiplied') => void;
  onFirstVolumeChange: (value: string) => void;
  onVolumeMultiplierChange: (value: string) => void;
  onStepTypeChange: (value: 'percent' | 'absolute') => void;
  onStepValueChange: (value: string) => void;
  direction: 'long' | 'short';
  errors?: {
    gridStartPrice?: string;
    gridEndPrice?: string;
    gridLevels?: string;
  };
  disabled?: boolean;
}

const GridSettingsPanel: React.FC<GridSettingsPanelProps> = ({
  enabled,
  startPrice,
  endPrice,
  levels,
  volumeType,
  firstVolume,
  volumeMultiplier,
  stepType,
  stepValue,
  onToggleEnabled,
  onStartPriceChange,
  onEndPriceChange,
  onLevelsChange,
  onVolumeTypeChange,
  onFirstVolumeChange,
  onVolumeMultiplierChange,
  onStepTypeChange,
  onStepValueChange,
  direction,
  errors = {},
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
        Включить сетку ордеров
      </label>

      {enabled && (
        <div style={{ marginTop: '15px', padding: '15px', border: '1px solid #eee', borderRadius: '4px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label>
                Начальная цена:
                <input
                  type="number"
                  value={startPrice}
                  onChange={(e) => onStartPriceChange(e.target.value)}
                  disabled={disabled}
                  step="0.00001"
                  style={{
                    width: '100%',
                    padding: '8px',
                    marginTop: '5px',
                    border: errors.gridStartPrice ? '1px solid red' : '1px solid #ccc',
                    borderRadius: '4px',
                    opacity: disabled ? 0.6 : 1
                  }}
                />
              </label>
              {errors.gridStartPrice && <div style={{ color: 'red', fontSize: '12px' }}>{errors.gridStartPrice}</div>}
            </div>

            <div>
              <label>
                Конечная цена:
                <input
                  type="number"
                  value={endPrice}
                  onChange={(e) => onEndPriceChange(e.target.value)}
                  disabled={disabled}
                  step="0.00001"
                  style={{
                    width: '100%',
                    padding: '8px',
                    marginTop: '5px',
                    border: errors.gridEndPrice ? '1px solid red' : '1px solid #ccc',
                    borderRadius: '4px',
                    opacity: disabled ? 0.6 : 1
                  }}
                />
              </label>
              {errors.gridEndPrice && <div style={{ color: 'red', fontSize: '12px' }}>{errors.gridEndPrice}</div>}
            </div>

            <div>
              <label>
                Количество уровней:
                <input
                  type="number"
                  value={levels}
                  onChange={(e) => onLevelsChange(e.target.value)}
                  disabled={disabled}
                  min="2"
                  max="100"
                  style={{
                    width: '100%',
                    padding: '8px',
                    marginTop: '5px',
                    border: errors.gridLevels ? '1px solid red' : '1px solid #ccc',
                    borderRadius: '4px',
                    opacity: disabled ? 0.6 : 1
                  }}
                />
              </label>
              {errors.gridLevels && <div style={{ color: 'red', fontSize: '12px' }}>{errors.gridLevels}</div>}
            </div>
          </div>

          <div style={{ marginTop: '15px' }}>
            <label>
              Тип объема:
              <select
                value={volumeType}
                onChange={(e) => onVolumeTypeChange(e.target.value as 'fixed' | 'multiplied')}
                disabled={disabled}
                style={{ marginLeft: '10px', padding: '5px' }}
              >
                <option value="fixed">Фиксированный</option>
                <option value="multiplied">Умножаемый</option>
              </select>
            </label>
          </div>

          {volumeType === 'multiplied' && (
            <div style={{ marginTop: '10px' }}>
              <label>
                Множитель объема:
                <input
                  type="number"
                  value={volumeMultiplier}
                  onChange={(e) => onVolumeMultiplierChange(e.target.value)}
                  disabled={disabled}
                  step="0.1"
                  min="1"
                  style={{ marginLeft: '10px', padding: '5px', width: '80px' }}
                />
              </label>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GridSettingsPanel;
