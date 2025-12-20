// calculatorReducer.js

/*export const initialState = {
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
       default:
           return state;
   }
}
*/
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
    gridDistribution: [60, 30, 10], // Распределение % по ордерам
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

            // Корректируем распределение при изменении количества ордеров
            let newDistribution;
            if (newCount > state.gridDistribution.length) {
                // Добавляем новые ордера с равномерным распределением
                newDistribution = [...state.gridDistribution];
                const remainingPercent = 100 - state.gridDistribution.reduce((a, b) => a + b, 0);
                const newOrderPercent = remainingPercent / (newCount - state.gridDistribution.length);
                for (let i = state.gridDistribution.length; i < newCount; i++) {
                    newDistribution.push(newOrderPercent);
                }
            } else {
                // Уменьшаем количество ордеров, сохраняя пропорции
                newDistribution = state.gridDistribution.slice(0, newCount);
                const totalPercent = newDistribution.reduce((a, b) => a + b, 0);
                // Нормализуем к 100%
                newDistribution = newDistribution.map(p => (p / totalPercent) * 100);
            }

            return {
                ...state,
                gridOrdersCount: newCount,
                gridDistribution: newDistribution
            };

        case 'UPDATE_GRID_DISTRIBUTION':
            const updatedDistribution = [...state.gridDistribution];
            updatedDistribution[action.index] = Math.max(0, Math.min(100, action.value));

            // Нормализуем сумму к 100%
            const total = updatedDistribution.reduce((a, b) => a + b, 0);
            if (total !== 100) {
                const factor = 100 / total;
                for (let i = 0; i < updatedDistribution.length; i++) {
                    updatedDistribution[i] = updatedDistribution[i] * factor;
                }
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