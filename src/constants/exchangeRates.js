// src/constants/exchangeRates.js

/**
 * Константы комиссий для различных бирж
 * Комиссии указаны в процентах от объема сделки
 */
export const EXCHANGE_RATES = {
    BINANCE: {
        name: 'Binance',
        maker: 0.1,      // 0.1% для мейкеров (лимитные ордера)
        taker: 0.1,       // 0.1% для тейкеров (рыночные ордера)
        currency: 'BNB',  // Валюта для оплаты комиссий
        discount: 0.25    // 25% скидка при оплате BNB
    },
    BYBIT: {
        name: 'Bybit',
        maker: 0.1,
        taker: 0.1,
        currency: 'USDT',
        discount: 0
    },
    OKX: {
        name: 'OKX',
        maker: 0.08,
        taker: 0.1,
        currency: 'OKB',
        discount: 0.2
    },
    COINBASE: {
        name: 'Coinbase',
        maker: 0.4,
        taker: 0.6,
        currency: 'USD',
        discount: 0
    },
    CUSTOM: {
        name: 'Пользовательская',
        maker: 0.1,
        taker: 0.1,
        currency: 'USDT',
        discount: 0
    }
};

/**
 * Настройки по умолчанию
 */
export const DEFAULT_EXCHANGE = 'BINANCE';
export const DEFAULT_ORDER_TYPE = 'maker'; // 'maker' для лимитных ордеров, 'taker' для рыночных
