// src/calculations/index.js
/**
 * Фасадный модуль для доступа ко всем специализированным калькуляторам
 *
 * Этот модуль предоставляет единый интерфейс для расчетов параметров позиций
 * для различных типов финансовых инструментов.
 */

import { detectInstrumentType } from './types/instrumentTypes';
import { calculateReport as calculateBaseReport } from '../../utils/calculateReport';

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

    // Получаем соответствующий калькулятор
    const Calculator = CALCULATORS[detectedType?.category] || CALCULATORS.crypto;

    try {
        // Используем специализированный калькулятор
        return Calculator.calculate({
            instrument,
            instrumentType: detectedType,
            ...otherParams
        });
    } catch (error) {
        console.warn(`Ошибка в специализированном калькуляторе (${detectedType?.category}):`, error);
        console.log('Использую базовый расчет...');

        // Fallback на базовый расчет
        return calculateBaseReport(params);
    }
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

// Экспортируем специализированные калькуляторы для прямого доступа
export { ForexCalculator, CryptoCalculator, StockCalculator, FuturesCalculator, CFDCalculator };

// Экспортируем утилиты
export * from './utils/lotCalculations';
export * from './utils/marginCalculations';
export * from './utils/commissionCalculations';
export * from './utils/riskCalculations';

// Экспортируем типы и классификаторы
export * from './types/instrumentTypes';
export * from './types/forexPairs';
export * from './types/cryptoPairs';
export * from './types/stockSymbols';

// Экспорт для обратной совместимости
export { calculateInstrumentReport as calculateReport };
