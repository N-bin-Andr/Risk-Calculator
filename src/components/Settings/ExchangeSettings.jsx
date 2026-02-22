// src/components/Settings/ExchangeSettings.jsx

import React from 'react';
import { EXCHANGE_RATES, DEFAULT_EXCHANGE } from '../../constants/exchangeRates';
import { useLocalStorage } from '../../hooks';

const ExchangeSettings = () => {
    const [selectedExchange, setSelectedExchange] = useLocalStorage('selectedExchange', DEFAULT_EXCHANGE);
    const [orderType, setOrderType] = useLocalStorage('orderType', 'maker');
    const [customRates, setCustomRates] = useLocalStorage('customRates', {
        maker: 0.1,
        taker: 0.1,
        currency: 'USDT'
    });

    const currentExchange = EXCHANGE_RATES[selectedExchange];
    const isCustom = selectedExchange === 'CUSTOM';

    const getCommissionRate = () => {
        if (isCustom) {
            return orderType === 'maker' ? customRates.maker : customRates.taker;
        }
        return orderType === 'maker' ? currentExchange.maker : currentExchange.taker;
    };

    const handleExchangeChange = (e) => {
        setSelectedExchange(e.target.value);
    };

    const handleCustomRateChange = (type, value) => {
        setCustomRates({
            ...customRates,
            [type]: parseFloat(value) || 0
        });
    };

    return (
        <div className="settings-section">
            <h3>🏦 Настройки биржи и комиссий</h3>

            <div className="settings-group">
                <label htmlFor="exchange">Выберите биржу:</label>
                <select
                    id="exchange"
                    value={selectedExchange}
                    onChange={handleExchangeChange}
                >
                    {Object.entries(EXCHANGE_RATES).map(([key, exchange]) => (
                        <option key={key} value={key}>
                            {exchange.name} (maker: {exchange.maker}%, taker: {exchange.taker}%)
                        </option>
                    ))}
                </select>
            </div>

            <div className="settings-group">
                <label htmlFor="orderType">Тип ордера:</label>
                <select
                    id="orderType"
                    value={orderType}
                    onChange={(e) => setOrderType(e.target.value)}
                >
                    <option value="maker">Лимитный ордер (maker) - комиссия {getCommissionRate()}%</option>
                    <option value="taker">Рыночный ордер (taker) - комиссия {getCommissionRate()}%</option>
                </select>
            </div>

            {isCustom && (
                <div className="custom-rates">
                    <h4>Пользовательские комиссии:</h4>
                    <div className="settings-group">
                        <label>Maker комиссия (%):</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="1"
                            value={customRates.maker}
                            onChange={(e) => handleCustomRateChange('maker', e.target.value)}
                        />
                    </div>
                    <div className="settings-group">
                        <label>Taker комиссия (%):</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="1"
                            value={customRates.taker}
                            onChange={(e) => handleCustomRateChange('taker', e.target.value)}
                        />
                    </div>
                    <div className="settings-group">
                        <label>Валюта комиссии:</label>
                        <select
                            value={customRates.currency}
                            onChange={(e) => setCustomRates({...customRates, currency: e.target.value})}
                        >
                            <option value="USDT">USDT</option>
                            <option value="BNB">BNB</option>
                            <option value="BTC">BTC</option>
                            <option value="ETH">ETH</option>
                        </select>
                    </div>
                </div>
            )}

            <div className="commission-info">
                <h4>📊 Информация о комиссиях:</h4>
                <p>
                    <strong>Текущая комиссия:</strong> {getCommissionRate()}%<br />
                    <strong>Тип ордера:</strong> {orderType === 'maker' ? 'Лимитный' : 'Рыночный'}<br />
                    <strong>Валюта комиссии:</strong> {isCustom ? customRates.currency : currentExchange.currency}
                </p>
                {currentExchange.discount > 0 && (
                    <p className="discount-info">
                        💡 Скидка {currentExchange.discount * 100}% при оплате комиссии в {currentExchange.currency}
                    </p>
                )}
            </div>

            <style jsx>{`
                .settings-section {
                    padding: 20px;
                    background-color: #f8f9fa;
                    border-radius: 8px;
                    margin-bottom: 20px;
                }
                .settings-group {
                    margin-bottom: 15px;
                }
                .settings-group label {
                    display: block;
                    margin-bottom: 5px;
                    font-weight: 500;
                }
                .settings-group select,
                .settings-group input {
                    width: 100%;
                    padding: 8px;
                    border: 1px solid #ced4da;
                    border-radius: 4px;
                }
                .custom-rates {
                    padding: 15px;
                    background-color: #e8f4ff;
                    border-radius: 6px;
                    margin: 15px 0;
                }
                .commission-info {
                    padding: 15px;
                    background-color: #d4edda;
                    border-radius: 6px;
                    border-left: 4px solid #28a745;
                }
                .discount-info {
                    margin-top: 10px;
                    padding: 8px;
                    background-color: #fff3cd;
                    border-radius: 4px;
                    color: #856404;
                }
            `}</style>
        </div>
    );
};

export default ExchangeSettings;
