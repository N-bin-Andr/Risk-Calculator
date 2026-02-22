// src/hooks/useCalculator.js

import { useState, useReducer, useCallback } from 'react';
import { calculatorReducer, initialState } from '../reducers/calculatorReducer';
import { calculateInstrumentReport, getDefaultPriceStep } from '../calculations';
import { validateFields } from '../utils/validateCalculator';
import { sendReportToNotion } from '../utils/notionService';
import { useInstrumentHistory } from './useInstrumentHistory';
import html2canvas from 'html2canvas';

/**
 * Основной хук для логики калькулятора
 * Объединяет всю бизнес-логику, состояние и обработчики
 */
export function useCalculator() {
    // Состояние калькулятора через редьюсер
    const [state, dispatch] = useReducer(calculatorReducer, initialState);

    // Локальные состояния для UI
    const [deposit, setDeposit] = useState(localStorage.getItem('lastDeposit') || '1000');
    const [riskSize, setRiskSize] = useState(localStorage.getItem('lastRiskSize') || '2');
    const [notionStatus, setNotionStatus] = useState('');
    const [isSendingToNotion, setIsSendingToNotion] = useState(false);
    const [instrumentSettingsOpen, setInstrumentSettingsOpen] = useState(false);
    const [selectedInstrumentForSettings, setSelectedInstrumentForSettings] = useState('');
    const [selectedInstrumentType, setSelectedInstrumentType] = useState(null);
    const [calculationResults, setCalculationResults] = useState(null);
    const [calculationError, setCalculationError] = useState('');

    // Хук для истории инструментов
    const {
        history,
        addInstrument,
        getSuggestions,
        updateInstrumentPriceStep
    } = useInstrumentHistory();

    // Деструктуризация состояния для удобства
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
    }, []);

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

    // Автоматическое определение типа инструмента
    const detectInstrumentTypeFromName = useCallback((instrumentName) => {
        if (!instrumentName) return null;

        const instrumentUpper = instrumentName.toUpperCase();

        if (instrumentUpper.includes('/')) {
            if (instrumentUpper.includes('XAU') || instrumentUpper.includes('XAG') ||
                instrumentUpper.includes('XPT') || instrumentUpper.includes('XPD')) {
                return 'metals';
            } else if (instrumentUpper.includes('USD') || instrumentUpper.includes('EUR') ||
                       instrumentUpper.includes('JPY') || instrumentUpper.includes('GBP')) {
                return instrumentUpper.includes('USD') ? 'forex_major' : 'forex_minor';
            }
        } else if (instrumentUpper.includes('USDT') || instrumentUpper.includes('BTC') ||
                   instrumentUpper.includes('ETH') || instrumentUpper.includes('BNB')) {
            return 'crypto_spot';
        } else if (instrumentUpper.length <= 5 && !instrumentUpper.includes('.')) {
            return 'stocks_us';
        } else if (instrumentUpper.includes('.MX') || instrumentUpper.includes('.ME')) {
            return 'indices_world';
        }

        return null;
    }, []);

    // Функции для сетки
    const isGridFieldEnabled = useCallback((index) => {
        if (index === 0) return true;
        const prevField = gridDistribution[index - 1];
        return prevField && prevField.trim() !== '' && !isNaN(parseFloat(prevField));
    }, [gridDistribution]);

    const getGridFieldPlaceholder = useCallback((index) => {
        if (index === gridOrdersCount - 1) {
            return 'Рассчитается автоматически';
        }
        return isGridFieldEnabled(index) ? 'Введите %' : 'Заполните предыдущее поле';
    }, [gridOrdersCount, isGridFieldEnabled]);

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

    // Основной обработчик расчета
    const handleCalculate = useCallback(() => {
        setCalculationError('');
        setCalculationResults(null);

        const errors = validateFields(state);
        if (Object.keys(errors).length > 0) {
            Object.entries(errors).forEach(([field, error]) => {
                if (error) {
                    dispatch({ type: 'SET_FIELD', field: `${field}Error`, value: error });
                }
            });
            return;
        }

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
            const calculationParams = {
                instrument: instrument.trim(),
                instrumentType: selectedInstrumentType,
                direction,
                entryPrice: entryPriceNum,
                slPrice: slPriceNum,
                deposit: depositNum,
                riskSize: riskSizeNum,
                tpLevels: tpLevels.filter(tp => tp.price && tp.percent).map(tp => ({
                    price: parseFloat(tp.price),
                    percent: parseFloat(tp.percent)
                })),
                gridEnabled,
                gridOrdersCount,
                gridDistribution: gridDistribution.map(val => parseFloat(val) || 0),
                traderNote,
                status,
                isBacktest,
                accountCurrency: 'USD',
                currentPriceStep: currentPriceStep || getDefaultPriceStep(instrument)
            };

            const reportData = calculateInstrumentReport(calculationParams);
            setCalculationResults(reportData);

            // Обновляем state
            dispatch({ type: 'SET_FIELD', field: 'vCoins', value: reportData.positionSize || reportData.positionLots || reportData.shares || 0 });
            dispatch({ type: 'SET_FIELD', field: 'vValue', value: reportData.positionValue || 0 });
            dispatch({ type: 'SET_FIELD', field: 'riskValue', value: reportData.riskAmount || 0 });
            dispatch({ type: 'SET_FIELD', field: 'rrRatio', value: reportData.tpResults?.[0]?.rrRatio || reportData.tpDetails?.[0]?.rrRatio || 0 });
            dispatch({ type: 'SET_FIELD', field: 'slPoints', value: reportData.stopLossPips || reportData.slPoints || 0 });
            dispatch({ type: 'SET_FIELD', field: 'reportId', value: reportData.reportId || `ORD-${Date.now()}` });
            dispatch({ type: 'SET_FIELD', field: 'date', value: reportData.date || new Date().toLocaleDateString('ru-RU') });

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

            dispatch({ type: 'SET_FIELD', field: 'showReport', value: true });

            if (instrument && addInstrument) {
                addInstrument(instrument, currentPriceStep);
            }

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
            setTimeout(() => setNotionStatus(''), 5000);
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

    return {
        // Состояние
        state,
        dispatch,
        deposit,
        setDeposit,
        riskSize,
        setRiskSize,
        notionStatus,
        isSendingToNotion,
        instrumentSettingsOpen,
        selectedInstrumentForSettings,
        selectedInstrumentType,
        calculationResults,
        calculationError,
        history,

        // Данные для UI
        tooltipText,
        reportData,

        // Методы
        handleInstrumentTypeSelect,
        getInstrumentSuggestions,
        handleOpenInstrumentSettings,
        handleCloseInstrumentSettings,
        handleSaveInstrumentSettings,
        detectInstrumentTypeFromName,
        isGridFieldEnabled,
        getGridFieldPlaceholder,
        calculateLastGridField,
        handleCalculate,
        handleSendToNotion,
        handleExportToImage,
        handleResetForm,
        handleDirectionChange,
        addInstrument,
        updateInstrumentPriceStep,
        getSuggestions
    };
}
