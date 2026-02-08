// src/components/Calculator/InstrumentTypeSelector.jsx
import React, { useState, useEffect } from 'react';
import '../../styles/components/InstrumentTypeSelector.css';

// Константы типов инструментов
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

// Константы категорий
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
        marginRequirement: 0.01, // 1:100 leverage
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
        marginRequirement: 1, // Spot - no leverage by default
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
        marginRequirement: 0.05, // 20x leverage
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
        marginRequirement: 0.5, // 2x leverage
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

const InstrumentTypeSelector = ({
    selectedType,
    onTypeSelect,
    instrument,
    isDirectionChosen,
    tooltipText
}) => {
    const [expandedCategory, setExpandedCategory] = useState(null);
    const [selectedDetails, setSelectedDetails] = useState(null);

    // Определяем тип инструмента по его названию
    useEffect(() => {
        if (!instrument) {
            setSelectedDetails(null);
            return;
        }

        const instrumentUpper = instrument.toUpperCase();
        let detectedType = null;

        // Определяем тип по паттернам
        if (instrumentUpper.includes('/')) {
            // Forex или металлы
            if (instrumentUpper.includes('XAU') || instrumentUpper.includes('XAG') ||
                instrumentUpper.includes('XPT') || instrumentUpper.includes('XPD')) {
                detectedType = 'metals';
            } else if (instrumentUpper.includes('USD') || instrumentUpper.includes('EUR') ||
                       instrumentUpper.includes('JPY') || instrumentUpper.includes('GBP')) {
                detectedType = instrumentUpper.includes('USD') ? 'forex_major' : 'forex_minor';
            }
        } else if (instrumentUpper.includes('USDT') || instrumentUpper.includes('BTC') ||
                   instrumentUpper.includes('ETH') || instrumentUpper.includes('BNB')) {
            // Криптовалюты
            detectedType = instrumentUpper.includes('USDT') ? 'crypto_spot' : 'crypto_spot';
        } else if (instrumentUpper.length <= 5 && !instrumentUpper.includes('.')) {
            // Акции (тикеры)
            detectedType = 'stocks_us';
        } else if (instrumentUpper.includes('.MX') || instrumentUpper.includes('.ME')) {
            // Индексы
            detectedType = 'indices_world';
        }

        if (detectedType && INSTRUMENT_DETAILS[detectedType]) {
            setSelectedDetails(INSTRUMENT_DETAILS[detectedType]);
        } else {
            setSelectedDetails(null);
        }
    }, [instrument]);

    // Обработчик выбора категории
    const handleCategoryToggle = (category) => {
        setExpandedCategory(expandedCategory === category ? null : category);
    };

    // Обработчик выбора типа инструмента
    const handleTypeSelect = (typeId) => {
        if (onTypeSelect) {
            onTypeSelect(typeId);

            // Устанавливаем детали выбранного типа
            if (INSTRUMENT_DETAILS[typeId]) {
                setSelectedDetails(INSTRUMENT_DETAILS[typeId]);
            }
        }
    };

    // Получение иконки для категории
    const getCategoryIcon = (category) => {
        switch (category) {
            case 'FOREX': return '💱';
            case 'CRYPTO': return '₿';
            case 'STOCKS': return '📈';
            case 'INDICES': return '📊';
            case 'COMMODITIES': return '🛢️';
            default: return '📋';
        }
    };

    return (
        <div className={`instrument-type-selector ${!isDirectionChosen ? 'disabled' : ''}`}>
            <div className="selector-header">
                <h3>🎯 Тип инструмента</h3>
                <div className="selector-description">
                    Выберите категорию инструмента для точного расчета параметров позиции
                </div>
            </div>

            <div className="categories-grid">
                {Object.entries(INSTRUMENT_CATEGORIES).map(([categoryKey, category]) => (
                    <div
                        key={categoryKey}
                        className={`category-card ${expandedCategory === categoryKey ? 'expanded' : ''}`}
                    >
                        <div
                            className="category-header"
                            onClick={() => handleCategoryToggle(categoryKey)}
                        >
                            <div className="category-icon">{getCategoryIcon(categoryKey)}</div>
                            <div className="category-info">
                                <h4 className="category-name">{category.name}</h4>
                                <div className="category-hint">
                                    {expandedCategory === categoryKey ? 'Свернуть' : 'Развернуть'}
                                </div>
                            </div>
                            <div className="category-arrow">
                                {expandedCategory === categoryKey ? '▲' : '▼'}
                            </div>
                        </div>

                        {expandedCategory === categoryKey && (
                            <div className="category-types">
                                {category.types.map((type) => (
                                    <div
                                        key={type.id}
                                        className={`type-item ${selectedType === type.id ? 'selected' : ''}`}
                                        onClick={() => handleTypeSelect(type.id)}
                                    >
                                        <div className="type-icon">{type.icon}</div>
                                        <div className="type-info">
                                            <div className="type-name">{type.name}</div>
                                            {selectedType === type.id && (
                                                <div className="type-selected-indicator">✓ Выбрано</div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Детальная информация о выбранном типе */}
            {selectedDetails && (
                <div className="instrument-details">
                    <h4>📋 Параметры выбранного типа:</h4>
                    <div className="details-grid">
                        <div className="detail-item">
                            <span className="detail-label">Название:</span>
                            <span className="detail-value">{selectedDetails.name}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Описание:</span>
                            <span className="detail-value">{selectedDetails.description}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Примеры:</span>
                            <span className="detail-value">{selectedDetails.examples.join(', ')}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Размер лота:</span>
                            <span className="detail-value">{selectedDetails.lotSize.toLocaleString()}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Маржинальное требование:</span>
                            <span className="detail-value">{selectedDetails.marginRequirement * 100}%</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Шаг цены:</span>
                            <span className="detail-value">{selectedDetails.priceStep}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Минимальный объем:</span>
                            <span className="detail-value">{selectedDetails.minTradeSize}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Торговые часы:</span>
                            <span className="detail-value">{selectedDetails.tradingHours}</span>
                        </div>
                        {selectedDetails.commission && (
                            <div className="detail-item">
                                <span className="detail-label">Комиссия:</span>
                                <span className="detail-value">{selectedDetails.commission}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Автоматическое определение типа */}
            {instrument && selectedDetails && (
                <div className="auto-detection-info">
                    <div className="detection-icon">🤖</div>
                    <div className="detection-text">
                        <strong>Автоматически определено:</strong> {selectedDetails.name}
                        <div className="detection-hint">
                            На основе введенного инструмента "{instrument}"
                        </div>
                    </div>
                </div>
            )}

            {/* Подсказки */}
            <div className="selector-tips">
                <h4>💡 Зачем выбирать тип инструмента?</h4>
                <ul>
                    <li><strong>Точный расчет позиции</strong> - разный размер лота и маржинальные требования</li>
                    <li><strong>Правильный риск-менеджмент</strong> - разная волатильность и ликвидность</li>
                    <li><strong>Автоматические настройки</strong> - шаг цены, минимальный объем и др.</li>
                    <li><strong>Учет специфики рынка</strong> - торговые часы, свопы, комиссии</li>
                </ul>
            </div>
        </div>
    );
};

export default InstrumentTypeSelector;
export { INSTRUMENT_TYPES, INSTRUMENT_CATEGORIES, INSTRUMENT_DETAILS };
