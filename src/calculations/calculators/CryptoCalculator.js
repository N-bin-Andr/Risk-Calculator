
// src/calculations/calculators/CryptoCalculator.js
/**
 * Калькулятор для криптовалютных инструментов
 */
class CryptoCalculator {
    static calculate(params) {
        // Базовая реализация
        const { instrument, entryPrice, slPrice, deposit, riskSize } = params;

        const riskAmount = deposit * (riskSize / 100);
        const priceDiff = Math.abs(entryPrice - slPrice);
        const positionSize = riskAmount / priceDiff;
        const positionValue = positionSize * entryPrice;

        return {
            positionSize,
            positionValue,
            riskAmount,
            calculatorType: 'crypto',
            instrumentType: this.detectCryptoType(instrument)
        };
    }

    static detectCryptoType(instrument) {
        if (instrument.includes('USDT')) return 'spot';
        if (instrument.includes('-PERP')) return 'perpetual';
        if (instrument.includes('FUTURES')) return 'futures';
        return 'spot';
    }

    static getName() { return 'Crypto Calculator'; }
    static getDescription() { return 'Калькулятор для криптовалютных инструментов'; }
    static getExamples() { return ['BTCUSDT', 'ETHUSDT', 'BNBUSDT']; }
    static getDefaultSettings() {
        return {
            leverage: 1,
            minTradeSize: 0.0001,
            commission: 0.1,
            fundingRate: 0.01
        };
    }
}

export default CryptoCalculator;

