// src/calculations/types/instrumentTypes.js
/**
 * Классификация и определение типов финансовых инструментов
 */

// Основные категории инструментов
export const INSTRUMENT_CATEGORIES = {
    FOREX: 'forex',
    CRYPTO: 'crypto',
    STOCKS: 'stocks',
    FUTURES: 'futures',
    INDICES: 'indices',
    COMMODITIES: 'commodities',
    METALS: 'metals',
    BONDS: 'bonds',
    ETF: 'etf',
    OPTIONS: 'options',
    CFDS: 'cfds'
};

// Подтипы инструментов
export const INSTRUMENT_SUBTYPES = {
    // Forex
    FOREX_MAJOR: 'forex_major',
    FOREX_MINOR: 'forex_minor',
    FOREX_EXOTIC: 'forex_exotic',
    FOREX_CROSS: 'forex_cross',

    // Crypto
    CRYPTO_SPOT: 'crypto_spot',
    CRYPTO_FUTURES: 'crypto_futures',
    CRYPTO_PERPETUAL: 'crypto_perpetual',
    CRYPTO_MARGIN: 'crypto_margin',

    // Stocks
    STOCKS_US: 'stocks_us',
    STOCKS_EU: 'stocks_eu',
    STOCKS_ASIA: 'stocks_asia',
    STOCKS_EMERGING: 'stocks_emerging',

    // Metals
    METALS_PRECIOUS: 'metals_precious',
    METALS_INDUSTRIAL: 'metals_industrial',

    // Commodities
    COMMODITIES_ENERGY: 'commodities_energy',
    COMMODITIES_AGRICULTURAL: 'commodities_agricultural',
    COMMODITIES_SOFT: 'commodities_soft',

    // Indices
    INDICES_WORLD: 'indices_world',
    INDICES_SECTOR: 'indices_sector',
    INDICES_VOLATILITY: 'indices_volatility'
};

// Маппинг типов инструментов на категории
export const TYPE_TO_CATEGORY = {
    [INSTRUMENT_SUBTYPES.FOREX_MAJOR]: INSTRUMENT_CATEGORIES.FOREX,
    [INSTRUMENT_SUBTYPES.FOREX_MINOR]: INSTRUMENT_CATEGORIES.FOREX,
    [INSTRUMENT_SUBTYPES.FOREX_EXOTIC]: INSTRUMENT_CATEGORIES.FOREX,
    [INSTRUMENT_SUBTYPES.FOREX_CROSS]: INSTRUMENT_CATEGORIES.FOREX,

    [INSTRUMENT_SUBTYPES.CRYPTO_SPOT]: INSTRUMENT_CATEGORIES.CRYPTO,
    [INSTRUMENT_SUBTYPES.CRYPTO_FUTURES]: INSTRUMENT_CATEGORIES.CRYPTO,
    [INSTRUMENT_SUBTYPES.CRYPTO_PERPETUAL]: INSTRUMENT_CATEGORIES.CRYPTO,
    [INSTRUMENT_SUBTYPES.CRYPTO_MARGIN]: INSTRUMENT_CATEGORIES.CRYPTO,

    [INSTRUMENT_SUBTYPES.STOCKS_US]: INSTRUMENT_CATEGORIES.STOCKS,
    [INSTRUMENT_SUBTYPES.STOCKS_EU]: INSTRUMENT_CATEGORIES.STOCKS,
    [INSTRUMENT_SUBTYPES.STOCKS_ASIA]: INSTRUMENT_CATEGORIES.STOCKS,
    [INSTRUMENT_SUBTYPES.STOCKS_EMERGING]: INSTRUMENT_CATEGORIES.STOCKS,

    [INSTRUMENT_SUBTYPES.METALS_PRECIOUS]: INSTRUMENT_CATEGORIES.METALS,
    [INSTRUMENT_SUBTYPES.METALS_INDUSTRIAL]: INSTRUMENT_CATEGORIES.METALS,

    [INSTRUMENT_SUBTYPES.COMMODITIES_ENERGY]: INSTRUMENT_CATEGORIES.COMMODITIES,
    [INSTRUMENT_SUBTYPES.COMMODITIES_AGRICULTURAL]: INSTRUMENT_CATEGORIES.COMMODITIES,
    [INSTRUMENT_SUBTYPES.COMMODITIES_SOFT]: INSTRUMENT_CATEGORIES.COMMODITIES,

    [INSTRUMENT_SUBTYPES.INDICES_WORLD]: INSTRUMENT_CATEGORIES.INDICES,
    [INSTRUMENT_SUBTYPES.INDICES_SECTOR]: INSTRUMENT_CATEGORIES.INDICES,
    [INSTRUMENT_SUBTYPES.INDICES_VOLATILITY]: INSTRUMENT_CATEGORIES.INDICES
};

// Паттерны для определения типа инструмента
const INSTRUMENT_PATTERNS = [
    // Forex Major (пары с USD)
    {
        pattern: /^(EUR|GBP|AUD|NZD|USD|CAD|CHF|JPY)\/(USD|EUR|GBP|JPY|CHF|CAD|AUD|NZD)$/i,
        type: INSTRUMENT_SUBTYPES.FOREX_MAJOR,
        category: INSTRUMENT_CATEGORIES.FOREX
    },
    // Forex Minor (кросс-пары без USD)
    {
        pattern: /^(EUR|GBP|AUD|NZD|CHF|JPY|CAD)\/(EUR|GBP|AUD|NZD|CHF|JPY|CAD)$/i,
        type: INSTRUMENT_SUBTYPES.FOREX_MINOR,
        category: INSTRUMENT_CATEGORIES.FOREX
    },
    // Metals (XAU, XAG, etc)
    {
        pattern: /^(XAU|XAG|XPT|XPD)\/(USD|EUR|GBP)$/i,
        type: INSTRUMENT_SUBTYPES.METALS_PRECIOUS,
        category: INSTRUMENT_CATEGORIES.METALS
    },
    // Crypto Spot (USDT пары)
    {
        pattern: /^(BTC|ETH|BNB|XRP|ADA|SOL|DOT|DOGE|AVAX|MATIC)USDT$/i,
        type: INSTRUMENT_SUBTYPES.CRYPTO_SPOT,
        category: INSTRUMENT_CATEGORIES.CRYPTO
    },
    // Crypto Futures (фьючерсы)
    {
        pattern: /^(BTC|ETH|BNB|XRP|ADA|SOL)USD(T)?-PERP$/i,
        type: INSTRUMENT_SUBTYPES.CRYPTO_FUTURES,
        category: INSTRUMENT_CATEGORIES.CRYPTO
    },
    // US Stocks (тикеры акций)
    {
        pattern: /^(AAPL|TSLA|AMZN|GOOGL|MSFT|NVDA|META|NFLX|AMD|INTC)$/i,
        type: INSTRUMENT_SUBTYPES.STOCKS_US,
        category: INSTRUMENT_CATEGORIES.STOCKS
    },
    // Индексы
    {
        pattern: /^(SPX|DJI|NDX|FTSE|DAX|CAC|NIKKEI|HSI)\.(MX|ME)$/i,
        type: INSTRUMENT_SUBTYPES.INDICES_WORLD,
        category: INSTRUMENT_CATEGORIES.INDICES
    },
    // Энергоносители
    {
        pattern: /^(CL|BRENT|WTI|NG|HO|RB)\.(F|G|H|J|K|M|N|Q|U|V|X|Z)$/i,
        type: INSTRUMENT_SUBTYPES.COMMODITIES_ENERGY,
        category: INSTRUMENT_CATEGORIES.COMMODITIES
    }
];

/**
 * Определение типа инструмента по его названию
 * @param {string} instrument - Название инструмента
 * @returns {Object} Информация о типе инструмента
 */
export function detectInstrumentType(instrument) {
    if (!instrument) {
        return {
            type: INSTRUMENT_SUBTYPES.CRYPTO_SPOT,
            category: INSTRUMENT_CATEGORIES.CRYPTO,
            name: 'Неизвестный инструмент',
            confidence: 0
        };
    }

    // Проверяем по паттернам
    for (const { pattern, type, category } of INSTRUMENT_PATTERNS) {
        if (pattern.test(instrument)) {
            return {
                type,
                category,
                name: getTypeName(type),
                confidence: 0.9
            };
        }
    }

    // Эвристики для нераспознанных инструментов
    const instrumentUpper = instrument.toUpperCase();

    if (instrumentUpper.includes('/')) {
        // Валютные пары
        return {
            type: instrumentUpper.includes('USD') ? INSTRUMENT_SUBTYPES.FOREX_MAJOR : INSTRUMENT_SUBTYPES.FOREX_MINOR,
            category: INSTRUMENT_CATEGORIES.FOREX,
            name: 'Валютная пара',
            confidence: 0.7
        };
    } else if (instrumentUpper.includes('USDT')) {
        // Криптовалюты
        return {
            type: INSTRUMENT_SUBTYPES.CRYPTO_SPOT,
            category: INSTRUMENT_CATEGORIES.CRYPTO,
            name: 'Криптовалюта (Spot)',
            confidence: 0.8
        };
    } else if (instrumentUpper.length <= 5 && !instrumentUpper.includes('.')) {
        // Акции
        return {
            type: INSTRUMENT_SUBTYPES.STOCKS_US,
            category: INSTRUMENT_CATEGORIES.STOCKS,
            name: 'Акция',
            confidence: 0.6
        };
    }

    // По умолчанию - крипто спот
    return {
        type: INSTRUMENT_SUBTYPES.CRYPTO_SPOT,
        category: INSTRUMENT_CATEGORIES.CRYPTO,
        name: 'Криптовалюта (Spot)',
        confidence: 0.5
    };
}

/**
 * Получение читаемого имени типа инструмента
 * @param {string} type - Тип инструмента
 * @returns {string} Читаемое имя
 */
function getTypeName(type) {
    const typeNames = {
        [INSTRUMENT_SUBTYPES.FOREX_MAJOR]: 'Мажорная валютная пара',
        [INSTRUMENT_SUBTYPES.FOREX_MINOR]: 'Минорная валютная пара',
        [INSTRUMENT_SUBTYPES.FOREX_EXOTIC]: 'Экзотическая валютная пара',
        [INSTRUMENT_SUBTYPES.FOREX_CROSS]: 'Кросс-валютная пара',

        [INSTRUMENT_SUBTYPES.CRYPTO_SPOT]: 'Криптовалюта (Spot)',
        [INSTRUMENT_SUBTYPES.CRYPTO_FUTURES]: 'Крипто-фьючерс',
        [INSTRUMENT_SUBTYPES.CRYPTO_PERPETUAL]: 'Перпетуальный контракт',
        [INSTRUMENT_SUBTYPES.CRYPTO_MARGIN]: 'Маржинальная торговля',

        [INSTRUMENT_SUBTYPES.STOCKS_US]: 'Акция (США)',
        [INSTRUMENT_SUBTYPES.STOCKS_EU]: 'Акция (Европа)',
        [INSTRUMENT_SUBTYPES.STOCKS_ASIA]: 'Акция (Азия)',
        [INSTRUMENT_SUBTYPES.STOCKS_EMERGING]: 'Акция (Развивающиеся рынки)',

        [INSTRUMENT_SUBTYPES.METALS_PRECIOUS]: 'Драгоценный металл',
        [INSTRUMENT_SUBTYPES.METALS_INDUSTRIAL]: 'Промышленный металл',

        [INSTRUMENT_SUBTYPES.COMMODITIES_ENERGY]: 'Энергоноситель',
        [INSTRUMENT_SUBTYPES.COMMODITIES_AGRICULTURAL]: 'Сельхозтовар',
        [INSTRUMENT_SUBTYPES.COMMODITIES_SOFT]: 'Soft commodity',

        [INSTRUMENT_SUBTYPES.INDICES_WORLD]: 'Мировой индекс',
        [INSTRUMENT_SUBTYPES.INDICES_SECTOR]: 'Отраслевой индекс',
        [INSTRUMENT_SUBTYPES.INDICES_VOLATILITY]: 'Индекс волатильности'
    };

    return typeNames[type] || 'Неизвестный тип';
}

/**
 * Проверка, является ли инструмент валютной парой
 * @param {string} instrument - Название инструмента
 * @returns {boolean}
 */
export function isForexPair(instrument) {
    const { category } = detectInstrumentType(instrument);
    return category === INSTRUMENT_CATEGORIES.FOREX;
}

/**
 * Проверка, является ли инструмент криптовалютой
 * @param {string} instrument - Название инструмента
 * @returns {boolean}
 */
export function isCrypto(instrument) {
    const { category } = detectInstrumentType(instrument);
    return category === INSTRUMENT_CATEGORIES.CRYPTO;
}

/**
 * Проверка, является ли инструмент акцией
 * @param {string} instrument - Название инструмента
 * @returns {boolean}
 */
export function isStock(instrument) {
    const { category } = detectInstrumentType(instrument);
    return category === INSTRUMENT_CATEGORIES.STOCKS;
}

/**
 * Получение шага цены по умолчанию для типа инструмента
 * @param {string} type - Тип инструмента
 * @returns {number} Шаг цены
 */
export function getDefaultPriceStep(type) {
    const priceSteps = {
        [INSTRUMENT_SUBTYPES.FOREX_MAJOR]: 0.0001,
        [INSTRUMENT_SUBTYPES.FOREX_MINOR]: 0.0001,
        [INSTRUMENT_SUBTYPES.FOREX_EXOTIC]: 0.00001,
        [INSTRUMENT_SUBTYPES.FOREX_CROSS]: 0.0001,

        [INSTRUMENT_SUBTYPES.CRYPTO_SPOT]: 0.01,
        [INSTRUMENT_SUBTYPES.CRYPTO_FUTURES]: 0.01,
        [INSTRUMENT_SUBTYPES.CRYPTO_PERPETUAL]: 0.01,
        [INSTRUMENT_SUBTYPES.CRYPTO_MARGIN]: 0.01,

        [INSTRUMENT_SUBTYPES.STOCKS_US]: 0.01,
        [INSTRUMENT_SUBTYPES.STOCKS_EU]: 0.01,
        [INSTRUMENT_SUBTYPES.STOCKS_ASIA]: 0.01,
        [INSTRUMENT_SUBTYPES.STOCKS_EMERGING]: 0.01,

        [INSTRUMENT_SUBTYPES.METALS_PRECIOUS]: 0.01,
        [INSTRUMENT_SUBTYPES.METALS_INDUSTRIAL]: 0.01,

        [INSTRUMENT_SUBTYPES.COMMODITIES_ENERGY]: 0.01,
        [INSTRUMENT_SUBTYPES.COMMODITIES_AGRICULTURAL]: 0.01,
        [INSTRUMENT_SUBTYPES.COMMODITIES_SOFT]: 0.01,

        [INSTRUMENT_SUBTYPES.INDICES_WORLD]: 0.1,
        [INSTRUMENT_SUBTYPES.INDICES_SECTOR]: 0.1,
        [INSTRUMENT_SUBTYPES.INDICES_VOLATILITY]: 0.01
    };

    return priceSteps[type] || 0.01;
}

/**
 * Получение размера лота по умолчанию для типа инструмента
 * @param {string} type - Тип инструмента
 * @returns {number} Размер лота
 */
export function getDefaultLotSize(type) {
    const lotSizes = {
        [INSTRUMENT_SUBTYPES.FOREX_MAJOR]: 100000,
        [INSTRUMENT_SUBTYPES.FOREX_MINOR]: 100000,
        [INSTRUMENT_SUBTYPES.FOREX_EXOTIC]: 100000,
        [INSTRUMENT_SUBTYPES.FOREX_CROSS]: 100000,

        [INSTRUMENT_SUBTYPES.CRYPTO_SPOT]: 1,
        [INSTRUMENT_SUBTYPES.CRYPTO_FUTURES]: 1,
        [INSTRUMENT_SUBTYPES.CRYPTO_PERPETUAL]: 1,
        [INSTRUMENT_SUBTYPES.CRYPTO_MARGIN]: 1,

        [INSTRUMENT_SUBTYPES.STOCKS_US]: 1,
        [INSTRUMENT_SUBTYPES.STOCKS_EU]: 1,
        [INSTRUMENT_SUBTYPES.STOCKS_ASIA]: 1,
        [INSTRUMENT_SUBTYPES.STOCKS_EMERGING]: 1,

        [INSTRUMENT_SUBTYPES.METALS_PRECIOUS]: 100,
        [INSTRUMENT_SUBTYPES.METALS_INDUSTRIAL]: 100,

        [INSTRUMENT_SUBTYPES.COMMODITIES_ENERGY]: 1000,
        [INSTRUMENT_SUBTYPES.COMMODITIES_AGRICULTURAL]: 1000,
        [INSTRUMENT_SUBTYPES.COMMODITIES_SOFT]: 1000,

        [INSTRUMENT_SUBTYPES.INDICES_WORLD]: 1,
        [INSTRUMENT_SUBTYPES.INDICES_SECTOR]: 1,
        [INSTRUMENT_SUBTYPES.INDICES_VOLATILITY]: 1
    };

    return lotSizes[type] || 1;
}

/**
 * Получение маржинального требования по умолчанию
 * @param {string} type - Тип инструмента
 * @returns {number} Маржинальное требование (0-1)
 */
export function getDefaultMarginRequirement(type) {
    const marginRequirements = {
        [INSTRUMENT_SUBTYPES.FOREX_MAJOR]: 0.01,     // 1:100
        [INSTRUMENT_SUBTYPES.FOREX_MINOR]: 0.02,     // 1:50
        [INSTRUMENT_SUBTYPES.FOREX_EXOTIC]: 0.05,    // 1:20
        [INSTRUMENT_SUBTYPES.FOREX_CROSS]: 0.02,     // 1:50

        [INSTRUMENT_SUBTYPES.CRYPTO_SPOT]: 1,        // Spot - no leverage
        [INSTRUMENT_SUBTYPES.CRYPTO_FUTURES]: 0.05,  // 1:20
        [INSTRUMENT_SUBTYPES.CRYPTO_PERPETUAL]: 0.05, // 1:20
        [INSTRUMENT_SUBTYPES.CRYPTO_MARGIN]: 0.1,    // 1:10

        [INSTRUMENT_SUBTYPES.STOCKS_US]: 0.5,        // 1:2
        [INSTRUMENT_SUBTYPES.STOCKS_EU]: 0.5,        // 1:2
        [INSTRUMENT_SUBTYPES.STOCKS_ASIA]: 0.5,      // 1:2
        [INSTRUMENT_SUBTYPES.STOCKS_EMERGING]: 0.5,  // 1:2

        [INSTRUMENT_SUBTYPES.METALS_PRECIOUS]: 0.01, // 1:100
        [INSTRUMENT_SUBTYPES.METALS_INDUSTRIAL]: 0.02, // 1:50

        [INSTRUMENT_SUBTYPES.COMMODITIES_ENERGY]: 0.03, // 1:33
        [INSTRUMENT_SUBTYPES.COMMODITIES_AGRICULTURAL]: 0.05, // 1:20
        [INSTRUMENT_SUBTYPES.COMMODITIES_SOFT]: 0.05, // 1:20

        [INSTRUMENT_SUBTYPES.INDICES_WORLD]: 0.02,   // 1:50
        [INSTRUMENT_SUBTYPES.INDICES_SECTOR]: 0.03,  // 1:33
        [INSTRUMENT_SUBTYPES.INDICES_VOLATILITY]: 0.1 // 1:10
    };

    return marginRequirements[type] || 1;
}
