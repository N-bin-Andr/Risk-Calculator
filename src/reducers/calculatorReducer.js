export const initialState = {
    reportId: '',
    date: '',
    instrument: '',
    entryPrice: '',
    slPrice: '',
    takeProfitPrice: '',
    direction: 'buy',
    traderNote: '',
    riskValue: '',
    slPoints: 0,
    vCoins: 0,
    vValue: 0,
    rrRatio: '',
    isBacktest: false,
    tpError: '',
    slError: '',
    showReport: false,
};

export function calculatorReducer(state, action) {
    switch (action.type) {
        case 'SET_FIELD':
            return { ...state, [action.field]: action.value };
        case 'RESET_FORM':
            return { ...initialState };
        default:
            return state;
    }
}
