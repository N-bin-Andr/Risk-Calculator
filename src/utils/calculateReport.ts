// Определяем типы для состояния
export interface TPLevel {
  price: string;
  percent: number;
}

export interface CalculatorState {
  tpError: string;
  slError: string;
  gridError: string;
  isBacktest: boolean;
  direction: string;
  instrument: string;
  entryPrice: string;
  slPrice: string;
  takeProfitPrice: string;
  tpLevels: TPLevel[];
  traderNote: string;
  reportId: string;
  date: string;
  showReport: boolean;
  vCoins: number;
  vValue: number;
  rrRatio: string;
  riskValue: string;
  slPoints: number;
  deposit: string;
  riskSize: string;
  status: string;

  // === НОВЫЕ ПОЛЯ ДЛЯ СЕТОЧНОГО ВХОДА ===
  gridEnabled: boolean;           // Включен ли сеточный вход
  gridOrdersCount: number;        // Количество ордеров в сетке (по умолчанию 3)
  gridDistribution: string[];     // Распределение % по ордерам (пустые строки)
  gridPrices: number[];           // Рассчитанные цены для каждого ордера
  gridQuantities: number[];       // Рассчитанные объемы для каждого ордера
  gridAveragePrice: number;       // Средняя цена входа по сетке
  gridTotalQuantity: number;      // Общее количество актива
  gridInvestment: number;         // Общая сумма инвестиции
  gridCalculated: boolean;        // Флаг что расчет сетки выполнен
}

export const initialState: CalculatorState = {
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
  gridEnabled: false,
  gridOrdersCount: 3,
  gridDistribution: ['', '', ''],
  gridPrices: [],
  gridQuantities: [],
  gridAveragePrice: 0,
  gridTotalQuantity: 0,
  gridInvestment: 0,
  gridCalculated: false,
};

// Определяем типы действий
type SetFieldAction = {
  type: 'SET_FIELD';
  field: keyof CalculatorState;
  value: any;
};

type ResetFormAction = {
  type: 'RESET_FORM';
  keepFields?: (keyof CalculatorState)[];
};

type ResetFieldsExceptAction = {
  type: 'RESET_FIELDS_EXCEPT';
  fieldsToKeep: (keyof CalculatorState)[];
};

type AddTPLevelAction = {
  type: 'ADD_TP_LEVEL';
};

type RemoveTPLevelAction = {
  type: 'REMOVE_TP_LEVEL';
  index: number;
};

type UpdateTPLevelAction = {
  type: 'UPDATE_TP_LEVEL';
  index: number;
  field: keyof TPLevel;
  value: string | number;
};

type ToggleGridAction = {
  type: 'TOGGLE_GRID';
};

type SetGridOrdersCountAction = {
  type: 'SET_GRID_ORDERS_COUNT';
  value: number;
};

type UpdateGridDistributionAction = {
  type: 'UPDATE_GRID_DISTRIBUTION';
  index?: number;
  value?: string;
  fullDistribution?: string[];
};

type SetGridCalculationResultsAction = {
  type: 'SET_GRID_CALCULATION_RESULTS';
  prices: number[];
  quantities: number[];
  averagePrice: number;
  totalQuantity: number;
  investment: number;
};

type ResetGridCalculationAction = {
  type: 'RESET_GRID_CALCULATION';
};

type ResetGridDistributionAction = {
  type: 'RESET_GRID_DISTRIBUTION';
};

type SetDefaultGridPresetAction = {
  type: 'SET_DEFAULT_GRID_PRESET';
  preset: 'equal' | 'decreasing' | 'increasing' | 'custom';
};

type SaveStateAction = {
  type: 'SAVE_STATE';
};

type LoadStateAction = {
  type: 'LOAD_STATE';
};

type CalculatorAction =
  | SetFieldAction
  | ResetFormAction
  | ResetFieldsExceptAction
  | AddTPLevelAction
  | RemoveTPLevelAction
  | UpdateTPLevelAction
  | ToggleGridAction
  | SetGridOrdersCountAction
  | UpdateGridDistributionAction
  | SetGridCalculationResultsAction
  | ResetGridCalculationAction
  | ResetGridDistributionAction
  | SetDefaultGridPresetAction
  | SaveStateAction
  | LoadStateAction;

// Вспомогательная функция для преобразования процента в число
const parsePercent = (percent: number | string): number => {
  if (typeof percent === 'string') {
    const parsed = parseFloat(percent);
    return isNaN(parsed) ? 0 : parsed;
  }
  return percent;
};

// Вспомогательная функция для безопасного сброса формы
const resetFormWithKeep = (
  state: CalculatorState,
  keepFields: (keyof CalculatorState)[] = []
): CalculatorState => {
  const newState = { ...initialState };

  // Сохраняем указанные поля
  keepFields.forEach(field => {
    const value = state[field];
    if (value !== undefined && value !== null) {
      (newState as any)[field] = value;
    }
  });

  // Сохраняем исторически важные поля
  newState.instrument = state.instrument || newState.instrument;
  newState.isBacktest = state.isBacktest || newState.isBacktest;
  newState.deposit = state.deposit || newState.deposit;
  newState.riskSize = state.riskSize || newState.riskSize;

  return newState;
};

// Вспомогательная функция для сброса всех полей кроме указанных
const resetFieldsExcept = (
  state: CalculatorState,
  fieldsToKeep: (keyof CalculatorState)[]
): CalculatorState => {
  const newState: any = {};

  (Object.keys(state) as Array<keyof CalculatorState>).forEach(key => {
    if (fieldsToKeep.includes(key)) {
      newState[key] = state[key];
    } else {
      const initial = initialState[key];

      // Обрабатываем разные типы данных
      if (Array.isArray(initial)) {
        newState[key] = [...initial];
      } else if (typeof initial === 'number') {
        newState[key] = 0;
      } else if (typeof initial === 'boolean') {
        newState[key] = false;
      } else if (typeof initial === 'object' && initial !== null) {
        // Используем глубокое копирование для объектов
        newState[key] = JSON.parse(JSON.stringify(initial));
      } else {
        newState[key] = '';
      }
    }
  });

  return newState as CalculatorState;
};

export function calculatorReducer(
  state: CalculatorState,
  action: CalculatorAction
): CalculatorState {
  switch (action.type) {
    case 'SET_FIELD':
      return {
        ...state,
        [action.field]: action.value,
      };

    case 'RESET_FORM':
      return resetFormWithKeep(state, action.keepFields);

    case 'RESET_FIELDS_EXCEPT':
      return resetFieldsExcept(state, action.fieldsToKeep);

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
      const totalPercent = newTpLevels.reduce((sum, tp) => sum + tp.percent, 0);
      if (Math.abs(totalPercent - 100) > 0.01 && newTpLevels.length > 0) {
        const lastIndex = newTpLevels.length - 1;
        const lastPercent = newTpLevels[lastIndex].percent;
        newTpLevels[lastIndex] = {
          ...newTpLevels[lastIndex],
          percent: 100 - (totalPercent - lastPercent)
        };
      }

      return {
        ...state,
        tpLevels: newTpLevels,
        tpError: '' // Сбрасываем ошибку при удалении уровня
      };

    case 'UPDATE_TP_LEVEL':
      const updatedTpLevels = state.tpLevels.map((tp, i) =>
        i === action.index ? {
          ...tp,
          [action.field]: action.field === 'percent'
            ? parsePercent(action.value)
            : action.value
        } : tp
      );

      // Проверяем сумму процентов после обновления
      const newTotalPercent = updatedTpLevels.reduce((sum, tp) => sum + tp.percent, 0);

      // Автоматически корректируем последний уровень, если сумма не 100%
      if (Math.abs(newTotalPercent - 100) > 0.01 && updatedTpLevels.length > 0) {
        const lastIndex = updatedTpLevels.length - 1;
        if (action.index !== lastIndex) { // Не корректируем если редактируем последний
          const lastPercent = updatedTpLevels[lastIndex].percent;
          const adjustment = 100 - (newTotalPercent - lastPercent);
          updatedTpLevels[lastIndex] = {
            ...updatedTpLevels[lastIndex],
            percent: Math.max(0, adjustment)
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
      let updatedDistribution: string[];

      if (action.fullDistribution) {
        // Используем полностью обновленный массив если передан
        updatedDistribution = [...action.fullDistribution];
      } else if (action.index !== undefined && action.value !== undefined) {
        // Иначе обновляем только указанный индекс
        updatedDistribution = [...state.gridDistribution];
        let newValue: string;

        if (action.value === '') {
          newValue = '';
        } else {
          const numValue = parseFloat(action.value);
          newValue = isNaN(numValue) ? '' : Math.max(0, Math.min(100, numValue)).toString();
        }

        updatedDistribution[action.index] = newValue;
      } else {
        updatedDistribution = state.gridDistribution;
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
      let presetDistribution: string[];

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
        const savedState = JSON.parse(localStorage.getItem('calculatorState') || 'null');
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
      const _exhaustiveCheck: never = action;
      console.warn(`Неизвестный тип действия: ${(action as any).type}`);
      return state;
  }
}
