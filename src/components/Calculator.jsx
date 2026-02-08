// src/components/Calculator/Calculator.jsx - обновленная версия с интеграцией InstrumentInput
import React, { useState, useEffect, useReducer, useCallback } from 'react';
import InstrumentInput from './InstrumentInput';
import GridSettingsPanel from './GridSettingsPanel';
import TakeProfitManager from './TakeProfitManager';
import RiskManagementPanel from './RiskManagementPanel';
import CalculationResults from './CalculationResults';
import ExportActions from './ExportActions';
import InstrumentSettingsDialog from '../InstrumentSettingsDialog/InstrumentSettingsDialog';
import { useInstrumentHistory } from '../../hooks/useInstrumentHistory';
import { calculatorReducer, initialState } from '../../reducers/calculatorReducer';
import { calculateReport } from '../../utils/calculateReport';
import { validateFields } from '../../utils/validateCalculator';
import { sendReportToNotion } from '../../utils/notionService';
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
        handleCloseInstrumentSettings();
    }, [updateInstrumentPriceStep, handleCloseInstrumentSettings]);

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

    // Обработчик расчета
    const handleCalculate = useCallback(() => {
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

        try {
            const reportData = calculateReport({
                deposit,
                riskSize,
                entryPrice,
                slPrice,
                takeProfitPrice: tpLevels[0]?.price,
                direction,
                instrument,
                traderNote,
                status,
                isBacktest,
                tpLevels,
                gridEnabled,
                gridOrdersCount,
                gridDistribution,
                priceStep: currentPriceStep,
                getDefaultPriceStep: (name) => {
                    // Используем логику из useInstrumentHistory
                    const lowerName = name.toLowerCase();
                    if (lowerName.includes('btc') || lowerName.includes('eth') ||
                        lowerName.includes('usdt') || lowerName.includes('bnb')) {
                        return 0.01;
                    }
                    if (lowerName.includes('.mx') || lowerName.includes('.me')) {
                        return 0.01;
                    }
                    if (lowerName.includes('usd') || lowerName.includes('eur') ||
                        lowerName.includes('gbp') || lowerName.includes('jpy')) {
                        return 0.0001;
                    }
                    return 0.01;
                }
            });

            // Обновляем state с результатами расчета
            dispatch({
                type: 'SET_FIELD',
                field: 'vCoins',
                value: reportData.vCoins
            });
            dispatch({
                type: 'SET_FIELD',
                field: 'vValue',
                value: reportData.vValue
            });
            dispatch({
                type: 'SET_FIELD',
                field: 'riskValue',
                value: reportData.riskValue
            });
            dispatch({
                type: 'SET_FIELD',
                field: 'rrRatio',
                value: reportData.rrRatio
            });
            dispatch({
                type: 'SET_FIELD',
                field: 'slPoints',
                value: reportData.slPoints
            });
            dispatch({
                type: 'SET_FIELD',
                field: 'reportId',
                value: reportData.reportId
            });
            dispatch({
                type: 'SET_FIELD',
                field: 'date',
                value: reportData.date
            });

            // Если включена сетка, обновляем данные сетки
            if (gridEnabled && reportData.gridReport) {
                dispatch({
                    type: 'SET_GRID_CALCULATION_RESULTS',
                    prices: reportData.gridReport.gridPrices,
                    quantities: reportData.gridReport.gridQuantities,
                    averagePrice: reportData.gridReport.gridAveragePrice,
                    totalQuantity: reportData.gridReport.gridTotalQuantity,
                    investment: reportData.gridReport.gridInvestment
                });
            }

            // Показываем отчет
            dispatch({ type: 'SET_FIELD', field: 'showReport', value: true });

            // Сохраняем инструмент в историю
            if (instrument && addInstrument) {
                addInstrument(instrument, currentPriceStep);
            }

        } catch (error) {
            console.error('Ошибка расчета:', error);
            alert(`Ошибка расчета: ${error.message}`);
        }
    }, [state, deposit, riskSize, entryPrice, slPrice, direction, instrument, traderNote,
        status, isBacktest, tpLevels, gridEnabled, gridOrdersCount, gridDistribution,
        currentPriceStep, addInstrument]);

    // Обработчик отправки в Notion
    const handleSendToNotion = useCallback(async () => {
        if (!vCoins || isNaN(vCoins)) {
            alert('Сначала выполните расчет');
            return;
        }

        setIsSendingToNotion(true);
        setNotionStatus('⏳ Отправка отчета в Notion...');

        try {
            const reportData = {
                reportId: state.reportId || `ORD-${Date.now()}`,
                date: state.date || new Date().toLocaleDateString('ru-RU'),
                instrument,
                direction,
                entryPrice,
                slPrice,
                takeProfitPrice: tpLevels[0]?.price,
                deposit,
                riskSize,
                riskValue,
                vCoins,
                vValue,
                rrRatio,
                slPoints: state.slPoints || 0,
                traderNote,
                status,
                isBacktest,
                gridEnabled,
                gridOrdersCount,
                gridReport: gridEnabled ? {
                    gridAveragePrice,
                    gridInvestment
                } : null
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
    }, [vCoins, state.reportId, state.date, state.slPoints, instrument, direction,
        entryPrice, slPrice, tpLevels, deposit, riskSize, riskValue, vValue, rrRatio,
        traderNote, status, isBacktest, gridEnabled, gridOrdersCount, gridAveragePrice,
        gridInvestment]);

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
            useCORS: true
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = `risk-report-${instrument || 'trade'}-${new Date().toISOString().slice(0, 10)}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        });
    }, [instrument]);

    // Обработчик сброса формы
    const handleResetForm = useCallback(() => {
        dispatch({
            type: 'RESET_FORM',
            keepFields: ['deposit', 'riskSize', 'instrument', 'isBacktest']
        });
        setNotionStatus('');
    }, []);

    // Обработчик изменения направления
    const handleDirectionChange = useCallback((value) => {
        dispatch({ type: 'SET_FIELD', field: 'direction', value });
        dispatch({ type: 'SET_FIELD', field: 'isDirectionChosen', value: true });

        // Сбрасываем ошибки, связанные с направлением
        dispatch({ type: 'SET_FIELD', field: 'slError', value: '' });
        dispatch({ type: 'SET_FIELD', field: 'tpError', value: '' });
    }, []);

    // Данные для экспорта
    const reportData = vCoins && !isNaN(vCoins) ? {
        instrument,
        direction,
        entryPrice,
        slPrice,
        deposit,
        riskSize,
        vCoins,
        vValue,
        riskValue,
        rrRatio,
        traderNote,
        status,
        date: state.date
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

            <form onSubmit={(e) => e.preventDefault()}>
                {/* Основные поля */}
                <fieldset className="form-section">
                    <legend>📝 Основные параметры</legend>

                    {/* Ввод инструмента с использованием нового компонента */}
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
            {showReport && (
                <CalculationResults
                    gridEnabled={gridEnabled}
                    gridPrices={gridPrices}
                    gridQuantities={gridQuantities}
                    gridDistribution={gridDistribution}
                    gridAveragePrice={gridAveragePrice}
                    gridTotalQuantity={gridTotalQuantity}
                    gridInvestment={gridInvestment}
                    vCoins={vCoins}
                    vValue={vValue}
                    riskValue={riskValue}
                    rrRatio={rrRatio}
                    instrument={instrument}
                    currentPriceStep={currentPriceStep}
                    notionStatus={notionStatus}
                    isSendingToNotion={isSendingToNotion}
                    status={status}
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
