import {
  CalculatorState,
  TPLevel,
  Direction,
  ValidationResult,
  GridValidationParams,
  TakeProfitValidationParams
} from '../types/calculator';

// Типы для валидационных ошибок
export interface ValidationErrors {
  instrument?: string;
  entryPrice?: string;
  stopLossPrice?: string;
  takeProfitPrice?: string;
  deposit?: string;
  riskSize?: string;
  stopLossPercent?: string;
  takeProfitPercent?: string;
  riskPerTrade?: string;
  riskReward?: string;
  lotSize?: string;
  takeProfitLevels?: string;
  gridStartPrice?: string;
  gridEndPrice?: string;
  gridLevels?: string;
  gridVolumeType?: string;
  gridFirstVolume?: string;
  gridVolumeMultiplier?: string;
  gridStepType?: string;
  gridStepValue?: string;
  [key: string]: string | undefined;
}

export interface GridValidationResult {
  errors: ValidationErrors;
  isValid: boolean;
}

export interface TakeProfitValidationResult {
  errors: ValidationErrors;
  isValid: boolean;
  takeProfitErrors?: string[];
}

/**
 * Валидация основных полей калькулятора
 */
export const validateCalculator = (state: CalculatorState): ValidationResult => {
  const errors: ValidationErrors = {};

  // Валидация инструмента
  if (!state.instrument || state.instrument.trim() === '') {
    errors.instrument = 'Выберите инструмент';
  }

  // Валидация цены входа
  const entryPrice = parseFloat(state.entryPrice);
  if (!state.entryPrice || isNaN(entryPrice) || entryPrice <= 0) {
    errors.entryPrice = 'Введите корректную цену входа';
  }

  // Валидация стоп-лосса
  const stopLossPrice = parseFloat(state.stopLossPrice);
  if (!state.stopLossPrice || isNaN(stopLossPrice) || stopLossPrice <= 0) {
    errors.stopLossPrice = 'Введите корректный стоп-лосс';
  }

  // Валидация тейк-профита (только если поле заполнено)
  if (state.takeProfitPrice && state.takeProfitPrice.trim() !== '') {
    const takeProfitPrice = parseFloat(state.takeProfitPrice);
    if (isNaN(takeProfitPrice) || takeProfitPrice <= 0) {
      errors.takeProfitPrice = 'Введите корректный тейк-профит';
    }
  }

  // Валидация депозита
  const deposit = parseFloat(state.deposit);
  if (!state.deposit || isNaN(deposit) || deposit <= 0) {
    errors.deposit = 'Введите корректный депозит';
  }

  // Валидация размера риска
  const riskSize = parseFloat(state.riskSize);
  if (!state.riskSize || isNaN(riskSize) || riskSize <= 0 || riskSize > 100) {
    errors.riskSize = 'Размер риска должен быть от 0.01% до 100%';
  }

  // Валидация процента стоп-лосса
  const stopLossPercent = parseFloat(state.stopLossPercent);
  if (!state.stopLossPercent || isNaN(stopLossPercent) || stopLossPercent <= 0) {
    errors.stopLossPercent = 'Введите корректный процент стоп-лосса';
  }

  // Валидация процента тейк-профита (только если поле заполнено)
  if (state.takeProfitPercent && state.takeProfitPercent.trim() !== '') {
    const takeProfitPercent = parseFloat(state.takeProfitPercent);
    if (isNaN(takeProfitPercent) || takeProfitPercent <= 0) {
      errors.takeProfitPercent = 'Введите корректный процент тейк-профита';
    }
  }

  // Валидация риска на сделку
  const riskPerTrade = parseFloat(state.riskPerTrade);
  if (!state.riskPerTrade || isNaN(riskPerTrade) || riskPerTrade <= 0) {
    errors.riskPerTrade = 'Введите корректный риск на сделку';
  }

  // Валидация риск-риворда (только если поле заполнено)
  if (state.riskReward && state.riskReward.trim() !== '') {
    const riskReward = parseFloat(state.riskReward);
    if (isNaN(riskReward) || riskReward <= 0) {
      errors.riskReward = 'Введите корректный риск-риворд';
    }
  }

  // Валидация размера лота
  const lotSize = parseFloat(state.lotSize);
  if (!state.lotSize || isNaN(lotSize) || lotSize <= 0) {
    errors.lotSize = 'Введите корректный размер лота';
  }

  // Логическая валидация цен
  if (!errors.entryPrice && !errors.stopLossPrice && state.direction) {
    const entry = parseFloat(state.entryPrice);
    const sl = parseFloat(state.stopLossPrice);

    if (state.direction === 'long') {
      if (sl >= entry) {
        errors.stopLossPrice = 'Для LONG стоп-лосс должен быть ниже цены входа';
      }
    } else if (state.direction === 'short') {
      if (sl <= entry) {
        errors.stopLossPrice = 'Для SHORT стоп-лосс должен быть выше цены входа';
      }
    }
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0
  };
};

/**
 * Валидация настроек сетки
 */
export const validateGrid = (params: GridValidationParams): GridValidationResult => {
  const errors: ValidationErrors = {};

  if (!params.gridEnabled) {
    return { errors, isValid: true };
  }

  // Валидация начальной цены сетки
  const gridStartPrice = parseFloat(params.gridStartPrice);
  if (!params.gridStartPrice || isNaN(gridStartPrice) || gridStartPrice <= 0) {
    errors.gridStartPrice = 'Введите корректную начальную цену сетки';
  }

  // Валидация конечной цены сетки
  const gridEndPrice = parseFloat(params.gridEndPrice);
  if (!params.gridEndPrice || isNaN(gridEndPrice) || gridEndPrice <= 0) {
    errors.gridEndPrice = 'Введите корректную конечную цену сетки';
  }

  // Валидация количества уровней сетки
  const gridLevels = parseInt(params.gridLevels, 10);
  if (!params.gridLevels || isNaN(gridLevels) || gridLevels < 2 || gridLevels > 100) {
    errors.gridLevels = 'Количество уровней должно быть от 2 до 100';
  }

  // Логическая валидация цен сетки
  if (!errors.gridStartPrice && !errors.gridEndPrice && params.direction) {
    const start = parseFloat(params.gridStartPrice);
    const end = parseFloat(params.gridEndPrice);
    const entry = parseFloat(params.entryPrice);
    const sl = parseFloat(params.stopLossPrice);

    if (params.direction === 'long') {
      if (start >= end) {
        errors.gridStartPrice = 'Для LONG начальная цена должна быть ниже конечной';
      }
      if (start >= entry) {
        errors.gridStartPrice = 'Для LONG начальная цена сетки должна быть ниже цены входа';
      }
      if (end <= sl) {
        errors.gridEndPrice = 'Для LONG конечная цена сетки должна быть выше стоп-лосса';
      }
    } else if (params.direction === 'short') {
      if (start <= end) {
        errors.gridStartPrice = 'Для SHORT начальная цена должна быть выше конечной';
      }
      if (start <= entry) {
        errors.gridStartPrice = 'Для SHORT начальная цена сетки должна быть выше цены входа';
      }
      if (end >= sl) {
        errors.gridEndPrice = 'Для SHORT конечная цена сетки должна быть ниже стоп-лосса';
      }
    }
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0
  };
};

/**
 * Валидация уровней тейк-профита
 */
export const validateTakeProfit = (params: TakeProfitValidationParams): TakeProfitValidationResult => {
  const errors: ValidationErrors = {};
  const takeProfitErrors: string[] = [];

  if (!params.takeProfitLevels || params.takeProfitLevels.length === 0) {
    return { errors, isValid: true, takeProfitErrors: [] };
  }

  const entry = parseFloat(params.entryPrice);
  const sl = parseFloat(params.stopLossPrice);

  // Проверка наличия цены входа и стоп-лосса
  if (isNaN(entry) || isNaN(sl)) {
    errors.entryPrice = 'Сначала установите цену входа и стоп-лосс';
    return { errors, isValid: false, takeProfitErrors: [] };
  }

  // Проверка суммы процентов (максимум 100%)
  const totalPercent = params.takeProfitLevels.reduce((sum, lvl) => {
    const percent = parseFloat(lvl.percent);
    return sum + (isNaN(percent) ? 0 : percent);
  }, 0);

  if (totalPercent > 100) {
    errors.takeProfitLevels = `Сумма процентов тейк-профитов не должна превышать 100% (сейчас: ${totalPercent.toFixed(2)}%)`;
  }

  // Валидация каждого уровня
  params.takeProfitLevels.forEach((level, index) => {
    const tpPrice = parseFloat(level.price);
    const tpPercent = parseFloat(level.percent);

    if (isNaN(tpPrice) || tpPrice <= 0) {
      takeProfitErrors.push(`Уровень ${index + 1}: некорректная цена`);
    }

    if (isNaN(tpPercent) || tpPercent <= 0) {
      takeProfitErrors.push(`Уровень ${index + 1}: некорректный процент`);
    }

    // Логическая валидация для LONG
    if (params.direction === 'long') {
      if (tpPrice <= entry) {
        takeProfitErrors.push(`Уровень ${index + 1}: для LONG тейк-профит должен быть выше цены входа`);
      }
      if (tpPrice <= sl) {
        takeProfitErrors.push(`Уровень ${index + 1}: для LONG тейк-профит должен быть выше стоп-лосса`);
      }
    }
    // Логическая валидация для SHORT
    else if (params.direction === 'short') {
      if (tpPrice >= entry) {
        takeProfitErrors.push(`Уровень ${index + 1}: для SHORT тейк-профит должен быть ниже цены входа`);
      }
      if (tpPrice >= sl) {
        takeProfitErrors.push(`Уровень ${index + 1}: для SHORT тейк-профит должен быть ниже стоп-лосса`);
      }
    }
  });

  return {
    errors,
    isValid: Object.keys(errors).length === 0 && takeProfitErrors.length === 0,
    takeProfitErrors
  };
};

/**
 * Общая валидация всех параметров калькулятора
 */
export const validateAll = (
  state: CalculatorState,
  gridParams: GridValidationParams,
  tpParams: TakeProfitValidationParams
): ValidationResult => {
  const calculatorValidation = validateCalculator(state);
  const gridValidation = validateGrid(gridParams);
  const tpValidation = validateTakeProfit(tpParams);

  const allErrors = {
    ...calculatorValidation.errors,
    ...gridValidation.errors,
    ...tpValidation.errors
  };

  return {
    errors: allErrors,
    isValid: calculatorValidation.isValid && gridValidation.isValid && tpValidation.isValid
  };
};

export default {
  validateCalculator,
  validateGrid,
  validateTakeProfit,
  validateAll
};
