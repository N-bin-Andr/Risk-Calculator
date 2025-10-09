import React, { useState, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, PointElement, CategoryScale, LinearScale } from 'chart.js';
import { sendReportToNotion } from '../services/notionService';
import '../styles/styles.css';
import html2canvas from 'html2canvas';

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale);

const Calculator = () => {
    const [reportId, setReportId] = useState('');
    const [date, setDate] = useState('');
    const [deposit, setDeposit] = useState('');
    const [riskSize, setRiskSize] = useState('');
    const [entryPrice, setEntryPrice] = useState('');
    const [slPrice, setSLPrice] = useState('');
    const [slPoints, setSLPoints] = useState(0);
    const [takeProfitPrice, setTakeProfitPrice] = useState('');
    const [instrument, setInstrument] = useState('');
    const [direction, setDirection] = useState('buy');
    const [traderNote, setTraderNote] = useState('');
    const [riskValue, setRiskValue] = useState('');
    const [vCoins, setVCoins] = useState(0);
    const [vValue, setVValue] = useState(0);
    const [rrRatio, setRRRatio] = useState('');
    const [isBacktest, setIsBacktest] = useState(false);
    const [status, setStatus] = useState('Открыт');

    const reportRef = useRef();

    const calculate = () => {
        const D = parseFloat(deposit);
        const R = parseFloat(riskSize);
        const EP = parseFloat(entryPrice);
        const SL = parseFloat(slPrice);
        const TP = parseFloat(takeProfitPrice);
        const slDiff = Math.abs(entryPrice - slPrice);

        if (
            isNaN(D) || D <= 0 ||
            isNaN(R) || R <= 0 || R > 100 ||
            isNaN(EP) || EP <= 0 ||
            isNaN(SL) || SL <= 0
        ) {
            alert('Пожалуйста, введите корректные числовые значения. Риск должен быть от 0 до 100%.');
            return;
        }

        if (direction !== 'buy' && direction !== 'sell') {
            alert('Выберите направление сделки: покупка или продажа.');
            return;
        }

        if (takeProfitPrice && isNaN(TP)) {
            alert('Take Profit должен быть числом.');
            return;
        }

        const reportId = `ORD-${Date.now()}`;
        const RV = +(D * (R / 100)).toFixed(2);
        const SP = +Math.abs(EP - SL).toFixed(1);
        if (SP === 0) return alert('SL не может совпадать с ценой входа');
        const VC = +(RV / SP * 1000).toFixed(2);
        const VV = +(VC * EP).toFixed(2);
        const RR = TP ? +((Math.abs(TP - EP) / Math.abs(EP - SL)).toFixed(2)) : null;

        setReportId(reportId);
        setDate(new Date().toISOString().split('T')[0]);
        setRiskValue(RV);
        setSLPoints(SP);
        setVCoins(VC);
        setVValue(VV);
        setRRRatio(RR);

        const reportData = {
            reportId,
            instrument,
            date: new Date().toISOString().split('T')[0],
            direction,
            deposit: D,
            riskSize: R,
            riskValue: RV,
            entryPrice: EP,
            slPrice: SL,
            slPoints: SP,
            vCoins: VC,
            vValue: VV,
            rrRatio: RR,
            takeProfitPrice: TP,
            traderNote,
            status
        };

        const archive = JSON.parse(localStorage.getItem('reportArchive') || '[]');
        archive.push(reportData);
        localStorage.setItem('reportArchive', JSON.stringify(archive));

        const databaseId = isBacktest
            ? 'Backtest-1ea3718e85ac81dd82adffca37528e4b?p=2723718e85ac808094e1ffc452341d0c&pm=c'
            : process.env.REACT_APP_NOTION_DATABASE_ID;

        sendReportToNotion(reportData, databaseId);
    };

    const exportToImage = () => {
        html2canvas(reportRef.current, { scale: 2 }).then(canvas => {
            const link = document.createElement('a');
            link.download = `order-report-${Date.now()}.jpg`;
            link.href = canvas.toDataURL('image/jpeg', 0.9);
            link.click();
        });
    };

    const chartData = {
        labels: ['SL', 'Entry', 'TP'],
        datasets: [{
            label: 'Уровни сделки',
            data: [parseFloat(slPrice), parseFloat(entryPrice), parseFloat(takeProfitPrice || entryPrice)],
            borderColor: 'blue',
            fill: false,
        }]
    };

    return (
        <div className="calculator">
            <h2>Расчёт параметров ордера</h2>
            <form>
                <label>
                    <input
                        type="checkbox"
                        checked={isBacktest}
                        onChange={e => setIsBacktest(e.target.checked)}
                    />
                    Backtest
                </label>
                <label>Инструмент:
                    <input type="text" value={instrument} onChange={e => setInstrument(e.target.value)} />
                </label>
                <label>Депозит (USDT):
                    <input type="number" step="0.01" value={deposit} onChange={e => setDeposit(e.target.value)} />
                </label>
                <label>Риск на сделку (%):
                    <input type="number" step="0.01" value={riskSize} onChange={e => setRiskSize(e.target.value)} />
                </label>
                <label>Цена входа (USDT):
                    <input type="number" step="0.0001" value={entryPrice} onChange={e => setEntryPrice(e.target.value)} />
                </label>

                {isNaN(entryPrice) && <span className="error-text">Введите число</span>}

                <label>Цена Stop Loss (USDT):
                    <input type="number" step="0.0001" value={slPrice} onChange={e => setSLPrice(e.target.value)} />
                </label>
                <label>Take Profit (USDT):
                    <input type="number" step="0.0001" value={takeProfitPrice} onChange={e => setTakeProfitPrice(e.target.value)} />
                </label>
                <label>Направление сделки:
                    <select value={direction} onChange={e => setDirection(e.target.value)}>
                        <option value="buy">Покупка</option>
                        <option value="sell">Продажа</option>
                    </select>
                </label>
                <label>Статус сделки:
                    <select value={status} onChange={e => setStatus(e.target.value)}>
                        <option value="Открыт">Открыт</option>
                        <option value="Запланирован">Запланирован</option>
                        <option value="Отменён">Отменён</option>
                    </select>
                </label>

                <label>Комментарий трейдера:
                    <textarea value={traderNote} onChange={e => setTraderNote(e.target.value)} rows={4} />
                </label>
                <button type="button" onClick={calculate}>Рассчитать</button>
                <button type="button" onClick={exportToImage}>Экспорт в изображение</button>

            </form>




            <div className="results">
                <p>Риск в USDT: {riskValue}</p>
                <p>SL в пунктах: {slPoints}</p>
                <p>Размер позиции (в активе): {vCoins.toFixed(2)}</p>
                <p>Размер позиции (USDT): {vValue}</p>
                {rrRatio && <p>Risk/Reward: {rrRatio}:1</p>}
            </div>

            <div ref={reportRef} className="report-container">
                <h3 className="report-section-title">📝 Комментарий трейдера</h3>
                <p className="report-comment">
                    {traderNote || 'Комментарий отсутствует'}
                </p>
                <h3 className="report-section-title">📄 Ордер</h3>
                <p><strong>ID:</strong> {reportId}</p>
                <p><strong>Депозит:</strong> {deposit} USDT</p>
                <p><strong>Дата:</strong> {date}</p>

                <h3 className="report-section-title">💰 Параметры позиции:</h3>
                <p><strong>Инструмент:</strong> {instrument}</p>
                <p><strong>Направление сделки:</strong> {direction === 'buy' ? 'Покупка' : 'Продажа'}</p>
                <p><strong>Ценовой уровень входа:</strong> {entryPrice} USDT</p>
                <p><strong>Ценовой уровень SL:</strong> {slPrice} USDT</p>
                <p><strong>Ценовой уровень TP:</strong> {takeProfitPrice || '—'} USDT</p>
                <p><strong>Размер позиции (в активах):</strong> {typeof vCoins === 'number' ? vCoins.toFixed(2) : '—'}</p>
                <p><strong>Размер позиции (в USDT):</strong> {typeof vValue === 'number' ? vValue.toFixed(2) : '—'}</p>
                <p><strong>Risk/Reward:</strong> 1:{rrRatio || '—'}</p>
                <h3 className="report-section-title">🛡️ Риск-менеджмент</h3>
                <p><strong>Риск на сделку:</strong> {riskSize}%</p>
                <p><strong>Риск в USDT:</strong> {riskValue}</p>
                <p><strong>SL в пунктах:</strong> {slPoints}</p>

            </div>

            {entryPrice && slPrice && (
                <div className="chart">
                    <h4>График уровней сделки</h4>
                    <Line data={chartData} />
                </div>
            )}
        </div>
    );
};

export default Calculator;
