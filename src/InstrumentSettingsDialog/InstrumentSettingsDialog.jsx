import React, { useState, useEffect } from 'react';
import '../styles/styles.css';

const InstrumentSettingsDialog = ({
    isOpen,
    onClose,
    instrumentName,
    currentPriceStep,
    onSave,
    onCancel
}) => {
    const [priceStep, setPriceStep] = useState('');
    const [errors, setErrors] = useState({});

    // Инициализация при открытии
    useEffect(() => {
        if (isOpen) {
            setPriceStep(currentPriceStep !== null && currentPriceStep !== undefined ? currentPriceStep.toString() : '');
            setErrors({});
        }
    }, [isOpen, currentPriceStep]);

    if (!isOpen) return null;

    const validateForm = () => {
        const newErrors = {};

        if (priceStep !== '' && priceStep !== null) {
            const stepValue = parseFloat(priceStep);

            if (isNaN(stepValue)) {
                newErrors.priceStep = 'Введите число';
            } else if (stepValue <= 0) {
                newErrors.priceStep = 'Шаг цены должен быть больше 0';
            } else if (stepValue > 1000) {
                newErrors.priceStep = 'Шаг цены не может превышать 1000';
            }
        }

        return newErrors;
    };

    const handleSave = () => {
        const validationErrors = validateForm();

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        // Если поле пустое, сохраняем null (используется значение по умолчанию)
        const valueToSave = priceStep === '' || priceStep === null ? null : parseFloat(priceStep);

        onSave(instrumentName, valueToSave);
        onClose();
    };

    const handleCancel = () => {
        onCancel && onCancel();
        onClose();
    };

    const getDefaultStepSuggestion = () => {
        const lowerName = instrumentName.toLowerCase();

        if (lowerName.includes('btc') || lowerName.includes('eth') ||
            lowerName.includes('usdt') || lowerName.includes('bnb')) {
            return '0.01 (1 цент для крипто/USDT пар)';
        }

        if (lowerName.includes('.mx') || lowerName.includes('.me')) {
            return '0.01 (1 цент для акций)';
        }

        if (lowerName.includes('usd') || lowerName.includes('eur') ||
            lowerName.includes('gbp') || lowerName.includes('jpy')) {
            return '0.0001 (1 пипс для форекс)';
        }

        return '0.01 (по умолчанию)';
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>⚙️ Настройки инструмента</h3>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>

                <div className="modal-content">
                    <div className="instrument-info">
                        <h4>{instrumentName}</h4>
                        <p className="instrument-hint">
                            Настройте параметры для точного расчета пунктов (пипсов)
                        </p>
                    </div>

                    <div className="form-group">
                        <label htmlFor="priceStep">
                            <strong>Шаг цены (Tick Size):</strong>
                        </label>
                        <div className="input-with-suffix">
                            <input
                                id="priceStep"
                                type="number"
                                step="0.000001"
                                min="0.000001"
                                max="1000"
                                value={priceStep}
                                onChange={(e) => {
                                    setPriceStep(e.target.value);
                                    if (errors.priceStep) {
                                        setErrors({ ...errors, priceStep: '' });
                                    }
                                }}
                                placeholder="Авто (используется значение по умолчанию)"
                                className={errors.priceStep ? 'input-error' : ''}
                            />
                            <span className="input-suffix">USDT</span>
                        </div>

                        {errors.priceStep && (
                            <div className="error-message">{errors.priceStep}</div>
                        )}

                        <div className="field-hint">
                            <p>Рекомендуемое значение для {instrumentName}: {getDefaultStepSuggestion()}</p>
                            <p className="small-text">
                                Шаг цены влияет на расчет пунктов (пипсов) между ценой входа и SL.
                                Оставьте поле пустым для использования значения по умолчанию.
                            </p>
                        </div>
                    </div>

                    <div className="price-step-examples">
                        <h5>📋 Примеры шагов цены:</h5>
                        <ul>
                            <li>
                                <strong>Криптовалюты (BTCUSDT, ETHUSDT):</strong> 0.01 (1 цент)
                            </li>
                            <li>
                                <strong>Форекс (EURUSD, GBPUSD):</strong> 0.0001 (1 пипс)
                            </li>
                            <li>
                                <strong>Акции (AAPL.US, TSLA.US):</strong> 0.01 (1 цент)
                            </li>
                            <li>
                                <strong>Индексы (SPX, NASDAQ):</strong> 0.1 (10 центов)
                            </li>
                        </ul>
                    </div>

                    <div className="form-group">
                        <label>
                            <strong>Как это влияет на расчеты:</strong>
                        </label>
                        <div className="calculation-example">
                            <p>
                                Количество пунктов = |Цена входа - Stop Loss| / Шаг цены
                            </p>
                            <p className="example-text">
                                Пример: Вход = 100.00, SL = 99.00, Шаг = 0.01<br />
                                Пункты = |100.00 - 99.00| / 0.01 = 100 пунктов
                            </p>
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button
                        className="btn btn-secondary"
                        onClick={handleCancel}
                    >
                        Отмена
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleSave}
                    >
                        💾 Сохранить настройки
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InstrumentSettingsDialog;
