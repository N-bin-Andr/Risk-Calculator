import React, { useState, useRef } from 'react';
import { sendReportToNotion } from '../services/notionService';
import '../styles/styles.css';
import html2canvas from 'html2canvas';
import { useInstrumentHistory } from '../hooks/useInstrumentHistory';
import { useReducer, useEffect } from 'react';
import { calculatorReducer, initialState } from '../reducers/calculatorReducer';
import { validateFields } from '../utils/validateCalculator';
import { calculateReport, getDirectionLabel } from '../utils/calculateReport';

const Calculator = () => {
    let savedState;
    try {
        const raw = localStorage.getItem('calculatorState');
        savedState = raw ? JSON.parse(raw) : null;
    } catch (e) {
        savedState = null;
    }

    const [state, dispatch] = useReducer(
        calculatorReducer,
        { ...initialState, ...(savedState || {}) }
    );

    const {
        getSuggestions,
        addInstrument,
        history,
        deleteInstrument,
        exportHistoryAsJSON
    } = useInstrumentHistory();

    const [selectedInstruments, setSelectedInstruments] = useState([]);
    const [reportData, setReportData] = useState(null);

    const toggleInstrumentSelection = name => {
        setSelectedInstruments(prev =>
            prev.includes(name)
                ? prev.filter(item => item !== name)
                : [...prev, name]
        );
    };
    const toggleSelectAll = () => {
        if (selectedInstruments.length === history.length) {
            setSelectedInstruments([]);
        } else {
            setSelectedInstruments(history.map(item => item.name));
        }
    };

    const handleDeleteSelected = () => {
        selectedInstruments.forEach(name => deleteInstrument(name));
        setSelectedInstruments([]);
    };

    useEffect(() => {
        const EP = parseFloat(state.entryPrice);
        const SL = parseFloat(state.slPrice);
        const TP = parseFloat(state.takeProfitPrice);
        const direction = state.direction;

        const suggestions = getSuggestions(state.instrument);
        setInstrumentSuggestions(suggestions);

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
            } else if (direction === 'sell' && price > EP) {
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
    }, [state.entryPrice, state.slPrice, state.takeProfitPrice, state.direction, state.instrument,
        getSuggestions]);

    useEffect(() => {
        const savedDeposit = localStorage.getItem('savedDeposit');
        const savedRiskSize = localStorage.getItem('savedRiskSize');

        dispatch({ type: 'SET_FIELD', field: 'deposit', value: savedDeposit || '' });
        dispatch({ type: 'SET_FIELD', field: 'riskSize', value: savedRiskSize || '' });

        dispatch({ type: 'RESET_FIELDS_EXCEPT', fieldsToKeep: ['deposit', 'riskSize'] });
    }, []);

    useEffect(() => {
        localStorage.setItem('savedDeposit', state.deposit);
    }, [state.deposit]);

    useEffect(() => {
        localStorage.setItem('savedRiskSize', state.riskSize);
    }, [state.riskSize]);

    const isDirectionChosen = state.direction === 'long' || state.direction === 'short';
    const tooltipText = 'Сначала выберите направление сделки';
    const [deposit, setDeposit] = useState(() => { return localStorage.getItem('lastDeposit') || ''; });
    const [riskSize, setRiskSize] = useState(() => { return localStorage.getItem('lastRiskSize') || ''; });
    const [status, setStatus] = useState(() => { return localStorage.getItem('lastStatus') || 'Запланирован'; });
    const [instrumentSuggestions, setInstrumentSuggestions] = useState([]);

    const reportRef = useRef();
    const [showReport, setShowReport] = useState(false);

    const calculate = async () => {
        const errors = validateFields(state);

        dispatch({ type: 'SET_FIELD', field: 'tpError', value: errors.tpError || '' });
        dispatch({ type: 'SET_FIELD', field: 'slError', value: errors.slError || '' });
        dispatch({ type: 'SET_FIELD', field: 'gridError', value: errors.gridError || '' });

        if (Object.keys(errors).length > 0) {
            alert('Пожалуйста, исправьте ошибки перед расчётом');
            return;
        }

        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const reportId = `ORD${day}${month}${year}${hours}${minutes}F`;
        dispatch({ type: 'SET_FIELD', field: 'reportId', value: reportId });

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
                })
            });
            setReportData(report);

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

            addInstrument(state.instrument);
            await sendReportToNotion(
                { ...state, deposit, riskSize, status },
                false,
                process.env.REACT_APP_NOTION_TOKEN,
                process.env.REACT_APP_NOTION_DATABASE_ID
            );

        } catch (error) {
            alert(error.message);
        }
    };

    const resetForm = () => {
        dispatch({ type: 'RESET_FORM' });
    };

    const exportToImage = () => {
        setShowReport(true); // включаем отчёт
        setTimeout(() => {
            const element = reportRef.current;
            if (element) {
                html2canvas(element, { scale: 2 }).then(canvas => {
                    const link = document.createElement('a');
                    link.download = `order-report-${Date.now()}.jpg`;
                    link.href = canvas.toDataURL('image/jpeg', 0.9);
                    link.click();
                    setShowReport(false); // скрываем отчёт
                });
            } else {
                alert('Ошибка: отчёт не найден.');
                setShowReport(false);
            }
        }, 300); // даём время DOM отрисоваться
    };

    const handleChange = (field) => (e) => {
        dispatch({ type: 'SET_FIELD', field, value: e.target.value });
    };

    // Функция для определения доступности поля распределения
    const isGridFieldEnabled = (index) => {
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
    };

    // Функция для получения текста плейсхолдера
    const getGridFieldPlaceholder = (index) => {
        if (index === state.gridOrdersCount - 1) {
            return "Рассчитается автоматически";
        }
        if (index === 0) {
            return "Введите % (напр. 60)";
        }
        return "Заполните предыдущее поле";
    };

    if (!state) return null;

    return (
        <div className="calculator">
            <h2>Расчёт параметров ордера</h2>
            <form>
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

                <div className="layout-columns">
                    <div className="left-column">
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
                                <option value="long">Покупка</option>
                                <option value="short">Продажа</option>
                            </select>
                            <div className="inline-field">
                                <label>Инструмент:</label>
                                <input
                                    type="text"
                                    value={state.instrument}
                                    onChange={e =>
                                        dispatch({ type: 'SET_FIELD', field: 'instrument', value: e.target.value })
                                    }
                                    list="instrument-options"
                                    autoComplete="off"
                                />
                            </div>

                            <datalist id="instrument-options">
                                {instrumentSuggestions.map((item, index) => (
                                    <option key={index} value={item} />
                                ))}
                            </datalist>
                            <div className="inline-field">
                                <label>Депозит (USDT):</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={deposit}
                                    onChange={e => {
                                        const value = e.target.value;
                                        setDeposit(value);
                                        localStorage.setItem('lastDeposit', value);
                                        dispatch({ type: 'SET_FIELD', field: 'deposit', value: e.target.value })
                                    }}
                                />
                            </div>

                            <div title={!isDirectionChosen ? tooltipText : ''} className="inline-field">
                                <label>Цена входа:</label>
                                <input
                                    type="number"
                                    step="0.0001"
                                    value={state.entryPrice}
                                    onChange={e =>
                                        dispatch({ type: 'SET_FIELD', field: 'entryPrice', value: e.target.value })
                                    }
                                    disabled={!isDirectionChosen}
                                />
                            </div>
                            {isNaN(state.entryPrice) && <span className="error-text">Введите число</span>}

                            {/* === ПЕРЕКЛЮЧАТЕЛЬ СЕТОЧНОГО ВХОДА (под полем Цена входа) === */}
                            <div className="inline-checkbox" style={{ marginTop: '10px', marginBottom: '10px' }}>
                                <input
                                    type="checkbox"
                                    id="gridEnabled"
                                    checked={state.gridEnabled}
                                    onChange={() => dispatch({ type: 'TOGGLE_GRID' })}
                                />
                                <label htmlFor="gridEnabled" style={{ fontWeight: 'bold', color: state.gridEnabled ? '#007bff' : '#333' }}>
                                    📊 Сеточный вход
                                </label>
                            </div>

                            {/* === НАСТРОЙКИ СЕТКИ (отображаются только при включенной сетке) === */}
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

                                    {/* Поля распределения процентов с поэтапным заполнением */}
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
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => dispatch({ type: 'ADD_TP_LEVEL' })}
                                    disabled={!isDirectionChosen}
                                >
                                    ➕ Добавить TP
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
                                    <option value="Открыт">Открыт</option>
                                    <option value="Запланирован">Запланирован</option>
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
                                    value={state.slPrice}
                                    className={state.slError ? 'input-error' : ''}
                                    onChange={e => {
                                        const value = e.target.value;
                                        dispatch({ type: 'SET_FIELD', field: 'slPrice', value: e.target.value });

                                        const SL = parseFloat(value);
                                        const EP = parseFloat(state.entryPrice);

                                        if (!value || isNaN(SL) || isNaN(EP)) {
                                            dispatch({ type: 'SET_FIELD', field: 'state.slError', value: e.target.value });
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
                                />
                            </div>
                            {state.slError && <span className="error-text">{state.slError}</span>}

                            <div className="inline-field">
                                <label>Риск на сделку (%):</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={riskSize}
                                    onChange={e => {
                                        const value = e.target.value;
                                        setRiskSize(value);
                                        localStorage.setItem('lastRiskSize', value);
                                    }}
                                />
                            </div>
                        </fieldset>
                    </div>

                    <div className="instrument-history">
                        <fieldset className="form-section">
                            <legend>📚 История инструментов:</legend>
                            {history.length === 0 ? (
                                <p style={{ opacity: 0.6 }}>История пуста</p>
                            ) : (

                                <ul className="instrument-history-list">
                                    {history.map(({ name, count }) => (
                                        <li key={name}>

                                            <div className="inline-checkbox">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedInstruments.includes(name)}
                                                    onChange={() => toggleInstrumentSelection(name)}
                                                />
                                                <span>{name}</span>
                                                <span style={{ opacity: 0.6 }}>({count})</span>
                                                <label className="instrument-checkbox"></label>
                                            </div>
                                        </li>
                                    ))}
                                </ul>

                            )}
                        </fieldset>

                        <div className="select-all-row">
                            <label className="select-all-checkbox"></label>
                            <input
                                type="checkbox"
                                checked={selectedInstruments.length === history.length && history.length > 0}
                                onChange={toggleSelectAll}
                            />
                            <span>Выделить всё</span>
                        </div>

                        <div className="button-group">
                            <div className="instrument-history-actions">
                                <button onClick={handleDeleteSelected}>🗑️ Удалить</button>
                                <button onClick={exportHistoryAsJSON}>📤 в JSON</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Блок 4: Комментарий */}
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
                    />
                </fieldset>

                <fieldset className="report-section">
                    <legend>📊 Результаты расчёта</legend>
                    <div className="results">
                        {/* РЕЖИМ ОДИН ОРДЕР (gridEnabled = false) */}
                        {!state.gridEnabled && (
                            <>
                                <p>Размер позиции (в активе): {typeof state.vCoins === 'number' ? state.vCoins.toFixed(8) : '—'}</p>
                                <p>Размер позиции (USDT): {typeof state.vValue === 'number' ? state.vValue.toFixed(2) : '—'}</p>
                                <p>Риск в USDT: {typeof state.riskValue === 'number' ? state.riskValue.toFixed(2) : '—'}</p>
                                {state.rrRatio && <p>Risk/Reward: {state.rrRatio}</p>}
                            </>
                        )}

                        {/* РЕЖИМ СЕТОЧНЫЙ ВХОД (gridEnabled = true) */}
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

                {/* Кнопки */}
                <div className="button-group">
                    <button
                        type="button"
                        onClick={calculate}
                        disabled={!!state.slError || !!state.tpError || !!state.gridError}
                    >
                        Рассчитать
                    </button>

                    <button
                        type="button"
                        onClick={exportToImage}
                        disabled={!!state.slError || !!state.tpError || !!state.gridError}
                    >
                        Экспорт в изображение
                    </button>

                    <button
                        type="button"
                        onClick={() => dispatch({ type: 'RESET_FORM' })}>
                        Очистить
                    </button>
                </div>
            </form>

            {(state.tpError || state.slError || state.gridError) && (
                <div className="form-errors">
                    <ul>
                        {state.tpError && <li><span className="error-icon">⚠️</span> {state.tpError}</li>}
                        {state.slError && <li><span className="error-icon">⚠️</span> {state.slError}</li>}
                        {state.gridError && <li><span className="error-icon">⚠️</span> {state.gridError}</li>}
                    </ul>
                </div>
            )}

            {showReport && (
                <div ref={reportRef} className="report-container" style={{ visibility: 'visible' }}>
                    <div className="report-container">
                        <h3 className="report-section-title">📝 Комментарий трейдера</h3>
                        <p className="report-comment">{state.traderNote || 'Рассматриваю сделку:'}</p>
                        <h3 className="report-section-title">
                            <i className="fas fa-wrench" style={{ marginRight: '8px' }}></i>
                            Инструмент
                        </h3>
                        <p><strong></strong> {state.instrument}</p>
                        <h3 className="report-section-title">📄 Ордер</h3>
                        <p><strong>ID:</strong> {state.reportId}</p>
                        <p><strong>Депозит на сделку:</strong> {deposit} USDT</p>
                        <p><strong>Направление сделки:</strong> {getDirectionLabel(state.direction)}</p>
                        <p><strong>Дата:</strong> {state.date}</p>
                        <h3 className="report-section-title">💰 Параметры позиции:</h3>
                        <p><strong>Ценовой уровень входа:</strong> {state.entryPrice} USDT</p>
                        <p><strong>Размер позиции (в активах):</strong> {typeof state.vCoins === 'number' ? state.vCoins.toFixed(8) : '—'}</p>
                        <p><strong>Размер позиции (в USDT):</strong> {typeof state.vValue === 'number' ? state.vValue.toFixed(2) : '—'}</p>

                        {/* Отображение сетки в отчете */}
                        {state.gridEnabled && state.gridPrices && state.gridPrices.length > 0 && (
                            <>
                                <h3 className="report-section-title">📊 Сеточный вход</h3>
                                <p><strong>Количество ордеров:</strong> {state.gridOrdersCount}</p>
                                <p><strong>Средняя цена входа:</strong> {state.gridAveragePrice.toFixed(4)} USDT</p>
                                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                                    <thead>
                                        <tr>
                                            <th style={{ border: '1px solid #ccc', padding: '5px' }}>#</th>
                                            <th style={{ border: '1px solid #ccc', padding: '5px' }}>Цена</th>
                                            <th style={{ border: '1px solid #ccc', padding: '5px' }}>%</th>
                                            <th style={{ border: '1px solid #ccc', padding: '5px' }}>Кол-во</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {state.gridPrices.map((price, index) => (
                                            <tr key={index}>
                                                <td style={{ border: '1px solid #ccc', padding: '5px' }}>{index + 1}</td>
                                                <td style={{ border: '1px solid #ccc', padding: '5px' }}>{price} USDT</td>
                                                <td style={{ border: '1px solid #ccc', padding: '5px' }}>
                                                    {state.gridDistribution[index] ? parseFloat(state.gridDistribution[index]).toFixed(1) + '%' : '—'}
                                                </td>
                                                <td style={{ border: '1px solid #ccc', padding: '5px' }}>{state.gridQuantities[index]?.toFixed(8)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </>
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
                            <p><strong>Ожидаемая прибыль:</strong> ${reportData.totalProfit}</p>
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