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
    // Валидация входных данных
    const D = parseFloat(deposit);
    const R = parseFloat(riskSize);
    const EP = parseFloat(entryPrice);
    const SL = parseFloat(slPrice);

    if (isNaN(D) || D <= 0) {
        throw new Error('Некорректный размер депозита. Введите положительное число.');
    }

    if (isNaN(R) || R <= 0 || R > 100) {
        throw new Error('Риск на сделку должен быть от 0.01% до 100%.');
    }

    if (isNaN(EP) || EP <= 0) {
        throw new Error('Некорректная цена входа. Введите положительное число.');
    }

    if (isNaN(SL) || SL <= 0) {
        throw new Error('Некорректный уровень Stop Loss. Введите положительное число.');
    }

    if (direction !== 'long' && direction !== 'short') {
        throw new Error('Направление сделки должно быть "Long" или "Short".');
    }

    // Проверяем, что SL не равен цене входа
    if (EP === SL) {
        throw new Error('Цена входа и Stop Loss не должны совпадать.');
    }

    // Проверяем логическое соответствие SL и направления
    if (direction === 'long' && SL > EP) {
        throw new Error('Для Long позиции Stop Loss должен быть ниже цены входа.');
    }

    if (direction === 'short' && SL < EP) {
        throw new Error('Для Short позиции Stop Loss должен быть выше цены входа.');
    }

    // Проверяем распределение
    if (!gridDistribution || !Array.isArray(gridDistribution) || gridDistribution.length === 0) {
        throw new Error('Распределение по ордерам не задано.');
    }

    if (gridDistribution.length !== gridOrdersCount) {
        throw new Error(`Количество полей распределения (${gridDistribution.length}) не соответствует количеству ордеров (${gridOrdersCount}).`);
    }

    // Преобразуем все значения в числа
    const distribution = gridDistribution.map(val => {
        const num = parseFloat(val);
        return isNaN(num) ? 0 : num;
    });

    // Проверяем что все поля кроме последнего заполнены
    for (let i = 0; i < distribution.length - 1; i++) {
        if (distribution[i] <= 0) {
            throw new Error(`Ордер ${i + 1}: процент должен быть больше 0.`);
        }
    }

    // Проверяем сумму распределения
    const totalPercent = distribution.reduce((sum, p) => sum + p, 0);
    if (Math.abs(totalPercent - 100) > 0.1) {
        throw new Error(`Сумма распределения должна быть 100% (сейчас: ${totalPercent.toFixed(2)}%).`);
    }

    // 1. Рассчитываем шаг цены
    const priceRange = Math.abs(EP - SL);
    if (priceRange <= 0) {
        throw new Error('Разница между ценой входа и Stop Loss слишком мала для расчета сетки.');
    }

    const priceStep = priceRange / (gridOrdersCount - 1);

    // 2. Рассчитываем цены для каждого ордера
    const gridPrices = [];
    for (let i = 0; i < gridOrdersCount; i++) {
        if (direction === 'long') {
            // Для лонга: от самой высокой (EP) к низкой (SL)
            gridPrices.push(+(EP - (priceStep * i)).toFixed(8));
        } else {
            // Для шорта: от самой низкой (EP) к высокой (SL)
            gridPrices.push(+(EP + (priceStep * i)).toFixed(8));
        }
    }

    // Проверяем что все цены положительные
    if (gridPrices.some(price => price <= 0)) {
        throw new Error('Рассчитанные цены ордеров должны быть положительными. Проверьте входные данные.');
    }

    // 3. Рассчитываем среднюю цену входа
    let totalWeightedPrice = 0;
    distribution.forEach((percent, index) => {
        totalWeightedPrice += gridPrices[index] * (percent / 100);
    });
    const averagePrice = +totalWeightedPrice.toFixed(8);

    // 4. Рассчитываем максимальный риск
    const maxRisk = D * (R / 100);

    // 5. Рассчитываем общее количество актива
    const priceDiff = Math.abs(averagePrice - SL);
    if (priceDiff <= 0) {
        throw new Error('Разница между средней ценой и Stop Loss слишком мала для расчета объема.');
    }

    const totalQuantity = +(maxRisk / priceDiff).toFixed(8);

    // 6. Распределяем количество по ордерам
    const gridQuantities = distribution.map(percent =>
        +(totalQuantity * (percent / 100)).toFixed(8)
    );

    // 7. Рассчитываем сумму инвестиции
    const investment = gridQuantities.reduce((sum, qty, idx) =>
        sum + (qty * gridPrices[idx]), 0
    );

    // 8. Проверяем что инвестиция не превышает депозит
    if (investment > D) {
        console.warn(`Внимание: инвестиция (${investment.toFixed(2)} USDT) превышает депозит (${D.toFixed(2)} USDT).`);
    }

    // 9. Рассчитываем RR для каждого ордера (если есть TP)
    const gridOrders = gridPrices.map((price, idx) => ({
        order: idx + 1,
        price: +price.toFixed(8),
        quantity: gridQuantities[idx],
        percent: distribution[idx],
        amount: +(gridQuantities[idx] * price).toFixed(2),
        distanceToSL: Math.abs(price - SL),
        riskPerOrder: +(gridQuantities[idx] * Math.abs(price - SL)).toFixed(2)
    }));

    return {
        gridPrices,
        gridQuantities,
        gridAveragePrice: +averagePrice.toFixed(8),
        gridTotalQuantity: +totalQuantity.toFixed(8),
        gridInvestment: +investment.toFixed(2),
        gridOrders,
        gridStep: +priceStep.toFixed(8),
        gridMaxRisk: +maxRisk.toFixed(2),
        gridTotalRisk: gridOrders.reduce((sum, order) => sum + order.riskPerOrder, 0)
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
    // Валидация основных параметров
    const D = parseFloat(deposit);
    const R = parseFloat(riskSize);
    const EP = parseFloat(entryPrice);
    const SL = parseFloat(slPrice);
    const TP = takeProfitPrice ? parseFloat(takeProfitPrice) : null;

    // Проверка обязательных полей
    if (isNaN(D) || D <= 0) {
        throw new Error('Размер депозита обязателен и должен быть больше 0.');
    }

    if (isNaN(R) || R <= 0 || R > 100) {
        throw new Error('Риск на сделку должен быть от 0.01% до 100%.');
    }

    if (isNaN(EP) || EP <= 0) {
        throw new Error('Цена входа обязательна и должна быть больше 0.');
    }

    if (isNaN(SL) || SL <= 0) {
        throw new Error('Stop Loss обязателен и должен быть больше 0.');
    }

    if (direction !== 'long' && direction !== 'short') {
        throw new Error('Выберите направление сделки (Long или Short).');
    }

    if (EP === SL) {
        throw new Error('Цена входа и Stop Loss не должны совпадать.');
    }

    // Проверка логического соответствия SL и направления
    if (direction === 'long' && SL > EP) {
        throw new Error('Для Long позиции Stop Loss должен быть ниже цены входа.');
    }

    if (direction === 'short' && SL < EP) {
        throw new Error('Для Short позиции Stop Loss должен быть выше цены входа.');
    }

    // Проверка TP уровней
    if (tpLevels && Array.isArray(tpLevels)) {
        const tpErrors = [];
        let totalPercent = 0;

        tpLevels.forEach((tp, i) => {
            const tpPrice = parseFloat(tp.price);
            const tpPercent = parseFloat(tp.percent);

            if (isNaN(tpPrice) || tpPrice <= 0) {
                tpErrors.push(`TP ${i + 1}: неверная цена.`);
            } else if (tpPrice === EP) {
                tpErrors.push(`TP ${i + 1}: цена не должна совпадать с ценой входа.`);
            } else if (direction === 'long' && tpPrice < EP) {
                tpErrors.push(`TP ${i + 1}: для Long позиции цена должна быть выше цены входа.`);
            } else if (direction === 'short' && tpPrice > EP) {
                tpErrors.push(`TP ${i + 1}: для Short позиции цена должна быть ниже цены входа.`);
            }

            if (isNaN(tpPercent) || tpPercent <= 0) {
                tpErrors.push(`TP ${i + 1}: процент должен быть больше 0.`);
            } else {
                totalPercent += tpPercent;
            }
        });

        if (totalPercent > 100) {
            tpErrors.push(`Сумма процентов TP (${totalPercent.toFixed(2)}%) превышает 100%.`);
        }

        if (tpErrors.length > 0) {
            throw new Error(`Ошибки в уровнях Take Profit:\n${tpErrors.join('\n')}`);
        }
    }

    // РАСЧЕТ ДЛЯ СЕТОЧНОГО ВХОДА
    let gridReport = null;
    let calculatedEntryPrice = EP; // Сохраняем оригинальную цену входа
    let usedGridDistribution = [];

    if (gridEnabled) {
        try {
            // Преобразуем распределение в числа
            const distribution = gridDistribution.map(val => {
                if (val === '' || val === undefined || val === null) return 0;
                const num = parseFloat(val);
                return isNaN(num) ? 0 : num;
            });

            // Сохраняем использованное распределение
            usedGridDistribution = [...distribution];

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

    // Генерация ID отчета
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const reportId = `ORD${day}${month}${year}${hours}${minutes}${seconds}F`;

    // Расчет риска
    const RV = +(D * (R / 100)).toFixed(2);
    const SP = +(Math.abs(calculatedEntryPrice - SL) / 0.0001).toFixed(1);

    if (SP === 0) {
        throw new Error('Разница между ценой входа и Stop Loss слишком мала для расчета.');
    }

    // Расчет объема
    const VC = gridEnabled && gridReport
        ? gridReport.gridTotalQuantity
        : +(RV / Math.abs(calculatedEntryPrice - SL)).toFixed(8);

    if (VC <= 0) {
        throw new Error('Рассчитанный объем позиции должен быть больше 0.');
    }

    // Расчет стоимости позиции
    const VV = gridEnabled && gridReport
        ? gridReport.gridInvestment
        : +(VC * calculatedEntryPrice).toFixed(2);

    // Расчет прибыли по TP уровням
    let totalProfit = 0;
    const tpDetails = [];

    if (tpLevels && Array.isArray(tpLevels)) {
        tpLevels.forEach(tp => {
            const tpPrice = parseFloat(tp.price);
            const tpPercent = parseFloat(tp.percent);

            if (isNaN(tpPrice) || isNaN(tpPercent)) return;

            const volume = VC * (tpPercent / 100);
            const profitPerUnit = direction === 'long'
                ? tpPrice - calculatedEntryPrice
                : calculatedEntryPrice - tpPrice;

            const profit = profitPerUnit * volume;
            totalProfit += profit;

            const rrRatio = (Math.abs(tpPrice - calculatedEntryPrice) / Math.abs(calculatedEntryPrice - SL)).toFixed(2);
            const vc = +(volume).toFixed(8);
            const action = direction === 'long' ? 'Продать' : 'Купить';

            tpDetails.push({
                price: +tpPrice.toFixed(8),
                percent: +tpPercent.toFixed(2),
                rrRatio: +parseFloat(rrRatio).toFixed(2),
                vc,
                action,
                profit: +profit.toFixed(2),
                profitPercent: +((profit / VV) * 100).toFixed(2)
            });
        });

        totalProfit = +totalProfit.toFixed(2);
    }

    // Проверка суммарного объема TP
    const totalVC = tpDetails.reduce((acc, tp) => acc + tp.vc, 0);
    if (Math.abs(totalVC - VC) > 0.0001) {
        console.warn(`Суммарный объём TP (${totalVC}) не соответствует общему объёму (${VC})`);
    }

    // Расчет среднего и максимального RR
    let RR = null;
    let maxRR = null;

    if (tpDetails.length > 0) {
        RR = +(tpDetails.reduce((acc, tp) =>
            acc + (tp.rrRatio * (tp.percent / 100)), 0
        )).toFixed(2);

        maxRR = Math.max(...tpDetails.map(tp => tp.rrRatio));
    }

    // Дата отчета
    const date = now.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    // Формирование данных отчета
    const reportData = {
        reportId,
        instrument: instrument || 'Не указан',
        date,
        direction,
        directionLabel: getDirectionLabel(direction),
        deposit: +D.toFixed(2),
        riskSize: +R.toFixed(2),
        riskValue: RV,
        entryPrice: +calculatedEntryPrice.toFixed(8),
        slPrice: +SL.toFixed(8),
        slPoints: SP,
        vCoins: +VC.toFixed(8),
        vValue: +VV.toFixed(2),
        rrRatio: RR,
        takeProfitPrice: TP ? +TP.toFixed(8) : null,
        traderNote: traderNote || '',
        status: status || 'Запланирован',
        isBacktest: !!isBacktest,
        tpDetails,
        totalProfit,
        maxRR: maxRR ? +maxRR.toFixed(2) : null,
        // Данные сетки
        gridEnabled,
        gridOrdersCount: gridEnabled ? gridOrdersCount : null,
        gridDistribution: gridEnabled ? usedGridDistribution : null,
        gridReport,
        // Дополнительные метрики
        riskToDepositRatio: +((RV / D) * 100).toFixed(2),
        positionToDepositRatio: +((VV / D) * 100).toFixed(2),
        calculatedAt: now.toISOString()
    };

    return reportData;
}

// Дополнительные утилиты
export function calculateRiskAmount(deposit, riskPercent) {
    const D = parseFloat(deposit);
    const R = parseFloat(riskPercent);

    if (isNaN(D) || D <= 0) return 0;
    if (isNaN(R) || R <= 0 || R > 100) return 0;

    return +(D * (R / 100)).toFixed(2);
}

export function calculatePositionSize(entryPrice, slPrice, riskAmount) {
    const EP = parseFloat(entryPrice);
    const SL = parseFloat(slPrice);
    const RA = parseFloat(riskAmount);

    if (isNaN(EP) || EP <= 0) return 0;
    if (isNaN(SL) || SL <= 0) return 0;
    if (isNaN(RA) || RA <= 0) return 0;

    const priceDiff = Math.abs(EP - SL);
    if (priceDiff <= 0) return 0;

    return +(RA / priceDiff).toFixed(8);
}

export function calculateProfit(entryPrice, exitPrice, positionSize, direction) {
    const EP = parseFloat(entryPrice);
    const XP = parseFloat(exitPrice);
    const PS = parseFloat(positionSize);

    if (isNaN(EP) || isNaN(XP) || isNaN(PS)) return 0;

    if (direction === 'long') {
        return +((XP - EP) * PS).toFixed(2);
    } else if (direction === 'short') {
        return +((EP - XP) * PS).toFixed(2);
    }

    return 0;
}
