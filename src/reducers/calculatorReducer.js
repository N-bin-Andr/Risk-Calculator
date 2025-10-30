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
                resetState[key] = action.fieldsToKeep.includes(key) ? state[key] : '';
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


