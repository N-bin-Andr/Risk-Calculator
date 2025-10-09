// utils/calculateReport.js

export function calculateReport({
    deposit,
    riskSize,
    entryPrice,
    slPrice,
    takeProfitPrice,
    direction,
    instrument,
    traderNote,
    status,
    isBacktest
}) {
    const D = parseFloat(deposit);
    const R = parseFloat(riskSize);
    const EP = parseFloat(entryPrice);
    const SL = parseFloat(slPrice);
    const TP = parseFloat(takeProfitPrice);

    if (
        isNaN(D) || D <= 0 ||
        isNaN(R) || R <= 0 || R > 100 ||
        isNaN(EP) || EP <= 0 ||
        isNaN(SL) || SL <= 0
    ) {
        throw new Error('Некорректные входные данные');
    }

    if (direction !== 'buy' && direction !== 'sell') {
        throw new Error('Направление сделки должно быть "buy" или "sell"');
    }

    if (takeProfitPrice && isNaN(TP)) {
        throw new Error('Take Profit должен быть числом');
    }

    const reportId = `ORD-${Date.now()}F`;
    const RV = +(D * (R / 100)).toFixed(2);
    const SP = +(Math.abs(EP - SL) / 0.0001).toFixed(1);
    if (SP === 0) throw new Error('SL не может совпадать с ценой входа');
    const VC = +(RV / Math.abs(EP - SL)).toFixed(2);
    const VV = +(VC * EP).toFixed(2);
    const RR = TP ? +((Math.abs(TP - EP) / Math.abs(EP - SL)).toFixed(2)) : null;
    const date = new Date().toISOString().split('T')[0];

    const reportData = {
        reportId,
        instrument,
        date,
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

    return reportData;
}
