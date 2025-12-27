
import React from 'react';

interface CalculationResultsProps {
  results: any; // Временно any, потом определим конкретный тип
  isLoading: boolean;
  isValid: boolean;
  onCalculate: () => void;
  onReset: () => void;
}

const CalculationResults: React.FC<CalculationResultsProps> = ({
  results,
  isLoading,
  isValid,
  onCalculate,
  onReset
}) => {
  return (
    <div style={{ margin: '10px 0' }}>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
        <button
          type="button"
          onClick={onCalculate}
          disabled={!isValid || isLoading}
          style={{
            padding: '10px 20px',
            backgroundColor: isValid ? '#4CAF50' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isValid && !isLoading ? 'pointer' : 'not-allowed'
          }}
        >
          {isLoading ? 'Расчет...' : 'Рассчитать'}
        </button>

        <button
          type="button"
          onClick={onReset}
          disabled={isLoading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          Сбросить
        </button>
      </div>

      {results?.position && (
        <div style={{
          padding: '15px',
          border: '1px solid #4CAF50',
          borderRadius: '4px',
          backgroundColor: '#f1f8e9'
        }}>
          <h3 style={{ marginTop: 0 }}>Результаты расчета:</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>Размер позиции: <strong>{results.position.positionSize.toFixed(2)}</strong></div>
            <div>Риск в деньгах: <strong>{results.position.riskAmount.toFixed(2)}</strong></div>
            <div>Потенциальная прибыль: <strong>{results.position.potentialProfit.toFixed(2)}</strong></div>
            <div>Потенциальный убыток: <strong>{results.position.potentialLoss.toFixed(2)}</strong></div>
            <div>Риск/Прибыль: <strong>{results.position.riskRewardRatio.toFixed(2)}</strong></div>
          </div>
        </div>
      )}

      {!isValid && !results?.position && (
        <div style={{
          padding: '10px',
          border: '1px solid #ff9800',
          borderRadius: '4px',
          backgroundColor: '#fff3e0',
          color: '#e65100'
        }}>
          Заполните все обязательные поля для расчета
        </div>
      )}
    </div>
  );
};

export default CalculationResults;
