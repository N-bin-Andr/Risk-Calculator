// src/calculations/calculators/StockCalculator.js
/**
 * Калькулятор для акций
 */
class StockCalculator {
    static calculate(params) {
        // Базовая реализация
        const { instrument, entryPrice, slPrice, deposit, riskSize } = params;

        const riskAmount = deposit * (riskSize / 100);
        const priceDiff = Math.abs(entryPrice - slPrice);
        const shares = Math.floor(riskAmount / priceDiff);
        const positionValue = shares * entryPrice;

        return {
            shares,
            positionValue,
            riskAmount,
            calculatorType: 'stocks',
            commission: this.calculateCommission(shares, entryPrice)
        };
    }

    static calculateCommission(shares, price) {
        // Пример: $0.005 за акцию
        return shares * 0.005;
    }

    static getName() { return 'Stock Calculator'; }
    static getDescription() { return 'Калькулятор для акций с учетом комиссий'; }
    static getExamples() { return ['AAPL', 'TSLA', 'AMZN']; }
    static getDefaultSettings() {
        return {
            leverage: 2,
            minShares: 1,
            commissionPerShare: 0.005,
            dividendAdjustment: true
        };
    }
}

export default StockCalculator;
