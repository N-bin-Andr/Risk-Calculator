import { useReducer, useEffect, useCallback } from 'react';
import {
  CalculatorState,
  CalculatorAction,
  Direction
} from '../types/calculator';
import { CALCULATOR_CONSTANTS, STORAGE_CONSTANTS } from '../utils/constants';
import { safeGetLocalStorage, safeSetLocalStorage, generateId } from '../utils/helpers';

/**
 * Начальное состояние калькулятора
 */
const initialState: CalculatorState = {
  // Основные параметры
  direction: 'long',
  instrument: '',
  entryPrice: '',
  stopLossPrice: '',
  takeProfitPrice: '',

  // Управление рисками
  deposit: CALCULATOR_CONSTANTS.DEFAULT_DEPOSIT,
  riskSize: CALCULATOR_CONSTANTS.DEFAULT_RISK_SIZE,
  stopLossPercent: CALCULATOR_CONSTANTS.DEFAULT_STOP_LOSS_PERCENT,
  takeProfitPercent: CALCULATOR_CONSTANTS.DEFAULT_TAKE_PROFIT_PERCENT,
  riskPerTrade: CALCULATOR_CONSTANTS.DEFAULT_RISK_PER_TRADE,
  riskReward: CALCULATOR_CONSTANTS.DEFAULT_RISK_REWARD,
  lotSize: CALCULATOR_CONSTANTS.DEFAULT_LOT_SIZE,

  // Настройки сетки
  gridEnabled: false,
  gridStartPrice: '',
  gridEndPrice: '',
  gridLevels: CALCULATOR_CONSTANTS.DEFAULT_GRID_LEVELS,
  gridVolumeType: 'fixed',
  gridFirstVolume: CALCULATOR_CONSTANTS.DEFAULT_GRID_FIRST_VOLUME,
  gridVolumeMultiplier: CALCULATOR_CONSTANTS.DEFAULT_GRID_VOLUME_MULTIPLIER,
  gridStepType: 'percent',
  gridStepValue: CALCULATOR_CONSTANTS.DEFAULT_GRID_STEP_VALUE,

  // Уровни тейк-профита
  takeProfitLevels: [],
  takeProfitLevelsEnabled: false,

  // Дополнительные настройки
  commissionEnabled: false,
  commission: CALCULATOR_CONSTANTS.DEFAULT_COMMISSION,
  swapEnabled: false,
  swapLong: CALCULATOR_CONSTANTS.DEFAULT_SWAP_LONG,
  swapShort: CALCULATOR_CONSTANTS.DEFAULT_SWAP_SHORT,
  spreadEnabled: false,
  spread: CALCULATOR_CONSTANTS.DEFAULT_SPREAD,

  // Результаты расчетов
  positionSize: '',
  riskAmount: '',
  investment: '',
  potentialProfit: '',
  potentialLoss: '',
  margin: '',
  freeMargin: '',
  marginLevel: '',

  // Флаги состояния
  isCalculating: false,
  isValid: false,
  lastCalculated: undefined,

  // История и шаблоны
  templateName: '',
  note: '',
  tags: []
};

/**
 * Редьюсер для управления состоянием калькулятора
 */
function calculatorReducer(state: CalculatorState, action: CalculatorAction): CalculatorState {
  switch (action.type) {
    case 'SET_DIRECTION':
      return { ...state, direction: action.payload };

    case 'SET_INSTRUMENT':
      return { ...state, instrument: action.payload };

    case 'SET_ENTRY_PRICE':
      return { ...state, entryPrice: action.payload };

    case 'SET_STOP_LOSS_PRICE':
      return { ...state, stopLossPrice: action.payload };

    case 'SET_TAKE_PROFIT_PRICE':
      return { ...state, takeProfitPrice: action.payload };

    case 'SET_DEPOSIT':
      return { ...state, deposit: action.payload };

    case 'SET_RISK_SIZE':
      return { ...state, riskSize: action.payload };

    case 'SET_STOP_LOSS_PERCENT':
      return { ...state, stopLossPercent: action.payload };

    case 'SET_TAKE_PROFIT_PERCENT':
      return { ...state, takeProfitPercent: action.payload };

    case 'SET_RISK_PER_TRADE':
      return { ...state, riskPerTrade: action.payload };

    case 'SET_RISK_REWARD':
      return { ...state, riskReward: action.payload };

    case 'SET_LOT_SIZE':
      return { ...state, lotSize: action.payload };

    case 'TOGGLE_GRID_ENABLED':
      return { ...state, gridEnabled: !state.gridEnabled };

    case 'SET_GRID_START_PRICE':
      return { ...state, gridStartPrice: action.payload };

    case 'SET_GRID_END_PRICE':
      return { ...state, gridEndPrice: action.payload };

    case 'SET_GRID_LEVELS':
      return { ...state, gridLevels: action.payload };

    case 'SET_GRID_VOLUME_TYPE':
      return { ...state, gridVolumeType: action.payload };

    case 'SET_GRID_FIRST_VOLUME':
      return { ...state, gridFirstVolume: action.payload };

    case 'SET_GRID_VOLUME_MULTIPLIER':
      return { ...state, gridVolumeMultiplier: action.payload };

    case 'SET_GRID_STEP_TYPE':
      return { ...state, gridStepType: action.payload };

    case 'SET_GRID_STEP_VALUE':
      return { ...state, gridStepValue: action.payload };

    case 'ADD_TAKE_PROFIT_LEVEL':
      return {
        ...state,
        takeProfitLevels: [
          ...state.takeProfitLevels,
          {
            id: generateId('tp'),
            price: '',
            percent: '',
            volume: '',
            note: ''
          }
        ]
      };

    case 'REMOVE_TAKE_PROFIT_LEVEL':
      return {
        ...state,
        takeProfitLevels: state.takeProfitLevels.filter(level => level.id !== action.payload)
      };

    case 'UPDATE_TAKE_PROFIT_LEVEL':
      return {
        ...state,
        takeProfitLevels: state.takeProfitLevels.map(level => {
          if (level.id === action.payload.id) {
            return {
              ...level,
              [action.payload.field]: action.payload.value
            };
          }
          return level;
        })
      };

    case 'TOGGLE_TAKE_PROFIT_LEVELS_ENABLED':
      return { ...state, takeProfitLevelsEnabled: !state.takeProfitLevelsEnabled };

    case 'TOGGLE_COMMISSION_ENABLED':
      return { ...state, commissionEnabled: !state.commissionEnabled };

    case 'SET_COMMISSION':
      return { ...state, commission: action.payload };

    case 'TOGGLE_SWAP_ENABLED':
      return { ...state, swapEnabled: !state.swapEnabled };

    case 'SET_SWAP_LONG':
      return { ...state, swapLong: action.payload };

    case 'SET_SWAP_SHORT':
      return { ...state, swapShort: action.payload };

    case 'TOGGLE_SPREAD_ENABLED':
      return { ...state, spreadEnabled: !state.spreadEnabled };

    case 'SET_SPREAD':
      return { ...state, spread: action.payload };

    case 'CALCULATE_RESULTS':
      return {
        ...state,
        isCalculating: true,
        lastCalculated: new Date()
      };

    case 'RESET_CALCULATOR':
      return {
        ...initialState,
        instrument: state.instrument, // Сохраняем выбранный инструмент
        tags: [...state.tags] // Сохраняем теги
      };

    case 'LOAD_TEMPLATE':
      return {
        ...state,
        ...action.payload,
        isCalculating: false
      };

    case 'SET_TEMPLATE_NAME':
      return { ...state, templateName: action.payload };

    case 'SET_NOTE':
      return { ...state, note: action.payload };

    case 'ADD_TAG':
      return {
        ...state,
        tags: [...state.tags, action.payload].filter((tag, index, array) =>
          array.indexOf(tag) === index // Убираем дубликаты
        )
      };

    case 'REMOVE_TAG':
      return {
        ...state,
        tags: state.tags.filter(tag => tag !== action.payload)
      };

    case 'SET_CALCULATION_STATE':
      return { ...state, isCalculating: action.payload };

    case 'SET_VALIDITY':
      return { ...state, isValid: action.payload };

    case 'UPDATE_MULTIPLE_FIELDS':
      return { ...state, ...action.payload };

    case 'RESET_FIELDS_EXCEPT': {
      const fieldsToKeep = action.payload.keepFields;
      const newState = { ...state };

      // Сбрасываем все поля, кроме указанных
      Object.keys(initialState).forEach(key => {
        const fieldKey = key as keyof CalculatorState;
        if (!fieldsToKeep.includes(fieldKey)) {
          // Используем any для обхода строгой типизации при динамическом ключе
          const initialValue = initialState[fieldKey];
          (newState as any)[fieldKey] = Array.isArray(initialValue)
            ? JSON.parse(JSON.stringify(initialValue))
            : initialValue;
        }
      });

      return newState;
    }

    case 'RESET_FORM_WITH_KEEP': {
      const fieldsToReset = action.payload.keepFields;
      const newState = { ...state };

      // Сбрасываем все поля, кроме указанных (альтернативная реализация)
      Object.keys(initialState).forEach(key => {
        const fieldKey = key as keyof CalculatorState;
        if (!fieldsToReset.includes(fieldKey)) {
          const initialValue = initialState[fieldKey];
          (newState as any)[fieldKey] = Array.isArray(initialValue)
            ? JSON.parse(JSON.stringify(initialValue))
            : initialValue;
        }
      });

      return newState;
    }

    default:
      return state;
  }
}

/**
 * Кастомный хук для управления состоянием калькулятора
 */
export function useCalculatorState() {
  const [state, dispatch] = useReducer(calculatorReducer, initialState);

  // Загрузка состояния из localStorage при монтировании
  useEffect(() => {
    const savedState = safeGetLocalStorage<CalculatorState>(
      STORAGE_CONSTANTS.KEYS.CALCULATOR_STATE
    );

    if (savedState) {
      dispatch({ type: 'UPDATE_MULTIPLE_FIELDS', payload: savedState });
    }
  }, []);

  // Сохранение состояния в localStorage при изменении
  useEffect(() => {
    safeSetLocalStorage(STORAGE_CONSTANTS.KEYS.CALCULATOR_STATE, state);
  }, [state]);

  // Действия (actions) для управления состоянием
  const actions = {
    setDirection: useCallback((direction: Direction) => {
      dispatch({ type: 'SET_DIRECTION', payload: direction });
    }, []),

    setInstrument: useCallback((instrument: string) => {
      dispatch({ type: 'SET_INSTRUMENT', payload: instrument });
    }, []),

    setEntryPrice: useCallback((price: string) => {
      dispatch({ type: 'SET_ENTRY_PRICE', payload: price });
    }, []),

    setStopLossPrice: useCallback((price: string) => {
      dispatch({ type: 'SET_STOP_LOSS_PRICE', payload: price });
    }, []),

    setTakeProfitPrice: useCallback((price: string) => {
      dispatch({ type: 'SET_TAKE_PROFIT_PRICE', payload: price });
    }, []),

    setDeposit: useCallback((deposit: string) => {
      dispatch({ type: 'SET_DEPOSIT', payload: deposit });
    }, []),

    setRiskSize: useCallback((riskSize: string) => {
      dispatch({ type: 'SET_RISK_SIZE', payload: riskSize });
    }, []),

    setStopLossPercent: useCallback((percent: string) => {
      dispatch({ type: 'SET_STOP_LOSS_PERCENT', payload: percent });
    }, []),

    setTakeProfitPercent: useCallback((percent: string) => {
      dispatch({ type: 'SET_TAKE_PROFIT_PERCENT', payload: percent });
    }, []),

    setRiskPerTrade: useCallback((risk: string) => {
      dispatch({ type: 'SET_RISK_PER_TRADE', payload: risk });
    }, []),

    setRiskReward: useCallback((riskReward: string) => {
      dispatch({ type: 'SET_RISK_REWARD', payload: riskReward });
    }, []),

    setLotSize: useCallback((lotSize: string) => {
      dispatch({ type: 'SET_LOT_SIZE', payload: lotSize });
    }, []),

    toggleGridEnabled: useCallback(() => {
      dispatch({ type: 'TOGGLE_GRID_ENABLED' });
    }, []),

    setGridStartPrice: useCallback((price: string) => {
      dispatch({ type: 'SET_GRID_START_PRICE', payload: price });
    }, []),

    setGridEndPrice: useCallback((price: string) => {
      dispatch({ type: 'SET_GRID_END_PRICE', payload: price });
    }, []),

    setGridLevels: useCallback((levels: string) => {
      dispatch({ type: 'SET_GRID_LEVELS', payload: levels });
    }, []),

    setGridVolumeType: useCallback((type: 'fixed' | 'multiplied') => {
      dispatch({ type: 'SET_GRID_VOLUME_TYPE', payload: type });
    }, []),

    setGridFirstVolume: useCallback((volume: string) => {
      dispatch({ type: 'SET_GRID_FIRST_VOLUME', payload: volume });
    }, []),

    setGridVolumeMultiplier: useCallback((multiplier: string) => {
      dispatch({ type: 'SET_GRID_VOLUME_MULTIPLIER', payload: multiplier });
    }, []),

    setGridStepType: useCallback((type: 'percent' | 'absolute') => {
      dispatch({ type: 'SET_GRID_STEP_TYPE', payload: type });
    }, []),

    setGridStepValue: useCallback((value: string) => {
      dispatch({ type: 'SET_GRID_STEP_VALUE', payload: value });
    }, []),

    addTakeProfitLevel: useCallback(() => {
      dispatch({ type: 'ADD_TAKE_PROFIT_LEVEL' });
    }, []),

    removeTakeProfitLevel: useCallback((id: string) => {
      dispatch({ type: 'REMOVE_TAKE_PROFIT_LEVEL', payload: id });
    }, []),

    updateTakeProfitLevel: useCallback((id: string, field: string, value: string) => {
      dispatch({
        type: 'UPDATE_TAKE_PROFIT_LEVEL',
        payload: { id, field: field as any, value }
      });
    }, []),

    toggleTakeProfitLevelsEnabled: useCallback(() => {
      dispatch({ type: 'TOGGLE_TAKE_PROFIT_LEVELS_ENABLED' });
    }, []),

    toggleCommissionEnabled: useCallback(() => {
      dispatch({ type: 'TOGGLE_COMMISSION_ENABLED' });
    }, []),

    setCommission: useCallback((commission: string) => {
      dispatch({ type: 'SET_COMMISSION', payload: commission });
    }, []),

    toggleSwapEnabled: useCallback(() => {
      dispatch({ type: 'TOGGLE_SWAP_ENABLED' });
    }, []),

    setSwapLong: useCallback((swap: string) => {
      dispatch({ type: 'SET_SWAP_LONG', payload: swap });
    }, []),

    setSwapShort: useCallback((swap: string) => {
      dispatch({ type: 'SET_SWAP_SHORT', payload: swap });
    }, []),

    toggleSpreadEnabled: useCallback(() => {
      dispatch({ type: 'TOGGLE_SPREAD_ENABLED' });
    }, []),

    setSpread: useCallback((spread: string) => {
      dispatch({ type: 'SET_SPREAD', payload: spread });
    }, []),

    calculateResults: useCallback(() => {
      dispatch({ type: 'CALCULATE_RESULTS' });
    }, []),

    resetCalculator: useCallback(() => {
      dispatch({ type: 'RESET_CALCULATOR' });
    }, []),

    loadTemplate: useCallback((template: Partial<CalculatorState>) => {
      dispatch({ type: 'LOAD_TEMPLATE', payload: template });
    }, []),

    setTemplateName: useCallback((name: string) => {
      dispatch({ type: 'SET_TEMPLATE_NAME', payload: name });
    }, []),

    setNote: useCallback((note: string) => {
      dispatch({ type: 'SET_NOTE', payload: note });
    }, []),

    addTag: useCallback((tag: string) => {
      dispatch({ type: 'ADD_TAG', payload: tag });
    }, []),

    removeTag: useCallback((tag: string) => {
      dispatch({ type: 'REMOVE_TAG', payload: tag });
    }, []),

    setCalculationState: useCallback((isCalculating: boolean) => {
      dispatch({ type: 'SET_CALCULATION_STATE', payload: isCalculating });
    }, []),

    setValidity: useCallback((isValid: boolean) => {
      dispatch({ type: 'SET_VALIDITY', payload: isValid });
    }, []),

    updateMultipleFields: useCallback((fields: Partial<CalculatorState>) => {
      dispatch({ type: 'UPDATE_MULTIPLE_FIELDS', payload: fields });
    }, []),

    resetFieldsExcept: useCallback((keepFields: (keyof CalculatorState)[]) => {
      dispatch({ type: 'RESET_FIELDS_EXCEPT', payload: { keepFields } });
    }, []),

    resetFormWithKeep: useCallback((keepFields: (keyof CalculatorState)[]) => {
      dispatch({ type: 'RESET_FORM_WITH_KEEP', payload: { keepFields } });
    }, [])
  };

  return {
    state,
    dispatch,
    actions
  };
}
