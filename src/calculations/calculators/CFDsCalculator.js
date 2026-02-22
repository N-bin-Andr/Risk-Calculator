// src/calculations/calculators/CFDsCalculator.js

/**
 * Калькулятор для CFD контрактов (Контракты на разницу)
 */
class CFDsCalculator {
    /**
     * Расчет параметров позиции для CFD
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
            commission = 0.1, // комиссия в % от объема
            commissionType = 'percentage', // 'percentage', 'fixed', 'per_unit'
            overnightFee = 0,
        } = params;

        // Шаг 1: Определяем сумму риска
        const riskAmount = deposit * (riskSize / 100);

        // Шаг 2: Рассчитываем расстояние до стоп-лосса
        const priceDiff = Math.abs(entryPrice - slPrice);
        if (priceDiff <= 0) {
            throw new Error('Цена входа и Stop Loss должны отличаться');
        }

        // Шаг 3: Рассчитываем количество контрактов
        let contracts = Math.floor(riskAmount / (priceDiff * contractSize));
        contracts = Math.max(1, contracts); // Минимум 1 контракт

        // Шаг 4: Рассчитываем стоимость позиции
        const positionValue = contracts * contractSize * entryPrice;

        // Шаг 5: Рассчитываем маржинальные требования
        const marginRequired = positionValue / leverage;

        // Шаг 6: Рассчитываем комиссию
        const commissionAmount = this.calculateCommission({
            positionValue,
            contracts,
            contractSize,
            entryPrice,
            commission,
            commissionType
        });

        // Шаг 7: Рассчитываем прибыль по TP уровням
        const tpResults = this.calculateTakeProfitResults({
            tpLevels,
            entryPrice,
            contracts,
            contractSize,
            direction,
            commissionAmount
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
                contractSize,
                direction,
                leverage,
                commission,
                commissionType
            });
        }

        // Шаг 9: Расчет overnight fees (если позиция держится более 1 дня)
        const overnightFees = overnightFee * contracts;

        return {
            // Основные результаты
            contracts,
            positionValue,
            marginRequired,
            leverage,
            contractSize,

            // Риск
            riskAmount,
            stopLossDistance: priceDiff,
            stopLossPercent: (priceDiff / entryPrice) * 100,

            // Комиссии
            commission: commissionAmount,
            commissionType,
            commissionRate: commission,
            overnightFees,

            // Take Profit результаты
            tpResults,

            // Сеточные результаты
            gridResults,

            // Дополнительная информация
            marginUtilization: (marginRequired / deposit) * 100,
            freeMargin: deposit - marginRequired,
            breakevenPrice: this.calculateBreakevenPrice({
                entryPrice,
                contracts,
                contractSize,
                direction,
                commissionAmount
            }),

            // Метрики
            calculatorType: 'cfd',
            instrumentType: this.detectCFDType(instrument),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Расчет комиссии
     */
    static calculateCommission({
        positionValue,
        contracts,
        contractSize,
        entryPrice,
        commission,
        commissionType
    }) {
        switch (commissionType) {
            case 'percentage':
                return positionValue * (commission / 100);

            case 'fixed':
                return commission;

            case 'per_unit':
                return contracts * contractSize * commission;

            case 'per_contract':
                return contracts * commission;

            default:
                return positionValue * (commission / 100);
        }
    }

    /**
     * Расчет цены безубыточности
     */
    static calculateBreakevenPrice({
        entryPrice,
        contracts,
        contractSize,
        direction,
        commissionAmount
    }) {
        const commissionPerUnit = commissionAmount / (contracts * contractSize);

        if (direction === 'long') {
            return entryPrice + commissionPerUnit;
        } else {
            return entryPrice - commissionPerUnit;
        }
    }

    /**
     * Расчет результатов Take Profit
     */
    static calculateTakeProfitResults({
        tpLevels,
        entryPrice,
        contracts,
        contractSize,
        direction,
        commissionAmount
    }) {
        if (!tpLevels || tpLevels.length === 0) {
            return [];
        }

        const commissionPerContract = commissionAmount / contracts;

        return tpLevels.map(tp => {
            const tpPrice = parseFloat(tp.price);
            const volumePercent = parseFloat(tp.percent) || 100;
            const tpContracts = Math.floor(contracts * (volumePercent / 100));

            let profit;
            if (direction === 'long') {
                profit = (tpPrice - entryPrice) * tpContracts * contractSize;
            } else {
                profit = (entryPrice - tpPrice) * tpContracts * contractSize;
            }

            // Вычитаем комиссию пропорционально объему
            const tpCommission = commissionPerContract * tpContracts;
            const netProfit = profit - tpCommission;

            const profitPercent = (netProfit / (tpContracts * contractSize * entryPrice)) * 100;

            return {
                price: tpPrice,
                profit: netProfit,
                profitPercent: this.roundPercent(profitPercent),
                volumePercent,
                contracts: tpContracts,
                grossProfit: profit,
                commission: tpCommission
            };
        });
    }

    /**
     * Расчет сеточного входа
     */
    static calculateGridResults({
        entryPrice,
        slPrice,
        contracts,
        gridOrdersCount,
        gridDistribution,
        contractSize,
        direction,
        leverage,
        commission,
        commissionType
    }) {
        const priceRange = Math.abs(entryPrice - slPrice);
        const gridStep = priceRange / (gridOrdersCount + 1);

        const gridOrders = [];
        let totalContracts = 0;
        let totalMargin = 0;
        let totalInvestment = 0;
        let totalCommission = 0;

        for (let i = 0; i < gridOrdersCount; i++) {
            const percent = gridDistribution[i] || (100 / gridOrdersCount);
            const orderContracts = Math.floor(contracts * (percent / 100));
            const validatedContracts = Math.max(1, orderContracts);

            // Цена ордера
            let orderPrice;
            if (direction === 'long') {
                orderPrice = entryPrice - (gridStep * (i + 1));
            } else {
                orderPrice = entryPrice + (gridStep * (i + 1));
            }

            const orderValue = validatedContracts * contractSize * orderPrice;
            const orderMargin = orderValue / leverage;

            // Расчет комиссии для ордера
            const orderCommission = this.calculateCommission({
                positionValue: orderValue,
                contracts: validatedContracts,
                contractSize,
                entryPrice: orderPrice,
                commission,
                commissionType
            });

            const orderRisk = Math.abs(orderPrice - slPrice) * validatedContracts * contractSize;

            gridOrders.push({
                order: i + 1,
                price: orderPrice,
                contracts: validatedContracts,
                value: orderValue,
                margin: orderMargin,
                commission: orderCommission,
                distanceToSL: Math.abs(orderPrice - slPrice),
                risk: orderRisk,
                percent: percent
            });

            totalContracts += validatedContracts;
            totalMargin += orderMargin;
            totalInvestment += orderValue;
            totalCommission += orderCommission;
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
            totalCommission,
            avgPrice,
            gridStep
        };
    }

    /**
     * Определение типа CFD
     */
    static detectCFDType(instrument) {
        const upperInstrument = instrument.toUpperCase();

        if (upperInstrument.includes('BTC') || upperInstrument.includes('ETH')) {
            return 'crypto_cfd';
        } else if (upperInstrument.includes('AAPL') || upperInstrument.includes('TSLA')) {
            return 'stock_cfd';
        } else if (upperInstrument.includes('SPX') || upperInstrument.includes('NAS')) {
            return 'index_cfd';
        } else if (upperInstrument.includes('XAU') || upperInstrument.includes('XAG')) {
            return 'commodity_cfd';
        } else if (upperInstrument.includes('/')) {
            return 'forex_cfd';
        }
        return 'other_cfd';
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
        return 'CFDs Calculator';
    }

    /**
     * Получение описания калькулятора
     */
    static getDescription() {
        return 'Калькулятор для CFD контрактов с учетом комиссий и overnight fees';
    }

    /**
     * Получение примеров инструментов
     */
    static getExamples() {
        return ['BTC/USD', 'AAPL', 'SPX', 'XAU/USD', 'EUR/USD'];
    }

    /**
     * Получение настроек по умолчанию
     */
    static getDefaultSettings() {
        return {
            leverage: 10,
            contractSize: 1,
            commission: 0.1,
            commissionType: 'percentage',
            overnightFee: 0,
            minContracts: 1,
            maxContracts: 1000,
            allowedCommissionTypes: ['percentage', 'fixed', 'per_unit', 'per_contract']
        };
    }
}

export default CFDsCalculator;
