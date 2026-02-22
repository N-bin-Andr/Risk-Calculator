// src/calculations/index.js

/**
 * Фасадный модуль для доступа ко всем специализированным калькуляторам
 *
 * Этот модуль предоставляет единый интерфейс для расчетов параметров позиций
 * для различных типов финансовых инструментов.
 */

import { detectInstrumentType } from './types/instrumentTypes';

// Импортируем специализированные калькуляторы
import ForexCalculator from './calculators/ForexCalculator';
import CryptoCalculator from './calculators/CryptoCalculator';
import StockCalculator from './calculators/StockCalculator';
import FuturesCalculator from './calculators/FuturesCalculator';
import CFDCalculator from './calculators/CFDsCalculator';

// Регистр калькуляторов по типам инструментов
const CALCULATORS = {
    forex: ForexCalculator,
    crypto: CryptoCalculator,
    stocks: StockCalculator,
    futures: FuturesCalculator,
    cfds: CFDCalculator
};

/**
 * Основная функция расчета отчета с автоматическим выбором калькулятора
 * @param {Object} params - Параметры расчета
 * @returns {Object} Результаты расчета
 */
export function calculateInstrumentReport(params) {
    const {
        instrument,
        instrumentType,
        ...otherParams
    } = params;

    // Определяем тип инструмента, если не задан
    const detectedType = instrumentType || detectInstrumentType(instrument);
    const category = detectedType?.category || 'crypto';

    // Получаем соответствующий калькулятор
    const Calculator = CALCULATORS[category] || CALCULATORS.crypto;

    try {
        // Используем специализированный калькулятор
        return Calculator.calculate({
            instrument,
            instrumentType: detectedType,
            ...otherParams
        });
    } catch (error) {
        console.warn(`Ошибка в специализированном калькуляторе (${category}):`, error);
        console.log('Использую базовый расчет...');

        // Fallback на базовый расчет
        return fallbackCalculate(params);
    }
}

/**
 * Запасная функция расчета (бывший calculateReport)
 * @param {Object} params - Параметры расчета
 * @returns {Object} Результаты расчета
 */
function fallbackCalculate(params) {
    const {
        deposit,
        riskSize,
        entryPrice,
        slPrice,
        direction,
        instrument,
        //  traderNote,
        // status,
        // isBacktest,
        // tpLevels = [],
        gridEnabled = false,
        gridOrdersCount = 3,
        gridDistribution = [],
        priceStep = null
    } = params;

    // Базовая реализация расчета
    const D = parseFloat(deposit) || 0;
    const R = parseFloat(riskSize) || 0;
    const EP = parseFloat(entryPrice) || 0;
    const SL = parseFloat(slPrice) || 0;

    if (D <= 0 || R <= 0 || EP <= 0 || SL <= 0 || EP === SL) {
        throw new Error('Некорректные параметры для расчета');
    }

    const riskAmount = D * (R / 100);
    const priceDiff = Math.abs(EP - SL);
    const positionSize = riskAmount / priceDiff;
    const positionValue = positionSize * EP;

    // Генерация ID отчета
    const now = new Date();
    const reportId = `ORD${now.getDate().toString().padStart(2,'0')}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getFullYear()}${now.getHours().toString().padStart(2,'0')}${now.getMinutes().toString().padStart(2,'0')}${now.getSeconds().toString().padStart(2,'0')}F`;

    return {
        reportId,
        instrument: instrument || 'Не указан',
        date: now.toLocaleDateString('ru-RU'),
        direction,
        deposit: D,
        riskSize: R,
        riskAmount,
        entryPrice: EP,
        slPrice: SL,
        positionSize,
        positionValue,
        tpResults: [],
        gridEnabled,
        gridOrdersCount: gridEnabled ? gridOrdersCount : null,
        gridDistribution: gridEnabled ? gridDistribution : null,
        calculatorType: 'fallback',
        timestamp: now.toISOString()
    };
}

/**
 * Получение калькулятора по типу инструмента
 * @param {string} type - Тип инструмента
 * @returns {Object} Специализированный калькулятор
 */
export function getCalculatorByType(type) {
    return CALCULATORS[type] || CALCULATORS.crypto;
}

/**
 * Получение информации о типе инструмента
 * @param {string} instrument - Название инструмента
 * @returns {Object} Информация о типе инструмента
 */
export function getInstrumentInfo(instrument) {
    return detectInstrumentType(instrument);
}

/**
 * Получение списка всех доступных типов инструментов
 * @returns {Array} Список типов инструментов
 */
export function getAvailableInstrumentTypes() {
    return Object.keys(CALCULATORS).map(key => ({
        id: key,
        name: CALCULATORS[key].getName(),
        description: CALCULATORS[key].getDescription(),
        examples: CALCULATORS[key].getExamples()
    }));
}

/**
 * Получение настроек по умолчанию для типа инструмента
 * @param {string} type - Тип инструмента
 * @returns {Object} Настройки по умолчанию
 */
export function getDefaultSettings(type) {
    const Calculator = getCalculatorByType(type);
    return Calculator.getDefaultSettings();
}

/**
 * Получение шага цены по умолчанию для инструмента
 * @param {string} instrument - Название инструмента
 * @returns {number} Шаг цены по умолчанию
 */
export function getDefaultPriceStep(instrument) {
    if (!instrument) return 0.01;

    const lowerName = instrument.toLowerCase();

    if (lowerName.includes('btc') || lowerName.includes('eth') ||
        lowerName.includes('usdt') || lowerName.includes('bnb')) {
        return 0.01;
    }

    if (lowerName.includes('xau') || lowerName.includes('xag') ||
        lowerName.includes('xpt') || lowerName.includes('xpd')) {
        return 0.01;
    }

    if (lowerName.includes('/')) {
        return 0.0001;
    }

    return 0.01;
}

// Экспортируем специализированные калькуляторы для прямого доступа
export {
    ForexCalculator,
    CryptoCalculator,
    StockCalculator,
    FuturesCalculator,
    CFDCalculator
};

// Экспортируем утилиты
export * from './helpers/lotCalculations';
export * from './helpers/marginCalculations';
export * from './helpers/commissionCalculations';
export * from './helpers/riskCalculations';

// Экспортируем типы и классификаторы
export * from './types/instrumentTypes';
export * from './types/forexPairs';
export * from './types/cryptoPairs';
export * from './types/stockSymbols';

// Экспорт для обратной совместимости - теперь это просто алиас
export { calculateInstrumentReport as calculateReport };
