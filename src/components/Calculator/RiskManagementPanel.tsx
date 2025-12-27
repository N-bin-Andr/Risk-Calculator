import React from 'react';

interface RiskManagementPanelProps {
  deposit: string;
  riskSize: string;
  stopLossPercent: string;
  takeProfitPercent: string;
  riskPerTrade: string;
  riskReward: string;
  lotSize: string;
  onDepositChange: (value: string) => void;
  onRiskSizeChange: (value: string) => void;
  onStopLossPercentChange: (value: string) => void;
  onTakeProfitPercentChange: (value: string) => void;
  onRiskPerTradeChange: (value: string) => void;
  onRiskRewardChange: (value: string) => void;
  onLotSizeChange: (value: string) => void;
  errors?: {
    deposit?: string;
    riskSize?: string;
    stopLossPercent?: string;
    takeProfitPercent?: string;
    riskPerTrade?: string;
    riskReward?: string;
    lotSize?: string;
  };
  disabled?: boolean;
}

const RiskManagementPanel: React.FC<RiskManagementPanelProps> = ({
  deposit,
  riskSize,
  stopLossPercent,
  takeProfitPercent,
  riskPerTrade,
  riskReward,
  lotSize,
  onDepositChange,
  onRiskSizeChange,
  onStopLossPercentChange,
  onTakeProfitPercentChange,
  onRiskPerTradeChange,
  onRiskRewardChange,
  onLotSizeChange,
  errors = {},
  disabled = false
}) => {
  return (
    <div style={{ margin: '10px 0' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        <div>
          <label>
            Депозит:
            <input
              type="number"
              value={deposit}
              onChange={(e) => onDepositChange(e.target.value)}
              disabled={disabled}
              step="0.01"
              style={{
                width: '100%',
                padding: '8px',
                marginTop: '5px',
                border: errors.deposit ? '1px solid red' : '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </label>
          {errors.deposit && <div style={{ color: 'red', fontSize: '12px' }}>{errors.deposit}</div>}
        </div>

        <div>
          <label>
            Размер риска (%):
            <input
              type="number"
              value={riskSize}
              onChange={(e) => onRiskSizeChange(e.target.value)}
              disabled={disabled}
              step="0.01"
              min="0.01"
              max="100"
              style={{
                width: '100%',
                padding: '8px',
                marginTop: '5px',
                border: errors.riskSize ? '1px solid red' : '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </label>
          {errors.riskSize && <div style={{ color: 'red', fontSize: '12px' }}>{errors.riskSize}</div>}
        </div>

        <div>
          <label>
            Стоп-лосс (%):
            <input
              type="number"
              value={stopLossPercent}
              onChange={(e) => onStopLossPercentChange(e.target.value)}
              disabled={disabled}
              step="0.01"
              style={{
                width: '100%',
                padding: '8px',
                marginTop: '5px',
                border: errors.stopLossPercent ? '1px solid red' : '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </label>
          {errors.stopLossPercent && <div style={{ color: 'red', fontSize: '12px' }}>{errors.stopLossPercent}</div>}
        </div>

        <div>
          <label>
            Тейк-профит (%):
            <input
              type="number"
              value={takeProfitPercent}
              onChange={(e) => onTakeProfitPercentChange(e.target.value)}
              disabled={disabled}
              step="0.01"
              style={{
                width: '100%',
                padding: '8px',
                marginTop: '5px',
                border: errors.takeProfitPercent ? '1px solid red' : '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </label>
          {errors.takeProfitPercent && <div style={{ color: 'red', fontSize: '12px' }}>{errors.takeProfitPercent}</div>}
        </div>

        <div>
          <label>
            Риск на сделку:
            <input
              type="number"
              value={riskPerTrade}
              onChange={(e) => onRiskPerTradeChange(e.target.value)}
              disabled={disabled}
              step="0.01"
              style={{
                width: '100%',
                padding: '8px',
                marginTop: '5px',
                border: errors.riskPerTrade ? '1px solid red' : '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </label>
          {errors.riskPerTrade && <div style={{ color: 'red', fontSize: '12px' }}>{errors.riskPerTrade}</div>}
        </div>

        <div>
          <label>
            Риск/Прибыль:
            <input
              type="number"
              value={riskReward}
              onChange={(e) => onRiskRewardChange(e.target.value)}
              disabled={disabled}
              step="0.01"
              style={{
                width: '100%',
                padding: '8px',
                marginTop: '5px',
                border: errors.riskReward ? '1px solid red' : '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </label>
          {errors.riskReward && <div style={{ color: 'red', fontSize: '12px' }}>{errors.riskReward}</div>}
        </div>

        <div>
          <label>
            Размер лота:
            <input
              type="number"
              value={lotSize}
              onChange={(e) => onLotSizeChange(e.target.value)}
              disabled={disabled}
              step="0.01"
              style={{
                width: '100%',
                padding: '8px',
                marginTop: '5px',
                border: errors.lotSize ? '1px solid red' : '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </label>
          {errors.lotSize && <div style={{ color: 'red', fontSize: '12px' }}>{errors.lotSize}</div>}
        </div>
      </div>
    </div>
  );
};

export default RiskManagementPanel;
