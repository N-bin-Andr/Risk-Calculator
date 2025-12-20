export function validateFields(state) {
    const errors = {};

    const EP = parseFloat(state.entryPrice);
    const TP = parseFloat(state.takeProfitPrice);
    const SL = parseFloat(state.slPrice);

    if (!state.instrument) errors.instrument = 'Инструмент обязателен';
    if (isNaN(EP)) errors.entryPrice = 'Цена входа должна быть числом';

    if (!isNaN(TP)) {
        if (TP === EP) errors.tpError = 'TP не должен совпадать с ценой входа';
        else if (state.direction === 'long' && TP < EP) errors.tpError = 'TP должен быть выше цены входа при Long позиции';
        else if (state.direction === 'short' && TP > EP) errors.tpError = 'TP должен быть ниже цены входа при Short позиции';
    }

    if (!isNaN(SL)) {
        if (SL === EP) errors.slError = 'SL не должен совпадать с ценой входа';
        else if (state.direction === 'long' && SL > EP) errors.slError = 'SL должен быть ниже цены входа при Long позиции';
        else if (state.direction === 'short' && SL < EP) errors.slError = 'SL должен быть выше цены входа при Short позиции';
    }

    // === НОВАЯ ВАЛИДАЦИЯ ДЛЯ СЕТОЧНОГО ВХОДА ===
    if (state.gridEnabled) {
        // Проверка количества ордеров
        if (state.gridOrdersCount < 1 || state.gridOrdersCount > 10) {
            errors.gridError = 'Количество ордеров должно быть от 1 до 10';
        }

        // Проверка распределения
        if (state.gridDistribution && Array.isArray(state.gridDistribution)) {
            const totalPercent = state.gridDistribution.reduce((sum, percent) => sum + parseFloat(percent || 0), 0);

            if (Math.abs(totalPercent - 100) > 0.01) { // Допуск 0.01%
                errors.gridError = errors.gridError
                    ? `${errors.gridError}. Сумма распределения должна быть 100% (сейчас: ${totalPercent.toFixed(2)}%)`
                    : `Сумма распределения должна быть 100% (сейчас: ${totalPercent.toFixed(2)}%)`;
            }

            // Проверка каждого значения
            state.gridDistribution.forEach((percent, index) => {
                const p = parseFloat(percent);
                if (isNaN(p) || p < 0 || p > 100) {
                    errors.gridError = errors.gridError
                        ? `${errors.gridError}. Ордер ${index + 1}: процент должен быть от 0 до 100`
                        : `Ордер ${index + 1}: процент должен быть от 0 до 100`;
                }
            });
        }

        // Проверка что есть цена входа и SL для расчета сетки
        if (isNaN(EP) || isNaN(SL)) {
            errors.gridError = errors.gridError
                ? `${errors.gridError}. Для расчета сетки нужны цена входа и SL`
                : 'Для расчета сетки нужны цена входа и SL';
        }

        // Проверка что цена входа и SL не совпадают
        if (!isNaN(EP) && !isNaN(SL) && EP === SL) {
            errors.gridError = errors.gridError
                ? `${errors.gridError}. Цена входа и SL не должны совпадать для сетки`
                : 'Цена входа и SL не должны совпадать для сетки';
        }

        // Проверка направления сделки для сетки
        if (!state.direction) {
            errors.gridError = errors.gridError
                ? `${errors.gridError}. Для сетки нужно выбрать направление сделки`
                : 'Для сетки нужно выбрать направление сделки';
        }
    }

    return errors;
}