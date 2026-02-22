// src/calculations/calculators/CryptoCalculator.js

/**
 * Калькулятор для криптовалютных инструментов с учетом комиссий биржи
 */
class CryptoCalculator {
    /**
     * Расчет параметров позиции для криптовалют
     * @param {Object} params - Параметры расчета
     * @returns {Object} Результаты расчета
     */
    static calculate(params) {
        const {
            instrument,
            entryPrice,
            slPrice,
            tpLevels = [],
            deposit,
            riskSize,
            gridEnabled = false,
            gridOrdersCount = 3,
            gridDistribution = [],
            // Параметры комиссий
            commission = 0.1,           // базовая комиссия в %
            commissionType = 'maker',    // 'maker' или 'taker'
            exchangeCurrency = 'USDT',   // валюта комиссии
            discount = 0,                // скидка при оплате токеном биржи (0-1)
            useDiscount = false          // используем ли скидку
        } = params;

        // Шаг 1: Определяем сумму риска
        const riskAmount = deposit * (riskSize / 100);

        // Шаг 2: Рассчитываем расстояние до стоп-лосса
        const priceDiff = Math.abs(entryPrice - slPrice);
        if (priceDiff <= 0) {
            throw new Error('Цена входа и Stop Loss должны отличаться');
        }

        // Шаг 3: Учитываем комиссии в расчете риска
        // Комиссия взимается дважды: при входе и при выходе (стоп-лосс или тейк-профит)
        const effectiveCommission = useDiscount ? commission * (1 - discount) : commission;
        const totalCommissionPercent = effectiveCommission * 2 / 100; // вход + выход в десятичном виде

        // Корректируем риск с учетом комиссий
        // Чтобы чистый убыток = riskAmount, нужно учесть что часть уйдет на комиссии
        const adjustedRisk = riskAmount / (1 + totalCommissionPercent);

        // Шаг 4: Рассчитываем базовый размер позиции
        let positionSize = adjustedRisk / priceDiff;

        // Округляем до допустимого минимального объема (для крипто)
        positionSize = this.roundToStep(positionSize, this.getMinStep(instrument));

        // Шаг 5: Рассчитываем стоимость позиции
        const positionValue = positionSize * entryPrice;

        // Шаг 6: Рассчитываем комиссии
        const entryCommission = positionValue * (effectiveCommission / 100);
        const exitCommission = positionValue * (effectiveCommission / 100); // для стоп-лосса
        const totalCommission = entryCommission + exitCommission;

        // Шаг 7: Проверяем, что риск с комиссиями не превышает допустимый
        const actualRisk = Math.abs(positionSize * priceDiff) + totalCommission;
        const riskDifference = actualRisk - riskAmount;

        // Шаг 8: Рассчитываем прибыль по TP уровням с учетом комиссий
        const tpResults = this.calculateTakeProfitResults({
            tpLevels,
            entryPrice,
            positionSize,
            direction: params.direction,
            commissionRate: effectiveCommission,
            entryCommission
        });

        // Шаг 9: Расчет для сеточного входа
        let gridResults = null;
        if (gridEnabled) {
            gridResults = this.calculateGridResults({
                entryPrice,
                slPrice,
                positionSize,
                gridOrdersCount,
                gridDistribution,
                direction: params.direction,
                commissionRate: effectiveCommission
            });
        }

        // Определяем тип крипто-инструмента
        const cryptoType = this.detectCryptoType(instrument);

        return {
            // Основные результаты
            positionSize,
            positionValue,

            // Риск
            riskAmount,
            adjustedRisk,
            actualRisk,
            riskDifference: riskDifference > 0 ? riskDifference : 0,

            // Комиссии
            commission: {
                rate: effectiveCommission,
                type: commissionType,
                currency: exchangeCurrency,
                entry: entryCommission,
                exit: exitCommission,
                total: totalCommission,
                withDiscount: useDiscount,
                originalRate: commission,
                discount: discount * 100
            },

            // Цены
            entryPrice,
            slPrice,
            stopLossDistance: priceDiff,

            // Take Profit результаты
            tpResults,

            // Сеточные результаты
            gridResults,

            // Дополнительная информация
            calculatorType: 'crypto',
            instrumentType: cryptoType,

            // Метрики
            riskToDepositRatio: (actualRisk / deposit) * 100,
            positionToDepositRatio: (positionValue / deposit) * 100,

            timestamp: new Date().toISOString()
        };
    }

    /**
     * Расчет результатов Take Profit с учетом комиссий
     */
    static calculateTakeProfitResults({
        tpLevels,
        entryPrice,
        positionSize,
        direction,
        commissionRate,
        entryCommission
    }) {
        if (!tpLevels || tpLevels.length === 0) {
            return [];
        }

        return tpLevels.map((tp, index) => {
            const tpPrice = parseFloat(tp.price);
            const volumePercent = parseFloat(tp.percent) || 100;
            const tpPositionSize = positionSize * (volumePercent / 100);

            // Расчет прибыли до комиссий
            let grossProfit;
            if (direction === 'long') {
                grossProfit = (tpPrice - entryPrice) * tpPositionSize;
            } else {
                grossProfit = (entryPrice - tpPrice) * tpPositionSize;
            }

            // Комиссия при выходе по TP
            const tpValue = tpPositionSize * tpPrice;
            const tpCommission = tpValue * (commissionRate / 100);

            // Распределяем входную комиссию пропорционально объему
            const proportionalEntryCommission = entryCommission * (volumePercent / 100);

            // Чистая прибыль
            const netProfit = grossProfit - tpCommission - proportionalEntryCommission;

            // Рентабельность в процентах
            const investment = tpPositionSize * entryPrice;
            const profitPercent = (netProfit / investment) * 100;

            return {
                price: tpPrice,
                volumePercent,
                grossProfit,
                netProfit,
                profitPercent: this.roundPercent(profitPercent),
                commission: {
                    entry: proportionalEntryCommission,
                    exit: tpCommission,
                    total: tpCommission + proportionalEntryCommission
                },
                rrRatio: this.calculateRRRatio(grossProfit, investment, commissionRate)
            };
        });
    }

    /**
     * Расчет сеточного входа с учетом комиссий
     */
    static calculateGridResults({
        entryPrice,
        slPrice,
        positionSize,
        gridOrdersCount,
        gridDistribution,
        direction,
        commissionRate
    }) {
        const priceRange = Math.abs(entryPrice - slPrice);
        const gridStep = priceRange / (gridOrdersCount + 1);

        const gridOrders = [];
        let totalPositionSize = 0;
        let totalValue = 0;
        let totalCommissions = 0;

        for (let i = 0; i < gridOrdersCount; i++) {
            const percent = gridDistribution[i] || (100 / gridOrdersCount);
            const orderSize = positionSize * (percent / 100);
            const validatedSize = this.roundToStep(orderSize, this.getMinStep());

            // Цена ордера
            let orderPrice;
            if (direction === 'long') {
                orderPrice = entryPrice - (gridStep * (i + 1));
            } else {
                orderPrice = entryPrice + (gridStep * (i + 1));
            }

            const orderValue = validatedSize * orderPrice;
            const orderCommission = orderValue * (commissionRate / 100);
            const orderRisk = Math.abs(orderPrice - slPrice) * validatedSize;

            gridOrders.push({
                order: i + 1,
                price: orderPrice,
                size: validatedSize,
                value: orderValue,
                commission: orderCommission,
                risk: orderRisk,
                percent: percent
            });

            totalPositionSize += validatedSize;
            totalValue += orderValue;
            totalCommissions += orderCommission;
        }

        // Расчет средней цены
        const avgPrice = gridOrders.reduce((sum, order) =>
            sum + (order.price * order.size), 0
        ) / totalPositionSize;

        return {
            orders: gridOrders,
            totalPositionSize,
            totalValue,
            totalCommissions,
            avgPrice,
            gridStep
        };
    }

    /**
     * Расчет соотношения риск/прибыль с учетом комиссий
     */
    static calculateRRRatio(profit, investment, commissionRate) {
        const totalCommission = investment * (commissionRate / 100) * 2;
        const netProfit = profit - totalCommission;
        const risk = investment * 0.01; // упрощенно
        return netProfit / risk;
    }

    /**
     * Определение типа крипто-инструмента
     */
    static detectCryptoType(instrument) {
        if (!instrument) return 'spot';

        const upperInstrument = instrument.toUpperCase();

        if (upperInstrument.includes('USDT')) {
            if (upperInstrument.includes('PERP') || upperInstrument.includes('FUTURES')) {
                return 'perpetual';
            }
            return 'spot';
        }
        if (upperInstrument.includes('BTC') || upperInstrument.includes('ETH')) {
            return 'spot';
        }
        return 'spot';
    }

    /**
     * Округление до допустимого шага
     */
    static roundToStep(value, step = 0.0001) {
        return Math.floor(value / step) * step;
    }

    /**
     * Получение минимального шага для инструмента
     */
    static getMinStep(instrument) {
        const upperInstrument = instrument?.toUpperCase() || '';

        if (upperInstrument.includes('BTC')) {
            return 0.00001; // BTC: 0.00001 BTC
        } else if (upperInstrument.includes('ETH')) {
            return 0.0001;  // ETH: 0.0001 ETH
        } else {
            return 0.0001;  // По умолчанию
        }
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
        return 'Crypto Calculator (с комиссиями)';
    }

    /**
     * Получение описания калькулятора
     */
    static getDescription() {
        return 'Калькулятор для криптовалют с учетом комиссий биржи (maker/taker)';
    }

    /**
     * Получение примеров инструментов
     */
    static getExamples() {
        return ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT'];
    }

    /**
     * Получение настроек по умолчанию
     */
    static getDefaultSettings() {
        return {
            leverage: 1,
            minTradeSize: 0.0001,
            commission: 0.1,
            commissionType: 'maker',
            fundingRate: 0.01,
            supportedExchanges: ['Binance', 'Bybit', 'OKX', 'Custom']
        };
    }
}

export default CryptoCalculator;
