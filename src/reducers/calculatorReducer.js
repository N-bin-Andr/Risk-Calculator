export const initialState = {
    tpError: '',
    slError: '',
    isBacktest: false,
    direction: '',
    instrument: '',
    entryPrice: '',
    slPrice: '',
    takeProfitPrice: '',
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
        default:
            return state;
        case 'RESET_FIELDS_EXCEPT':
            const resetState = {};
            Object.keys(state).forEach(key => {
                resetState[key] = action.fieldsToKeep.includes(key) ? state[key] : '';
            });
            return resetState;
    }
}


