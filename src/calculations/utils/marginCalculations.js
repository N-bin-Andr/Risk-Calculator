// src/calculations/utils/marginCalculations.js
/**
 * Утилиты для расчета маржинальных требований
 */
export function calculateInitialMargin(positionValue, marginRequirement) {
    return positionValue * marginRequirement;
}

export function calculateMaintenanceMargin(positionValue, maintenanceRate) {
    return positionValue * maintenanceRate;
}

export function calculateLiquidationPrice(entryPrice, positionSize, margin, direction) {
    // Упрощенный расчет цены ликвидации
    const marginRatio = margin / (positionSize * entryPrice);
    if (direction === 'long') {
        return entryPrice * (1 - marginRatio);
    } else {
        return entryPrice * (1 + marginRatio);
    }
}
