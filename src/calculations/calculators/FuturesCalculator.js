// src/calculations/calculators/FuturesCalculator.js

/**
 * Калькулятор для фьючерсных контрактов
 */
class FuturesCalculator {
    /**
     * Расчет параметров позиции для фьючерсов
     * @param {Object} params - Параметры расчета
     * @returns {Object} Результаты расчета
     */
    static calculate(params) {
        const {
            instrument,
            direction,
            entryPrice,
            slPrice,
            tpLevels = [],
            deposit,
            riskSize,
            gridEnabled = false,
            gridOrdersCount = 3,
            gridDistribution = [],
            leverage = 10,
            contractSize = 1,
            tickSize = 0.01,
            tickValue = 1,
            marginType = 'isolated', // 'isolated' или 'cross'
            accountCurrency = 'USD'
        } = params;

        // Шаг 1: Определяем сумму риска
        const riskAmount = deposit * (riskSize / 100);

        // Шаг 2: Рассчитываем расстояние до стоп-лосса в тиках
        const stopLossTicks = this.calculateTicksBetweenPrices(entryPrice, slPrice, tickSize);

        // Шаг 3: Рассчитываем стоимость одного тика
        const tickValuePerContract = tickValue;

        // Шаг 4: Рассчитываем количество контрактов
        let contracts = Math.floor(riskAmount / (stopLossTicks * tickValuePerContract));
        contracts = Math.max(1, contracts); // Минимум 1 контракт

        // Шаг 5: Рассчитываем стоимость позиции
        const positionValue = contracts * contractSize * entryPrice;

        // Шаг 6: Рассчитываем маржинальные требования
        const marginRequired = this.calculateMarginRequired(positionValue, leverage, marginType);

        // Шаг 7: Рассчитываем прибыль по TP уровням
        const tpResults = this.calculateTakeProfitResults({
            tpLevels,
            entryPrice,
            contracts,
            tickSize,
            tickValue,
            direction
        });

        // Шаг 8: Расчет для сеточного входа
        let gridResults = null;
        if (gridEnabled) {
            gridResults = this.calculateGridResults({
                entryPrice,
                slPrice,
                contracts,
                gridOrdersCount,
                gridDistribution,
                tickSize,
                tickValue,
                direction,
                leverage,
                contractSize,
                marginType
            });
        }

        return {
            // Основные результаты
            contracts,
            positionValue,
            marginRequired,
            leverage,
            contractSize,

            // Риск
            riskAmount,
            stopLossTicks,
            tickValue: tickValuePerContract,
            tickSize,

            // Take Profit результаты
            tpResults,

            // Сеточные результаты
            gridResults,

            // Дополнительная информация
            marginType,
            marginUtilization: (marginRequired / deposit) * 100,
            freeMargin: deposit - marginRequired,
            liquidationPrice: this.calculateLiquidationPrice({
                entryPrice,
                contracts,
                positionValue,
                marginRequired,
                direction,
                marginType,
                leverage
            }),

            // Метрики
            riskPerTick: riskAmount / stopLossTicks,
            calculatorType: 'futures',
            instrumentType: this.detectFuturesType(instrument),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Расчет количества тиков между ценами
     */
    static calculateTicksBetweenPrices(price1, price2, tickSize) {
        return Math.abs(price1 - price2) / tickSize;
    }

    /**
     * Расчет требуемой маржи
     */
    static calculateMarginRequired(positionValue, leverage, marginType = 'isolated') {
        const initialMargin = positionValue / leverage;

        if (marginType === 'isolated') {
            return initialMargin;
        } else {
            // Для cross-margin возвращаем ту же сумму, но в реальности логика сложнее
            return initialMargin;
        }
    }

    /**
     * Расчет цены ликвидации
     */
    static calculateLiquidationPrice({
        entryPrice,
        contracts,
        positionValue,
        marginRequired,
        direction,
        marginType,
        leverage
    }) {
        const maintenanceMargin = positionValue * 0.005; // 0.5% для примера
        const availableMargin = marginRequired - maintenanceMargin;

        if (direction === 'long') {
            return entryPrice - (availableMargin / (contracts * positionValue / entryPrice));
        } else {
            return entryPrice + (availableMargin / (contracts * positionValue / entryPrice));
        }
    }

    /**
     * Расчет результатов Take Profit
     */
    static calculateTakeProfitResults(params) {
        const {
            tpLevels,
            entryPrice,
            contracts,
            tickSize,
            tickValue,
            direction
        } = params;

        if (!tpLevels || tpLevels.length === 0) {
            return [];
        }

        return tpLevels.map(tp => {
            const ticks = this.calculateTicksBetweenPrices(entryPrice, tp.price, tickSize);
            const profit = ticks * tickValue * contracts;
            const profitPercent = (profit / (contracts * entryPrice)) * 100;

            return {
                price: tp.price,
                ticks,
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
            contracts,
            gridOrdersCount,
            gridDistribution,
            tickSize,
            tickValue,
            direction,
            leverage,
            contractSize,
            marginType
        } = params;

        const stopLossTicks = this.calculateTicksBetweenPrices(entryPrice, slPrice, tickSize);
        const gridStepTicks = stopLossTicks / (gridOrdersCount + 1);

        const gridOrders = [];
        let totalContracts = 0;
        let totalMargin = 0;
        let totalInvestment = 0;

        for (let i = 0; i < gridOrdersCount; i++) {
            const percent = gridDistribution[i] || (100 / gridOrdersCount);
            const orderContracts = Math.floor(contracts * (percent / 100));
            const validatedContracts = Math.max(1, orderContracts);

            // Цена ордера зависит от направления
            let orderPrice;
            if (direction === 'long') {
                orderPrice = entryPrice - (gridStepTicks * (i + 1) * tickSize);
            } else {
                orderPrice = entryPrice + (gridStepTicks * (i + 1) * tickSize);
            }

            const orderValue = validatedContracts * contractSize * orderPrice;
            const orderMargin = this.calculateMarginRequired(orderValue, leverage, marginType);
            const orderTicksToSL = this.calculateTicksBetweenPrices(orderPrice, slPrice, tickSize);
            const orderRisk = orderTicksToSL * tickValue * validatedContracts;

            gridOrders.push({
                order: i + 1,
                price: orderPrice,
                contracts: validatedContracts,
                value: orderValue,
                margin: orderMargin,
                ticksToSL: Math.round(orderTicksToSL),
                risk: orderRisk,
                percent: percent
            });

            totalContracts += validatedContracts;
            totalMargin += orderMargin;
            totalInvestment += orderValue;
        }

        // Расчет средней цены
        const avgPrice = gridOrders.reduce((sum, order) =>
            sum + (order.price * order.contracts), 0
        ) / totalContracts;

        return {
            orders: gridOrders,
            totalContracts,
            totalInvestment,
            totalMargin,
            avgPrice,
            gridStepTicks: Math.round(gridStepTicks),
            gridStep: gridStepTicks * tickSize
        };
    }

    /**
     * Определение типа фьючерса
     */
    static detectFuturesType(instrument) {
        const upperInstrument = instrument.toUpperCase();

        if (upperInstrument.includes('BTC') || upperInstrument.includes('ETH')) {
            return 'crypto_futures';
        } else if (upperInstrument.includes('ES') || upperInstrument.includes('NQ')) {
            return 'index_futures';
        } else if (upperInstrument.includes('CL') || upperInstrument.includes('NG')) {
            return 'commodity_futures';
        } else if (upperInstrument.includes('GC') || upperInstrument.includes('SI')) {
            return 'metal_futures';
        }
        return 'other_futures';
    }

    /**
     * Округление процентов
     */
    static roundPercent(percent) {
        return Math.round(percent * 100) / 100;
    }

    /**
     * Получение имени калькулятора
     */
    static getName() {
        return 'Futures Calculator';
    }

    /**
     * Получение описания калькулятора
     */
    static getDescription() {
        return 'Калькулятор для фьючерсных контрактов с учетом маржинальных требований и цены ликвидации';
    }

    /**
     * Получение примеров инструментов
     */
    static getExamples() {
        return ['BTCUSDT', 'ETHUSDT', 'ES', 'NQ', 'CL', 'GC'];
    }

    /**
     * Получение настроек по умолчанию
     */
    static getDefaultSettings() {
        return {
            leverage: 10,
            contractSize: 1,
            tickSize: 0.01,
            tickValue: 1,
            marginType: 'isolated',
            maintenanceMargin: 0.005,
            minContracts: 1,
            maxContracts: 1000
        };
    }
}

export default FuturesCalculator;
