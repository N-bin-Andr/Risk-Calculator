// src/components/Calculator/TakeProfitManager.jsx
import React from 'react';
import '../../styles/components/TakeProfitManager.css';

const TakeProfitManager = ({
    tpLevels,
    tpError,
    isDirectionChosen,
    dispatch,
    tooltipText
}) => {

    // Обработчик изменения цены TP
    const handlePriceChange = (index, value) => {
        dispatch({
            type: 'UPDATE_TP_LEVEL',
            index,
            field: 'price',
            value: value
        });
    };

    // Обработчик изменения процента TP
    const handlePercentChange = (index, value) => {
        dispatch({
            type: 'UPDATE_TP_LEVEL',
            index,
            field: 'percent',
            value: value
        });
    };

    // Обработчик добавления нового TP уровня
    const handleAddTPLevel = () => {
        dispatch({ type: 'ADD_TP_LEVEL' });
    };

    // Обработчик удаления TP уровня
    const handleRemoveTPLevel = (index) => {
        dispatch({ type: 'REMOVE_TP_LEVEL', index });
    };

    // Рассчитываем сумму процентов
    const totalPercent = tpLevels.reduce((acc, tp) => {
        const percent = parseFloat(tp.percent);
        return acc + (isNaN(percent) ? 0 : percent);
    }, 0);

    // Проверяем можно ли добавить еще TP уровень
    const canAddMoreTP = tpLevels.length < 5;

    return (
        <fieldset className="form-section take-profit-section">
            <legend>🎯 Уровни Take Profit</legend>

            {/* Информация о TP уровнях */}
            <div className="tp-info">
                <p>
                    <strong>Уровней:</strong> {tpLevels.length} из 5 |
                    <strong> Сумма %:</strong> {totalPercent.toFixed(1)}%
                </p>
                {totalPercent > 100 && (
                    <p className="tp-warning">
                        ⚠️ Сумма процентов превышает 100%
                    </p>
                )}
            </div>

            {/* Список TP уровней */}
            <div className="tp-levels-list">
                {tpLevels.map((tp, index) => (
                    <div
                        key={index}
                        className={`tp-level-item ${tpError ? 'has-error' : ''}`}
                        title={!isDirectionChosen ? tooltipText : ''}
                    >
                        <div className="tp-level-header">
                            <span className="tp-level-number">TP {index + 1}</span>
                            {index > 0 && (
                                <button
                                    type="button"
                                    className="tp-remove-btn"
                                    onClick={() => handleRemoveTPLevel(index)}
                                    disabled={tpLevels.length === 1}
                                    title="Удалить уровень"
                                >
                                    🗑️
                                </button>
                            )}
                        </div>

                        <div className="tp-inputs">
                            <div className="tp-input-group">
                                <label htmlFor={`tp-price-${index}`}>Цена:</label>
                                <input
                                    id={`tp-price-${index}`}
                                    type="number"
                                    step="0.0001"
                                    min="0"
                                    value={tp.price}
                                    className={tpError ? 'input-error' : ''}
                                    onChange={(e) => handlePriceChange(index, e.target.value)}
                                    placeholder="Цена"
                                    disabled={!isDirectionChosen}
                                />
                            </div>

                            <div className="tp-input-group">
                                <label htmlFor={`tp-percent-${index}`}>% объема:</label>
                                <div className="percent-input-container">
                                    <input
                                        id={`tp-percent-${index}`}
                                        type="number"
                                        step="1"
                                        min="0"
                                        max="100"
                                        value={tp.percent}
                                        className={tpError ? 'input-error' : ''}
                                        onChange={(e) => handlePercentChange(index, e.target.value)}
                                        placeholder="%"
                                        disabled={!isDirectionChosen}
                                    />
                                    <span className="percent-symbol">%</span>
                                </div>
                            </div>
                        </div>

                        {/* Визуализация процента */}
                        <div className="tp-percent-visualization">
                            <div
                                className="tp-percent-bar"
                                style={{
                                    width: `${Math.min(100, parseFloat(tp.percent) || 0)}%`,
                                    backgroundColor: index === 0 ? '#28a745' :
                                                   index === 1 ? '#007bff' :
                                                   index === 2 ? '#ffc107' :
                                                   index === 3 ? '#6c757d' :
                                                   '#dc3545'
                                }}
                            />
                            <span className="tp-percent-value">
                                {tp.percent || 0}%
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Кнопка добавления TP */}
            <div className="tp-actions">
                <button
                    type="button"
                    className="tp-add-btn"
                    onClick={handleAddTPLevel}
                    disabled={!isDirectionChosen || !canAddMoreTP}
                    title={!canAddMoreTP ? "Максимум 5 уровней TP" : "Добавить уровень Take Profit"}
                >
                    ➕ Добавить TP уровень {!canAddMoreTP && "(макс. 5)"}
                </button>
            </div>

            {/* Отображение ошибок */}
            {tpError && (
                <div className="tp-errors">
                    <div className="tp-error-icon">⚠️</div>
                    <div className="tp-error-messages">
                        {tpError.split('\n').map((error, idx) => (
                            <p key={idx} className="tp-error-text">{error}</p>
                        ))}
                    </div>
                </div>
            )}

            {/* Подсказка по использованию */}
            <div className="tp-hint">
                <p><strong>💡 Подсказка:</strong></p>
                <ul>
                    <li>Распределите % объема между уровнями TP</li>
                    <li>Сумма процентов не должна превышать 100%</li>
                    <li>Для Long позиций цены TP должны быть выше цены входа</li>
                    <li>Для Short позиций цены TP должны быть ниже цены входа</li>
                </ul>
            </div>
        </fieldset>
    );
};

export default TakeProfitManager;
