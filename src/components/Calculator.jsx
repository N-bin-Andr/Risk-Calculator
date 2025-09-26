import React, { useState } from 'react';
import jsPDF from 'jspdf';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, PointElement, CategoryScale, LinearScale } from 'chart.js';
import { sendReportToNotion } from '../services/notionService';
import '../styles/styles.css';

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale);

const Calculator = () => {
    const [deposit, setDeposit] = useState('');
    const [riskSize, setRiskSize] = useState('');
    const [entryPrice, setEntryPrice] = useState('');
    const [slPrice, setSLPrice] = useState('');
    const [takeProfitPrice, setTakeProfitPrice] = useState('');
    const [instrument, setInstrument] = useState('');
    const [direction, setDirection] = useState('buy');
    const [traderNote, setTraderNote] = useState('');

    const [riskValue, setRiskValue] = useState('');
    const [slPoints, setSLPoints] = useState('');
    const [estimatedSLValue, setEstimatedSLValue] = useState('');
    const [vCoins, setVCoins] = useState('');
    const [vValue, setVValue] = useState('');
    const [rrRatio, setRRRatio] = useState('');
    const [isBacktest, setIsBacktest] = useState(false);
    const [status, setStatus] = useState('Открыт');


    const calculate = () => {
        const D = parseFloat(deposit);
        const R = parseFloat(riskSize) / 100;
        const EP = parseFloat(entryPrice);
        const SL = parseFloat(slPrice);
        const TP = parseFloat(takeProfitPrice);

        if (isNaN(D) || isNaN(R) || isNaN(EP) || isNaN(SL)) {
            alert('Пожалуйста, заполните все обязательные поля.');
            return;
        }

        const RV = +(D * R).toFixed(2);
        const SP = +Math.abs(EP - SL).toFixed(1);
        if (SP === 0) return alert('SL не может совпадать с ценой входа');
        const VC = +(RV / SP * 1000).toFixed(2);
        const VV = +(VC * EP).toFixed(2);
        const SLcalc = direction === 'buy'
            ? +(EP - EP * R).toFixed(4)
            : +(EP + EP * R).toFixed(4);
        const RR = TP ? +((Math.abs(TP - EP) / Math.abs(EP - SL)).toFixed(2)) : null;

        setRiskValue(RV);
        setSLPoints(SP);
        setVCoins(VC);
        setVValue(VV);
        setEstimatedSLValue(SLcalc);
        setRRRatio(RR);

        const reportData = {
            instrument,
            date: new Date().toISOString().split('T')[0],
            direction,
            deposit: D,
            riskSize: R * 100,
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

        sendReportToNotion(reportData, isBacktest);

    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        const today = new Date().toLocaleDateString('ru-RU');
        const reportId = 'ORD-' + Date.now();

        doc.setFontSize(16);
        doc.text('📄 Расчёт параметров ордера', 20, 20);
        doc.setFontSize(12);
        doc.text(`Инструмент: ${instrument || '—'}`, 20, 30);
        doc.setFontSize(10);
        doc.text(`Дата: ${today}`, 150, 30);
        doc.text(`Номер отчёта: ${reportId}`, 150, 36);

        doc.setFontSize(12);
        doc.text(`Депозит: ${deposit} USDT`, 20, 50);
        doc.text(`Ценовой уровень входа: ${entryPrice} USDT`, 20, 60);
        doc.text(`Ценовой уровень SL: ${slPrice} USDT`, 20, 70);
        doc.text(`Направление сделки: ${direction === 'buy' ? 'Покупка' : 'Продажа'}`, 20, 80);
        doc.text(`Размер позиции (в активах): ${vCoins}`, 20, 90);
        doc.text(`Размер позиции (в USDT): ${vValue}`, 20, 100);

        doc.text('🛡️ Риск менеджмент', 20, 120);
        doc.text(`Риск на сделку: ${riskSize}%`, 20, 130);
        doc.text(`Риск в USDT: ${riskValue}`, 20, 140);
        doc.text(`SL в пунктах: ${slPoints}`, 20, 150);
        doc.text(`Расчётное значение SL: ${estimatedSLValue}`, 20, 160);
        if (takeProfitPrice) {
            doc.text(`Take Profit: ${takeProfitPrice} USDT`, 20, 170);
            doc.text(`Risk/Reward: ${rrRatio}:1`, 20, 180);
        }

        doc.text('📝 Комментарий трейдера:', 20, 200);
        const noteLines = doc.splitTextToSize(traderNote || '—', 160);
        doc.text(noteLines, 25, 210);

        doc.save('order-report.pdf');
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
            <h2>Калькулятор ордера</h2>
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
                <button type="button" onClick={exportToPDF}>Экспорт в PDF</button>
            </form>

            <div className="results">
                <p>Риск в USDT: {riskValue}</p>
                <p>SL в пунктах: {slPoints}</p>
                <p>Расчётный SL: {estimatedSLValue}</p>
                <p>Размер позиции (актив): {vCoins}</p>
                <p>Размер позиции (USDT): {vValue}</p>
                {rrRatio && <p>Risk/Reward: {rrRatio}:1</p>}
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
