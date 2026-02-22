// src/components/Calculator/Calculator.jsx
import React, { useState, useEffect, useReducer, useCallback } from 'react';
import InstrumentInput from './InstrumentInput';
import InstrumentTypeSelector from './InstrumentTypeSelector';
import GridSettingsPanel from './GridSettingsPanel';
import TakeProfitManager from './TakeProfitManager';
import RiskManagementPanel from './RiskManagementPanel';
import CalculationResults from './CalculationResults';
import ExportActions from './ExportActions';
import InstrumentSettingsDialog from '../InstrumentSettingsDialog/InstrumentSettingsDialog';
import { useInstrumentHistory } from '../../hooks';
import { calculatorReducer, initialState } from '../../reducers/calculatorReducer';
import { calculateInstrumentReport, getDefaultPriceStep } from '../../calculations';
import { validateFields } from '../../utils/validateCalculator';
import { sendReportToNotion } from '../../utils/notionService';
import { formatCurrency } from '../../utils/formatters';
import html2canvas from 'html2canvas';
import '../../styles/components/Calculator.css';

const Calculator = () => {
    const [state, dispatch] = useReducer(calculatorReducer, initialState);
    const [deposit, setDeposit] = useState(localStorage.getItem('lastDeposit') || '1000');
    const [riskSize, setRiskSize] = useState(localStorage.getItem('lastRiskSize') || '2');
    const [notionStatus, setNotionStatus] = useState('');
    const [isSendingToNotion, setIsSendingToNotion] = useState(false);
    const [instrumentSettingsOpen, setInstrumentSettingsOpen] = useState(false);
    const [selectedInstrumentForSettings, setSelectedInstrumentForSettings] = useState('');
    const [selectedInstrumentType, setSelectedInstrumentType] = useState(null);
    const [calculationResults, setCalculationResults] = useState(null);
    const [calculationError, setCalculationError] = useState('');

    const {
        history,
        addInstrument,
        getSuggestions,
        updateInstrumentPriceStep
    } = useInstrumentHistory();

    const {
        instrument,
        instrumentError,
        direction,
        isDirectionChosen,
        entryPrice,
        slPrice,
        slError,
        tpLevels,
        tpError,
        gridEnabled,
        gridOrdersCount,
        gridDistribution,
        gridError,
        gridPrices,
        gridQuantities,
        gridAveragePrice,
        gridTotalQuantity,
        gridInvestment,
        vCoins,
        vValue,
        riskValue,
        rrRatio,
        traderNote,
        status,
        isBacktest,
        showReport,
        currentPriceStep
    } = state;

    const tooltipText = "Сначала выберите направление сделки (Long/Short)";

    // Обработчик выбора типа инструмента
    const handleInstrumentTypeSelect = useCallback((typeId) => {
        setSelectedInstrumentType(typeId);

        // Автоматически устанавливаем шаг цены на основе типа
        if (typeId && INSTRUMENT_DETAILS[typeId]) {
            const priceStep = INSTRUMENT_DETAILS[typeId].priceStep;
            dispatch({ type: 'SET_FIELD', field: 'currentPriceStep', value: priceStep });

            // Если есть выбранный инструмент, обновляем его настройки
            if (instrument && updateInstrumentPriceStep) {
                updateInstrumentPriceStep(instrument, priceStep);
            }
        }
    }, [instrument, updateInstrumentPriceStep]);

    // Функция для получения подсказок инструментов
    const getInstrumentSuggestions = useCallback((input) => {
        return getSuggestions(input);
    }, [getSuggestions]);

    // Функция для открытия настроек инструмента
    const handleOpenInstrumentSettings = useCallback((instrumentName) => {
        setSelectedInstrumentForSettings(instrumentName);
        setInstrumentSettingsOpen(true);
    }, []);

    // Функция для закрытия настроек инструмента
    const handleCloseInstrumentSettings = useCallback(() => {
        setInstrumentSettingsOpen(false);
        setSelectedInstrumentForSettings('');
    }, []);

    // Функция для сохранения настроек инструмента
    const handleSaveInstrumentSettings = useCallback((instrumentName, priceStep) => {
        updateInstrumentPriceStep(instrumentName, priceStep);
        dispatch({ type: 'SET_FIELD', field: 'currentPriceStep', value: priceStep });
        handleCloseInstrumentSettings();
    }, [updateInstrumentPriceStep, handleCloseInstrumentSettings]);

    // Автоматическое определение типа инструмента при его изменении
    useEffect(() => {
        if (!instrument) {
            setSelectedInstrumentType(null);
            return;
        }

        const instrumentUpper = instrument.toUpperCase();
        let detectedType = null;

        // Определяем тип по паттернам (упрощенная версия)
        if (instrumentUpper.includes('/')) {
            // Валютные пары или металлы
            if (instrumentUpper.includes('XAU') || instrumentUpper.includes('XAG') ||
                instrumentUpper.includes('XPT') || instrumentUpper.includes('XPD')) {
                detectedType = 'metals';
            } else if (instrumentUpper.includes('USD') || instrumentUpper.includes('EUR') ||
                       instrumentUpper.includes('JPY') || instrumentUpper.includes('GBP')) {
                detectedType = instrumentUpper.includes('USD') ? 'forex_major' : 'forex_minor';
            }
        } else if (instrumentUpper.includes('USDT') || instrumentUpper.includes('BTC') ||
                   instrumentUpper.includes('ETH') || instrumentUpper.includes('BNB')) {
            // Криптовалюты
            detectedType = 'crypto_spot';
        } else if (instrumentUpper.length <= 5 && !instrumentUpper.includes('.')) {
            // Акции (тикеры)
            detectedType = 'stocks_us';
        } else if (instrumentUpper.includes('.MX') || instrumentUpper.includes('.ME')) {
            // Индексы
            detectedType = 'indices_world';
        }

        if (detectedType && INSTRUMENT_DETAILS[detectedType]) {
            setSelectedInstrumentType(detectedType);

            // Автоматически устанавливаем шаг цены
            const priceStep = INSTRUMENT_DETAILS[detectedType].priceStep;
            dispatch({ type: 'SET_FIELD', field: 'currentPriceStep', value: priceStep });
        }
    }, [instrument]);

    // Функция для проверки доступности полей сетки
    const isGridFieldEnabled = useCallback((index) => {
        if (index === 0) return true;

        // Проверяем, заполнено ли предыдущее поле
        const prevField = gridDistribution[index - 1];
        return prevField && prevField.trim() !== '' && !isNaN(parseFloat(prevField));
    }, [gridDistribution]);

    // Функция для получения placeholder для поля сетки
    const getGridFieldPlaceholder = useCallback((index) => {
        if (index === gridOrdersCount - 1) {
            return 'Рассчитается автоматически';
        }
        return isGridFieldEnabled(index) ? 'Введите %' : 'Заполните предыдущее поле';
    }, [gridOrdersCount, isGridFieldEnabled]);

    // Функция для расчета последнего поля сетки
    const calculateLastGridField = useCallback(() => {
        if (gridDistribution.length === 0) return '';

        const sumFilled = gridDistribution.slice(0, -1).reduce((sum, val) => {
            if (val === '' || val === undefined || val === null) return sum;
            const numVal = parseFloat(val);
            return sum + (isNaN(numVal) ? 0 : numVal);
        }, 0);

        if (sumFilled < 100) {
            return (100 - sumFilled).toFixed(1);
        } else if (sumFilled > 100) {
            return 'Ошибка: >100%';
        }
        return '0.0';
    }, [gridDistribution]);

    // Основной обработчик расчета с использованием новой системы
    const handleCalculate = useCallback(() => {
        // Сбрасываем предыдущие ошибки и результаты
        setCalculationError('');
        setCalculationResults(null);

        // Валидация полей
        const errors = validateFields(state);

        if (Object.keys(errors).length > 0) {
            // Устанавливаем ошибки в state
            Object.entries(errors).forEach(([field, error]) => {
                if (error) {
                    dispatch({ type: 'SET_FIELD', field: `${field}Error`, value: error });
                }
            });
            return;
        }

        // Проверка обязательных числовых полей
        const depositNum = parseFloat(deposit);
        const riskSizeNum = parseFloat(riskSize);
        const entryPriceNum = parseFloat(entryPrice);
        const slPriceNum = parseFloat(slPrice);

        if (isNaN(depositNum) || depositNum <= 0) {
            setCalculationError('Депозит должен быть положительным числом');
            return;
        }

        if (isNaN(riskSizeNum) || riskSizeNum <= 0 || riskSizeNum > 100) {
            setCalculationError('Риск должен быть от 0.01% до 100%');
            return;
        }

        if (isNaN(entryPriceNum) || entryPriceNum <= 0) {
            setCalculationError('Цена входа должна быть положительным числом');
            return;
        }

        if (isNaN(slPriceNum) || slPriceNum <= 0) {
            setCalculationError('Stop Loss должен быть положительным числом');
            return;
        }

        if (entryPriceNum === slPriceNum) {
            setCalculationError('Цена входа и Stop Loss не должны совпадать');
            return;
        }

        try {
            // Подготавливаем параметры для расчета
            const calculationParams = {
                // Основные параметры
                instrument: instrument.trim(),
                instrumentType: selectedInstrumentType,
                direction,
                entryPrice: entryPriceNum,
                slPrice: slPriceNum,

                // Риск-менеджмент
                deposit: depositNum,
                riskSize: riskSizeNum,

                // Take Profit уровни
                tpLevels: tpLevels.filter(tp => tp.price && tp.percent).map(tp => ({
                    price: parseFloat(tp.price),
                    percent: parseFloat(tp.percent)
                })),

                // Настройки сетки (если включена)
                gridEnabled,
                gridOrdersCount,
                gridDistribution: gridDistribution.map(val => parseFloat(val) || 0),

                // Дополнительные параметры
                traderNote,
                status,
                isBacktest,
                accountCurrency: 'USD',

                // Шаг цены
                currentPriceStep: currentPriceStep || getDefaultPriceStep(instrument)
            };

            console.log('Параметры расчета:', calculationParams);

            // Выполняем расчет с использованием новой системы
            const reportData = calculateInstrumentReport(calculationParams);

            console.log('Результаты расчета:', reportData);

            // Сохраняем результаты расчета
            setCalculationResults(reportData);

            // Обновляем state с результатами расчета для обратной совместимости
            dispatch({
                type: 'SET_FIELD',
                field: 'vCoins',
                value: reportData.positionSize || reportData.positionLots || reportData.shares || 0
            });

            dispatch({
                type: 'SET_FIELD',
                field: 'vValue',
                value: reportData.positionValue || 0
            });

            dispatch({
                type: 'SET_FIELD',
                field: 'riskValue',
                value: reportData.riskAmount || 0
            });

            dispatch({
                type: 'SET_FIELD',
                field: 'rrRatio',
                value: reportData.tpResults?.[0]?.rrRatio ||
                       reportData.tpDetails?.[0]?.rrRatio || 0
            });

            dispatch({
                type: 'SET_FIELD',
                field: 'slPoints',
                value: reportData.stopLossPips || reportData.slPoints || 0
            });

            dispatch({
                type: 'SET_FIELD',
                field: 'reportId',
                value: reportData.reportId || `ORD-${Date.now()}`
            });

            dispatch({
                type: 'SET_FIELD',
                field: 'date',
                value: reportData.date || new Date().toLocaleDateString('ru-RU')
            });

            // Если включена сетка, обновляем данные сетки
            if (gridEnabled && reportData.gridResults) {
                dispatch({
                    type: 'SET_GRID_CALCULATION_RESULTS',
                    prices: reportData.gridResults.orders?.map(o => o.price) || [],
                    quantities: reportData.gridResults.orders?.map(o => o.units) || [],
                    averagePrice: reportData.gridResults.avgPrice || 0,
                    totalQuantity: reportData.gridResults.totalLots || reportData.gridResults.totalInvestment || 0,
                    investment: reportData.gridResults.totalInvestment || 0
                });
            }

            // Показываем отчет
            dispatch({ type: 'SET_FIELD', field: 'showReport', value: true });

            // Сохраняем инструмент в историю
            if (instrument && addInstrument) {
                addInstrument(instrument, currentPriceStep);
            }

            // Успешное завершение расчета
            setCalculationError('');

        } catch (error) {
            console.error('Ошибка расчета:', error);
            setCalculationError(`Ошибка расчета: ${error.message}`);
            alert(`Ошибка расчета: ${error.message}`);
        }
    }, [state, deposit, riskSize, entryPrice, slPrice, direction, instrument, traderNote,
        status, isBacktest, tpLevels, gridEnabled, gridOrdersCount, gridDistribution,
        currentPriceStep, selectedInstrumentType, addInstrument]);

    // Обработчик отправки в Notion
    const handleSendToNotion = useCallback(async () => {
        if (!calculationResults) {
            alert('Сначала выполните расчет');
            return;
        }

        setIsSendingToNotion(true);
        setNotionStatus('⏳ Отправка отчета в Notion...');

        try {
            const reportData = {
                reportId: calculationResults.reportId || `ORD-${Date.now()}`,
                date: calculationResults.date || new Date().toLocaleDateString('ru-RU'),
                instrument,
                direction,
                entryPrice: parseFloat(entryPrice),
                slPrice: parseFloat(slPrice),
                takeProfitPrice: tpLevels[0]?.price ? parseFloat(tpLevels[0].price) : null,
                deposit: parseFloat(deposit),
                riskSize: parseFloat(riskSize),
                riskValue: calculationResults.riskAmount || 0,
                vCoins: calculationResults.positionSize || calculationResults.positionLots || calculationResults.shares || 0,
                vValue: calculationResults.positionValue || 0,
                rrRatio: calculationResults.tpResults?.[0]?.rrRatio || calculationResults.rrRatio || 0,
                slPoints: calculationResults.stopLossPips || calculationResults.slPoints || 0,
                traderNote,
                status,
                isBacktest,
                gridEnabled,
                gridOrdersCount,
                instrumentType: selectedInstrumentType,
                calculatorType: calculationResults.calculatorType || 'unknown',
                marginRequired: calculationResults.marginRequired,
                freeMargin: calculationResults.freeMargin
            };

            const result = await sendReportToNotion(
                reportData,
                isBacktest,
                process.env.REACT_APP_NOTION_TOKEN,
                process.env.REACT_APP_NOTION_DATABASE_ID
            );

            if (result.success) {
                setNotionStatus('✅ Отчет успешно отправлен в Notion');
            } else {
                setNotionStatus(`❌ Ошибка: ${result.error?.message || 'Неизвестная ошибка'}`);
            }
        } catch (error) {
            console.error('Ошибка отправки в Notion:', error);
            setNotionStatus(`❌ Ошибка отправки: ${error.message}`);
        } finally {
            setIsSendingToNotion(false);
            // Автоматически скрываем статус через 5 секунд
            setTimeout(() => {
                setNotionStatus('');
            }, 5000);
        }
    }, [calculationResults, instrument, direction, entryPrice, slPrice, tpLevels, deposit,
        riskSize, traderNote, status, isBacktest, gridEnabled, gridOrdersCount, selectedInstrumentType]);

    // Обработчик экспорта в изображение
    const handleExportToImage = useCallback(() => {
        const reportElement = document.querySelector('.calculation-results-section');
        if (!reportElement) {
            alert('Сначала выполните расчет');
            return;
        }

        html2canvas(reportElement, {
            backgroundColor: '#fdfdfd',
            scale: 2,
            useCORS: true,
            logging: false
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = `risk-report-${instrument || 'trade'}-${new Date().toISOString().slice(0, 10)}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        }).catch(error => {
            console.error('Ошибка экспорта:', error);
            alert('Ошибка при экспорте изображения');
        });
    }, [instrument]);

    // Обработчик сброса формы
    const handleResetForm = useCallback(() => {
        dispatch({
            type: 'RESET_FORM',
            keepFields: ['deposit', 'riskSize', 'instrument', 'isBacktest', 'currentPriceStep']
        });
        setSelectedInstrumentType(null);
        setCalculationResults(null);
        setCalculationError('');
        setNotionStatus('');
    }, []);

    // Обработчик изменения направления
    const handleDirectionChange = useCallback((value) => {
        dispatch({ type: 'SET_FIELD', field: 'direction', value });
        dispatch({ type: 'SET_FIELD', field: 'isDirectionChosen', value: true });

        // Сбрасываем ошибки, связанные с направлением
        dispatch({ type: 'SET_FIELD', field: 'slError', value: '' });
        dispatch({ type: 'SET_FIELD', field: 'tpError', value: '' });
        setCalculationError('');
    }, []);

    // Данные для экспорта
    const reportData = calculationResults ? {
        instrument,
        direction,
        entryPrice,
        slPrice,
        deposit,
        riskSize,
        vCoins: calculationResults.positionSize || calculationResults.positionLots || calculationResults.shares || 0,
        vValue: calculationResults.positionValue || 0,
        riskValue: calculationResults.riskAmount || 0,
        rrRatio: calculationResults.tpResults?.[0]?.rrRatio || calculationResults.rrRatio || 0,
        traderNote,
        status,
        date: calculationResults.date,
        instrumentType: selectedInstrumentType,
        calculatorType: calculationResults.calculatorType,
        marginRequired: calculationResults.marginRequired,
        freeMargin: calculationResults.freeMargin
    } : null;

    return (
        <div className="calculator">
            <h2>📊 Калькулятор рисков</h2>

            <div className="calculator-header-note">
                <p>
                    <span>💡</span>
                    <span>
                        Заполните форму и нажмите "Рассчитать". Для сохранения результатов используйте "Notion" или "Экспорт".
                    </span>
                </p>
            </div>

            {/* Сообщение об ошибке расчета */}
            {calculationError && (
                <div className="calculation-error">
                    <div className="error-icon">⚠️</div>
                    <div className="error-message">{calculationError}</div>
                </div>
            )}

            <form onSubmit={(e) => e.preventDefault()}>
                {/* Основные поля */}
                <fieldset className="form-section">
                    <legend>📝 Основные параметры</legend>

                    {/* Ввод инструмента */}
                    <InstrumentInput
                        instrument={instrument}
                        setInstrument={(value) => dispatch({ type: 'SET_FIELD', field: 'instrument', value })}
                        instrumentError={instrumentError}
                        setInstrumentError={(error) => dispatch({ type: 'SET_FIELD', field: 'instrumentError', value: error })}
                        isDirectionChosen={isDirectionChosen}
                        tooltipText={tooltipText}
                        historySuggestions={history}
                        onInstrumentSelect={(selectedInstrument) => {
                            dispatch({ type: 'SET_FIELD', field: 'instrument', value: selectedInstrument.name });
                            dispatch({ type: 'SET_FIELD', field: 'instrumentError', value: '' });

                            if (addInstrument) {
                                addInstrument(selectedInstrument.name, selectedInstrument.priceStep);
                            }
                        }}
                        onOpenSettings={handleOpenInstrumentSettings}
                        getSuggestions={getInstrumentSuggestions}
                    />

                    {/* Выбор типа инструмента */}
                    <InstrumentTypeSelector
                        selectedType={selectedInstrumentType}
                        onTypeSelect={handleInstrumentTypeSelect}
                        instrument={instrument}
                        isDirectionChosen={isDirectionChosen}
                        tooltipText={tooltipText}
                    />

                    {/* Выбор направления сделки */}
                    <div className="inline-field">
                        <label>Направление:</label>
                        <div className="direction-buttons">
                            <button
                                type="button"
                                className={`direction-btn ${direction === 'long' ? 'active' : ''}`}
                                onClick={() => handleDirectionChange('long')}
                            >
                                📈 Long
                            </button>
                            <button
                                type="button"
                                className={`direction-btn ${direction === 'short' ? 'active' : ''}`}
                                onClick={() => handleDirectionChange('short')}
                            >
                                📉 Short
                            </button>
                        </div>
                    </div>

                    {/* Цена входа */}
                    <div className={`inline-field ${!isDirectionChosen ? 'disabled-field' : ''}`}
                         title={!isDirectionChosen ? tooltipText : ''}>
                        <label>Цена входа (USDT):</label>
                        <input
                            type="number"
                            step="0.0001"
                            min="0"
                            value={entryPrice}
                            onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'entryPrice', value: e.target.value })}
                            disabled={!isDirectionChosen}
                            placeholder="0.0000"
                        />
                    </div>
                </fieldset>

                {/* Панель управления рисками */}
                <RiskManagementPanel
                    deposit={deposit}
                    setDeposit={setDeposit}
                    riskSize={riskSize}
                    setRiskSize={setRiskSize}
                    slPrice={slPrice}
                    slError={slError}
                    isDirectionChosen={isDirectionChosen}
                    dispatch={dispatch}
                    entryPrice={entryPrice}
                    direction={direction}
                    tooltipText={tooltipText}
                />

                {/* Менеджер Take Profit */}
                <TakeProfitManager
                    tpLevels={tpLevels}
                    tpError={tpError}
                    isDirectionChosen={isDirectionChosen}
                    dispatch={dispatch}
                    tooltipText={tooltipText}
                />

                {/* Настройки сетки */}
                <GridSettingsPanel
                    gridEnabled={gridEnabled}
                    gridOrdersCount={gridOrdersCount}
                    gridDistribution={gridDistribution}
                    isDirectionChosen={isDirectionChosen}
                    dispatch={dispatch}
                    isGridFieldEnabled={isGridFieldEnabled}
                    getGridFieldPlaceholder={getGridFieldPlaceholder}
                    calculateLastGridField={calculateLastGridField}
                />

                {/* Заметка трейдера */}
                <fieldset className="form-section">
                    <legend>📝 Заметка трейдера</legend>
                    <div className="trader-note-container">
                        <textarea
                            className="trader-note"
                            value={traderNote}
                            onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'traderNote', value: e.target.value })}
                            placeholder="Добавьте заметки о сделке, стратегии или другие комментарии..."
                            rows="3"
                        />
                    </div>
                </fieldset>

                {/* Статус сделки */}
                <fieldset className="form-section">
                    <legend>📊 Статус сделки</legend>
                    <div className="inline-field">
                        <label>Статус:</label>
                        <select
                            value={status}
                            onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'status', value: e.target.value })}
                        >
                            <option value="Запланирован">Запланирован</option>
                            <option value="Открыт">Открыт</option>
                            <option value="Отменён">Отменён</option>
                            <option value="Завершен">Завершен</option>
                        </select>
                    </div>

                    <div className="inline-checkbox">
                        <input
                            type="checkbox"
                            id="isBacktest"
                            checked={isBacktest}
                            onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'isBacktest', value: e.target.checked })}
                        />
                        <label htmlFor="isBacktest">Это бэктест (тест стратегии)</label>
                    </div>
                </fieldset>

                {/* Кнопки действий */}
                <ExportActions
                    reportData={reportData}
                    isSendingToNotion={isSendingToNotion}
                    notionStatus={notionStatus}
                    slError={slError}
                    tpError={tpError}
                    gridError={gridError}
                    isDirectionChosen={isDirectionChosen}
                    onCalculate={handleCalculate}
                    onSendToNotion={handleSendToNotion}
                    onExportToImage={handleExportToImage}
                    onResetForm={handleResetForm}
                />
            </form>

            {/* Результаты расчета */}
            {showReport && calculationResults && (
                <CalculationResults
                    gridEnabled={gridEnabled}
                    gridPrices={gridPrices}
                    gridQuantities={gridQuantities}
                    gridDistribution={gridDistribution}
                    gridAveragePrice={gridAveragePrice}
                    gridTotalQuantity={gridTotalQuantity}
                    gridInvestment={gridInvestment}
                    vCoins={calculationResults.positionSize || calculationResults.positionLots || calculationResults.shares || 0}
                    vValue={calculationResults.positionValue || 0}
                    riskValue={calculationResults.riskAmount || 0}
                    rrRatio={calculationResults.tpResults?.[0]?.rrRatio || calculationResults.rrRatio || 0}
                    instrument={instrument}
                    currentPriceStep={currentPriceStep}
                    notionStatus={notionStatus}
                    isSendingToNotion={isSendingToNotion}
                    status={status}
                    // Дополнительные данные из новой системы
                    calculationResults={calculationResults}
                    calculatorType={calculationResults.calculatorType}
                    marginRequired={calculationResults.marginRequired}
                    freeMargin={calculationResults.freeMargin}
                    pipValue={calculationResults.pipValuePerLot}
                    stopLossPips={calculationResults.stopLossPips}
                />
            )}

            {/* Диалог настроек инструмента */}
            <InstrumentSettingsDialog
                isOpen={instrumentSettingsOpen}
                onClose={handleCloseInstrumentSettings}
                instrumentName={selectedInstrumentForSettings}
                currentPriceStep={currentPriceStep}
                onSave={handleSaveInstrumentSettings}
            />
        </div>
    );
};

export default Calculator;
