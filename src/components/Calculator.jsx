import React, { useState, useRef } from 'react';
import { sendReportToNotion } from '../services/notionService';
import '../styles/styles.css';
import html2canvas from 'html2canvas';
import { calculateReport } from '../utils/calculateReport';
import { useInstrumentHistory } from '../hooks/useInstrumentHistory';
import { useReducer, useEffect } from 'react';
import { calculatorReducer, initialState } from '../reducers/calculatorReducer';
import { validateFields } from '../utils/validateCalculator';

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
            } else if (direction === 'buy' && SL > EP) {
                dispatch({ type: 'SET_FIELD', field: 'slError', value: 'SL должен быть ниже цены входа при покупке' });
            } else if (direction === 'sell' && SL < EP) {
                dispatch({ type: 'SET_FIELD', field: 'slError', value: 'SL должен быть выше цены входа при продаже' });
            } else {
                dispatch({ type: 'SET_FIELD', field: 'slError', value: '' });
            }
        } else {
            dispatch({ type: 'SET_FIELD', field: 'slError', value: '' });
        }

        // TP проверка
        if (!isNaN(TP) && !isNaN(EP) && direction) {
            if (TP === EP) {
                dispatch({ type: 'SET_FIELD', field: 'tpError', value: 'TP не должен совпадать с ценой входа' });
            } else if (direction === 'buy' && TP < EP) {
                dispatch({ type: 'SET_FIELD', field: 'tpError', value: 'TP должен быть выше цены входа при покупке' });
            } else if (direction === 'sell' && TP > EP) {
                dispatch({ type: 'SET_FIELD', field: 'tpError', value: 'TP должен быть ниже цены входа при продаже' });
            } else {
                dispatch({ type: 'SET_FIELD', field: 'tpError', value: '' });
            }
        } else {
            dispatch({ type: 'SET_FIELD', field: 'tpError', value: '' });
        }
    }, [state.entryPrice, state.slPrice, state.takeProfitPrice, state.direction]);

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




    const isDirectionChosen = state.direction === 'buy' || state.direction === 'sell';
    const tooltipText = 'Сначала выберите направление сделки';
    const [deposit, setDeposit] = useState(() => { return localStorage.getItem('lastDeposit') || ''; });
    const [riskSize, setRiskSize] = useState(() => { return localStorage.getItem('lastRiskSize') || ''; });
    const [status, setStatus] = useState(() => { return localStorage.getItem('lastStatus') || 'Запланирован'; });

    const { addInstrument, getSuggestions, deleteInstrument, history, exportHistoryAsJSON } = useInstrumentHistory();
    const [instrumentSuggestions, setInstrumentSuggestions] = useState([]);
    const reportRef = useRef();
    const [showReport, setShowReport] = useState(false);

    const calculate = async () => {
        const errors = validateFields(state);

        dispatch({ type: 'SET_FIELD', field: 'tpError', value: errors.tpError || '' });
        dispatch({ type: 'SET_FIELD', field: 'slError', value: errors.slError || '' });

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
            const reportData = calculateReport({ ...state, deposit, riskSize, status });
            dispatch({ type: 'SET_FIELD', field: 'slPoints', value: reportData.slPoints });
            dispatch({ type: 'SET_FIELD', field: 'vCoins', value: reportData.vCoins });
            dispatch({ type: 'SET_FIELD', field: 'vValue', value: reportData.vValue });
            dispatch({ type: 'SET_FIELD', field: 'riskValue', value: reportData.riskValue });
            dispatch({ type: 'SET_FIELD', field: 'rrRatio', value: reportData.rrRatio });
            dispatch({ type: 'SET_FIELD', field: 'showReport', value: true });
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
                    <label htmlFor="isBacktest">Это бэктест</label>
                </div>


                {/* Блок 1: Направление и инструмент */}
                <fieldset className="form-section">
                    <legend>💰 Параметры позиции:</legend>
                    <select
                        value={state.direction}
                        onChange={e =>
                            dispatch({ type: 'SET_FIELD', field: 'direction', value: e.target.value })
                        }
                    >
                        <option value="">Выберите направление</option>
                        <option value="buy">Покупка</option>
                        <option value="sell">Продажа</option>
                    </select>
                    <label>Инструмент:
                        <input
                            type="text"
                            value={state.instrument}
                            onChange={e =>
                                dispatch({ type: 'SET_FIELD', field: 'instrument', value: e.target.value })
                            }
                            list="instrument-options"
                            autoComplete="off"
                        />
                    </label>
                    <datalist id="instrument-options">
                        {instrumentSuggestions.map((item, index) => (
                            <option key={index} value={item} />
                        ))}
                    </datalist>
                    <datalist id="instrument-options">
                        {instrumentSuggestions.map((item, index) => (
                            <option key={index} value={item} />
                        ))}
                    </datalist>
                </fieldset>


                {/* Блок 2: Цены и статус */}
                <fieldset className="form-section">
                    <legend>📈 Параметры позиции</legend>
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
                            value={state.entryPrice}
                            onChange={e =>
                                dispatch({ type: 'SET_FIELD', field: 'entryPrice', value: e.target.value })
                            }
                            disabled={!isDirectionChosen}
                        />

                    </div>
                    {isNaN(state.entryPrice) && <span className="error-text">Введите число</span>}

                    <div title={!isDirectionChosen ? tooltipText : ''} className="inline-field">
                        <label>Take Profit (USDT):</label>
                        <input
                            type="number"
                            step="0.0001"
                            value={state.takeProfitPrice}
                            className={state.tpError ? 'input-error' : ''}
                            onChange={e => {
                                const value = e.target.value;
                                dispatch({ type: 'SET_FIELD', field: 'takeProfitPrice', value: e.target.value });

                                const TP = parseFloat(value);
                                const EP = parseFloat(state.entryPrice);

                                if (!value || isNaN(TP) || isNaN(EP)) {
                                    dispatch({ type: 'SET_FIELD', field: 'tpError', value: e.target.value });
                                    return;
                                }

                                if (!state.direction) {
                                    dispatch({ type: 'SET_FIELD', field: 'tpError', value: '' });
                                    return;
                                }
                                if (TP === EP) {
                                    dispatch({ type: 'SET_FIELD', field: 'tpError', value: 'TP не должен совпадать с ценой входа' });
                                } else if (state.direction === 'buy' && TP < EP) {
                                    dispatch({ type: 'SET_FIELD', field: 'tpError', value: 'TP должен быть выше цены входа при покупке' });
                                } else if (state.direction === 'sell' && TP > EP) {
                                    dispatch({ type: 'SET_FIELD', field: 'tpError', value: 'TP должен быть ниже цены входа при продаже' });
                                } else {
                                    dispatch({ type: 'SET_FIELD', field: 'tpError', value: '' });
                                }
                            }}
                            disabled={!isDirectionChosen}
                        />
                    </div>
                    {state.tpError && <span className="error-text">{state.tpError}</span>}

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
                                } else if (state.direction === 'buy' && SL > EP) {
                                    dispatch({ type: 'SET_FIELD', field: 'slError', value: 'SL должен быть ниже цены входа при покупке' });
                                } else if (state.direction === 'sell' && SL < EP) {
                                    dispatch({ type: 'SET_FIELD', field: 'slError', value: 'SL должен быть выше цены входа при продаже' });
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

                {/* Блок 4: Комментарий */}
                <fieldset className="form-section">
                    <legend>📝 Комментарий трейдера</legend>
                    <div title={!isDirectionChosen ? tooltipText : ''}>
                        <label>Комментарий трейдера:
                            <textarea
                                value={state.traderNote}
                                onChange={e =>
                                    dispatch({ type: 'SET_FIELD', field: 'traderNote', value: e.target.value })
                                }
                                disabled={!isDirectionChosen}
                                rows={4}
                                style={{ width: '100%', resize: 'vertical' }}
                            />
                        </label>
                    </div>
                </fieldset>


                <fieldset className="report-section">
                    <legend>📊 Результаты расчёта</legend>
                    <div className="results">
                        <p>Размер позиции (в активе): {typeof state.vCoins === 'number' ? state.vCoins.toFixed(2) : '—'}</p>
                        <p>Размер позиции (USDT): {typeof state.vValue === 'number' ? state.vValue.toFixed(2) : '—'}</p>
                        <p>Риск в USDT: {typeof state.riskValue === 'number' ? state.riskValue.toFixed(2) : '—'}</p>
                        {state.rrRatio && <p>Risk/Reward: {state.rrRatio}</p>}
                    </div>
                </fieldset>

                {/* Кнопки */}
                <div className="button-group">
                    <button
                        type="button"
                        onClick={calculate}
                        disabled={!!state.slError || !!state.tpError}
                    >
                        Рассчитать
                    </button>

                    <button
                        type="button"
                        onClick={exportToImage}
                        disabled={!!state.slError || !!state.tpError}
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

            {(state.tpError || state.slError) && (
                <div className="form-errors">
                    <ul>
                        {state.tpError && <li><span className="error-icon">⚠️</span> {state.tpError}</li>}
                        {state.slError && <li><span className="error-icon">⚠️</span> {state.slError}</li>}
                    </ul>
                </div>
            )}

            <div className="state.instrument-history">
                <h4>История инструментов:</h4>
                <ul>
                    {history.map(({ name, count }) => (
                        <li key={name}>
                            {name} <span style={{ opacity: 0.6 }}>({count})</span>
                            <button onClick={() => deleteInstrument(name)}>Удалить</button>
                        </li>
                    ))}
                </ul>
                <button onClick={exportHistoryAsJSON}>📤 Экспорт в JSON</button>
            </div>







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
                        <p><strong>Направление сделки:</strong> {state.direction === 'Buy' ? 'Buy' : 'Sell'}</p>
                        <p><strong>Дата:</strong> {state.date}</p>
                        <h3 className="report-section-title">💰 Параметры позиции:</h3>
                        <p><strong>Ценовой уровень входа:</strong> {state.entryPrice} USDT</p>
                        <p><strong>Размер позиции (в активах):</strong> {typeof state.vCoins === 'number' ? state.vCoins.toFixed(2) : '—'}</p>
                        <p><strong>Размер позиции (в USDT):</strong> {typeof state.vValue === 'number' ? state.vValue.toFixed(2) : '—'}</p>
                        <p><strong>Ценовой уровень TP:</strong> {state.takeProfitPrice || '—'} USDT</p>
                        <p><strong>Risk/Reward:</strong> {state.rrRatio || '—'}</p>
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
