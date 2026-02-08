

import React, { useState, useRef, useReducer, useEffect, useCallback } from 'react';
import { sendReportToNotion } from '../services/notionService';
import '../styles/styles.css';
import html2canvas from 'html2canvas';
import { useInstrumentHistory } from '../hooks/useInstrumentHistory';
import { calculatorReducer, initialState } from '../reducers/calculatorReducer';
import { validateFields } from '../utils/validateCalculator';
import { calculateReport, getDirectionLabel } from '../utils/calculateReport';
import InstrumentSettingsDialog from './InstrumentSettingsDialog';
import GridSettingsPanel from './Calculator/GridSettingsPanel';
import TakeProfitManager from './Calculator/TakeProfitManager';
import RiskManagementPanel from './Calculator/RiskManagementPanel';
import CalculationResults from './Calculator/CalculationResults';
import ExportActions from './Calculator/ExportActions';




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
    const [deposit, setDeposit] = useState(() => localStorage.getItem('savedDeposit') || '');
    const [riskSize, setRiskSize] = useState(() => localStorage.getItem('savedRiskSize') || '');
    const [status, setStatus] = useState(() => localStorage.getItem('lastStatus') || 'Запланирован');
    const [instrumentSuggestions, setInstrumentSuggestions] = useState([]);
    const [showReport, setShowReport] = useState(false);
    const [reportData, setReportData] = useState(null);
    const [showSettingsDialog, setShowSettingsDialog] = useState(false);
    const [selectedInstrument, setSelectedInstrument] = useState('');
    const [currentPriceStep, setCurrentPriceStep] = useState(null);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestionIndex, setSuggestionIndex] = useState(-1);
    const [isSendingToNotion, setIsSendingToNotion] = useState(false);
    const [notionStatus, setNotionStatus] = useState('');

    // Refs
    const reportRef = useRef();
    const instrumentInputRef = useRef();
    const suggestionRef = useRef();

    // Вспомогательные переменные
    const isDirectionChosen = state.direction === 'long' || state.direction === 'short';
    const tooltipText = 'Сначала выберите направление сделки';

    // Закрытие подсказок при клике вне поля
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (suggestionRef.current &&
                !suggestionRef.current.contains(event.target) &&
                instrumentInputRef.current &&
                !instrumentInputRef.current.contains(event.target)) {
                setShowSuggestions(false);
                setSuggestionIndex(-1);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Инициализация из localStorage
    useEffect(() => {
        const savedDeposit = localStorage.getItem('savedDeposit');
        const savedRiskSize = localStorage.getItem('savedRiskSize');
        const savedStatus = localStorage.getItem('lastStatus');

        if (savedDeposit) {
            setDeposit(savedDeposit);
            dispatch({ type: 'SET_FIELD', field: 'deposit', value: savedDeposit });
        }

        if (savedRiskSize) {
            setRiskSize(savedRiskSize);
            dispatch({ type: 'SET_FIELD', field: 'riskSize', value: savedRiskSize });
        }

        if (savedStatus) {
            setStatus(savedStatus);
        } else {
            localStorage.setItem('lastStatus', 'Запланирован');
        }
    }, []);

    // Сохранение депозита при изменении
    useEffect(() => {
        if (deposit !== '') {
            localStorage.setItem('lastDeposit', deposit);
            localStorage.setItem('savedDeposit', deposit);
            dispatch({ type: 'SET_FIELD', field: 'deposit', value: deposit });
        }
    }, [deposit]);

    // Сохранение риска при изменении
    useEffect(() => {
        if (riskSize !== '') {
            localStorage.setItem('lastRiskSize', riskSize);
            localStorage.setItem('savedRiskSize', riskSize);
            dispatch({ type: 'SET_FIELD', field: 'riskSize', value: riskSize });
        }
    }, [riskSize]);

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

        // Проверяем только предыдущее поле
        const prevVal = state.gridDistribution[index - 1];
        if (prevVal === '' || prevVal === undefined || prevVal === null) {
            return false;
        }

        const numVal = parseFloat(prevVal);
        return !isNaN(numVal) && numVal > 0;

    }, [state.gridEnabled, state.gridDistribution, state.gridOrdersCount, isDirectionChosen]);

    // Функция для получения текста плейсхолдера
    const getGridFieldPlaceholder = useCallback((index) => {
        if (index === state.gridOrdersCount - 1) {
            return "Рассчитается автоматически";
        }
        if (index === 0) {
            return "Введите % (напр. 60)";
        }

        // Проверяем, доступно ли поле для ввода
        if (isGridFieldEnabled(index)) {
            return "Введите %";
        } else {
            return "Заполните предыдущее поле";
        }
    }, [state.gridOrdersCount, isGridFieldEnabled]);

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

    // Обновление подсказок инструментов
    useEffect(() => {
        if (state.instrument.trim() === '') {
            setInstrumentSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        const suggestions = getSuggestions(state.instrument);
        setInstrumentSuggestions(suggestions);

        setShowSuggestions(false); // Всегда скрываем выпадающий список
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
        // УБИРАЕМ обработку клавиш для выпадающего списка, так как его больше нет
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

    // Основная функция расчета
    const calculate = async () => {
        setNotionStatus(''); // Сбрасываем статус Notion
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

            alert('✅ Расчет успешно выполнен! Теперь вы можете отправить отчет в Notion с помощью соответствующей кнопки.');

        } catch (error) {
            console.error('Ошибка расчета:', error);
            alert(`Ошибка: ${error.message}`);
        }
    };
    // Функция отправки отчета в Notion
    const sendToNotion = async () => {
        if (!reportData) {
            alert('Сначала выполните расчет с помощью кнопки "Рассчитать"');
            return;
        }

        // Проверяем наличие Notion конфигурации
        if (!process.env.REACT_APP_NOTION_TOKEN ||
            (!process.env.REACT_APP_NOTION_DATABASE_ID && !process.env.REACT_APP_NOTION_BACKTEST_DB)) {
            setNotionStatus('❌ Notion не настроен');
            alert('Notion не настроен. Пожалуйста, настройте переменные окружения REACT_APP_NOTION_TOKEN, REACT_APP_NOTION_DATABASE_ID и REACT_APP_NOTION_BACKTEST_DB');
            return;
        }

        setIsSendingToNotion(true);
        setNotionStatus('⏳ Подготовка данных...');

        try {
            // Подготавливаем данные для отправки
            const notionReportData = {
                ...reportData,
                instrument: state.instrument,
                direction: state.direction,
                traderNote: state.traderNote,
                status,
                reportId: state.reportId,
                date: state.date || new Date().toLocaleDateString('ru-RU'),
                deposit: parseFloat(deposit) || 0,
                riskSize: parseFloat(riskSize) || 0,
                priceStep: currentPriceStep
            };

            setNotionStatus('🔄 Определение базы данных...');

            // Определяем databaseId в зависимости от типа сделки
            let databaseId;
            if (state.isBacktest && process.env.REACT_APP_NOTION_BACKTEST_DB) {
                databaseId = process.env.REACT_APP_NOTION_BACKTEST_DB;
            } else if (!state.isBacktest && process.env.REACT_APP_NOTION_DATABASE_ID) {
                databaseId = process.env.REACT_APP_NOTION_DATABASE_ID;
            } else {
                databaseId = process.env.REACT_APP_NOTION_DATABASE_ID || process.env.REACT_APP_NOTION_BACKTEST_DB;
            }

            setNotionStatus('📤 Отправка в Notion...');

            const result = await sendReportToNotion(
                notionReportData,
                state.isBacktest,
                process.env.REACT_APP_NOTION_TOKEN,
                databaseId
            );

            if (result) {
                setNotionStatus('✅ Отправлено в Notion');
                // Не показываем alert при успешной отправке - статус уже виден
            } else {
                setNotionStatus('❌ Ошибка отправки');
                alert('❌ Произошла ошибка при отправке в Notion');
            }
        } catch (error) {
            console.error('Ошибка отправки в Notion:', error);

            // Более информативное сообщение об ошибке
            let errorMessage = 'Ошибка отправки в Notion';
            if (error.message.includes('unauthorized')) {
                errorMessage = 'Неверный токен доступа Notion. Проверьте REACT_APP_NOTION_TOKEN';
            } else if (error.message.includes('object_not_found')) {
                errorMessage = 'База данных Notion не найдена. Проверьте database_id';
            } else if (error.message.includes('validation_error')) {
                errorMessage = 'Ошибка валидации данных. Проверьте структуру базы данных';
            } else {
                errorMessage = `Ошибка Notion: ${error.message}`;
            }

            setNotionStatus(`❌ ${errorMessage}`);
            alert(`❌ ${errorMessage}`);
        } finally {
            setIsSendingToNotion(false);
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
        // НЕ сбрасываем депозит и риск
        setStatus('Запланирован');
        setReportData(null);
        setShowReport(false);
        setCurrentPriceStep(null);
        setShowSuggestions(false);
        setSuggestionIndex(-1);
        setNotionStatus('');
        setIsSendingToNotion(false);

        // Очищаем только статус, НЕ очищаем депозит и риск
        localStorage.removeItem('lastStatus');
    };


    // Обработка горячих клавиш
        useEffect(() => {
            const handleKeyDown = (e) => {
                // Ctrl+Enter - рассчитать
                if (e.ctrlKey && e.key === 'Enter') {
                    e.preventDefault();
                    calculate();
                }

                // Ctrl+E - экспорт в изображение
                if (e.ctrlKey && e.key === 'e') {
                    e.preventDefault();
                    if (reportData && !isSendingToNotion) {
                        exportToImage();
                    }
                }

                // Esc - закрыть подсказки
                if (e.key === 'Escape') {
                    setShowSuggestions(false);
                    setSuggestionIndex(-1);
                }
            };

            document.addEventListener('keydown', handleKeyDown);
            return () => {
                document.removeEventListener('keydown', handleKeyDown);
            };
        }, [calculate, exportToImage, reportData, isSendingToNotion]);

    if (!state) return <div>Загрузка калькулятора...</div>;

    return (
        <div className="calculator">
            <h2>Расчёт параметров ордера</h2>

            {/* Ссылка на историю инструментов */}
            <div className="calculator-header-note">
                <p>
                    💡 <strong>Инструменты сохраняются автоматически.</strong>
                    Для просмотра и управления истории инструментов перейдите в раздел
                    <span
                        className="link-to-history"
                        onClick={() => window.location.hash = '#instruments'}
                        style={{ marginLeft: '5px' }}
                    >
                        📚 История инструментов
                    </span>
                </p>
            </div>

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

            {/* НАЧАЛО формы */}
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

                            <div ref={suggestionRef} className="inline-field autosuggest-container">
                                <label>Инструмент:</label>
                                <div style={{ position: 'relative', width: '160px' }}>
                                    <input
                                        ref={instrumentInputRef}
                                        type="text"
                                        value={state.instrument}
                                        onChange={handleInstrumentChange}
                                        onKeyDown={handleInstrumentKeyDown}
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

                            <datalist id="instrument-options">
                                {instrumentSuggestions.map((item, index) => (
                                    <option key={index} value={item.name} />
                                ))}
                            </datalist>

                            <div className="inline-field">
                                <label>Депозит (USDT):</label>
                                <div style={{ position: 'relative', width: '160px' }}>
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
                                    {deposit && (
                                        <span
                                            style={{
                                                position: 'absolute',
                                                right: '8px',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                fontSize: '10px',
                                                color: '#28a745',
                                                backgroundColor: '#d4edda',
                                                padding: '1px 4px',
                                                borderRadius: '3px'
                                            }}
                                            title="Сохранено в браузере"
                                        >
                                            💾
                                        </span>
                                    )}
                                </div>
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
                            <GridSettingsPanel
                                gridEnabled={state.gridEnabled}
                                gridOrdersCount={state.gridOrdersCount}
                                gridDistribution={state.gridDistribution}
                                isDirectionChosen={isDirectionChosen}
                                dispatch={dispatch}
                                isGridFieldEnabled={isGridFieldEnabled}
                                getGridFieldPlaceholder={getGridFieldPlaceholder}
                                calculateLastGridField={calculateLastGridField}
                            />

                            {/* === УРОВНИ TAKE PROFIT === */}
                            <TakeProfitManager
                                tpLevels={state.tpLevels}
                                tpError={state.tpError}
                                isDirectionChosen={isDirectionChosen}
                                dispatch={dispatch}
                                tooltipText={tooltipText}
                            />

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

                        {/* === РИСК-МЕНЕДЖМЕНТ === */}
                        <RiskManagementPanel
                            deposit={deposit}
                            setDeposit={setDeposit}
                            riskSize={riskSize}
                            setRiskSize={setRiskSize}
                            slPrice={state.slPrice}
                            slError={state.slError}
                            isDirectionChosen={isDirectionChosen}
                            dispatch={dispatch}
                            entryPrice={state.entryPrice}
                            direction={state.direction}
                            tooltipText={tooltipText}
                        />
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

                {/* Результаты расчета*/}
                <CalculationResults
                    gridEnabled={state.gridEnabled}
                    gridPrices={state.gridPrices}
                    gridQuantities={state.gridQuantities}
                    gridDistribution={state.gridDistribution}
                    gridAveragePrice={state.gridAveragePrice}
                    gridTotalQuantity={state.gridTotalQuantity}
                    gridInvestment={state.gridInvestment}
                    vCoins={state.vCoins}
                    vValue={state.vValue}
                    riskValue={state.riskValue}
                    rrRatio={state.rrRatio}
                    instrument={state.instrument}
                    currentPriceStep={currentPriceStep}
                    notionStatus={notionStatus}
                    isSendingToNotion={isSendingToNotion}
                    status={status}
                />

                {/* Компонент кнопок экспорта и отправки */}
                <ExportActions
                    reportData={reportData}
                    isSendingToNotion={isSendingToNotion}
                    notionStatus={notionStatus}
                    slError={state.slError}
                    tpError={state.tpError}
                    gridError={state.gridError}
                    isDirectionChosen={isDirectionChosen}
                    onCalculate={calculate}
                    onSendToNotion={sendToNotion}
                    onExportToImage={exportToImage}
                    onResetForm={resetForm}
                />

                {/* Вывод ошибок - сделаем более информативным */}
                {(state.tpError || state.slError || state.gridError) && (
                    <div className="form-errors" style={{
                        animation: 'slideIn 0.3s ease-out',
                        maxHeight: '200px',
                        overflowY: 'auto'
                    }}>
                        <ul style={{ margin: 0, paddingLeft: '20px' }}>
                            {state.tpError && state.tpError.split('\n').map((error, index) => (
                                <li key={`tp-error-${index}`} style={{ marginBottom: '5px' }}>
                                    <span className="error-icon">⚠️</span> Take Profit: {error}
                                </li>
                            ))}
                            {state.slError && (
                                <li style={{ marginBottom: '5px' }}>
                                    <span className="error-icon">⚠️</span> Stop Loss: {state.slError}
                                </li>
                            )}
                            {state.gridError && state.gridError.split('\n').map((error, index) => (
                                <li key={`grid-error-${index}`} style={{ marginBottom: '5px' }}>
                                    <span className="error-icon">⚠️</span> Сетка: {error}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </form> {/* ЗАКРЫВАЕМ форму здесь */}

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
}; // ЗАКРЫВАЕМ компонент здесь

export default Calculator;
