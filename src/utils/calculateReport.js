export const getDirectionLabel = (dir) => {
    if (!dir) return "—";
    return dir.toLowerCase() === "long" ? "Long" : "Short";
};

// НОВАЯ ФУНКЦИЯ: Расчет сеточного входа
export function calculateGridReport({
    deposit,
    riskSize,
    entryPrice,
    slPrice,
    direction,
    gridOrdersCount = 3,
    gridDistribution = []
}) {
    const D = parseFloat(deposit);
    const R = parseFloat(riskSize);
    const EP = parseFloat(entryPrice);
    const SL = parseFloat(slPrice);

    if (
        isNaN(D) || D <= 0 ||
        isNaN(R) || R <= 0 || R > 100 ||
        isNaN(EP) || EP <= 0 ||
        isNaN(SL) || SL <= 0
    ) {
        throw new Error('Некорректные входные данные для сетки');
    }

    if (direction !== 'long' && direction !== 'short') {
        throw new Error('Направление сделки должно быть "Long" или "Short"');
    }

    // Проверяем распределение
    if (!gridDistribution || gridDistribution.length === 0) {
        throw new Error('Распределение по ордерам не задано');
    }

    // Преобразуем все значения в числа
    const distribution = gridDistribution.map(val => parseFloat(val) || 0);

    // Проверяем сумму распределения
    const totalPercent = distribution.reduce((sum, p) => sum + p, 0);
    if (Math.abs(totalPercent - 100) > 0.01) {
        throw new Error(`Сумма распределения должна быть 100% (сейчас: ${totalPercent.toFixed(2)}%)`);
    }

    // 1. Рассчитываем шаг цены
    const priceRange = Math.abs(EP - SL);
    const priceStep = priceRange / gridOrdersCount;

    // 2. Рассчитываем цены для каждого ордера
    const gridPrices = [];
    for (let i = 0; i < gridOrdersCount; i++) {
        if (direction === 'long') {
            // Для лонга: от самой высокой (EP) к низкой
            gridPrices.push(+(EP - (priceStep * i)).toFixed(4));
        } else {
            // Для шорта: от самой низкой (EP) к высокой
            gridPrices.push(+(EP + (priceStep * i)).toFixed(4));
        }
    }

    // 3. Рассчитываем среднюю цену входа
    let totalWeightedPrice = 0;
    distribution.forEach((percent, index) => {
        totalWeightedPrice += gridPrices[index] * (percent / 100);
    });
    const averagePrice = +totalWeightedPrice.toFixed(4);

    // 4. Рассчитываем максимальный риск
    const maxRisk = D * (R / 100);

    // 5. Рассчитываем общее количество актива
    const priceDiff = Math.abs(averagePrice - SL);
    const totalQuantity = +(maxRisk / priceDiff).toFixed(8);

    // 6. Распределяем количество по ордерам
    const gridQuantities = distribution.map(percent =>
        +(totalQuantity * (percent / 100)).toFixed(8)
    );

    // 7. Рассчитываем сумму инвестиции
    const investment = gridQuantities.reduce((sum, qty, idx) =>
        sum + (qty * gridPrices[idx]), 0
    );

    return {
        gridPrices,
        gridQuantities,
        gridAveragePrice: averagePrice,
        gridTotalQuantity: totalQuantity,
        gridInvestment: +investment.toFixed(2),
        gridOrders: gridPrices.map((price, idx) => ({
            order: idx + 1,
            price,
            quantity: gridQuantities[idx],
            percent: distribution[idx],
            amount: +(gridQuantities[idx] * price).toFixed(2)
        })),
        gridStep: +priceStep.toFixed(4),
        gridMaxRisk: +maxRisk.toFixed(2)
    };
}

// ОБНОВЛЕННАЯ ФУНКЦИЯ: Основной расчет (с поддержкой сетки)
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
    tpLevels = [],
    // Новые параметры для сетки
    gridEnabled = false,
    gridOrdersCount = 3,
    gridDistribution = []
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

    if (direction !== 'long' && direction !== 'short') {
        throw new Error('Направление сделки должно быть "Long" или "Short"');
    }

    if (takeProfitPrice && isNaN(TP)) {
        throw new Error('Take Profit должен быть числом');
    }

    // РАСЧЕТ ДЛЯ СЕТОЧНОГО ВХОДА
    let gridReport = null;
    let calculatedEntryPrice = EP; // Сохраняем оригинальную цену входа

    if (gridEnabled) {
        try {
            // Преобразуем распределение в числа
            const distribution = gridDistribution.map(val => {
                if (val === '' || val === undefined || val === null) return 0;
                const num = parseFloat(val);
                return isNaN(num) ? 0 : num;
            });

            gridReport = calculateGridReport({
                deposit: D,
                riskSize: R,
                entryPrice: EP,
                slPrice: SL,
                direction,
                gridOrdersCount,
                gridDistribution: distribution
            });

            // Используем среднюю цену сетки для дальнейших расчетов
            calculatedEntryPrice = gridReport.gridAveragePrice;
        } catch (error) {
            throw new Error(`Ошибка расчета сетки: ${error.message}`);
        }
    }

    const reportId = `ORD-${Date.now()}F`;
    const RV = +(D * (R / 100)).toFixed(2);
    const SP = +(Math.abs(calculatedEntryPrice - SL) / 0.0001).toFixed(1);

    if (SP === 0) throw new Error('SL не может совпадать с ценой входа');

    const VC = gridEnabled
        ? gridReport.gridTotalQuantity
        : +(RV / Math.abs(calculatedEntryPrice - SL)).toFixed(8);

    const VV = gridEnabled
        ? gridReport.gridInvestment
        : +(VC * calculatedEntryPrice).toFixed(2);

    let totalProfit = 0;
    tpLevels.forEach(tp => {
        const tpPrice = parseFloat(tp.price);
        const tpPercent = parseFloat(tp.percent);

        if (isNaN(tpPrice) || isNaN(tpPercent)) return;

        const volume = VC * (tpPercent / 100);
        const profitPerUnit = direction === 'long' ? tpPrice - calculatedEntryPrice : calculatedEntryPrice - tpPrice;

        totalProfit += profitPerUnit * volume;
    });

    totalProfit = +totalProfit.toFixed(2);

    const tpDetails = tpLevels.map(tp => {
        const tpPrice = parseFloat(tp.price);
        const tpPercent = parseFloat(tp.percent);
        const action = direction === 'long' ? 'Продать' : 'Купить';

        if (isNaN(tpPrice) || isNaN(tpPercent)) return null;

        const rrRatio = (Math.abs(tpPrice - calculatedEntryPrice) / Math.abs(calculatedEntryPrice - SL)).toFixed(1);
        const vc = +(VC * (tpPercent / 100)).toFixed(8);

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
        entryPrice: calculatedEntryPrice,
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
        // Добавляем данные сетки в отчет
        gridEnabled,
        gridReport
    };

    return reportData;
}

