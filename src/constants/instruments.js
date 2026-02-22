// src/constants/instruments.js

// Типы инструментов
export const INSTRUMENT_TYPES = {
    FOREX: 'forex',
    CRYPTO_SPOT: 'crypto_spot',
    CRYPTO_FUTURES: 'crypto_futures',
    STOCKS: 'stocks',
    INDICES: 'indices',
    COMMODITIES: 'commodities',
    METALS: 'metals',
    BONDS: 'bonds',
    ETF: 'etf',
    OPTIONS: 'options'
};

// Категории инструментов
export const INSTRUMENT_CATEGORIES = {
    FOREX: {
        name: 'Форекс (Валютные пары)',
        types: [
            { id: 'forex_major', name: 'Мажорные пары', icon: '💵' },
            { id: 'forex_minor', name: 'Минорные пары', icon: '💱' },
            { id: 'forex_exotic', name: 'Экзотические пары', icon: '🌍' },
            { id: 'forex_cross', name: 'Кросс-пары', icon: '🔄' }
        ]
    },
    CRYPTO: {
        name: 'Криптовалюты',
        types: [
            { id: 'crypto_spot', name: 'Спот (Spot)', icon: '₿' },
            { id: 'crypto_futures', name: 'Фьючерсы (Futures)', icon: '📈' },
            { id: 'crypto_perpetual', name: 'Перпетуальные', icon: '∞' },
            { id: 'crypto_margin', name: 'Маржинальная торговля', icon: '⚖️' }
        ]
    },
    STOCKS: {
        name: 'Акции',
        types: [
            { id: 'stocks_us', name: 'Акции США', icon: '🇺🇸' },
            { id: 'stocks_eu', name: 'Акции Европы', icon: '🇪🇺' },
            { id: 'stocks_asia', name: 'Акции Азии', icon: '🌏' },
            { id: 'stocks_emerging', name: 'Акции развивающихся рынков', icon: '🚀' }
        ]
    },
    INDICES: {
        name: 'Индексы',
        types: [
            { id: 'indices_world', name: 'Мировые индексы', icon: '🌐' },
            { id: 'indices_sector', name: 'Отраслевые индексы', icon: '🏭' },
            { id: 'indices_volatility', name: 'Волатильность (VIX)', icon: '📊' }
        ]
    },
    COMMODITIES: {
        name: 'Товары',
        types: [
            { id: 'metals', name: 'Металлы', icon: '🥇' },
            { id: 'energy', name: 'Энергоносители', icon: '⛽' },
            { id: 'agricultural', name: 'Сельхозтовары', icon: '🌽' },
            { id: 'soft', name: 'Soft commodities', icon: '☕' }
        ]
    }
};

// Детальная информация по каждому типу
export const INSTRUMENT_DETAILS = {
    // Forex
    forex_major: {
        name: 'Мажорные валютные пары',
        description: 'Пары с USD как основной валютой',
        examples: ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD'],
        lotSize: 100000,
        marginRequirement: 0.01,
        priceStep: 0.0001,
        minTradeSize: 0.01,
        maxTradeSize: 100,
        commission: 'Spread',
        tradingHours: '24/5',
        swapEnabled: true
    },
    forex_minor: {
        name: 'Минорные валютные пары',
        description: 'Пары без USD (кросс-пары)',
        examples: ['EUR/GBP', 'EUR/JPY', 'GBP/JPY', 'AUD/NZD', 'CAD/JPY'],
        lotSize: 100000,
        marginRequirement: 0.02,
        priceStep: 0.0001,
        minTradeSize: 0.01,
        maxTradeSize: 50,
        commission: 'Spread',
        tradingHours: '24/5',
        swapEnabled: true
    },
    crypto_spot: {
        name: 'Криптовалюты (Spot)',
        description: 'Непосредственная покупка криптовалют',
        examples: ['BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'XRP/USDT', 'ADA/USDT'],
        lotSize: 1,
        marginRequirement: 1,
        priceStep: 0.01,
        minTradeSize: 0.0001,
        maxTradeSize: 1000,
        commission: '0.1%',
        tradingHours: '24/7',
        swapEnabled: false
    },
    crypto_futures: {
        name: 'Крипто-фьючерсы',
        description: 'Контракты на будущую поставку криптовалют',
        examples: ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT'],
        lotSize: 1,
        marginRequirement: 0.05,
        priceStep: 0.01,
        minTradeSize: 0.001,
        maxTradeSize: 100,
        commission: '0.02%',
        tradingHours: '24/7',
        swapEnabled: false,
        fundingRate: true
    },
    stocks_us: {
        name: 'Акции США',
        description: 'Акции американских компаний',
        examples: ['AAPL', 'TSLA', 'AMZN', 'GOOGL', 'MSFT', 'NVDA'],
        lotSize: 1,
        marginRequirement: 0.5,
        priceStep: 0.01,
        minTradeSize: 1,
        maxTradeSize: 10000,
        commission: '0.005 USD per share',
        tradingHours: '9:30-16:00 EST',
        swapEnabled: false,
        dividendAdjustment: true
    },
    metals: {
        name: 'Драгоценные металлы',
        description: 'Золото, серебро, платина, палладий',
        examples: ['XAU/USD', 'XAG/USD', 'XPT/USD', 'XPD/USD'],
        lotSize: 100,
        marginRequirement: 0.01,
        priceStep: 0.01,
        minTradeSize: 0.01,
        maxTradeSize: 100,
        commission: 'Spread',
        tradingHours: '24/5',
        swapEnabled: true
    },
    indices_world: {
        name: 'Мировые индексы',
        description: 'Фондовые индексы разных стран',
        examples: ['SPX', 'DJI', 'NDX', 'FTSE', 'DAX', 'NIKKEI'],
        lotSize: 1,
        marginRequirement: 0.02,
        priceStep: 0.1,
        minTradeSize: 0.1,
        maxTradeSize: 1000,
        commission: 'Spread',
        tradingHours: 'Market hours',
        swapEnabled: false,
        cashSettled: true
    }
};
