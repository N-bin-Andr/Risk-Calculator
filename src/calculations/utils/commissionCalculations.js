// src/calculations/utils/commissionCalculations.js
/**
 * Утилиты для расчета торговых комиссий
 */
export function calculateCommission(volume, price, commissionRate, commissionType = 'percentage') {
    if (commissionType === 'percentage') {
        return volume * price * (commissionRate / 100);
    } else if (commissionType === 'fixed') {
        return commissionRate;
    } else if (commissionType === 'per_unit') {
        return volume * commissionRate;
    }
    return 0;
}

export function calculateSpreadCost(bidPrice, askPrice, volume) {
    return (askPrice - bidPrice) * volume;
}

export function calculateFundingRate(positionSize, fundingRate) {
    return positionSize * fundingRate;
}
