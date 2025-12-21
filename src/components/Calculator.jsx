import React, { useState, useRef, useReducer, useEffect, useCallback } from 'react';
import { sendReportToNotion } from '../services/notionService';
import '../styles/styles.css';
import html2canvas from 'html2canvas';
import { useInstrumentHistory } from '../hooks/useInstrumentHistory';
import { calculatorReducer, initialState } from '../reducers/calculatorReducer';
import { validateFields } from '../utils/validateCalculator';
import { calculateReport, getDirectionLabel } from '../utils/calculateReport';
import InstrumentSettingsDialog from './InstrumentSettingsDialog';

const Calculator = () => {
    // Восстановление состояния из localStorage
    const [savedState, setSavedState] = useState(() => {
        try {
            const raw = localStorage.getItem('calculatorState');
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            console.error('Ошибка загрузки состояния из localStorage:', e);
            return null;
        }
    });

    // Инициализация редьюсера
    const [state, dispatch] = useReducer(
        calculatorReducer,
        { ...initialState, ...(savedState || {}) }
    );

    // Хук истории инструментов
    const {
        getSuggestions,
        addInstrument,
        getInstrument,
        updateInstrumentPriceStep,
        getDefaultPriceStep
    } = useInstrumentHistory();

    // Локальные состояния
    const [deposit, setDeposit] = useState(() => localStorage.getItem('lastDeposit') || '');
    const [riskSize, setRiskSize] = useState(() => localStorage.getItem('lastRiskSize') || '');
    const [status, setStatus] = useState(() => localStorage.getItem('lastStatus') || 'Запланирован');
    const [instrumentSuggestions, setInstrumentSuggestions] = useState([]);
    const [showReport, setShowReport] = useState(false);
    const [reportData, setReportData] = useState(null);
    const [showSettingsDialog, setShowSettingsDialog] = useState(false);
    const [selectedInstrument, setSelectedInstrument] = useState('');
    const [currentPriceStep, setCurrentPriceStep] = useState(null);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestionIndex, setSuggestionIndex] = useState(-1);

    // Refs
    const reportRef = useRef();
    const instrumentInputRef = useRef();

    // Вспомогательные переменные
    const isDirectionChosen = state.direction === 'long' || state.direction === 'short';
    const tooltipText = 'Сначала выберите направление сделки';

    // Функция для расчета последнего поля распределения сетки
    const calculateLastGridField = useCallback((distribution) => {
        if (!distribution || distribution.length === 0) return distribution;

        const lastIndex = distribution.length - 1;
        const filledValues = distribution.slice(0, lastIndex).map(val => {
            const num = parseFloat(val);
            return isNaN(num) ? 0 : num;
        });

        const sumFilled = filledValues.reduce((acc, val) => acc + val, 0);
        const lastValue = Math.max(0, 100 - sumFilled);

        const newDistribution = [...distribution];
        newDistribution[lastIndex] = lastValue.toFixed(1);
        return newDistribution;
    }, []);

    // Функция для определения доступности поля распределения
    const isGridFieldEnabled = useCallback((index) => {
        if (!state.gridEnabled || !state.gridDistribution || !isDirectionChosen) {
            return false;
        }

        // Первое поле всегда доступно (если выбрано направление)
        if (index === 0) return true;

        // Последнее поле всегда заблокировано (рассчитывается автоматически)
        if (index === state.gridOrdersCount - 1) return false;

        // Проверяем, заполнены ли все предыдущие поля
        for (let i = 0; i < index; i++) {
            const val = state.gridDistribution[i];
            if (val === '' || val === undefined || val === null) {
                return false;
            }
            const numVal = parseFloat(val);
            if (isNaN(numVal) || numVal <= 0) {
                return false;
            }
        }

        return true;
    }, [state.gridEnabled, state.gridDistribution, state.gridOrdersCount, isDirectionChosen]);

    // Функция для получения текста плейсхолдера
    const getGridFieldPlaceholder = useCallback((index) => {
        if (index === state.gridOrdersCount - 1) {
            return "Рассчитается автоматически";
        }
        if (index === 0) {
            return "Введите % (напр. 60)";
        }
        return "Заполните предыдущее поле";
    }, [state.gridOrdersCount]);

    // Обновление подсказок инструментов
    useEffect(() => {
        if (state.instrument.trim() === '') {
            setInstrumentSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        const suggestions = getSuggestions(state.instrument);
        setInstrumentSuggestions(suggestions);

        if (suggestions.length > 0 && state.instrument.length >= 2) {
            setShowSuggestions(true);
        } else {
            setShowSuggestions(false);
        }
    }, [state.instrument, getSuggestions]);

    // Обработчик выбора инструмента из подсказок
    const handleInstrumentSelect = (instrument) => {
        dispatch({ type: 'SET_FIELD', field: 'instrument', value: instrument.name });

        // Получаем информацию об инструменте
        const instrumentData = getInstrument(instrument.name);
        if (instrumentData && instrumentData.priceStep !== null && instrumentData.priceStep !== undefined) {
            setCurrentPriceStep(instrumentData.priceStep);
        } else {
            setCurrentPriceStep(null);
        }

        setShowSuggestions(false);
        setSuggestionIndex(-1);
    };

    // Обработчик нажатия клавиш в поле инструмента
    const handleInstrumentKeyDown = (e) => {
        if (!showSuggestions || instrumentSuggestions.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSuggestionIndex(prev =>
                    prev < instrumentSuggestions.length - 1 ? prev + 1 : 0
                );
                break;

            case 'ArrowUp':
                e.preventDefault();
                setSuggestionIndex(prev =>
                    prev > 0 ? prev - 1 : instrumentSuggestions.length - 1
                );
                break;

            case 'Enter':
                e.preventDefault();
                if (suggestionIndex >= 0 && suggestionIndex < instrumentSuggestions.length) {
                    handleInstrumentSelect(instrumentSuggestions[suggestionIndex]);
                }
                break;

            case 'Escape':
                setShowSuggestions(false);
                setSuggestionIndex(-1);
                break;
        }
    };

    // Обработчик изменения инструмента
    const handleInstrumentChange = (e) => {
        const value = e.target.value;
        dispatch({ type: 'SET_FIELD', field: 'instrument', value: value });

        if (value.trim() === '') {
            setCurrentPriceStep(null);
        }
    };

    // Обработчик потери фокуса с поля инструмента
    const handleInstrumentBlur = () => {
        setTimeout(() => {
            setShowSuggestions(false);
            setSuggestionIndex(-1);
        }, 200);

        // Если инструмент не пустой и не выбран из списка, проверяем наличие
        if (state.instrument.trim() !== '') {
            const instrumentData = getInstrument(state.instrument);
            if (!instrumentData) {
                // Новый инструмент - показываем диалог настроек
                setSelectedInstrument(state.instrument);
                setCurrentPriceStep(null);
                setShowSettingsDialog(true);
            } else if (instrumentData.priceStep === null || instrumentData.priceStep === undefined) {
                // Инструмент есть, но нет шага цены - предлагаем настроить
                setSelectedInstrument(state.instrument);
                setCurrentPriceStep(null);
                setShowSettingsDialog(true);
            } else {
                setCurrentPriceStep(instrumentData.priceStep);
            }
        }
    };

    // Обработчик клика по кнопке настроек инструмента
    const handleInstrumentSettingsClick = () => {
        if (state.instrument.trim() === '') {
            alert('Сначала введите инструмент');
            return;
        }

        setSelectedInstrument(state.instrument);

        const instrumentData = getInstrument(state.instrument);
        if (instrumentData && instrumentData.priceStep !== null && instrumentData.priceStep !== undefined) {
            setCurrentPriceStep(instrumentData.priceStep);
        } else {
            setCurrentPriceStep(null);
        }

        setShowSettingsDialog(true);
    };

    // Обработчик сохранения настроек инструмента
    const handleSaveInstrumentSettings = (instrumentName, priceStep) => {
        // Добавляем или обновляем инструмент
        const result = addInstrument(instrumentName, priceStep);

        if (result === 'added' || result === 'updated') {
            // Если это текущий выбранный инструмент, обновляем текущий шаг
            if (instrumentName === state.instrument) {
                setCurrentPriceStep(priceStep);
            }

            // Обновляем подсказки
            const suggestions = getSuggestions(state.instrument);
            setInstrumentSuggestions(suggestions);
        }

        setShowSettingsDialog(false);
    };

    // Обработчик отмены настроек инструмента
    const handleCancelInstrumentSettings = () => {
        setShowSettingsDialog(false);
    };

    // Валидация SL и TP
    useEffect(() => {
        const EP = parseFloat(state.entryPrice);
        const SL = parseFloat(state.slPrice);
        const direction = state.direction;

        // SL проверка
        if (!isNaN(SL) && !isNaN(EP) && direction) {
            if (SL === EP) {
                dispatch({ type: 'SET_FIELD', field: 'slError', value: 'SL не должен совпадать с ценой входа' });
            } else if (direction === 'long' && SL > EP) {
                dispatch({ type: 'SET_FIELD', field: 'slError', value: 'SL должен быть ниже цены входа при Long позиции' });
            } else if (direction === 'short' && SL < EP) {
                dispatch({ type: 'SET_FIELD', field: 'slError', value: 'SL должен быть выше цены входа при Short позиции' });
            } else {
                dispatch({ type: 'SET_FIELD', field: 'slError', value: '' });
            }
        } else {
            dispatch({ type: 'SET_FIELD', field: 'slError', value: '' });
        }

        // TP проверка (множественные уровни)
        const tpErrors = [];

        state.tpLevels.forEach((tp, i) => {
            const price = parseFloat(tp.price);
            const percent = parseFloat(tp.percent);

            if (isNaN(price)) {
                tpErrors.push(`TP ${i + 1}: цена не указана`);
            } else if (price === EP) {
                tpErrors.push(`TP ${i + 1}: не должен совпадать с ценой входа`);
            } else if (direction === 'long' && price < EP) {
                tpErrors.push(`TP ${i + 1}: должен быть выше цены входа при Long позиции`);
            } else if (direction === 'short' && price > EP) {
                tpErrors.push(`TP ${i + 1}: должен быть ниже цены входа при Short позиции`);
            }

            if (isNaN(percent) || percent <= 0) {
                tpErrors.push(`TP ${i + 1}: процент должен быть > 0`);
            }
        });

        const totalPercent = state.tpLevels.reduce(
            (acc, tp) => acc + parseFloat(tp.percent || 0),
            0
        );
        if (totalPercent > 100) {
            tpErrors.push(`Сумма процентов TP превышает 100%`);
        }

        dispatch({
            type: 'SET_FIELD',
            field: 'tpError',
            value: tpErrors.join('\n')
        });
    }, [state.entryPrice, state.slPrice, state.direction, state.tpLevels]);

    // Инициализация из localStorage
    useEffect(() => {
        const savedDeposit = localStorage.getItem('savedDeposit');
        const savedRiskSize = localStorage.getItem('savedRiskSize');

        if (savedDeposit) setDeposit(savedDeposit);
        if (savedRiskSize) setRiskSize(savedRiskSize);

        // Сохраняем депозит и риск в глобальное состояние
        dispatch({ type: 'SET_FIELD', field: 'deposit', value: savedDeposit || '' });
        dispatch({ type: 'SET_FIELD', field: 'riskSize', value: savedRiskSize || '' });

        // Сохраняем статус в localStorage если еще нет
        if (!localStorage.getItem('lastStatus')) {
            localStorage.setItem('lastStatus', 'Запланирован');
        }
    }, []);

    // Сохранение в localStorage при изменении
    useEffect(() => {
        if (deposit) {
            localStorage.setItem('lastDeposit', deposit);
            localStorage.setItem('savedDeposit', deposit);
            dispatch({ type: 'SET_FIELD', field: 'deposit', value: deposit });
        }
    }, [deposit]);

    useEffect(() => {
        if (riskSize) {
            localStorage.setItem('lastRiskSize', riskSize);
            localStorage.setItem('savedRiskSize', riskSize);
            dispatch({ type: 'SET_FIELD', field: 'riskSize', value: riskSize });
        }
    }, [riskSize]);

    // Автоматический расчет последнего поля распределения при изменении распределения
    useEffect(() => {
        if (state.gridEnabled && state.gridDistribution && state.gridDistribution.length > 0) {
            const lastIndex = state.gridOrdersCount - 1;
            const lastValue = state.gridDistribution[lastIndex];

            // Если последнее поле не заполнено, рассчитываем его
            if (lastValue === '' || lastValue === undefined || lastValue === null) {
                const updatedDistribution = calculateLastGridField(state.gridDistribution);
                if (updatedDistribution[lastIndex] !== state.gridDistribution[lastIndex]) {
                    dispatch({
                        type: 'UPDATE_GRID_DISTRIBUTION',
                        index: lastIndex,
                        value: updatedDistribution[lastIndex],
                        fullDistribution: updatedDistribution
                    });
                }
            }
        }
    }, [state.gridEnabled, state.gridDistribution, state.gridOrdersCount, calculateLastGridField]);

    const calculate = async () => {
        const errors = validateFields(state);

        dispatch({ type: 'SET_FIELD', field: 'tpError', value: errors.tpError || '' });
        dispatch({ type: 'SET_FIELD', field: 'slError', value: errors.slError || '' });
        dispatch({ type: 'SET_FIELD', field: 'gridError', value: errors.gridError || '' });

        if (Object.keys(errors).length > 0) {
            alert('Пожалуйста, исправьте ошибки перед расчётом');
            return;
        }

        // Получаем шаг цены для инструмента
        let priceStepForCalculation = currentPriceStep;
        if (priceStepForCalculation === null || priceStepForCalculation === undefined) {
            // Если шаг цены не установлен, используем значение по умолчанию
            priceStepForCalculation = getDefaultPriceStep(state.instrument);
        }

        // Генерация reportId
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const reportId = `ORD${day}${month}${year}${hours}${minutes}F`;

        dispatch({ type: 'SET_FIELD', field: 'reportId', value: reportId });

        const date = new Date().toLocaleDateString();
        dispatch({ type: 'SET_FIELD', field: 'date', value: date });

        try {
            const report = calculateReport({
                ...state,
                deposit,
                riskSize,
                status,
                gridEnabled: state.gridEnabled,
                gridOrdersCount: state.gridOrdersCount,
                gridDistribution: state.gridDistribution.map(val => {
                    if (val === '' || val === undefined || val === null) return 0;
                    const num = parseFloat(val);
                    return isNaN(num) ? 0 : num;
                }),
                // Передаем шаг цены для расчета
                priceStep: priceStepForCalculation
            });

            setReportData(report);

            // Обновление состояния результатами расчета
            dispatch({ type: 'SET_FIELD', field: 'slPoints', value: report.slPoints });
            dispatch({ type: 'SET_FIELD', field: 'vCoins', value: report.vCoins });
            dispatch({ type: 'SET_FIELD', field: 'vValue', value: report.vValue });
            dispatch({ type: 'SET_FIELD', field: 'riskValue', value: report.riskValue });
            dispatch({ type: 'SET_FIELD', field: 'rrRatio', value: report.rrRatio });
            dispatch({ type: 'SET_FIELD', field: 'showReport', value: true });

            // Сохраняем результаты расчета сетки
            if (state.gridEnabled && report.gridReport) {
                dispatch({
                    type: 'SET_GRID_CALCULATION_RESULTS',
                    prices: report.gridReport.gridPrices,
                    quantities: report.gridReport.gridQuantities,
                    averagePrice: report.gridReport.gridAveragePrice,
                    totalQuantity: report.gridReport.gridTotalQuantity,
                    investment: report.gridReport.gridInvestment
                });
            } else {
                dispatch({ type: 'RESET_GRID_CALCULATION' });
            }

            // Добавляем инструмент в историю (если его нет)
            if (state.instrument && state.instrument.trim() !== '') {
                addInstrument(state.instrument, priceStepForCalculation);
            }

            // Отправка в Notion
            await sendReportToNotion(
                {
                    ...state,
                    deposit,
                    riskSize,
                    status,
                    reportId,
                    date,
                    priceStep: priceStepForCalculation,
                    // Добавляем результаты расчета для сетки
                    ...(state.gridEnabled && report.gridReport ? {
                        gridPrices: report.gridReport.gridPrices,
                        gridQuantities: report.gridReport.gridQuantities,
                        gridAveragePrice: report.gridReport.gridAveragePrice,
                        gridTotalQuantity: report.gridReport.gridTotalQuantity,
                        gridInvestment: report.gridReport.gridInvestment
                    } : {})
                },
                state.isBacktest,
                process.env.REACT_APP_NOTION_TOKEN,
                process.env.REACT_APP_NOTION_DATABASE_ID
            );

        } catch (error) {
            console.error('Ошибка расчета:', error);
            alert(`Ошибка: ${error.message}`);
        }
    };

    const exportToImage = () => {
        setShowReport(true);
        setTimeout(() => {
            const element = reportRef.current;
            if (element) {
                html2canvas(element, {
                    scale: 2,
                    backgroundColor: '#fdfdfd',
                    useCORS: true,
                    logging: false
                }).then(canvas => {
                    const link = document.createElement('a');
                    link.download = `order-report-${Date.now()}.jpg`;
                    link.href = canvas.toDataURL('image/jpeg', 0.9);
                    link.click();
                    setShowReport(false);
                }).catch(error => {
                    console.error('Ошибка при создании изображения:', error);
                    alert('Не удалось создать изображение отчета');
                    setShowReport(false);
                });
            } else {
                alert('Ошибка: отчёт не найден.');
                setShowReport(false);
            }
        }, 300);
    };

    const resetForm = () => {
        dispatch({ type: 'RESET_FORM' });
        setDeposit('');
        setRiskSize('');
        setStatus('Запланирован');
        setReportData(null);
        setShowReport(false);
        setCurrentPriceStep(null);
        setShowSuggestions(false);
        setSuggestionIndex(-1);

        // Очищаем localStorage для депозита и риска
        localStorage.removeItem('lastDeposit');
        localStorage.removeItem('lastRiskSize');
        localStorage.removeItem('lastStatus');
        localStorage.removeItem('savedDeposit');
        localStorage.removeItem('savedRiskSize');
    };

    if (!state) return <div>Загрузка калькулятора...</div>;

    return (
        <div className="calculator">
            <h2>Расчёт параметров ордера</h2>

            {/* Информация о текущем шаге цены */}
            {state.instrument && currentPriceStep !== null && (
                <div className="calculator-header-note">
                    <p>
                        📏 <strong>Шаг цены для {state.instrument}:</strong> {currentPriceStep} USDT
                        <button
                            className="btn-settings"
                            onClick={handleInstrumentSettingsClick}
                            style={{ marginLeft: '10px' }}
                        >
                            ⚙️ Изменить
                        </button>
                    </p>
                </div>
            )}

            {/* Ссылка на историю инструментов */}
            <div className="calculator-header-note">
                <p>
                    💡 <strong>Инструменты сохраняются автоматически.</strong>
                    Для просмотра и управления историей инструментов перейдите в раздел
                    <span
                        className="link-to-history"
                        onClick={() => window.location.hash = '#instruments'}
                        style={{ marginLeft: '5px' }}
                    >
                        📚 История инструментов
                    </span>
                </p>
            </div>

            <form onSubmit={(e) => e.preventDefault()}>
                <div className="inline-checkbox">
                    <input
                        type="checkbox"
                        id="isBacktest"
                        checked={state.isBacktest}
                        onChange={e =>
                            dispatch({ type: 'SET_FIELD', field: 'isBacktest', value: e.target.checked })
                        }
                    />
                    <label htmlFor="isBacktest">Это Backtest</label>
                </div>

                <div className="calculator-layout">
                    <div className="calculator-main-content">
                        {/* Блок 1: Направление и инструмент */}
                        <fieldset className="form-section">
                            <legend>📈 Параметры позиции</legend>
                            <select
                                value={state.direction}
                                onChange={e =>
                                    dispatch({ type: 'SET_FIELD', field: 'direction', value: e.target.value })
                                }
                            >
                                <option value="">Выберите направление</option>
                                <option value="long">Покупка (Long)</option>
                                <option value="short">Продажа (Short)</option>
                            </select>

                            <div className="inline-field autosuggest-container">
                                <label>Инструмент:</label>
                                <div style={{ position: 'relative', width: '160px' }}>
                                    <input
                                        ref={instrumentInputRef}
                                        type="text"
                                        value={state.instrument}
                                        onChange={handleInstrumentChange}
                                        onKeyDown={handleInstrumentKeyDown}
                                        onFocus={() => {
                                            if (state.instrument.length >= 2 && instrumentSuggestions.length > 0) {
                                                setShowSuggestions(true);
                                            }
                                        }}
                                        onBlur={handleInstrumentBlur}
                                        list="instrument-options"
                                        autoComplete="off"
                                        placeholder="Например: BTCUSDT"
                                        style={{ width: '100%' }}
                                    />
                                    {state.instrument.trim() !== '' && (
                                        <button
                                            type="button"
                                            className="btn-settings"
                                            onClick={handleInstrumentSettingsClick}
                                            style={{
                                                position: 'absolute',
                                                right: '5px',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                padding: '2px 6px',
                                                fontSize: '10px'
                                            }}
                                            title="Настроить шаг цены"
                                        >
                                            ⚙️
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Выпадающий список подсказок */}
                            {showSuggestions && instrumentSuggestions.length > 0 && (
                                <div className="suggestion-list">
                                    {instrumentSuggestions.map((suggestion, index) => (
                                        <div
                                            key={suggestion.name}
                                            className={`suggestion-item ${index === suggestionIndex ? 'selected' : ''}`}
                                            onClick={() => handleInstrumentSelect(suggestion)}
                                            onMouseEnter={() => setSuggestionIndex(index)}
                                        >
                                            <span className="suggestion-name">{suggestion.name}</span>
                                            <div className="suggestion-info">
                                                <span className="suggestion-count">{suggestion.count} раз</span>
                                                {suggestion.priceStep && (
                                                    <span className="suggestion-step">{suggestion.priceStep}</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <datalist id="instrument-options">
                                {instrumentSuggestions.map((item, index) => (
                                    <option key={index} value={item.name} />
                                ))}
                            </datalist>

                            <div className="inline-field">
                                <label>Депозит (USDT):</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={deposit}
                                    onChange={e => {
                                        const value = e.target.value;
                                        setDeposit(value);
                                    }}
                                    onBlur={() => {
                                        if (deposit) {
                                            localStorage.setItem('lastDeposit', deposit);
                                            localStorage.setItem('savedDeposit', deposit);
                                            dispatch({ type: 'SET_FIELD', field: 'deposit', value: deposit });
                                        }
                                    }}
                                    placeholder="1000"
                                />
                            </div>

                            <div title={!isDirectionChosen ? tooltipText : ''} className="inline-field">
                                <label>Цена входа:</label>
                                <input
                                    type="number"
                                    step="0.0001"
                                    min="0"
                                    value={state.entryPrice}
                                    onChange={e =>
                                        dispatch({ type: 'SET_FIELD', field: 'entryPrice', value: e.target.value })
                                    }
                                    disabled={!isDirectionChosen}
                                    placeholder="0.0000"
                                />
                            </div>
                            {isNaN(state.entryPrice) && <span className="error-text">Введите число</span>}

                            {/* === ПЕРЕКЛЮЧАТЕЛЬ СЕТОЧНОГО ВХОДА === */}
                            <div className="inline-checkbox" style={{ marginTop: '10px', marginBottom: '10px' }}>
                                <input
                                    type="checkbox"
                                    id="gridEnabled"
                                    checked={state.gridEnabled}
                                    onChange={() => dispatch({ type: 'TOGGLE_GRID' })}
                                    disabled={!isDirectionChosen}
                                />
                                <label htmlFor="gridEnabled" style={{
                                    fontWeight: 'bold',
                                    color: state.gridEnabled ? '#007bff' : '#333',
                                    opacity: !isDirectionChosen ? 0.5 : 1
                                }}>
                                    📊 Сеточный вход
                                </label>
                            </div>

                            {/* === НАСТРОЙКИ СЕТКИ === */}
                            {state.gridEnabled && (
                                <fieldset className="form-section grid-settings" style={{ marginTop: '15px' }}>
                                    <legend>⚙️ Настройки сетки</legend>
                                    <div className="inline-field">
                                        <label>Кол-во ордеров:</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="10"
                                            step="1"
                                            value={state.gridOrdersCount}
                                            onChange={e =>
                                                dispatch({
                                                    type: 'SET_GRID_ORDERS_COUNT',
                                                    value: parseInt(e.target.value) || 3
                                                })
                                            }
                                            disabled={!isDirectionChosen}
                                        />
                                    </div>

                                    {/* Поля распределения процентов */}
                                    {Array.from({ length: state.gridOrdersCount }).map((_, index) => (
                                        <div key={index} className="inline-field">
                                            <label>Ордер {index + 1} (%):</label>
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                value={state.gridDistribution[index] || ''}
                                                onChange={e => {
                                                    const inputValue = e.target.value;

                                                    // Разрешаем только числа, точку и пустую строку
                                                    if (inputValue === '' || /^\d*\.?\d*$/.test(inputValue)) {
                                                        dispatch({
                                                            type: 'UPDATE_GRID_DISTRIBUTION',
                                                            index,
                                                            value: inputValue
                                                        });
                                                    }
                                                }}
                                                onBlur={e => {
                                                    // При потере фокуса нормализуем значение
                                                    const inputValue = e.target.value;
                                                    if (inputValue !== '') {
                                                        const numValue = parseFloat(inputValue);
                                                        if (!isNaN(numValue)) {
                                                            dispatch({
                                                                type: 'UPDATE_GRID_DISTRIBUTION',
                                                                index,
                                                                value: numValue.toString()
                                                            });
                                                        }
                                                    }
                                                }}
                                                disabled={!isGridFieldEnabled(index)}
                                                placeholder={getGridFieldPlaceholder(index)}
                                                className={
                                                    index === state.gridOrdersCount - 1 && state.gridDistribution[index]
                                                        ? 'auto-calculated-field'
                                                        : ''
                                                }
                                                style={{
                                                    backgroundColor: index === state.gridOrdersCount - 1 && state.gridDistribution[index]
                                                        ? '#f0f8ff'
                                                        : 'white'
                                                }}
                                            />
                                        </div>
                                    ))}

                                    <div className="distribution-total">
                                        <strong>
                                            Сумма: {state.gridDistribution.reduce((sum, p) => {
                                                const num = parseFloat(p);
                                                return sum + (isNaN(num) ? 0 : num);
                                            }, 0).toFixed(1)}%
                                        </strong>
                                        {state.gridDistribution[state.gridOrdersCount - 1] &&
                                            typeof state.gridDistribution[state.gridOrdersCount - 1] === 'string' &&
                                            state.gridDistribution[state.gridOrdersCount - 1].includes('Ошибка') && (
                                                <span className="error-text"> (превышает 100%)</span>
                                            )}
                                    </div>
                                </fieldset>
                            )}

                            <fieldset className="form-section">
                                <legend>🎯 Уровни Take Profit</legend>
                                {Array.isArray(state.tpLevels) && state.tpLevels.map((tp, index) => (
                                    <div
                                        key={index}
                                        title={!isDirectionChosen ? tooltipText : ''}
                                        className="inline-field"
                                    >
                                        <label>TP {index + 1}:</label>
                                        <input
                                            type="number"
                                            step="0.0001"
                                            min="0"
                                            value={tp.price}
                                            className={state.tpError ? 'input-error' : ''}
                                            onChange={e =>
                                                dispatch({
                                                    type: 'UPDATE_TP_LEVEL',
                                                    index,
                                                    field: 'price',
                                                    value: e.target.value
                                                })
                                            }
                                            placeholder="Цена"
                                            disabled={!isDirectionChosen}
                                        />
                                        <input
                                            type="number"
                                            step="1"
                                            min="0"
                                            max="100"
                                            value={tp.percent}
                                            className={state.tpError ? 'input-error' : ''}
                                            onChange={e =>
                                                dispatch({
                                                    type: 'UPDATE_TP_LEVEL',
                                                    index,
                                                    field: 'percent',
                                                    value: e.target.value
                                                })
                                            }
                                            placeholder="% объёма"
                                            disabled={!isDirectionChosen}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => dispatch({ type: 'REMOVE_TP_LEVEL', index })}
                                            disabled={state.tpLevels.length === 1}
                                            style={{ padding: '4px 8px', fontSize: '12px' }}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => dispatch({ type: 'ADD_TP_LEVEL' })}
                                    disabled={!isDirectionChosen || state.tpLevels.length >= 5}
                                    style={{ marginTop: '10px' }}
                                >
                                    ➕ Добавить TP (макс. 5)
                                </button>
                                {state.tpError && <span className="error-text">{state.tpError}</span>}
                            </fieldset>

                            <div title={!isDirectionChosen ? tooltipText : ''} className="inline-field">
                                <label>Статус сделки: </label>
                                <select
                                    value={status}
                                    onChange={e => {
                                        const value = e.target.value;
                                        setStatus(value);
                                        localStorage.setItem('lastStatus', value);
                                    }}
                                    disabled={!isDirectionChosen}
                                >
                                    <option value="Запланирован">Запланирован</option>
                                    <option value="Открыт">Открыт</option>
                                    <option value="Отменён">Отменён</option>
                                </select>
                            </div>
                        </fieldset>

                        <fieldset className="form-section">
                            <legend>🛡️ Риск-менеджмент</legend>
                            <div title={!isDirectionChosen ? tooltipText : ''} className="inline-field">
                                <label>Stop Loss (USDT):</label>
                                <input
                                    type="number"
                                    step="0.0001"
                                    min="0"
                                    value={state.slPrice}
                                    className={state.slError ? 'input-error' : ''}
                                    onChange={e => {
                                        const value = e.target.value;
                                        dispatch({ type: 'SET_FIELD', field: 'slPrice', value: value });

                                        const SL = parseFloat(value);
                                        const EP = parseFloat(state.entryPrice);

                                        if (!value || isNaN(SL) || isNaN(EP)) {
                                            dispatch({ type: 'SET_FIELD', field: 'slError', value: '' });
                                            return;
                                        }

                                        if (SL === EP) {
                                            dispatch({ type: 'SET_FIELD', field: 'slError', value: 'SL не должен совпадать с ценой входа' });
                                        } else if (state.direction === 'long' && SL > EP) {
                                            dispatch({ type: 'SET_FIELD', field: 'slError', value: 'SL должен быть ниже цены входа при Long позиции' });
                                        } else if (state.direction === 'short' && SL < EP) {
                                            dispatch({ type: 'SET_FIELD', field: 'slError', value: 'SL должен быть выше цены входа при Short позиции' });
                                        } else {
                                            dispatch({ type: 'SET_FIELD', field: 'slError', value: '' });
                                        }
                                    }}
                                    disabled={!isDirectionChosen}
                                    placeholder="0.0000"
                                />
                            </div>
                            {state.slError && <span className="error-text">{state.slError}</span>}

                            <div className="inline-field">
                                <label>Риск на сделку (%):</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    value={riskSize}
                                    onChange={e => {
                                        const value = e.target.value;
                                        setRiskSize(value);
                                    }}
                                    onBlur={() => {
                                        if (riskSize) {
                                            localStorage.setItem('lastRiskSize', riskSize);
                                            localStorage.setItem('savedRiskSize', riskSize);
                                            dispatch({ type: 'SET_FIELD', field: 'riskSize', value: riskSize });
                                        }
                                    }}
                                    placeholder="2"
                                />
                            </div>
                        </fieldset>
                    </div>
                </div>

                {/* Комментарий трейдера */}
                <fieldset className="form-section">
                    <legend>📝 Комментарий трейдера</legend>
                    <textarea
                        value={state.traderNote}
                        onChange={e =>
                            dispatch({ type: 'SET_FIELD', field: 'traderNote', value: e.target.value })
                        }
                        className="trader-note"
                        rows={4}
                        disabled={!isDirectionChosen}
                        placeholder="Введите комментарий к сделке, анализ, причины входа и т.д."
                    />
                </fieldset>

                {/* Результаты расчета */}
                <fieldset className="report-section">
                    <legend>📊 Результаты расчёта</legend>
                    <div className="results">
                        {/* Информация о шаге цены в результатах */}
                        {state.instrument && (
                            <div className="price-step-info">
                                <p>
                                    <strong>Шаг цены для {state.instrument}:</strong>
                                    {currentPriceStep !== null ? ` ${currentPriceStep} USDT` : ' используется значение по умолчанию'}
                                </p>
                            </div>
                        )}

                        {/* РЕЖИМ ОДИН ОРДЕР */}
                        {!state.gridEnabled && (
                            <>
                                <p><strong>Размер позиции (в активе):</strong> {typeof state.vCoins === 'number' ? state.vCoins.toFixed(8) : '—'}</p>
                                <p><strong>Размер позиции (USDT):</strong> {typeof state.vValue === 'number' ? state.vValue.toFixed(2) : '—'}</p>
                                <p><strong>Риск в USDT:</strong> {typeof state.riskValue === 'number' ? state.riskValue.toFixed(2) : '—'}</p>
                                {state.rrRatio && <p><strong>Risk/Reward:</strong> {state.rrRatio}</p>}
                            </>
                        )}

                        {/* РЕЖИМ СЕТОЧНЫЙ ВХОД */}
                        {state.gridEnabled && state.gridPrices && state.gridPrices.length > 0 && (
                            <div className="grid-results">
                                <div className="grid-summary">
                                    <p><strong>Средняя цена входа:</strong> {state.gridAveragePrice.toFixed(4)} USDT</p>
                                    <p><strong>Общее количество:</strong> {state.gridTotalQuantity.toFixed(8)}</p>
                                    <p><strong>Общая инвестиция:</strong> {state.gridInvestment.toFixed(2)} USDT</p>
                                    <p><strong>Риск в USDT:</strong> {typeof state.riskValue === 'number' ? state.riskValue.toFixed(2) : '—'}</p>
                                </div>

                                <div className="grid-orders-table" style={{ marginTop: '15px' }}>
                                    <h4 style={{ marginBottom: '10px' }}>📊 Ордера сетки:</h4>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Цена (USDT)</th>
                                                <th>%</th>
                                                <th>Количество</th>
                                                <th>Сумма (USDT)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {state.gridPrices.map((price, index) => (
                                                <tr key={index}>
                                                    <td>{index + 1}</td>
                                                    <td>{price}</td>
                                                    <td>{state.gridDistribution[index] ? parseFloat(state.gridDistribution[index]).toFixed(1) + '%' : '—'}</td>
                                                    <td>{state.gridQuantities[index]?.toFixed(8)}</td>
                                                    <td>{state.gridQuantities[index] ? (state.gridQuantities[index] * price).toFixed(2) : '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Если сетка включена, но расчетов еще нет */}
                        {state.gridEnabled && (!state.gridPrices || state.gridPrices.length === 0) && (
                            <p style={{ fontStyle: 'italic', color: '#666' }}>
                                Нажмите "Рассчитать" для получения результатов сетки
                            </p>
                        )}
                    </div>
                </fieldset>

                {/* Кнопки действий */}
                <div className="button-group">
                    <button
                        type="button"
                        onClick={calculate}
                        disabled={!!state.slError || !!state.tpError || !!state.gridError || !isDirectionChosen}
                        style={{
                            backgroundColor: !isDirectionChosen ? '#ccc' : '#007bff',
                            flex: 1
                        }}
                    >
                        Рассчитать
                    </button>

                    <button
                        type="button"
                        onClick={exportToImage}
                        disabled={!state.showReport || !!state.slError || !!state.tpError || !!state.gridError}
                        style={{
                            backgroundColor: !state.showReport ? '#ccc' : '#28a745',
                            flex: 1
                        }}
                    >
                        📷 Экспорт в изображение
                    </button>

                    <button
                        type="button"
                        onClick={resetForm}
                        style={{
                            backgroundColor: '#dc3545',
                            flex: 1
                        }}
                    >
                        🗑️ Очистить форму
                    </button>
                </div>
            </form>

            {/* Вывод ошибок */}
            {(state.tpError || state.slError || state.gridError) && (
                <div className="form-errors">
                    <ul>
                        {state.tpError && <li><span className="error-icon">⚠️</span> {state.tpError}</li>}
                        {state.slError && <li><span className="error-icon">⚠️</span> {state.slError}</li>}
                        {state.gridError && <li><span className="error-icon">⚠️</span> {state.gridError}</li>}
                    </ul>
                </div>
            )}

            {/* Диалог настроек инструмента */}
            <InstrumentSettingsDialog
                isOpen={showSettingsDialog}
                onClose={() => setShowSettingsDialog(false)}
                instrumentName={selectedInstrument}
                currentPriceStep={currentPriceStep}
                onSave={handleSaveInstrumentSettings}
                onCancel={handleCancelInstrumentSettings}
            />

            {/* Отчет для экспорта */}
            {showReport && (
                <div ref={reportRef} className="report-container" style={{
                    position: 'absolute',
                    left: '-9999px',
                    top: '-9999px',
                    visibility: 'visible'
                }}>
                    <div className="report-content">
                        <h3 className="report-section-title">📝 Комментарий трейдера</h3>
                        <p className="report-comment">{state.traderNote || 'Рассматриваю сделку:'}</p>

                        <h3 className="report-section-title">
                            <i className="fas fa-wrench" style={{ marginRight: '8px' }}></i>
                            Инструмент
                        </h3>
                        <p><strong></strong> {state.instrument}</p>

                        {currentPriceStep !== null && (
                            <p><strong>Шаг цены:</strong> {currentPriceStep} USDT</p>
                        )}

                        <h3 className="report-section-title">📄 Ордер</h3>
                        <p><strong>ID:</strong> {state.reportId}</p>
                        <p><strong>Депозит на сделку:</strong> {deposit} USDT</p>
                        <p><strong>Направление сделки:</strong> {getDirectionLabel(state.direction)}</p>
                        <p><strong>Дата:</strong> {state.date}</p>

                        <h3 className="report-section-title">💰 Параметры позиции:</h3>

                        {/* РЕЖИМ ОДИН ОРДЕР */}
                        {!state.gridEnabled && (
                            <>
                                <p><strong>Ценовой уровень входа:</strong> {state.entryPrice} USDT</p>
                                <p><strong>Размер позиции (в активах):</strong> {typeof state.vCoins === 'number' ? state.vCoins.toFixed(8) : '—'}</p>
                                <p><strong>Размер позиции (в USDT):</strong> {typeof state.vValue === 'number' ? state.vValue.toFixed(2) : '—'}</p>
                            </>
                        )}

                        {/* РЕЖИМ СЕТОЧНЫЙ ВХОД */}
                        {state.gridEnabled && state.gridPrices && state.gridPrices.length > 0 && (
                            <>
                                <p><strong>Количество ордеров:</strong> {state.gridOrdersCount}</p>
                                <p><strong>Средняя цена входа:</strong> {state.gridAveragePrice.toFixed(4)} USDT</p>
                                <p><strong>Общее количество:</strong> {state.gridTotalQuantity.toFixed(8)}</p>
                                <p><strong>Общая инвестиция:</strong> {state.gridInvestment.toFixed(2)} USDT</p>

                                <h4 style={{ marginTop: '15px', marginBottom: '10px', color: '#2c5282' }}>📊 Ордера сетки:</h4>
                                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', fontSize: '14px' }}>
                                    <thead>
                                        <tr>
                                            <th style={{ border: '1px solid #ccc', padding: '5px', backgroundColor: '#e8f4ff' }}>#</th>
                                            <th style={{ border: '1px solid #ccc', padding: '5px', backgroundColor: '#e8f4ff' }}>Цена (USDT)</th>
                                            <th style={{ border: '1px solid #ccc', padding: '5px', backgroundColor: '#e8f4ff' }}>%</th>
                                            <th style={{ border: '1px solid #ccc', padding: '5px', backgroundColor: '#e8f4ff' }}>Кол-во</th>
                                            <th style={{ border: '1px solid #ccc', padding: '5px', backgroundColor: '#e8f4ff' }}>Сумма (USDT)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {state.gridPrices.map((price, index) => (
                                            <tr key={index}>
                                                <td style={{ border: '1px solid #ccc', padding: '5px' }}>{index + 1}</td>
                                                <td style={{ border: '1px solid #ccc', padding: '5px' }}>{price}</td>
                                                <td style={{ border: '1px solid #ccc', padding: '5px' }}>
                                                    {state.gridDistribution[index] ? parseFloat(state.gridDistribution[index]).toFixed(1) + '%' : '—'}
                                                </td>
                                                <td style={{ border: '1px solid #ccc', padding: '5px' }}>{state.gridQuantities[index]?.toFixed(8)}</td>
                                                <td style={{ border: '1px solid #ccc', padding: '5px' }}>
                                                    {state.gridQuantities[index] ? (state.gridQuantities[index] * price).toFixed(2) : '—'}
                                                </td>
                                            </tr>
                                        ))}
                                        {state.gridAveragePrice > 0 && (
                                            <tr style={{ backgroundColor: '#e8f4ff', fontWeight: 'bold' }}>
                                                <td colSpan="2" style={{ border: '1px solid #ccc', padding: '5px' }}><strong>Средняя цена:</strong></td>
                                                <td colSpan="3" style={{ border: '1px solid #ccc', padding: '5px' }}>
                                                    <strong>{state.gridAveragePrice.toFixed(4)} USDT</strong>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </>
                        )}

                        {/* Если сетка включена, но расчетов еще нет */}
                        {state.gridEnabled && (!state.gridPrices || state.gridPrices.length === 0) && (
                            <p><strong>Ценовой уровень входа:</strong> {state.entryPrice} USDT</p>
                        )}

                        {reportData?.tpDetails?.length > 0 && (
                            <>
                                <h3 className="report-section-title">🎯 Уровни Take Profit</h3>
                                <ul>
                                    {reportData.tpDetails.map((tp, i) => (
                                        <li key={i}>
                                            • {tp.price}$ — {tp.percent}% {tp.action} {tp.vc} R:R={tp.rrRatio}
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}

                        {typeof reportData?.totalProfit === 'number' && (
                            <p><strong>Ожидаемая прибыль:</strong> ${reportData.totalProfit.toFixed(2)}</p>
                        )}

                        {typeof reportData?.maxRR === 'number' && (
                            <p><strong>Максимальный R:R:</strong> {reportData.maxRR}</p>
                        )}

                        <h3 className="report-section-title">🛡️ Риск-менеджмент</h3>
                        <p><strong>Ценовой уровень SL:</strong> {state.slPrice} USDT</p>
                        <p><strong>Риск на сделку:</strong> {riskSize}%</p>
                        <p><strong>Риск в USDT:</strong> {state.riskValue}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Calculator;
