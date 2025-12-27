import { useMemo } from 'react';
import { CalculatorState, GridReport } from '../types/calculator';
import { CalculationService } from '../services/calculationService';
import { safeParseFloat } from '../utils/helpers';

/**
 * Хук для расчета сетки ордеров
 */
export function useGridCalculations(state: CalculatorState): GridReport | null {
  return useMemo(() => {
    // Если сетка не включена, возвращаем null
    if (!state.gridEnabled) {
      return null;
    }

    try {
      // Подготавливаем параметры для расчета сетки
      const gridParams = {
        gridEnabled: state.gridEnabled,
        gridStartPrice: state.gridStartPrice,
        gridEndPrice: state.gridEndPrice,
        gridLevels: state.gridLevels,
        gridVolumeType: state.gridVolumeType,
        gridFirstVolume: state.gridFirstVolume,
        gridVolumeMultiplier: state.gridVolumeMultiplier,
        gridStepType: state.gridStepType,
        gridStepValue: state.gridStepValue,
        direction: state.direction,
        entryPrice: state.entryPrice,
        stopLossPrice: state.stopLossPrice,
        lotSize: state.lotSize,
        deposit: state.deposit,
        riskSize: state.riskSize
      };

      // Проверяем, что все необходимые поля заполнены
      const requiredFields = [
        state.gridStartPrice,
        state.gridEndPrice,
        state.gridLevels,
        state.entryPrice,
        state.stopLossPrice,
        state.deposit,
        state.riskSize
      ];

      const hasAllRequiredFields = requiredFields.every(field => {
        const value = safeParseFloat(field);
        return !isNaN(value) && value > 0;
      });

      if (!hasAllRequiredFields) {
        return null;
      }

      // Выполняем расчет сетки
      return CalculationService.calculateGrid(gridParams);
    } catch (error) {
      console.error('Error calculating grid:', error);
      return null;
    }
  }, [
    state.gridEnabled,
    state.gridStartPrice,
    state.gridEndPrice,
    state.gridLevels,
    state.gridVolumeType,
    state.gridFirstVolume,
    state.gridVolumeMultiplier,
    state.gridStepType,
    state.gridStepValue,
    state.direction,
    state.entryPrice,
    state.stopLossPrice,
    state.lotSize,
    state.deposit,
    state.riskSize
  ]);
}

/**
 * Хук для расчета итогов сетки
 */
export function useGridSummary(gridReport: GridReport | null) {
  return useMemo(() => {
    if (!gridReport || gridReport.orders.length === 0) {
      return {
        totalInvestment: 0,
        totalVolume: 0,
        averagePrice: 0,
        totalProfit: 0,
        maxDrawdown: 0,
        maxDrawdownPercent: 0,
        riskReward: 0
      };
    }

    const {
      totalInvestment,
      totalVolume,
      averageEntryPrice,
      totalProfit,
      maxDrawdown,
      maxDrawdownPercent,
      riskReward
    } = gridReport;

    return {
      totalInvestment,
      totalVolume,
      averagePrice: averageEntryPrice,
      totalProfit,
      maxDrawdown,
      maxDrawdownPercent,
      riskReward
    };
  }, [gridReport]);
}

/**
 * Хук для расчета распределения объемов в сетке
 */
export function useGridVolumeDistribution(gridReport: GridReport | null) {
  return useMemo(() => {
    if (!gridReport || gridReport.orders.length === 0) {
      return [];
    }

    return gridReport.orders.map(order => ({
      level: order.level,
      price: order.price,
      volume: order.volume,
      percent: (order.volume / gridReport.totalVolume) * 100,
      cumulativePercent: (order.cumulativeVolume / gridReport.totalVolume) * 100
    }));
  }, [gridReport]);
}

/**
 * Хук для расчета прибыли по уровням сетки
 */
export function useGridProfitDistribution(gridReport: GridReport | null) {
  return useMemo(() => {
    if (!gridReport || gridReport.orders.length === 0) {
      return [];
    }

    return gridReport.orders.map(order => ({
      level: order.level,
      price: order.price,
      profit: order.profit,
      cumulativeProfit: order.cumulativeProfit,
      percent: gridReport.totalProfit > 0
        ? (order.profit / gridReport.totalProfit) * 100
        : 0,
      cumulativePercent: gridReport.totalProfit > 0
        ? (order.cumulativeProfit / gridReport.totalProfit) * 100
        : 0
    }));
  }, [gridReport]);
}

/**
 * Хук для проверки валидности сетки
 */
export function useGridValidation(state: CalculatorState) {
  return useMemo(() => {
    const errors: string[] = [];

    if (!state.gridEnabled) {
      return { isValid: true, errors };
    }

    // Проверка начальной цены
    const startPrice = safeParseFloat(state.gridStartPrice);
    if (isNaN(startPrice) || startPrice <= 0) {
      errors.push('Некорректная начальная цена сетки');
    }

    // Проверка конечной цены
    const endPrice = safeParseFloat(state.gridEndPrice);
    if (isNaN(endPrice) || endPrice <= 0) {
      errors.push('Некорректная конечная цена сетки');
    }

    // Проверка количества уровней
    const levels = parseInt(state.gridLevels, 10);
    if (isNaN(levels) || levels < 2 || levels > 100) {
      errors.push('Количество уровней должно быть от 2 до 100');
    }

    // Проверка логики цен
    if (!errors.length) {
      const entryPrice = safeParseFloat(state.entryPrice);
      const stopLossPrice = safeParseFloat(state.stopLossPrice);

      if (state.direction === 'long') {
        if (startPrice >= endPrice) {
          errors.push('Для LONG начальная цена должна быть ниже конечной');
        }
        if (startPrice >= entryPrice) {
          errors.push('Для LONG начальная цена сетки должна быть ниже цены входа');
        }
        if (endPrice <= stopLossPrice) {
          errors.push('Для LONG конечная цена сетки должна быть выше стоп-лосса');
        }
      } else if (state.direction === 'short') {
        if (startPrice <= endPrice) {
          errors.push('Для SHORT начальная цена должна быть выше конечной');
        }
        if (startPrice <= entryPrice) {
          errors.push('Для SHORT начальная цена сетки должна быть выше цены входа');
        }
        if (endPrice >= stopLossPrice) {
          errors.push('Для SHORT конечная цена сетки должна быть ниже стоп-лосса');
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }, [
    state.gridEnabled,
    state.gridStartPrice,
    state.gridEndPrice,
    state.gridLevels,
    state.direction,
    state.entryPrice,
    state.stopLossPrice
  ]);
}

/**
 * Хук для оптимизации сетки
 */
export function useGridOptimization(
  state: CalculatorState,
  targetProfit: number = 100
) {
  return useMemo(() => {
    if (!state.gridEnabled) {
      return null;
    }

    const startPrice = safeParseFloat(state.gridStartPrice);
    const endPrice = safeParseFloat(state.gridEndPrice);
    const entryPrice = safeParseFloat(state.entryPrice);
    const levels = parseInt(state.gridLevels, 10);

    if (isNaN(startPrice) || isNaN(endPrice) || isNaN(entryPrice) || isNaN(levels)) {
      return null;
    }

    // Рассчитываем оптимальный шаг
    const priceRange = Math.abs(endPrice - startPrice);
    const optimalStep = priceRange / (levels - 1);

    // Рассчитываем оптимальный объем для достижения целевой прибыли
    const averagePrice = (startPrice + endPrice) / 2;
    let optimalVolume = 0;

    if (state.direction === 'long') {
      const averageProfitPerUnit = averagePrice - entryPrice;
      if (averageProfitPerUnit > 0) {
        optimalVolume = targetProfit / averageProfitPerUnit;
      }
    } else {
      const averageProfitPerUnit = entryPrice - averagePrice;
      if (averageProfitPerUnit > 0) {
        optimalVolume = targetProfit / averageProfitPerUnit;
      }
    }

    // Рассчитываем оптимальное количество уровней
    const maxLevels = Math.min(100, Math.floor(priceRange / (entryPrice * 0.001)) + 1);
    const minLevels = Math.max(2, Math.ceil(priceRange / (entryPrice * 0.01)));

    return {
      optimalStep,
      optimalVolume,
      suggestedLevels: Math.max(minLevels, Math.min(maxLevels, 10)),
      maxPossibleLevels: maxLevels,
      minPossibleLevels: minLevels,
      isOptimal: levels >= minLevels && levels <= maxLevels
    };
  }, [
    state.gridEnabled,
    state.gridStartPrice,
    state.gridEndPrice,
    state.gridLevels,
    state.direction,
    state.entryPrice,
    targetProfit
  ]);
}

export default {
  useGridCalculations,
  useGridSummary,
  useGridVolumeDistribution,
  useGridProfitDistribution,
  useGridValidation,
  useGridOptimization
};
