import { useMemo } from 'react';
import { CalculatorState, ValidationResult, GridValidationParams, TakeProfitValidationParams } from '../types/calculator';
import ValidationService from '../services/validationService'; // Исправленный импорт

/**
 * Хук для валидации состояния калькулятора
 */
export function useValidation(state: CalculatorState): ValidationResult {
  return useMemo(() => {
    try {
      return ValidationService.validateCalculator(state);
    } catch (error) {
      console.error('Validation error:', error);
      return {
        errors: {},
        isValid: false
      };
    }
  }, [
    state.instrument,
    state.entryPrice,
    state.stopLossPrice,
    state.takeProfitPrice,
    state.deposit,
    state.riskSize,
    state.stopLossPercent,
    state.takeProfitPercent,
    state.riskPerTrade,
    state.riskReward,
    state.lotSize,
    state.direction
  ]);
}

/**
 * Хук для валидации настроек сетки
 */
export function useGridValidation(params: GridValidationParams): ValidationResult {
  return useMemo(() => {
    try {
      const result = ValidationService.validateGrid(params);
      return {
        errors: result.errors,
        isValid: result.isValid
      };
    } catch (error) {
      console.error('Grid validation error:', error);
      return {
        errors: {},
        isValid: false
      };
    }
  }, [
    params.gridEnabled,
    params.gridStartPrice,
    params.gridEndPrice,
    params.gridLevels,
    params.entryPrice,
    params.stopLossPrice,
    params.direction
  ]);
}

/**
 * Хук для валидации уровней тейк-профита
 */
export function useTakeProfitValidation(params: TakeProfitValidationParams) {
  return useMemo(() => {
    try {
      return ValidationService.validateTakeProfit(params);
    } catch (error) {
      console.error('Take profit validation error:', error);
      return {
        errors: {},
        isValid: false,
        takeProfitErrors: []
      };
    }
  }, [
    params.takeProfitLevels,
    params.entryPrice,
    params.stopLossPrice,
    params.direction,
    params.deposit,
    params.riskSize
  ]);
}

/**
 * Хук для комплексной валидации всего калькулятора
 */
export function useCompleteValidation(
  calculatorState: CalculatorState,
  gridParams: GridValidationParams,
  tpParams: TakeProfitValidationParams
): ValidationResult {
  return useMemo(() => {
    try {
      return ValidationService.validateAll(calculatorState, gridParams, tpParams);
    } catch (error) {
      console.error('Complete validation error:', error);
      return {
        errors: {},
        isValid: false
      };
    }
  }, [calculatorState, gridParams, tpParams]);
}

/**
 * Хук для проверки валидности конкретного поля
 */
export function useFieldValidation(
  state: CalculatorState,
  fieldName: keyof CalculatorState
): { isValid: boolean; error?: string } {
  return useMemo(() => {
    const validation = ValidationService.validateCalculator(state);
    const error = validation.errors[fieldName];

    return {
      isValid: !error,
      error
    };
  }, [state, fieldName]);
}

/**
 * Хук для проверки возможности расчета
 */
export function useCalculationReadiness(state: CalculatorState): {
  isReady: boolean;
  missingFields: string[];
} {
  return useMemo(() => {
    const missingFields: string[] = [];

    // Проверяем обязательные поля
    if (!state.instrument || state.instrument.trim() === '') {
      missingFields.push('instrument');
    }

    if (!state.entryPrice || parseFloat(state.entryPrice) <= 0) {
      missingFields.push('entryPrice');
    }

    if (!state.stopLossPrice || parseFloat(state.stopLossPrice) <= 0) {
      missingFields.push('stopLossPrice');
    }

    if (!state.deposit || parseFloat(state.deposit) <= 0) {
      missingFields.push('deposit');
    }

    if (!state.riskSize || parseFloat(state.riskSize) <= 0) {
      missingFields.push('riskSize');
    }

    if (!state.lotSize || parseFloat(state.lotSize) <= 0) {
      missingFields.push('lotSize');
    }

    // Проверяем логическую валидность
    if (!missingFields.length) {
      const entry = parseFloat(state.entryPrice);
      const sl = parseFloat(state.stopLossPrice);

      if (state.direction === 'long' && sl >= entry) {
        missingFields.push('stopLossPrice');
      }

      if (state.direction === 'short' && sl <= entry) {
        missingFields.push('stopLossPrice');
      }
    }

    return {
      isReady: missingFields.length === 0,
      missingFields
    };
  }, [
    state.instrument,
    state.entryPrice,
    state.stopLossPrice,
    state.deposit,
    state.riskSize,
    state.lotSize,
    state.direction
  ]);
}

/**
 * Хук для получения сообщений об ошибках в удобном формате
 */
export function useErrorMessages(
  validationResult: ValidationResult
): { field: string; message: string }[] {
  return useMemo(() => {
    return Object.entries(validationResult.errors)
      .map(([field, message]) => ({
        field,
        message: message || 'Неизвестная ошибка'
      }))
      .filter(error => error.message);
  }, [validationResult.errors]);
}

/**
 * Хук для проверки валидности перед отправкой в Notion
 */
export function useExportValidation(state: CalculatorState): {
  isValid: boolean;
  errors: string[];
} {
  return useMemo(() => {
    const errors: string[] = [];
    const validation = ValidationService.validateCalculator(state);

    // Проверяем основные ошибки
    Object.entries(validation.errors).forEach(([field, message]) => {
      if (message) {
        errors.push(`${field}: ${message}`);
      }
    });

    // Дополнительные проверки для экспорта
    if (!state.templateName?.trim()) {
      errors.push('Для экспорта укажите название шаблона');
    }

    if (parseFloat(state.riskSize) > 50) {
      errors.push('Риск более 50% слишком высок для экспорта');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }, [state]);
}

export default {
  useValidation,
  useGridValidation,
  useTakeProfitValidation,
  useCompleteValidation,
  useFieldValidation,
  useCalculationReadiness,
  useErrorMessages,
  useExportValidation
};
