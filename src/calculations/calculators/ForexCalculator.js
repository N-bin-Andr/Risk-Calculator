// src/calculations/calculators/ForexCalculator.js
/**
 * Калькулятор для форекс-пар (валютных пар)
 *
 * Особенности форекс:
 * - Торговля в лотах (стандартный лот = 100,000 единиц базовой валюты)
 * - Кредитное плечо (leverage) обычно 1:100
 * - Расчет прибыли/убытка в пипсах (pip)
 * - Свопы (swap) за перенос позиции через ночь
 * - Спред (spread) как основная комиссия
 *
 * Основная формула расчета лотности:
 * Лоты = (Сумма риска) / (Расстояние в пунктах × Стоимость пункта за 1 лот)
 *
 * где:
 * - Сумма риска = Депозит × (% риска / 100)
 * - Для EUR/USD: Стоимость пункта за 1 лот = $10
 * - Для USD/JPY: Стоимость пункта за 1 лот = (100,000 × 0.01) / Курс
 */

// Константы для форекс
const STANDARD_LOT_SIZE = 100000; // 1 стандартный лот = 100,000 единиц базовой валюты
const PIP_SIZE_MAJOR = 0.0001;    // Размер пипа для большинства пар (0.0001)
const PIP_SIZE_JPY = 0.01;        // Размер пипа для пар с JPY (0.01)

// Мажорные валютные пары (USD в котируемой валюте)
const MAJOR_PAIRS_USD_QUOTE = [
    'EUR/USD', 'GBP/USD', 'AUD/USD', 'NZD/USD'
];

// Мажорные пары с USD в базовой валюте
const MAJOR_PAIRS_USD_BASE = [
    'USD/JPY', 'USD/CHF', 'USD/CAD'
];

// Популярные кросс-пары
const CROSS_PAIRS = [
    'EUR/GBP', 'EUR/JPY', 'GBP/JPY', 'EUR/CHF',
    'AUD/JPY', 'CAD/JPY', 'NZD/JPY', 'GBP/AUD'
];

class ForexCalculator {
    /**
     * Расчет параметров позиции для форекс
     * @param {Object} params - Параметры расчета
     * @returns {Object} Результаты расчета
     */
    static calculate(params) {
        const {
            instrument,
            direction,
            entryPrice,
            slPrice,
            tpPrice,
            tpLevels = [],
            deposit,
            riskSize,
            gridEnabled = false,
            gridOrdersCount = 3,
            gridDistribution = [],
            leverage = 100,
            accountCurrency = 'USD'
        } = params;

        // Шаг 1: Определяем сумму риска на сделку
        const riskAmount = deposit * (riskSize / 100);

        // Шаг 2: Рассчитываем стоимость пункта для 1 лота
        const pipValuePerLot = this.calculatePipValuePerLot(instrument, entryPrice, accountCurrency);

        // Шаг 3: Определяем расстояние до стоп-лосса в пунктах
        const stopLossPips = this.calculatePipsBetweenPrices(entryPrice, slPrice, instrument);

        // Шаг 4: Рассчитываем оптимальный объем позиции (лотность)
        const positionLots = this.calculatePositionLots(riskAmount, stopLossPips, pipValuePerLot);

        // Проверяем минимальный/максимальный размер лота
        const validatedLots = this.validateLotSize(positionLots, instrument);

        // Расчет объема в единицах валюты
        const positionUnits = validatedLots * STANDARD_LOT_SIZE;

        // Расчет стоимости позиции
        const positionValue = this.calculatePositionValue(positionUnits, entryPrice, instrument);

        // Расчет требуемой маржи
        const marginRequired = this.calculateMarginRequired(positionValue, leverage);

        // Расчет прибыли по TP уровням
        const tpResults = this.calculateTakeProfitResults({
            tpLevels,
            entryPrice,
            positionLots: validatedLots,
            instrument,
            pipValuePerLot,
            direction
        });

        // Расчет для сеточного входа (если включен)
        let gridResults = null;
        if (gridEnabled) {
            gridResults = this.calculateGridResults({
                entryPrice,
                slPrice,
                positionLots: validatedLots,
                gridOrdersCount,
                gridDistribution,
                instrument,
                pipValuePerLot,
                direction,
                leverage
            });
        }

        // Расчет свопов
        const swapInfo = this.calculateSwapInfo(instrument, validatedLots, direction);

        // Расчет комиссий (спред)
        const commissionInfo = this.calculateCommissionInfo(instrument, validatedLots);

        return {
            // Основные результаты
            positionLots: validatedLots,
            positionUnits: Math.round(positionUnits),
            positionValue,
            marginRequired,

            // Риск
            riskAmount,
            stopLossPips: this.roundPips(stopLossPips),
            pipValuePerLot,

            // Информация о паре
            pairType: this.getPairType(instrument),
            leverage,
            pipSize: this.getPipSize(instrument),

            // Take Profit результаты
            tpResults,

            // Сеточные результаты
            gridResults,

            // Дополнительная информация
            swapInfo,
            commissionInfo,

            // Метрики
            riskPerPip: riskAmount / stopLossPips,
            marginUtilization: (marginRequired / deposit) * 100,
            freeMargin: deposit - marginRequired,

            // Метод расчета
            calculatorType: 'forex',
            calculationFormula: 'Лоты = Риск / (Пункты × Стоимость пункта за 1 лот)',
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Шаг 1: Рассчитываем стоимость пункта для 1 лота
     * @param {string} instrument - Инструмент (например, "EUR/USD")
     * @param {number} price - Текущая цена
     * @param {string} accountCurrency - Валюта счета
     * @returns {number} Стоимость пункта в валюте счета
     */
    static calculatePipValuePerLot(instrument, price, accountCurrency = 'USD') {
        const [baseCurrency, quoteCurrency] = instrument.toUpperCase().split('/');

        if (!baseCurrency || !quoteCurrency) {
            throw new Error(`Неверный формат инструмента: ${instrument}. Ожидается формат "BASE/QUOTE"`);
        }

        // Определяем размер пипа
        const pipSize = this.getPipSize(instrument);

        // Для пар с USD в котируемой валюте (EUR/USD, GBP/USD, AUD/USD, NZD/USD)
        if (quoteCurrency === 'USD') {
            // Стоимость пункта = (1 лот × размер пипа) в USD
            return STANDARD_LOT_SIZE * pipSize; // $10 для большинства пар
        }

        // Для пар с USD в базовой валюте (USD/JPY, USD/CHF, USD/CAD)
        if (baseCurrency === 'USD') {
            // Стоимость пункта = (1 лот × размер пипа) / Цена в USD
            return (STANDARD_LOT_SIZE * pipSize) / price;
        }

        // Для кросс-пар (EUR/GBP, EUR/JPY и т.д.)
        // Упрощенный расчет: предполагаем, что валюта счета - USD
        // В реальном приложении нужен актуальный курс quoteCurrency/USD
        console.warn(`Упрощенный расчет для кросс-пары ${instrument}. Для точного расчета нужен курс ${quoteCurrency}/USD`);
        return STANDARD_LOT_SIZE * pipSize * 1.0; // Предполагаем курс 1:1
    }

    /**
     * Шаг 2: Рассчитываем расстояние между ценами в пунктах
     * @param {number} price1 - Первая цена
     * @param {number} price2 - Вторая цена
     * @param {string} instrument - Инструмент
     * @returns {number} Расстояние в пунктах
     */
    static calculatePipsBetweenPrices(price1, price2, instrument) {
        const priceDiff = Math.abs(price1 - price2);
        const pipSize = this.getPipSize(instrument);

        return priceDiff / pipSize;
    }

    /**
     * Шаг 3: Рассчитываем размер позиции в лотах
     * @param {number} riskAmount - Сумма риска в валюте счета
     * @param {number} stopLossPips - Стоп-лосс в пунктах
     * @param {number} pipValuePerLot - Стоимость пункта за 1 лот
     * @returns {number} Размер позиции в лотах
     */
    static calculatePositionLots(riskAmount, stopLossPips, pipValuePerLot) {
        if (stopLossPips <= 0) {
            throw new Error('Стоп-лосс должен быть отличен от цены входа');
        }

        if (pipValuePerLot <= 0) {
            throw new Error('Стоимость пункта должна быть больше 0');
        }

        // Основная формула: Лоты = Риск / (Пункты × Стоимость пункта за 1 лот)
        return riskAmount / (stopLossPips * pipValuePerLot);
    }

    /**
     * Проверка минимального/максимального размера лота
     */
    static validateLotSize(lots, instrument) {
        const minLot = 0.01;  // Мини-лот
        const maxLot = 100;   // Максимальный лот

        if (lots < minLot) {
            console.warn(`Рассчитанный лот (${lots}) меньше минимального (${minLot}). Установлен минимум.`);
            return minLot;
        }

        if (lots > maxLot) {
            console.warn(`Рассчитанный лот (${lots}) больше максимального (${maxLot}). Установлен максимум.`);
            return maxLot;
        }

        return this.roundLots(lots);
    }

    /**
     * Получение размера пипа для инструмента
     */
    static getPipSize(instrument) {
        const upperInstrument = instrument.toUpperCase();

        // Для пар с JPY в котируемой валюте (XXX/JPY)
        if (upperInstrument.includes('/JPY')) {
            return PIP_SIZE_JPY; // 0.01
        }

        // Для большинства валютных пар
        return PIP_SIZE_MAJOR; // 0.0001
    }

    /**
     * Определение типа форекс пары
     */
    static getPairType(instrument) {
        const upperInstrument = instrument.toUpperCase();

        if (MAJOR_PAIRS_USD_QUOTE.includes(upperInstrument)) {
            return 'major_usd_quote';
        } else if (MAJOR_PAIRS_USD_BASE.includes(upperInstrument)) {
            return 'major_usd_base';
        } else if (CROSS_PAIRS.includes(upperInstrument)) {
            return 'cross';
        } else {
            return 'exotic';
        }
    }

    /**
     * Расчет стоимости позиции
     */
    static calculatePositionValue(units, price, instrument) {
        const [baseCurrency, quoteCurrency] = instrument.split('/');

        if (quoteCurrency === 'USD') {
            return units * price; // Прямой расчет для XXX/USD
        } else {
            // Для других пар нужна конвертация
            return units * price; // Упрощенный расчет
        }
    }

    /**
     * Расчет требуемой маржи
     */
    static calculateMarginRequired(positionValue, leverage) {
        return positionValue / leverage;
    }

    /**
     * Расчет результатов Take Profit
     */
    static calculateTakeProfitResults(params) {
        const {
            tpLevels,
            entryPrice,
            positionLots,
            instrument,
            pipValuePerLot,
            direction
        } = params;

        if (!tpLevels || tpLevels.length === 0) {
            return [];
        }

        return tpLevels.map(tp => {
            const tpPips = this.calculatePipsBetweenPrices(entryPrice, tp.price, instrument);
            const profit = tpPips * pipValuePerLot * positionLots;
            const profitPercent = (profit / (positionLots * STANDARD_LOT_SIZE * entryPrice)) * 100;

            return {
                price: tp.price,
                pips: this.roundPips(tpPips),
                profit,
                profitPercent: this.roundPercent(profitPercent),
                volumePercent: tp.percent || 100
            };
        });
    }

    /**
     * Расчет сеточного входа
     */
    static calculateGridResults(params) {
        const {
            entryPrice,
            slPrice,
            positionLots,
            gridOrdersCount,
            gridDistribution,
            instrument,
            pipValuePerLot,
            direction,
            leverage
        } = params;

        const stopLossPips = this.calculatePipsBetweenPrices(entryPrice, slPrice, instrument);
        const gridStepPips = stopLossPips / (gridOrdersCount + 1);

        const gridOrders = [];
        let totalInvestment = 0;
        let totalMargin = 0;

        for (let i = 0; i < gridOrdersCount; i++) {
            const percent = gridDistribution[i] || (100 / gridOrdersCount);
            const orderLots = positionLots * (percent / 100);
            const validatedOrderLots = this.validateLotSize(orderLots, instrument);

            // Цена ордера зависит от направления
            let orderPrice;
            const pipSize = this.getPipSize(instrument);

            if (direction === 'long') {
                // Для лонга: цена снижается от точки входа к SL
                orderPrice = entryPrice - (gridStepPips * (i + 1) * pipSize);
            } else {
                // Для шорта: цена растет от точки входа к SL
                orderPrice = entryPrice + (gridStepPips * (i + 1) * pipSize);
            }

            const orderUnits = validatedOrderLots * STANDARD_LOT_SIZE;
            const orderValue = this.calculatePositionValue(orderUnits, orderPrice, instrument);
            const orderMargin = this.calculateMarginRequired(orderValue, leverage);
            const orderPipsToSL = this.calculatePipsBetweenPrices(orderPrice, slPrice, instrument);
            const orderRisk = orderPipsToSL * pipValuePerLot * validatedOrderLots;

            gridOrders.push({
                order: i + 1,
                price: orderPrice,
                lots: validatedOrderLots,
                units: Math.round(orderUnits),
                value: orderValue,
                margin: orderMargin,
                pipsToSL: this.roundPips(orderPipsToSL),
                risk: orderRisk,
                percent: percent
            });

            totalInvestment += orderValue;
            totalMargin += orderMargin;
        }

        // Расчет средней цены (взвешенной по лотам)
        const totalLots = gridOrders.reduce((sum, order) => sum + order.lots, 0);
        const avgPrice = gridOrders.reduce((sum, order) =>
            sum + (order.price * order.lots), 0
        ) / totalLots;

        return {
            orders: gridOrders,
            totalInvestment,
            totalMargin,
            avgPrice,
            gridStepPips: this.roundPips(gridStepPips),
            totalLots
        };
    }

    /**
     * Расчет свопов
     */
    static calculateSwapInfo(instrument, positionLots, direction) {
        // Упрощенный расчет свопов
        // В реальности нужны актуальные ставки свопов от брокера
        const pairType = this.getPairType(instrument);

        let swapRate = 0;
        switch (pairType) {
            case 'major_usd_quote':
                swapRate = direction === 'long' ? -2.5 : 0.5;
                break;
            case 'major_usd_base':
                swapRate = direction === 'long' ? -1.8 : 0.3;
                break;
            case 'cross':
                swapRate = direction === 'long' ? -3.0 : 1.0;
                break;
            default:
                swapRate = direction === 'long' ? -5.0 : 2.0;
        }

        const swapPerLot = swapRate;
        const totalSwap = swapPerLot * positionLots;

        return {
            swapRate,
            swapPerLot,
            totalSwap,
            currency: 'USD',
            calculation: 'за 1 лот в день'
        };
    }

    /**
     * Расчет комиссий (спреда)
     */
    static calculateCommissionInfo(instrument, positionLots) {
        const pairType = this.getPairType(instrument);

        let spread = 1.0; // в пипах
        switch (pairType) {
            case 'major_usd_quote':
                spread = 0.8;
                break;
            case 'major_usd_base':
                spread = 0.9;
                break;
            case 'cross':
                spread = 1.5;
                break;
            default:
                spread = 3.0;
        }

        // Стоимость спреда = спред в пипах × стоимость пипа × количество лотов
        // Для упрощения используем среднюю стоимость пипа $10
        const commission = spread * 10 * positionLots;

        return {
            type: 'spread',
            spreadPips: spread,
            commission,
            currency: 'USD',
            description: 'Спред (разница между ценой покупки и продажи)'
        };
    }

    /**
     * Округление лотов
     */
    static roundLots(lots) {
        // До 2 знаков после запятой (0.01 минимальный лот)
        return Math.round(lots * 100) / 100;
    }

    /**
     * Округление пипсов
     */
    static roundPips(pips) {
        // До 1 знака после запятой
        return Math.round(pips * 10) / 10;
    }

    /**
     * Округление процентов
     */
    static roundPercent(percent) {
        // До 2 знаков после запятой
        return Math.round(percent * 100) / 100;
    }

    /**
     * Получение имени калькулятора
     */
    static getName() {
        return 'Forex Calculator';
    }

    /**
     * Получение описания калькулятора
     */
    static getDescription() {
        return 'Калькулятор для валютных пар (форекс). Основная формула: Лоты = Риск / (Пункты × Стоимость пункта за 1 лот)';
    }

    /**
     * Получение примеров инструментов
     */
    static getExamples() {
        return ['EUR/USD', 'GBP/USD', 'USD/JPY'];
    }

    /**
     * Получение настроек по умолчанию
     */
    static getDefaultSettings() {
        return {
            leverage: 100,
            lotSize: STANDARD_LOT_SIZE,
            pipSizeMajor: PIP_SIZE_MAJOR,
            pipSizeJPY: PIP_SIZE_JPY,
            commissionType: 'spread',
            swapEnabled: true,
            minTradeSize: 0.01,
            maxTradeSize: 100
        };
    }

    /**
     * Тестирование расчетов на примерах
     */
    static runTests() {
        console.log('=== Тестирование ForexCalculator ===\n');

        const testCases = [
            {
                name: 'Пример 1: EUR/USD',
                params: {
                    instrument: 'EUR/USD',
                    direction: 'long',
                    entryPrice: 1.0720,
                    slPrice: 1.0680,
                    deposit: 5000,
                    riskSize: 1,
                    accountCurrency: 'USD'
                },
                expectedLots: 0.125,
                description: 'Риск $50, 40 пунктов, стоимость пункта $10/лот'
            },
            {
                name: 'Пример 2: USD/JPY',
                params: {
                    instrument: 'USD/JPY',
                    direction: 'long',
                    entryPrice: 150.00,
                    slPrice: 149.50,
                    deposit: 10000,
                    riskSize: 2,
                    accountCurrency: 'USD'
                },
                expectedLots: 0.6,
                description: 'Риск $200, 50 пунктов, стоимость пункта ≈$6.67/лот'
            }
        ];

        testCases.forEach((testCase, index) => {
            console.log(`Тест ${index + 1}: ${testCase.name}`);
            console.log(`Описание: ${testCase.description}`);

            try {
                const result = this.calculate(testCase.params);
                const calculatedLots = result.positionLots;
                const difference = Math.abs(calculatedLots - testCase.expectedLots);
                const isCorrect = difference < 0.01;

                console.log(`Ожидалось: ${testCase.expectedLots} лотов`);
                console.log(`Рассчитано: ${calculatedLots.toFixed(3)} лотов`);
                console.log(`Разница: ${difference.toFixed(3)}`);
                console.log(`Статус: ${isCorrect ? '✅ ПРОШЕЛ' : '❌ НЕ ПРОШЕЛ'}`);
                console.log(`Формула: Лоты = ${testCase.params.deposit * (testCase.params.riskSize/100)} / (${this.calculatePipsBetweenPrices(testCase.params.entryPrice, testCase.params.slPrice, testCase.params.instrument).toFixed(1)} × ${this.calculatePipValuePerLot(testCase.params.instrument, testCase.params.entryPrice, testCase.params.accountCurrency).toFixed(2)})`);
                console.log('---\n');
            } catch (error) {
                console.log(`❌ Ошибка: ${error.message}`);
                console.log('---\n');
            }
        });
    }
}

export default ForexCalculator;
