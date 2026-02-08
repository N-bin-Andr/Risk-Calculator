// src/components/Calculator/RiskManagementPanel.jsx
import React, { useState, useEffect } from 'react';
import '../../styles/components/RiskManagement.css';
import { calculateRiskAmount, getRiskRecommendation } from '../../utils/helpers';
import { validateStopLoss } from '../../utils/validators';
import { formatCurrency } from '../../utils/formatters';

const RiskManagementPanel = ({
    deposit,
    setDeposit,
    riskSize,
    setRiskSize,
    slPrice,
    slError,
    isDirectionChosen,
    dispatch,
    entryPrice,
    direction,
    tooltipText
}) => {
    const [localDeposit, setLocalDeposit] = useState(deposit);
    const [localRiskSize, setLocalRiskSize] = useState(riskSize);
    const [localSlPrice, setLocalSlPrice] = useState(slPrice);

    // Синхронизация с родительским состоянием
    useEffect(() => {
        setLocalDeposit(deposit);
    }, [deposit]);

    useEffect(() => {
        setLocalRiskSize(riskSize);
    }, [riskSize]);

    useEffect(() => {
        setLocalSlPrice(slPrice);
    }, [slPrice]);

    // Обработчик изменения депозита
    const handleDepositChange = (value) => {
        setLocalDeposit(value);
        setDeposit(value);
    };

    // Обработчик блюра депозита
    const handleDepositBlur = () => {
        if (localDeposit) {
            localStorage.setItem('lastDeposit', localDeposit);
            localStorage.setItem('savedDeposit', localDeposit);
            dispatch({ type: 'SET_FIELD', field: 'deposit', value: localDeposit });
        }
    };

    // Обработчик изменения риска
    const handleRiskChange = (value) => {
        setLocalRiskSize(value);
        setRiskSize(value);
    };

    // Обработчик блюра риска
    const handleRiskBlur = () => {
        if (localRiskSize) {
            localStorage.setItem('lastRiskSize', localRiskSize);
            localStorage.setItem('savedRiskSize', localRiskSize);
            dispatch({ type: 'SET_FIELD', field: 'riskSize', value: localRiskSize });
        }
    };

    // Обработчик изменения Stop Loss с использованием валидатора
    const handleSlChange = (value) => {
        setLocalSlPrice(value);
        dispatch({ type: 'SET_FIELD', field: 'slPrice', value: value });

        // Используем централизованный валидатор
        const error = validateStopLoss(value, entryPrice, direction);
        dispatch({ type: 'SET_FIELD', field: 'slError', value: error });
    };

    // Расчет риска в USDT с использованием утилиты
    const riskAmount = calculateRiskAmount(localDeposit, localRiskSize);

    // Получение рекомендации по риску с использованием утилиты
    const riskRecommendation = getRiskRecommendation(localRiskSize);

    return (
        <fieldset className="form-section risk-management-section">
            <legend>🛡️ Риск-менеджмент</legend>

            {/* Статистика рисков */}
            <div className="risk-stats">
                <div className="risk-stat-item">
                    <span className="risk-stat-label">Риск в USDT:</span>
                    <span className="risk-stat-value">
                        {riskAmount > 0 ? formatCurrency(riskAmount) : '—'}
                    </span>
                </div>
                {riskRecommendation && (
                    <div className="risk-stat-item">
                        <span className="risk-stat-label">Уровень риска:</span>
                        <span
                            className="risk-stat-recommendation"
                            style={{ color: riskRecommendation.color }}
                        >
                            {riskRecommendation.emoji} {riskRecommendation.text}
                        </span>
                    </div>
                )}
            </div>

            {/* Поле Stop Loss */}
            <div className="risk-field-group">
                <div
                    className={`inline-field ${!isDirectionChosen ? 'disabled-field' : ''}`}
                    title={!isDirectionChosen ? tooltipText : ''}
                >
                    <label>Stop Loss (USDT):</label>
                    <div className="sl-input-container">
                        <input
                            type="number"
                            step="0.0001"
                            min="0"
                            value={localSlPrice}
                            className={slError ? 'input-error' : ''}
                            onChange={(e) => handleSlChange(e.target.value)}
                            disabled={!isDirectionChosen}
                            placeholder="0.0000"
                        />
                        <div className="sl-direction-hint">
                            {direction === 'long' ? '↓ Ниже входа' :
                             direction === 'short' ? '↑ Выше входа' : '—'}
                        </div>
                    </div>
                </div>
                {slError && <span className="error-text">{slError}</span>}
            </div>

            {/* Поля депозита и риска */}
            <div className="risk-inputs-grid">
                {/* Депозит */}
                <div className="risk-input-group">
                    <label htmlFor="deposit-input">
                        Депозит (USDT):
                        {localDeposit && (
                            <span className="saved-indicator" title="Сохранено в браузере">
                                💾
                            </span>
                        )}
                    </label>
                    <div className="input-with-prefix">
                        <span className="input-prefix">$</span>
                        <input
                            id="deposit-input"
                            type="number"
                            step="0.01"
                            min="0"
                            value={localDeposit}
                            onChange={(e) => handleDepositChange(e.target.value)}
                            onBlur={handleDepositBlur}
                            placeholder="1000"
                        />
                    </div>
                    <div className="input-hint">
                        Сумма капитала для сделки
                    </div>
                </div>

                {/* Риск */}
                <div className="risk-input-group">
                    <label htmlFor="risk-input">
                        Риск на сделку (%):
                        {localRiskSize && (
                            <span className="saved-indicator" title="Сохранено в браузере">
                                💾
                            </span>
                        )}
                    </label>
                    <div className="input-with-suffix">
                        <input
                            id="risk-input"
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={localRiskSize}
                            onChange={(e) => handleRiskChange(e.target.value)}
                            onBlur={handleRiskBlur}
                            placeholder="2"
                        />
                        <span className="input-suffix">%</span>
                    </div>
                    <div className="input-hint">
                        От 0.1% до 5% рекомендуется
                    </div>
                </div>
            </div>

            {/* Прогресс-бар риска */}
            {localRiskSize && !isNaN(parseFloat(localRiskSize)) && (
                <div className="risk-progress">
                    <div className="risk-progress-labels">
                        <span>0%</span>
                        <span>Риск: {localRiskSize}%</span>
                        <span>100%</span>
                    </div>
                    <div className="risk-progress-bar">
                        <div
                            className="risk-progress-fill"
                            style={{
                                width: `${Math.min(100, parseFloat(localRiskSize))}%`,
                                backgroundColor: riskRecommendation?.color || '#007bff'
                            }}
                        />
                        <div className="risk-progress-markers">
                            <div className="risk-marker" style={{ left: '1%' }} title="Консервативный">
                                🟢
                            </div>
                            <div className="risk-marker" style={{ left: '3%' }} title="Умеренный">
                                🟡
                            </div>
                            <div className="risk-marker" style={{ left: '5%' }} title="Агрессивный">
                                🟠
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Подсказки по риск-менеджменту */}
            <div className="risk-tips">
                <h4>💡 Советы по риск-менеджменту:</h4>
                <ul>
                    <li><strong>1-2%</strong> - Консервативный подход, подходит для начинающих</li>
                    <li><strong>2-3%</strong> - Умеренный риск, баланс между ростом и защитой</li>
                    <li><strong>3-5%</strong> - Агрессивный подход, для опытных трейдеров</li>
                    <li><strong>5%+</strong> - Высокий риск, используйте с осторожностью</li>
                </ul>
                <p className="risk-warning">
                    ⚠️ Никогда не рискуйте более 5% капитала на одну сделку!
                </p>
            </div>
        </fieldset>
    );
};

export default RiskManagementPanel;
