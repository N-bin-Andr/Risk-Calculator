import React from 'react';
import { formatNumber, formatCurrency } from '../../utils/formatters';
import { getStatusType, getStatusDisplay } from '../../utils/helpers';
import '../../styles/components/CalculationResults.css';

const CalculationResults = ({
    gridEnabled,
    gridPrices,
    gridQuantities,
    gridDistribution,
    gridAveragePrice,
    gridTotalQuantity,
    gridInvestment,
    vCoins,
    vValue,
    riskValue,
    rrRatio,
    instrument,
    currentPriceStep,
    notionStatus,
    isSendingToNotion,
    status
}) => {

    // Определение типа статуса для стилей (используем утилиту)
    const statusType = getStatusType(status);

    // Получаем отображаемый текст статуса с иконкой
    const statusDisplayText = getStatusDisplay(status);

    return (
        <fieldset className="form-section calculation-results-section">
            <legend>📊 Результаты расчёта</legend>

            <div className="results-container">
                {/* Информация о шаге цены */}
                {instrument && (
                    <div className="price-step-info">
                        <p>
                            <strong>Шаг цены для {instrument}:</strong>
                            {currentPriceStep !== null ? ` ${formatNumber(currentPriceStep, 6)} USDT` : ' используется значение по умолчанию'}
                        </p>
                    </div>
                )}

                {/* Статус сделки */}
                <div className="status-display">
                    <div className={`status-badge status-${statusType}`}>
                        {statusDisplayText}
                    </div>
                </div>

                {/* Статус отправки в Notion */}
                {notionStatus && (
                    <div className={`notion-status-container ${notionStatus.includes('✅') ? 'success' :
                                                                   notionStatus.includes('❌') ? 'error' :
                                                                   'info'}`}>
                        <div className="notion-status-header">
                            <span className="notion-status-icon">
                                {notionStatus.includes('✅') ? '✅' :
                                 notionStatus.includes('❌') ? '❌' :
                                 'ℹ️'}
                            </span>
                            <span className="notion-status-title">Notion:</span>
                            <span className="notion-status-text">{notionStatus.replace(/✅|❌|ℹ️/g, '').trim()}</span>
                        </div>

                        {isSendingToNotion && (
                            <>
                                <div className="notion-progress-bar">
                                    <div className="notion-progress-fill" />
                                </div>
                                <div className="notion-loading-spinner" />
                            </>
                        )}
                    </div>
                )}

                {/* РЕЖИМ ОДИН ОРДЕР */}
                {!gridEnabled && (
                    <div className="single-order-results">
                        <h4>📈 Результаты для одного ордера:</h4>

                        <div className="results-grid">
                            <div className="result-item">
                                <span className="result-label">Размер позиции (актив):</span>
                                <span className="result-value">{formatNumber(vCoins)}</span>
                            </div>

                            <div className="result-item">
                                <span className="result-label">Размер позиции (USDT):</span>
                                <span className="result-value">{formatCurrency(vValue)}</span>
                            </div>

                            <div className="result-item">
                                <span className="result-label">Риск в USDT:</span>
                                <span className="result-value">{formatCurrency(riskValue)}</span>
                            </div>

                            {rrRatio && (
                                <div className="result-item">
                                    <span className="result-label">Risk/Reward:</span>
                                    <span className="result-value">
                                        <span className={`rr-ratio ${rrRatio >= 2 ? 'good' : rrRatio >= 1 ? 'medium' : 'low'}`}>
                                            1:{formatNumber(rrRatio, 2)}
                                        </span>
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* РЕЖИМ СЕТОЧНЫЙ ВХОД */}
                {gridEnabled && gridPrices && gridPrices.length > 0 && (
                    <div className="grid-results">
                        <h4>📊 Результаты сеточного входа:</h4>

                        <div className="grid-summary">
                            <div className="summary-grid">
                                <div className="summary-item">
                                    <span className="summary-label">Средняя цена входа:</span>
                                    <span className="summary-value">{formatNumber(gridAveragePrice, 4)} USDT</span>
                                </div>

                                <div className="summary-item">
                                    <span className="summary-label">Общее количество:</span>
                                    <span className="summary-value">{formatNumber(gridTotalQuantity)}</span>
                                </div>

                                <div className="summary-item">
                                    <span className="summary-label">Общая инвестиция:</span>
                                    <span className="summary-value">{formatCurrency(gridInvestment)}</span>
                                </div>

                                <div className="summary-item">
                                    <span className="summary-label">Риск в USDT:</span>
                                    <span className="summary-value">{formatCurrency(riskValue)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Таблица ордеров сетки */}
                        <div className="grid-orders-table-container">
                            <h5>📋 Ордера сетки:</h5>

                            <div className="table-responsive">
                                <table className="grid-orders-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Цена (USDT)</th>
                                            <th>Распределение</th>
                                            <th>Количество</th>
                                            <th>Сумма (USDT)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {gridPrices.map((price, index) => (
                                            <tr key={index} className={index % 2 === 0 ? 'even-row' : 'odd-row'}>
                                                <td className="order-number">{index + 1}</td>
                                                <td className="order-price">{formatNumber(price, 4)}</td>
                                                <td className="order-distribution">
                                                    <div className="distribution-bar-container">
                                                        <div
                                                            className="distribution-bar"
                                                            style={{
                                                                width: `${gridDistribution[index] ? Math.min(100, parseFloat(gridDistribution[index])) : 0}%`,
                                                                backgroundColor: index === 0 ? '#28a745' :
                                                                               index === 1 ? '#007bff' :
                                                                               index === 2 ? '#ffc107' :
                                                                               index === 3 ? '#6c757d' :
                                                                               '#dc3545'
                                                            }}
                                                        />
                                                        <span className="distribution-percent">
                                                            {gridDistribution[index] ? parseFloat(gridDistribution[index]).toFixed(1) : '0.0'}%
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="order-quantity">{formatNumber(gridQuantities[index])}</td>
                                                <td className="order-amount">
                                                    {gridQuantities[index] ? formatCurrency(gridQuantities[index] * price) : '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="grid-totals-row">
                                            <td colSpan="2">
                                                <strong>Итого:</strong>
                                            </td>
                                            <td>
                                                <strong>
                                                    {gridDistribution.reduce((sum, p) => {
                                                        const num = parseFloat(p);
                                                        return sum + (isNaN(num) ? 0 : num);
                                                    }, 0).toFixed(1)}%
                                                </strong>
                                            </td>
                                            <td>
                                                <strong>{formatNumber(gridTotalQuantity)}</strong>
                                            </td>
                                            <td>
                                                <strong>{formatCurrency(gridInvestment)}</strong>
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Если сетка включена, но расчетов еще нет */}
                {gridEnabled && (!gridPrices || gridPrices.length === 0) && (
                    <div className="no-results-message">
                        <p>🔍 Нажмите "Рассчитать" для получения результатов сетки</p>
                        <p className="hint">Результаты появятся здесь после выполнения расчета</p>
                    </div>
                )}

                {/* Если нет результатов вообще */}
                {!gridEnabled && (!vCoins || isNaN(vCoins)) && (
                    <div className="no-results-message">
                        <p>📝 Заполните все поля и нажмите "Рассчитать"</p>
                        <p className="hint">Результаты расчета появятся в этом разделе</p>
                    </div>
                )}
            </div>
        </fieldset>
    );
};

export default CalculationResults;
