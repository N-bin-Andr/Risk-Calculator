// src/utils/validateCalculator.js

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
        if (state.gridOrdersCount < 1 || state.gridOrdersCount > 7) {
            errors.gridError = 'Количество ордеров должно быть от 1 до 10';
        }

        // Проверка распределения (поэтапное заполнение)
        if (state.gridDistribution && Array.isArray(state.gridDistribution)) {
            let totalPercent = 0;
            let hasEmptyBeforeLast = false;
            let hasInvalidValue = false;

            // Проверяем каждое поле кроме последнего
            for (let i = 0; i < state.gridDistribution.length - 1; i++) {
                const val = state.gridDistribution[i];

                if (val === '' || val === undefined || val === null) {
                    hasEmptyBeforeLast = true;
                    if (!errors.gridError && i === 0) {
                        errors.gridError = `Заполните поле для ордера ${i + 1}`;
                    }
                } else {
                    const p = parseFloat(val);
                    if (isNaN(p)) {
                        hasInvalidValue = true;
                        errors.gridError = errors.gridError
                            ? `${errors.gridError}. Ордер ${i + 1}: введите число`
                            : `Ордер ${i + 1}: введите число`;
                    } else if (p <= 0) {
                        hasInvalidValue = true;
                        errors.gridError = errors.gridError
                            ? `${errors.gridError}. Ордер ${i + 1}: значение должно быть > 0`
                            : `Ордер ${i + 1}: значение должно быть > 0`;
                    } else if (p > 100) {
                        hasInvalidValue = true;
                        errors.gridError = errors.gridError
                            ? `${errors.gridError}. Ордер ${i + 1}: значение не может превышать 100%`
                            : `Ордер ${i + 1}: значение не может превышать 100%`;
                    } else {
                        totalPercent += p;
                    }
                }
            }

            // Проверяем последнее поле (должно быть заполнено автоматически)
            const lastIndex = state.gridDistribution.length - 1;
            const lastValue = state.gridDistribution[lastIndex];

            if (!hasEmptyBeforeLast && !hasInvalidValue) {
                // Все предыдущие поля заполнены корректно
                const lastNum = parseFloat(lastValue);

                if (isNaN(lastNum)) {
                    errors.gridError = errors.gridError
                        ? `${errors.gridError}. Последнее поле не рассчитано`
                        : 'Ошибка расчета последнего поля';
                } else if (lastNum < 0) {
                    errors.gridError = errors.gridError
                        ? `${errors.gridError}. Сумма превышает 100% (остаток: ${lastNum.toFixed(1)}%)`
                        : `Сумма превышает 100% (остаток: ${lastNum.toFixed(1)}%)`;
                } else {
                    const finalTotal = totalPercent + lastNum;

                    if (Math.abs(finalTotal - 100) > 0.1) {
                        errors.gridError = errors.gridError
                            ? `${errors.gridError}. Сумма должна быть 100% (сейчас: ${finalTotal.toFixed(1)}%)`
                            : `Сумма должна быть 100% (сейчас: ${finalTotal.toFixed(1)}%)`;
                    }
                }
            }

            // Проверка на текст "Ошибка: >100%" в последнем поле
            if (typeof lastValue === 'string' && lastValue.includes('Ошибка: >100%')) {
                errors.gridError = errors.gridError
                    ? `${errors.gridError}. Сумма введенных значений превышает 100%`
                    : 'Сумма введенных значений превышает 100%';
            }
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
