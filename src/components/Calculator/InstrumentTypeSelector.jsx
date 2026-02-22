// src/components/Calculator/InstrumentTypeSelector.jsx

import React, { useState, useEffect } from 'react';
import {
    INSTRUMENT_TYPES,
    INSTRUMENT_CATEGORIES,
    INSTRUMENT_DETAILS
} from '../../constants/instruments';
import '../../styles/components/InstrumentTypeSelector.css';

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

        if (instrumentUpper.includes('/')) {
            if (instrumentUpper.includes('XAU') || instrumentUpper.includes('XAG') ||
                instrumentUpper.includes('XPT') || instrumentUpper.includes('XPD')) {
                detectedType = 'metals';
            } else if (instrumentUpper.includes('USD') || instrumentUpper.includes('EUR') ||
                       instrumentUpper.includes('JPY') || instrumentUpper.includes('GBP')) {
                detectedType = instrumentUpper.includes('USD') ? 'forex_major' : 'forex_minor';
            }
        } else if (instrumentUpper.includes('USDT') || instrumentUpper.includes('BTC') ||
                   instrumentUpper.includes('ETH') || instrumentUpper.includes('BNB')) {
            detectedType = 'crypto_spot';
        } else if (instrumentUpper.length <= 5 && !instrumentUpper.includes('.')) {
            detectedType = 'stocks_us';
        } else if (instrumentUpper.includes('.MX') || instrumentUpper.includes('.ME')) {
            detectedType = 'indices_world';
        }

        if (detectedType && INSTRUMENT_DETAILS[detectedType]) {
            setSelectedDetails(INSTRUMENT_DETAILS[detectedType]);
        } else {
            setSelectedDetails(null);
        }
    }, [instrument]);

    const handleCategoryToggle = (category) => {
        setExpandedCategory(expandedCategory === category ? null : category);
    };

    const handleTypeSelect = (typeId) => {
        if (onTypeSelect) {
            onTypeSelect(typeId);
            if (INSTRUMENT_DETAILS[typeId]) {
                setSelectedDetails(INSTRUMENT_DETAILS[typeId]);
            }
        }
    };

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

export default React.memo(InstrumentTypeSelector);
