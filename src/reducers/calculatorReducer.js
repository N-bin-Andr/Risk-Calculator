export const initialState = {
    tpError: '',
    slError: '',
    gridError: '',
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
    deposit: '',
    riskSize: '',
    status: 'Запланирован',

    // === НОВЫЕ ПОЛЯ ДЛЯ СЕТОЧНОГО ВХОДА ===
    gridEnabled: false,           // Включен ли сеточный вход
    gridOrdersCount: 3,          // Количество ордеров в сетке (по умолчанию 3)
    gridDistribution: ['', '', ''], // Распределение % по ордерам (пустые строки)
    gridPrices: [],               // Рассчитанные цены для каждого ордера
    gridQuantities: [],           // Рассчитанные объемы для каждого ордера
    gridAveragePrice: 0,          // Средняя цена входа по сетке
    gridTotalQuantity: 0,         // Общее количество актива
    gridInvestment: 0,            // Общая сумма инвестиции
    gridCalculated: false,        // Флаг что расчет сетки выполнен
};

export function calculatorReducer(state, action) {
    switch (action.type) {
        case 'SET_FIELD':
            return {
                ...state,
                [action.field]: action.value,
            };

        case 'RESET_FORM':
            // Сохраняем только исторически важные поля
            const fieldsToKeep = action.keepFields || [];
            const resetState = { ...initialState };

            // Сохраняем указанные поля
            fieldsToKeep.forEach(field => {
                if (state[field] !== undefined) {
                    resetState[field] = state[field];
                }
            });

            // Сохраняем исторически важные поля
            resetState.instrument = state.instrument || resetState.instrument;
            resetState.isBacktest = state.isBacktest || resetState.isBacktest;
            resetState.deposit = state.deposit || resetState.deposit;
            resetState.riskSize = state.riskSize || resetState.riskSize;

            return resetState;

        case 'RESET_FIELDS_EXCEPT':
            const resetState2 = {};
            Object.keys(state).forEach(key => {
                if (action.fieldsToKeep.includes(key)) {
                    resetState2[key] = state[key];
                } else {
                    const initial = initialState[key];
                    resetState2[key] =
                        Array.isArray(initial) ? [...initial] :
                            typeof initial === 'number' ? 0 :
                                typeof initial === 'boolean' ? false :
                                    typeof initial === 'object' && initial !== null ? { ...initial } :
                                        '';
                }
            });
            return resetState2;

        case 'ADD_TP_LEVEL':
            if (state.tpLevels.length >= 5) {
                console.warn('Максимальное количество TP уровней - 5');
                return state;
            }
            return {
                ...state,
                tpLevels: [...state.tpLevels, { price: '', percent: 0 }],
                tpError: '' // Сбрасываем ошибку при добавлении нового уровня
            };

        case 'REMOVE_TP_LEVEL':
            if (state.tpLevels.length <= 1) {
                console.warn('Должен остаться хотя бы один TP уровень');
                return state;
            }
            const newTpLevels = state.tpLevels.filter((_, i) => i !== action.index);

            // Пересчитываем проценты, если после удаления сумма не 100%
            const totalPercent = newTpLevels.reduce((sum, tp) => sum + parseFloat(tp.percent || 0), 0);
            if (totalPercent !== 100 && newTpLevels.length > 0) {
                const lastIndex = newTpLevels.length - 1;
                newTpLevels[lastIndex] = {
                    ...newTpLevels[lastIndex],
                    percent: 100 - (totalPercent - parseFloat(newTpLevels[lastIndex].percent || 0))
                };
            }

            return {
                ...state,
                tpLevels: newTpLevels,
                tpError: '' // Сбрасываем ошибку при удалении уровня
            };

        case 'UPDATE_TP_LEVEL':
            const updatedTpLevels = state.tpLevels.map((tp, i) =>
                i === action.index ? { ...tp, [action.field]: action.value } : tp
            );

            // Проверяем сумму процентов после обновления
            const newTotalPercent = updatedTpLevels.reduce((sum, tp) => {
                const percent = parseFloat(tp.percent);
                return sum + (isNaN(percent) ? 0 : percent);
            }, 0);

            // Автоматически корректируем последний уровень, если сумма не 100%
            if (Math.abs(newTotalPercent - 100) > 0.01 && updatedTpLevels.length > 0) {
                const lastIndex = updatedTpLevels.length - 1;
                if (action.index !== lastIndex) { // Не корректируем если редактируем последний
                    const lastPercent = parseFloat(updatedTpLevels[lastIndex].percent || 0);
                    const adjustment = 100 - (newTotalPercent - lastPercent);
                    updatedTpLevels[lastIndex] = {
                        ...updatedTpLevels[lastIndex],
                        percent: Math.max(0, adjustment).toFixed(1)
                    };
                }
            }

            return {
                ...state,
                tpLevels: updatedTpLevels,
                tpError: '' // Сбрасываем ошибку при обновлении
            };

        // === НОВЫЕ ACTION ДЛЯ УПРАВЛЕНИЯ СЕТКОЙ ===
        case 'TOGGLE_GRID':
            const newGridEnabled = !state.gridEnabled;
            if (!newGridEnabled) {
                // При отключении сетки сбрасываем все связанные поля
                return {
                    ...state,
                    gridEnabled: newGridEnabled,
                    gridPrices: [],
                    gridQuantities: [],
                    gridAveragePrice: 0,
                    gridTotalQuantity: 0,
                    gridInvestment: 0,
                    gridCalculated: false,
                    gridError: '',
                    // Сбрасываем распределение до начального
                    gridDistribution: ['', '', ''],
                    gridOrdersCount: 3
                };
            }
            return {
                ...state,
                gridEnabled: newGridEnabled,
                gridError: '' // Сбрасываем ошибку при включении
            };

        case 'SET_GRID_ORDERS_COUNT':
            const newCount = Math.max(1, Math.min(10, action.value)); // Ограничение 1-10 ордеров

            // Создаем новое распределение с сохранением значений где возможно
            const newDistribution = Array(newCount).fill('');
            if (state.gridDistribution) {
                const minLength = Math.min(newCount, state.gridDistribution.length);
                for (let i = 0; i < minLength; i++) {
                    newDistribution[i] = state.gridDistribution[i];
                }
            }

            // Автоматически рассчитываем последнее поле
            if (newCount > 1) {
                const filledValues = newDistribution.slice(0, -1).map(val => {
                    const num = parseFloat(val);
                    return isNaN(num) ? 0 : num;
                });

                const sumFilled = filledValues.reduce((acc, val) => acc + val, 0);
                if (sumFilled < 100) {
                    newDistribution[newCount - 1] = (100 - sumFilled).toFixed(1);
                } else if (sumFilled > 100) {
                    newDistribution[newCount - 1] = 'Ошибка: >100%';
                }
            }

            return {
                ...state,
                gridOrdersCount: newCount,
                gridDistribution: newDistribution,
                // Сбрасываем результаты расчета при изменении конфигурации
                gridPrices: [],
                gridQuantities: [],
                gridAveragePrice: 0,
                gridTotalQuantity: 0,
                gridInvestment: 0,
                gridCalculated: false,
                gridError: newDistribution[newCount - 1] === 'Ошибка: >100%' ? 'Сумма распределения превышает 100%' : ''
            };

        case 'UPDATE_GRID_DISTRIBUTION':
            let updatedDistribution;

            if (action.fullDistribution) {
                // Используем полностью обновленный массив если передан
                updatedDistribution = [...action.fullDistribution];
            } else {
                // Иначе обновляем только указанный индекс
                updatedDistribution = [...state.gridDistribution];
                let newValue;

                if (action.value === '') {
                    newValue = '';
                } else {
                    const numValue = parseFloat(action.value);
                    newValue = isNaN(numValue) ? '' : Math.max(0, Math.min(100, numValue)).toString();
                }

                updatedDistribution[action.index] = newValue;
            }

            // Проверяем заполненность полей кроме последнего
            const filledIndices = updatedDistribution.slice(0, -1).filter(val =>
                val !== '' && val !== undefined && val !== null
            ).length;

            // Суммируем значения кроме последнего
            const sumFilled = updatedDistribution.slice(0, -1).reduce((sum, val) => {
                if (val === '' || val === undefined || val === null) return sum;
                const numVal = parseFloat(val);
                return sum + (isNaN(numVal) ? 0 : numVal);
            }, 0);

            const lastIndex = state.gridOrdersCount - 1;
            let gridError = '';

            // Автоматически рассчитываем последнее поле
            if (filledIndices === state.gridOrdersCount - 1) {
                // Все поля кроме последнего заполнены
                if (sumFilled < 100) {
                    updatedDistribution[lastIndex] = (100 - sumFilled).toFixed(1);
                } else if (sumFilled > 100) {
                    updatedDistribution[lastIndex] = 'Ошибка: >100%';
                    gridError = `Сумма введенных значений (${sumFilled.toFixed(1)}%) превышает 100%`;
                } else {
                    updatedDistribution[lastIndex] = '0.0';
                }
            } else {
                // Не все поля заполнены - сбрасываем последнее
                updatedDistribution[lastIndex] = '';
            }

            // Проверяем что последнее поле не отрицательное
            const lastValue = parseFloat(updatedDistribution[lastIndex]);
            if (!isNaN(lastValue) && lastValue < 0) {
                updatedDistribution[lastIndex] = 'Ошибка: >100%';
                gridError = `Сумма введенных значений (${sumFilled.toFixed(1)}%) превышает 100%`;
            }

            return {
                ...state,
                gridDistribution: updatedDistribution,
                gridError,
                // Сбрасываем расчеты при изменении распределения
                gridPrices: [],
                gridQuantities: [],
                gridAveragePrice: 0,
                gridTotalQuantity: 0,
                gridInvestment: 0,
                gridCalculated: false
            };

        case 'SET_GRID_CALCULATION_RESULTS':
            return {
                ...state,
                gridPrices: action.prices || [],
                gridQuantities: action.quantities || [],
                gridAveragePrice: action.averagePrice || 0,
                gridTotalQuantity: action.totalQuantity || 0,
                gridInvestment: action.investment || 0,
                gridCalculated: true,
                gridError: '' // Сбрасываем ошибки при успешном расчете
            };

        case 'RESET_GRID_CALCULATION':
            return {
                ...state,
                gridPrices: [],
                gridQuantities: [],
                gridAveragePrice: 0,
                gridTotalQuantity: 0,
                gridInvestment: 0,
                gridCalculated: false
            };

        case 'RESET_GRID_DISTRIBUTION':
            // Сбрасываем распределение к начальному состоянию
            const resetDistribution = Array(state.gridOrdersCount).fill('');
            if (state.gridOrdersCount > 1) {
                resetDistribution[0] = '100.0';
                for (let i = 1; i < state.gridOrdersCount; i++) {
                    resetDistribution[i] = '';
                }
            }
            return {
                ...state,
                gridDistribution: resetDistribution,
                gridPrices: [],
                gridQuantities: [],
                gridAveragePrice: 0,
                gridTotalQuantity: 0,
                gridInvestment: 0,
                gridCalculated: false,
                gridError: ''
            };

        case 'SET_DEFAULT_GRID_PRESET':
            // Устанавливаем предустановленные значения распределения
            const preset = action.preset || 'equal'; // 'equal', 'decreasing', 'increasing', 'custom'
            let presetDistribution;

            switch (preset) {
                case 'equal':
                    const equalValue = (100 / state.gridOrdersCount).toFixed(1);
                    presetDistribution = Array(state.gridOrdersCount).fill(equalValue);
                    break;
                case 'decreasing':
                    presetDistribution = [];
                    let total = 0;
                    for (let i = 0; i < state.gridOrdersCount - 1; i++) {
                        const value = (60 / Math.pow(2, i)).toFixed(1);
                        presetDistribution.push(value);
                        total += parseFloat(value);
                    }
                    presetDistribution.push((100 - total).toFixed(1));
                    break;
                case 'increasing':
                    presetDistribution = [];
                    total = 0;
                    for (let i = 0; i < state.gridOrdersCount - 1; i++) {
                        const value = (20 * (i + 1)).toFixed(1);
                        presetDistribution.push(value);
                        total += parseFloat(value);
                    }
                    presetDistribution.push((100 - total).toFixed(1));
                    break;
                default:
                    return state;
            }

            return {
                ...state,
                gridDistribution: presetDistribution,
                gridError: '',
                // Сбрасываем расчеты при изменении пресета
                gridPrices: [],
                gridQuantities: [],
                gridAveragePrice: 0,
                gridTotalQuantity: 0,
                gridInvestment: 0,
                gridCalculated: false
            };

        case 'SAVE_STATE':
            // Сохраняем текущее состояние в localStorage
            try {
                localStorage.setItem('calculatorState', JSON.stringify(state));
            } catch (error) {
                console.error('Ошибка сохранения состояния:', error);
            }
            return state;

        case 'LOAD_STATE':
            // Загружаем состояние из localStorage
            try {
                const savedState = JSON.parse(localStorage.getItem('calculatorState'));
                if (savedState) {
                    return {
                        ...initialState,
                        ...savedState,
                        // Сбрасываем временные поля
                        gridPrices: [],
                        gridQuantities: [],
                        gridAveragePrice: 0,
                        gridTotalQuantity: 0,
                        gridInvestment: 0,
                        gridCalculated: false,
                        showReport: false
                    };
                }
            } catch (error) {
                console.error('Ошибка загрузки состояния:', error);
            }
            return state;

        default:
            console.warn(`Неизвестный тип действия: ${action.type}`);
            return state;
    }
}
