// src/utils/gridValidation.js

export const validateGridInput = (gridDistribution, gridOrdersCount) => {
    const errors = [];
    const warnings = [];

    // Проверка на пустые значения
    for (let i = 0; i < gridOrdersCount - 1; i++) {
        if (!gridDistribution[i] || gridDistribution[i].trim() === '') {
            errors.push(`Ордер ${i + 1}: не заполнено`);
        }
    }

    // Проверка что значения являются числами
    const numericValues = gridDistribution.map(val => {
        const num = parseFloat(val);
        return isNaN(num) ? 0 : num;
    });

    // Проверка что значения положительные
    for (let i = 0; i < gridOrdersCount - 1; i++) {
        if (numericValues[i] <= 0) {
            errors.push(`Ордер ${i + 1}: значение должно быть больше 0`);
        }
        if (numericValues[i] > 100) {
            errors.push(`Ордер ${i + 1}: значение не может превышать 100%`);
        }
    }

    // Сумма всех значений кроме последнего
    const sumBeforeLast = numericValues.slice(0, -1).reduce((acc, val) => acc + val, 0);

    if (sumBeforeLast > 100) {
        errors.push(`Сумма введенных значений (${sumBeforeLast.toFixed(1)}%) превышает 100%`);
    }

    if (sumBeforeLast === 0) {
        errors.push('Заполните хотя бы один ордер');
    }

    // Проверка распределения
    if (sumBeforeLast > 80) {
        warnings.push('Большая часть капитала сконцентрирована в первых ордерах');
    }

    const lastValue = numericValues[gridOrdersCount - 1];
    if (lastValue < 0) {
        errors.push(`Последний ордер не может быть отрицательным: ${lastValue.toFixed(1)}%`);
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
        calculatedLast: (100 - sumBeforeLast).toFixed(1)
    };
};

export const calculateOptimalDistribution = (gridOrdersCount, strategy = 'equal') => {
    switch (strategy) {
        case 'decreasing':
            // Убывающее распределение: 50%, 30%, 20% для 3 ордеров
            const decreasing = [];
            let remaining = 100;
            for (let i = 0; i < gridOrdersCount - 1; i++) {
                const value = Math.round((remaining * 0.6) / (gridOrdersCount - i));
                decreasing.push(value);
                remaining -= value;
            }
            decreasing.push(remaining);
            return decreasing.map(v => v.toFixed(1));

        case 'increasing':
            // Возрастающее распределение: 20%, 30%, 50% для 3 ордеров
            const increasing = [];
            remaining = 100;
            let base = 20;
            for (let i = 0; i < gridOrdersCount - 1; i++) {
                const value = Math.min(base, remaining - 10);
                increasing.push(value);
                remaining -= value;
                base += 15;
            }
            increasing.push(remaining);
            return increasing.map(v => v.toFixed(1));

        case 'pyramid':
            // Пирамида: 40%, 30%, 20%, 10% для 4 ордеров
            const pyramid = [];
            remaining = 100;
            let factor = 0.4;
            for (let i = 0; i < gridOrdersCount - 1; i++) {
                const value = Math.round(remaining * factor);
                pyramid.push(value);
                remaining -= value;
                factor *= 0.75;
            }
            pyramid.push(remaining);
            return pyramid.map(v => v.toFixed(1));

        default: // 'equal'
            // Равномерное распределение
            const equalValue = (100 / gridOrdersCount).toFixed(1);
            return Array(gridOrdersCount).fill(equalValue);
    }
};

export const getDistributionPresets = () => {
    return [
        { id: 'equal', name: 'Равномерное', description: 'Все ордера одинакового размера' },
        { id: 'decreasing', name: 'Убывающее', description: 'Первый ордер самый крупный' },
        { id: 'increasing', name: 'Возрастающее', description: 'Последний ордер самый крупный' },
        { id: 'pyramid', name: 'Пирамида', description: 'Уменьшение размера ордеров' }
    ];
};
