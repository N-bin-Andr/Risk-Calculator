export const initialState = {
    tpError: '',
    slError: '',
    isBacktest: false,
    direction: '',
    instrument: '',
    entryPrice: '',
    slPrice: '',
    takeProfitPrice: '',
    tpLevels: [{ price: '', percent: 100 }],
    traderNote: '',
    reportId: '',
    date: '',
    showReport: false,
    vCoins: 0,
    vValue: 0,
    rrRatio: '',
    riskValue: '',
    slPoints: 0,

    // === НОВЫЕ ПОЛЯ ДЛЯ СЕТОЧНОГО ВХОДА ===
    gridEnabled: false,           // Включен ли сеточный вход
    gridOrdersCount: 3,          // Количество ордеров в сетке (по умолчанию 3)
    gridDistribution: ['', '', ''], // Распределение % по ордерам (пустые строки)
    gridPrices: [],               // Рассчитанные цены для каждого ордера
    gridQuantities: [],           // Рассчитанные объемы для каждого ордера
    gridAveragePrice: 0,          // Средняя цена входа по сетке
    gridTotalQuantity: 0,         // Общее количество актива
    gridInvestment: 0,            // Общая сумма инвестиции
};

export function calculatorReducer(state, action) {
    switch (action.type) {
        case 'SET_FIELD':
            return {
                ...state,
                [action.field]: action.value,
            };

        case 'RESET_FORM':
            return initialState;

        case 'RESET_FIELDS_EXCEPT':
            const resetState = {};
            Object.keys(state).forEach(key => {
                if (action.fieldsToKeep.includes(key)) {
                    resetState[key] = state[key];
                } else {
                    const initial = initialState[key];
                    resetState[key] =
                        Array.isArray(initial) ? [] :
                            typeof initial === 'number' ? 0 :
                                typeof initial === 'boolean' ? false :
                                    typeof initial === 'object' ? {} :
                                        '';
                }
            });
            return resetState;

        case 'ADD_TP_LEVEL':
            return {
                ...state,
                tpLevels: [...state.tpLevels, { price: '', percent: 0 }]
            };

        case 'REMOVE_TP_LEVEL':
            return {
                ...state,
                tpLevels: state.tpLevels.filter((_, i) => i !== action.index)
            };

        case 'UPDATE_TP_LEVEL':
            return {
                ...state,
                tpLevels: state.tpLevels.map((tp, i) =>
                    i === action.index ? { ...tp, [action.field]: action.value } : tp
                )
            };

        // === НОВЫЕ ACTION ДЛЯ УПРАВЛЕНИЯ СЕТКОЙ ===
        case 'TOGGLE_GRID':
            return {
                ...state,
                gridEnabled: !state.gridEnabled,
                // При включении сетки сбрасываем обычный entryPrice
                ...(!state.gridEnabled && state.entryPrice ? { entryPrice: '' } : {})
            };

        case 'SET_GRID_ORDERS_COUNT':
            const newCount = Math.max(1, Math.min(10, action.value)); // Ограничение 1-10 ордеров

            // При изменении количества ордеров создаем пустой массив
            const emptyDistribution = new Array(newCount).fill('');

            return {
                ...state,
                gridOrdersCount: newCount,
                gridDistribution: emptyDistribution,
                // Сбрасываем результаты расчета при изменении конфигурации
                gridPrices: [],
                gridQuantities: [],
                gridAveragePrice: 0,
                gridTotalQuantity: 0,
                gridInvestment: 0
            };

        case 'UPDATE_GRID_DISTRIBUTION':
            const updatedDistribution = [...state.gridDistribution];
            const newValue = action.value === '' ? '' : Math.max(0, Math.min(100, action.value));
            updatedDistribution[action.index] = newValue;

            // Автоматически заполняем последнее поле, если все предыдущие заполнены
            const filledIndices = updatedDistribution.slice(0, -1).filter(val => val !== '' && val !== undefined).length;
            const sumFilled = updatedDistribution.slice(0, -1).reduce((sum, val) => {
                const numVal = parseFloat(val);
                return sum + (isNaN(numVal) ? 0 : numVal);
            }, 0);

            // Если все поля кроме последнего заполнены и сумма < 100, заполняем последнее
            if (filledIndices === state.gridOrdersCount - 1 && sumFilled < 100) {
                updatedDistribution[state.gridOrdersCount - 1] = +(100 - sumFilled).toFixed(1);
            } else if (filledIndices < state.gridOrdersCount - 1) {
                // Если не все заполнены, сбрасываем последнее
                updatedDistribution[state.gridOrdersCount - 1] = '';
            }

            // Если сумма заполненных > 100, показываем ошибку в последнем поле
            if (sumFilled > 100) {
                updatedDistribution[state.gridOrdersCount - 1] = 'Ошибка: >100%';
            }

            return {
                ...state,
                gridDistribution: updatedDistribution
            };

        case 'SET_GRID_CALCULATION_RESULTS':
            return {
                ...state,
                gridPrices: action.prices || [],
                gridQuantities: action.quantities || [],
                gridAveragePrice: action.averagePrice || 0,
                gridTotalQuantity: action.totalQuantity || 0,
                gridInvestment: action.investment || 0
            };

        case 'RESET_GRID_CALCULATION':
            return {
                ...state,
                gridPrices: [],
                gridQuantities: [],
                gridAveragePrice: 0,
                gridTotalQuantity: 0,
                gridInvestment: 0
            };

        default:
            return state;
    }
}