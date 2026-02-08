// src/calculations/utils/lotCalculations.js
/**
 * Утилиты для расчета размеров лотов и позиций
 */

/**
 * Расчет размера лота на основе риска
 * @param {number} riskAmount - Сумма риска в валюте депозита
 * @param {number} stopLossPips - Стоп.лосс в пипсах
 * @param {number} pipValue - Стоимость пипа
 * @param {number} contractSize - Размер контракта
 * @returns {number} Размер лота
 */
export function calculateLotSize(riskAmount, stopLossPips, pipValue, contractSize = 100000) {
    if (stopLossPips <= 0 || pipValue <= 0) {
        return 0;
    }
    return riskAmount / (stopLossPips * pipValue * contractSize);
}

/**
 * Расчет требуемой маржи
 * @param {number} positionValue - Стоимость позиции
 * @param {number} leverage - Кредитное плечо (например, 100 для 1:100)
 * @returns {number} Требуемая маржа
 */
export function calculateMargin(positionValue, leverage) {
    if (leverage <= 0) {
        return positionValue; // Без плеча
    }
    return positionValue / leverage;
}

/**
 * Расчет маржинального уровня
 * @param {number} equity - Средства на счете
 * @param {number} usedMargin - Использованная маржа
 * @returns {number} Маржинальный уровень в процентах
 */
export function calculateMarginLevel(equity, usedMargin) {
    if (usedMargin <= 0) {
        return Infinity;
    }
    return (equity / usedMargin) * 100;
}

/**
 * Расчет свободной маржи
 * @param {number} equity - Средства на счете
 * @param {number} usedMargin - Использованная маржа
 * @returns {number} Свободная маржа
 */
export function calculateFreeMargin(equity, usedMargin) {
    return equity - usedMargin;
}

/**
 * Расчет прибыли в пипсах
 * @param {number} entryPrice - Цена входа
 * @param {number} exitPrice - Цена выхода
 * @param {string} instrument - Инструмент (для определения размера пипа)
 * @returns {number} Прибыль в пипсах
 */
export function calculateProfitInPips(entryPrice, exitPrice, instrument) {
    const diff = Math.abs(entryPrice - exitPrice);

    // Определяем размер пипа на основе инструмента
    if (instrument.includes('JPY') && !instrument.startsWith('JPY')) {
        // Для пар с JPY в котируемой валюте пип = 0.01
        return diff / 0.01;
    } else if (instrument.includes('XAU') || instrument.includes('XAG')) {
        // Для золота и серебра
        return diff / 0.01;
    } else {
        // Для большинства инструментов пип = 0.0001
        return diff / 0.0001;
    }
}

/**
 * Расчет стоимости пипа
 * @param {string} instrument - Инструмент
 * @param {number} price - Текущая цена
 * @param {string} accountCurrency - Валюта счета
 * @param {number} lotSize - Размер лота
 * @returns {number} Стоимость пипа
 */
export function calculatePipValue(instrument, price, accountCurrency = 'USD', lotSize = 1) {
    const [baseCurrency, quoteCurrency] = instrument.split('/');

    if (!baseCurrency || !quoteCurrency) {
        // Для инструментов без '/' (акции, крипто)
        return price * 0.01 * lotSize;
    }

    // Для форекс пар
    if (quoteCurrency === accountCurrency) {
        // Если валюта котировки совпадает с валютой счета
        return 10 * lotSize; // $10 за пип на стандартный лот
    } else if (baseCurrency === accountCurrency) {
        // Если базовая валюта совпадает с валютой счета
        return (10 / price) * lotSize;
    } else {
        // Для кросс-пар нужен дополнительный расчет
        // Упрощенный вариант
        return 10 * lotSize;
    }
}

/**
 * Расчет свопа (комиссии за перенос позиции)
 * @param {string} instrument - Инструмент
 * @param {number} lotSize - Размер лота
 * @param {string} direction - Направление (long/short)
 * @param {number} swapLong - Ставка свопа для лонга
 * @param {number} swapShort - Ставка свопа для шорта
 * @returns {number} Сумма свопа
 */
export function calculateSwap(instrument, lotSize, direction, swapLong = 0, swapShort = 0) {
    const swapRate = direction === 'long' ? swapLong : swapShort;
    return swapRate * lotSize;
}

/**
 * Расчет объема позиции в единицах
 * @param {number} lotSize - Размер лота
 * @param {string} instrumentType - Тип инструмента
 * @returns {number} Объем в единицах
 */
export function calculatePositionUnits(lotSize, instrumentType) {
    const lotSizes = {
        'forex': 100000,
        'crypto': 1,
        'stocks': 1,
        'metals': 100,
        'indices': 1,
        'commodities': 1000
    };

    const multiplier = lotSizes[instrumentType] || 1;
    return lotSize * multiplier;
}

/**
 * Проверка минимального и максимального объема
 * @param {number} volume - Объем для проверки
 * @param {string} instrumentType - Тип инструмента
 * @returns {Object} Результат проверки
 */
export function validateVolume(volume, instrumentType) {
    const minVolumes = {
        'forex': 0.01,    // Мини-лот
        'crypto': 0.0001, // Для крипто
        'stocks': 1,      // 1 акция
        'metals': 0.01,   // Мини-лот для металлов
        'indices': 0.1,   // Для индексов
        'commodities': 0.1 // Для товаров
    };

    const maxVolumes = {
        'forex': 100,     // Максимальный лот
        'crypto': 1000,   // Для крипто
        'stocks': 10000,  // Для акций
        'metals': 100,    // Для металлов
        'indices': 1000,  // Для индексов
        'commodities': 500 // Для товаров
    };

    const minVolume = minVolumes[instrumentType] || 0.01;
    const maxVolume = maxVolumes[instrumentType] || 100;

    return {
        isValid: volume >= minVolume && volume <= maxVolume,
        minVolume,
        maxVolume,
        currentVolume: volume,
        isBelowMin: volume < minVolume,
        isAboveMax: volume > maxVolume
    };
}

/**
 * Конвертация объема между разными типами лотов
 * @param {number} volume - Исходный объем
 * @param {string} fromType - Исходный тип (standard/mini/micro)
 * @param {string} toType - Целевой тип
 * @returns {number} Конвертированный объем
 */
export function convertLotSize(volume, fromType, toType) {
    const multipliers = {
        'standard': 1,
        'mini': 0.1,
        'micro': 0.01,
        'nano': 0.001
    };

    const fromMultiplier = multipliers[fromType] || 1;
    const toMultiplier = multipliers[toType] || 1;

    return (volume * fromMultiplier) / toMultiplier;
}

/**
 * Расчет точки маржин-колла
 * @param {number} equity - Средства на счете
 * @param {number} usedMargin - Использованная маржа
 * @param {number} marginCallLevel - Уровень маржин-колла (например, 100%)
 * @returns {number} Значение equity при котором будет маржин-колл
 */
export function calculateMarginCallLevel(equity, usedMargin, marginCallLevel = 100) {
    return usedMargin * (marginCallLevel / 100);
}

/**
 * Расчет точки стоп-аута
 * @param {number} equity - Средства на счете
 * @param {number} usedMargin - Использованная маржа
 * @param {number} stopOutLevel - Уровень стоп-аута (например, 50%)
 * @returns {number} Значение equity при котором будет стоп-аут
 */
export function calculateStopOutLevel(equity, usedMargin, stopOutLevel = 50) {
    return usedMargin * (stopOutLevel / 100);
}
