import {
  validateCalculator,
  validateGrid,
  validateTakeProfit,
  validateAll
} from '../utils/validateCalculator';
import {
  CalculatorState,
  GridValidationParams,
  TakeProfitValidationParams,
  ValidationResult,
  GridValidationResult,
  TakeProfitValidationResult,
  ValidationErrors
} from '../types/calculator';

export class ValidationService {
  static validateCalculator(state: CalculatorState): ValidationResult {
    return validateCalculator(state);
  }

  static validateGrid(params: GridValidationParams): GridValidationResult {
    return validateGrid(params);
  }

  static validateTakeProfit(params: TakeProfitValidationParams): TakeProfitValidationResult {
    return validateTakeProfit(params);
  }

  static validateAll(
    calculatorState: CalculatorState,
    gridParams: GridValidationParams,
    tpParams: TakeProfitValidationParams
  ): ValidationResult {
    return validateAll(calculatorState, gridParams, tpParams);
  }

  static validateOrder(params: {
    direction: 'long' | 'short';
    entryPrice: number;
    stopLossPrice: number;
    takeProfitPrice?: number;
  }): ValidationResult {
    const errors: ValidationErrors = {};

    if (!params.direction) {
      errors.direction = 'Укажите направление сделки';
    }

    if (!params.entryPrice || params.entryPrice <= 0) {
      errors.entryPrice = 'Введите корректную цену входа';
    }

    if (!params.stopLossPrice || params.stopLossPrice <= 0) {
      errors.stopLossPrice = 'Введите корректный стоп-лосс';
    }

    if (params.takeProfitPrice !== undefined && params.takeProfitPrice <= 0) {
      errors.takeProfitPrice = 'Введите корректный тейк-профит';
    }

    // Логическая валидация
    if (!errors.entryPrice && !errors.stopLossPrice) {
      if (params.direction === 'long') {
        if (params.stopLossPrice >= params.entryPrice) {
          errors.stopLossPrice = 'Для LONG стоп-лосс должен быть ниже цены входа';
        }
        if (params.takeProfitPrice && params.takeProfitPrice <= params.entryPrice) {
          errors.takeProfitPrice = 'Для LONG тейк-профит должен быть выше цены входа';
        }
      } else if (params.direction === 'short') {
        if (params.stopLossPrice <= params.entryPrice) {
          errors.stopLossPrice = 'Для SHORT стоп-лосс должен быть выше цены входа';
        }
        if (params.takeProfitPrice && params.takeProfitPrice >= params.entryPrice) {
          errors.takeProfitPrice = 'Для SHORT тейк-профит должен быть ниже цены входа';
        }
      }
    }

    return {
      errors,
      isValid: Object.keys(errors).length === 0
    };
  }

  static validateRisk(params: {
    deposit: number;
    riskSize: number;
    riskPerTrade: number;
  }): ValidationResult {
    const errors: ValidationErrors = {};

    if (!params.deposit || params.deposit <= 0) {
      errors.deposit = 'Введите корректный депозит';
    }

    if (!params.riskSize || params.riskSize <= 0 || params.riskSize > 100) {
      errors.riskSize = 'Размер риска должен быть от 0.01% до 100%';
    }

    if (!params.riskPerTrade || params.riskPerTrade <= 0) {
      errors.riskPerTrade = 'Введите корректный риск на сделку';
    }

    return {
      errors,
      isValid: Object.keys(errors).length === 0
    };
  }

  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  static isValidPhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }
}

export default ValidationService;
