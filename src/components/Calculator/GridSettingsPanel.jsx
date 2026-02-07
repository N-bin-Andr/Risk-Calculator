
import React, { useCallback } from 'react';
import '../../styles/components/GridSettings.css';

const GridSettingsPanel = ({
    gridEnabled,
    gridOrdersCount,
    gridDistribution,
    isDirectionChosen,
    dispatch,
    isGridFieldEnabled,
    getGridFieldPlaceholder,
    calculateLastGridField
}) => {

    // Функция для обработки изменения распределения
    const handleDistributionChange = useCallback((index, value) => {
        dispatch({
            type: 'UPDATE_GRID_DISTRIBUTION',
            index,
            value: value
        });
    }, [dispatch]);

    // Функция для обработки блюра поля распределения
    const handleDistributionBlur = useCallback((index, value) => {
        if (value !== '') {
            const numValue = parseFloat(value);
            if (!isNaN(numValue)) {
                // Ограничиваем значение 0-100
                const clampedValue = Math.max(0, Math.min(100, numValue));
                dispatch({
                    type: 'UPDATE_GRID_DISTRIBUTION',
                    index,
                    value: clampedValue.toString()
                });
            }
        }
    }, [dispatch]);

    // Быстрые пресеты для распределения
    const handleQuickPreset = useCallback((presetType) => {
        switch (presetType) {
            case 'equal':
                const equalValue = (100 / gridOrdersCount).toFixed(1);
                const equalDistribution = Array(gridOrdersCount).fill(equalValue);
                dispatch({
                    type: 'SET_FIELD',
                    field: 'gridDistribution',
                    value: equalDistribution
                });
                break;

            case 'decreasing':
                const decreasingDistribution = [];
                let remaining = 100;
                for (let i = 0; i < gridOrdersCount - 1; i++) {
                    const value = Math.round((remaining * 0.6) / (gridOrdersCount - i));
                    decreasingDistribution.push(value.toString());
                    remaining -= value;
                }
                decreasingDistribution.push(remaining.toString());
                dispatch({
                    type: 'SET_FIELD',
                    field: 'gridDistribution',
                    value: decreasingDistribution
                });
                break;

            default:
                break;
        }
    }, [gridOrdersCount, dispatch]);

    if (!gridEnabled) {
        return null;
    }

    // Рассчитываем сумму распределения для отображения
    const distributionSum = gridDistribution.reduce((sum, p) => {
        const num = parseFloat(p);
        return sum + (isNaN(num) ? 0 : num);
    }, 0);

    return (
        <fieldset className="form-section grid-settings" style={{ marginTop: '15px' }}>
            <legend>⚙️ Настройки сетки</legend>

            {/* Подсказка для пользователя */}
            <div className="grid-hint">
                <strong>💡 Подсказка:</strong> Заполняйте поля по порядку. Последнее поле рассчитывается автоматически.
            </div>

            {/* Поле для количества ордеров */}
            <div className="inline-field">
                <label>Кол-во ордеров:</label>
                <input
                    type="number"
                    min="1"
                    max="10"
                    step="1"
                    value={gridOrdersCount}
                    onChange={e =>
                        dispatch({
                            type: 'SET_GRID_ORDERS_COUNT',
                            value: parseInt(e.target.value) || 3
                        })
                    }
                    disabled={!isDirectionChosen}
                />
                <span
                    className="grid-info-icon"
                    title="Рекомендуется 3-5 ордеров для оптимального усреднения"
                >
                    ⓘ
                </span>
            </div>

            {/* Поля распределения процентов */}
            {Array.from({ length: gridOrdersCount }).map((_, index) => {
                const isEnabled = isGridFieldEnabled(index);
                const isLast = index === gridOrdersCount - 1;

                return (
                    <div key={index} className="inline-field">
                        <label>
                            Ордер {index + 1} (%):
                            {!isLast && isEnabled && (
                                <span className="field-ready-indicator">
                                    ✓
                                </span>
                            )}
                        </label>
                        <input
                            type="text"
                            inputMode="decimal"
                            value={gridDistribution[index] || ''}
                            onChange={e => {
                                const inputValue = e.target.value;

                                // Разрешаем только числа, точку и пустую строку
                                if (inputValue === '' || /^[0-9]*\.?[0-9]*$/.test(inputValue)) {
                                    handleDistributionChange(index, inputValue);
                                }
                            }}
                            onBlur={e => handleDistributionBlur(index, e.target.value)}
                            disabled={!isEnabled}
                            placeholder={getGridFieldPlaceholder(index)}
                            className={
                                isLast && gridDistribution[index]
                                    ? 'auto-calculated-field'
                                    : ''
                            }
                            style={{
                                backgroundColor: isLast && gridDistribution[index]
                                    ? '#f0f8ff'
                                    : isEnabled ? 'white' : '#f5f5f5',
                                color: !isEnabled ? '#999' : '#000',
                                fontWeight: isLast && gridDistribution[index] ? 'bold' : 'normal'
                            }}
                            title={
                                isLast
                                    ? 'Автоматически рассчитывается как остаток до 100%'
                                    : isEnabled
                                        ? `Введите процент для ордера ${index + 1}`
                                        : 'Сначала заполните предыдущее поле'
                            }
                        />
                        {isLast && gridDistribution[index] && (
                            <span className="auto-calculated-indicator">
                                ⚡
                            </span>
                        )}
                    </div>
                );
            })}

            {/* Сумма распределения и прогресс-бар */}
            <div className="distribution-total">
                <strong>
                    Сумма: {distributionSum.toFixed(1)}%
                </strong>
                {gridDistribution[gridOrdersCount - 1] &&
                    typeof gridDistribution[gridOrdersCount - 1] === 'string' &&
                    gridDistribution[gridOrdersCount - 1].includes('Ошибка') && (
                        <span className="error-text"> (превышает 100%)</span>
                    )}

                {/* Индикатор прогресса */}
                <div className="distribution-progress">
                    <div
                        className="distribution-progress-bar"
                        style={{
                            width: `${Math.min(100, distributionSum)}%`
                        }}
                    />
                </div>
            </div>

            {/* Быстрые пресеты для распределения */}
            {gridOrdersCount > 1 && (
                <div className="quick-presets">
                    <div className="presets-label">
                        Быстрые настройки:
                    </div>
                    <div className="presets-buttons">
                        <button
                            type="button"
                            className="preset-button"
                            onClick={() => handleQuickPreset('equal')}
                        >
                            Равномерно
                        </button>
                        <button
                            type="button"
                            className="preset-button"
                            onClick={() => handleQuickPreset('decreasing')}
                        >
                            Убывающее
                        </button>
                    </div>
                </div>
            )}
        </fieldset>
    );
};

export default GridSettingsPanel;
