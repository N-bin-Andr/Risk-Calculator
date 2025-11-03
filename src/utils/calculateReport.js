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
    isBacktest,
    tpLevels = []
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

    let totalProfit = 0;
    tpLevels.forEach(tp => {
        const tpPrice = parseFloat(tp.price);
        const tpPercent = parseFloat(tp.percent);

        if (isNaN(tpPrice) || isNaN(tpPercent)) return;

        const volume = VC * (tpPercent / 100);
        const profitPerUnit = direction === 'buy' ? tpPrice - EP : EP - tpPrice;

        totalProfit += profitPerUnit * volume;
    });

    totalProfit = +totalProfit.toFixed(2);

    const tpDetails = tpLevels.map(tp => {
        const tpPrice = parseFloat(tp.price);
        const tpPercent = parseFloat(tp.percent);
        const action = status === 'Buy' ? 'Продать' : 'Купить';

        if (isNaN(tpPrice) || isNaN(tpPercent)) return null;

        const rrRatio = (Math.abs(tpPrice - EP) / Math.abs(EP - SL)).toFixed(1);
        const vc = +(VC * (tpPercent / 100)).toFixed(2);

        return {
            price: tpPrice,
            percent: tpPercent,
            rrRatio,
            vc,
            action
        };
    }).filter(Boolean);

    const totalVC = tpDetails.reduce((acc, tp) => acc + tp.vc, 0);

    if (totalVC > VC + 0.01) {
        throw new Error(`Суммарный объём V(c) по TP (${totalVC}) превышает общий объём позиции (${VC})`);
    }

    const RR = tpDetails.length > 0
        ? +(tpDetails.reduce((acc, tp) => acc + parseFloat(tp.rrRatio) * (tp.percent / 100), 0).toFixed(2))
        : null;

    const maxRR = tpDetails.length > 0
        ? +(tpDetails.reduce((acc, tp) => acc + parseFloat(tp.rrRatio) * (tp.percent / 100), 0).toFixed(1))
        : null;

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
        status,
        tpDetails,
        totalProfit,
        maxRR,
    };

    return reportData;
}
