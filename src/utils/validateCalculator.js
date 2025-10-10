export function validateFields(state) {
    const errors = {};

    const EP = parseFloat(state.entryPrice);
    const TP = parseFloat(state.takeProfitPrice);
    const SL = parseFloat(state.slPrice);

    if (!state.instrument) errors.instrument = 'Инструмент обязателен';
    if (isNaN(EP)) errors.entryPrice = 'Цена входа должна быть числом';

    if (!isNaN(TP)) {
        if (TP === EP) errors.tpError = 'TP не должен совпадать с ценой входа';
        else if (state.direction === 'buy' && TP < EP) errors.tpError = 'TP должен быть выше цены входа при покупке';
        else if (state.direction === 'sell' && TP > EP) errors.tpError = 'TP должен быть ниже цены входа при продаже';
    }

    if (!isNaN(SL)) {
        if (SL === EP) errors.slError = 'SL не должен совпадать с ценой входа';
        else if (state.direction === 'buy' && SL > EP) errors.slError = 'SL должен быть ниже цены входа при покупке';
        else if (state.direction === 'sell' && SL < EP) errors.slError = 'SL должен быть выше цены входа при продаже';
    }

    return errors;
}
