import {
  CalculateParams,
  PositionResult,
  GridParams,
  GridReport,
  GridOrder,
  RiskParams,
  RiskResult,
  TPLevel,
  TPDetail,
  Direction,
  Instrument
} from '../types/calculator';
import { CALCULATOR_CONSTANTS } from '../utils/constants';
import { safeParseFloat, clamp } from '../utils/helpers';

/**
 * Сервис для всех расчетов калькулятора рисков
 */
export class CalculationService {
  /**
   * Расчет размера позиции на основе параметров риска
   */
  static calculatePositionSize(params: CalculateParams): PositionResult {
    const {
      direction,
      entryPrice,
      stopLossPrice,
      takeProfitPrice,
      deposit,
      riskSize,
      lotSize,
      instrument
    } = params;

    const entry = safeParseFloat(entryPrice);
    const sl = safeParseFloat(stopLossPrice);
    const tp = takeProfitPrice ? safeParseFloat(takeProfitPrice) : null;
    const dep = safeParseFloat(deposit);
    const riskPercent = safeParseFloat(riskSize);
    const lot = safeParseFloat(lotSize);

    // Расчет расстояния до стоп-лосса
    const stopLossDistance = Math.abs(entry - sl);
    const stopLossPercent = (stopLossDistance / entry) * 100;

    // Расчет риска в деньгах
    const riskAmount = (dep * riskPercent) / 100;

    // Расчет размера позиции (в единицах базового актива)
    let positionSize = 0;
    if (stopLossDistance > 0) {
      positionSize = riskAmount / stopLossDistance;
    }

    // Применяем размер лота (округление до ближайшего шага лота)
    const lotStep = instrument?.step || 0.01;
    positionSize = Math.floor(positionSize / lotStep) * lotStep;
    positionSize = clamp(
      positionSize,
      instrument?.minLot || CALCULATOR_CONSTANTS.MIN_LOT_SIZE,
      instrument?.maxLot || CALCULATOR_CONSTANTS.MAX_LOT_SIZE
    );

    // Расчет инвестиции
    const investment = positionSize * entry;

    // Расчет потенциальной прибыли/убытка
    let potentialProfit = 0;
    let potentialLoss = 0;

    if (tp) {
      const takeProfitDistance = Math.abs(tp - entry);
      potentialProfit = positionSize * takeProfitDistance;
    }

    potentialLoss = positionSize * stopLossDistance;

    // Расчет риска/прибыли
    let riskRewardRatio = 0;
    if (tp && potentialLoss > 0) {
      riskRewardRatio = potentialProfit / potentialLoss;
    }

    // Расчет маржи (упрощенно: 1% от инвестиции)
    const margin = investment * 0.01;
    const freeMargin = dep - margin;
    const marginLevel = dep > 0 ? (dep / margin) * 100 : 0;

    // Комиссии и свопы
    let commission = 0;
    let swap = 0;
    let totalCost = 0;

    if (instrument) {
      // Комиссия: процент от инвестиции
      if (instrument.commission) {
        commission = investment * (instrument.commission / 100);
      }

      // Своп зависит от направления
      if (direction === 'long' && instrument.swapLong) {
        swap = positionSize * instrument.swapLong;
      } else if (direction === 'short' && instrument.swapShort) {
        swap = positionSize * instrument.swapShort;
      }

      totalCost = commission + swap;
    }

    return {
      positionSize,
      lotSize: lot,
      riskAmount,
      riskPercent,
      stopLossDistance,
      takeProfitDistance: tp ? Math.abs(tp - entry) : 0,
      riskRewardRatio,
      investment,
      potentialProfit,
      potentialLoss,
      margin,
      freeMargin,
      marginLevel,
      commission,
      swap,
      totalCost
    };
  }

  /**
   * Расчет сетки ордеров
   */
  static calculateGrid(params: GridParams): GridReport {
    if (!params.gridEnabled) {
      return {
        orders: [],
        totalLevels: 0,
        totalVolume: 0,
        totalInvestment: 0,
        averageEntryPrice: 0,
        totalProfit: 0,
        maxDrawdown: 0,
        maxDrawdownPercent: 0,
        riskReward: 0
      };
    }

    const {
      gridStartPrice,
      gridEndPrice,
      gridLevels,
      gridVolumeType,
      gridFirstVolume,
      gridVolumeMultiplier,
      gridStepType,
      gridStepValue,
      direction,
      entryPrice,
      stopLossPrice,
      lotSize,
      deposit,
      riskSize
    } = params;

    const start = safeParseFloat(gridStartPrice);
    const end = safeParseFloat(gridEndPrice);
    const levels = parseInt(gridLevels, 10);
    const firstVolume = safeParseFloat(gridFirstVolume);
    const multiplier = safeParseFloat(gridVolumeMultiplier);
    const stepValue = safeParseFloat(gridStepValue);
    const entry = safeParseFloat(entryPrice);
    const sl = safeParseFloat(stopLossPrice);
    const lot = safeParseFloat(lotSize);
    const dep = safeParseFloat(deposit);
    const riskPercent = safeParseFloat(riskSize);

    const orders: GridOrder[] = [];
    let cumulativeVolume = 0;
    let cumulativeInvestment = 0;
    let cumulativeProfit = 0;

    // Расчет шага цены
    let priceStep = 0;
    if (gridStepType === 'percent') {
      // Шаг в процентах от текущей цены
      priceStep = (end - start) / (levels - 1);
    } else {
      // Абсолютный шаг
      priceStep = stepValue;
      if (direction === 'short') {
        priceStep = -priceStep;
      }
    }

    // Генерация ордеров сетки
    for (let i = 0; i < levels; i++) {
      let price = 0;
      if (direction === 'long') {
        price = start + (priceStep * i);
      } else {
        price = start - (priceStep * i);
      }

      // Расчет объема для текущего уровня
      let volume = 0;
      if (gridVolumeType === 'fixed') {
        volume = firstVolume;
      } else {
        // Умножаемый объем
        volume = firstVolume * Math.pow(multiplier, i);
      }

      // Округление до шага лота
      volume = Math.floor(volume / lot) * lot;
      if (volume < lot) volume = lot;

      const investment = volume * price;
      const profit = this.calculateProfitForGridLevel(
        volume,
        price,
        direction,
        entry,
        sl
      );

      cumulativeVolume += volume;
      cumulativeInvestment += investment;
      cumulativeProfit += profit;

      orders.push({
        level: i + 1,
        price,
        volume,
        investment,
        profit,
        cumulativeVolume,
        cumulativeInvestment,
        cumulativeProfit
      });
    }

    // Расчет средней цены входа
    const averageEntryPrice = cumulativeVolume > 0
      ? cumulativeInvestment / cumulativeVolume
      : 0;

    // Расчет максимальной просадки
    const { maxDrawdown, maxDrawdownPercent } = this.calculateGridDrawdown(
      orders,
      direction,
      sl
    );

    // Расчет риск/прибыль для сетки
    const totalRisk = this.calculateGridRisk(orders, direction, sl, dep, riskPercent);
    const riskReward = totalRisk > 0 ? cumulativeProfit / totalRisk : 0;

    return {
      orders,
      totalLevels: levels,
      totalVolume: cumulativeVolume,
      totalInvestment: cumulativeInvestment,
      averageEntryPrice,
      totalProfit: cumulativeProfit,
      maxDrawdown,
      maxDrawdownPercent,
      riskReward
    };
  }

  /**
   * Расчет прибыли для уровня сетки
   */
  private static calculateProfitForGridLevel(
    volume: number,
    price: number,
    direction: Direction,
    entryPrice: number,
    stopLossPrice: number
  ): number {
    if (direction === 'long') {
      // Для LONG: прибыль = объем * (текущая цена - цена входа)
      // Но если цена ниже стоп-лосса, то убыток
      if (price <= stopLossPrice) {
        return volume * (price - stopLossPrice);
      }
      return volume * (price - entryPrice);
    } else {
      // Для SHORT: прибыль = объем * (цена входа - текущая цена)
      if (price >= stopLossPrice) {
        return volume * (stopLossPrice - price);
      }
      return volume * (entryPrice - price);
    }
  }

  /**
   * Расчет просадки для сетки
   */
  private static calculateGridDrawdown(
    orders: GridOrder[],
    direction: Direction,
    stopLossPrice: number
  ): { maxDrawdown: number; maxDrawdownPercent: number } {
    let maxDrawdown = 0;
    let maxInvestment = 0;
    let currentInvestment = 0;

    for (const order of orders) {
      currentInvestment += order.investment;

      if (direction === 'long' && order.price < stopLossPrice) {
        // Убыток при LONG если цена ниже стоп-лосса
        const drawdown = order.volume * (stopLossPrice - order.price);
        maxDrawdown = Math.max(maxDrawdown, drawdown);
      } else if (direction === 'short' && order.price > stopLossPrice) {
        // Убыток при SHORT если цена выше стоп-лосса
        const drawdown = order.volume * (order.price - stopLossPrice);
        maxDrawdown = Math.max(maxDrawdown, drawdown);
      }

      maxInvestment = Math.max(maxInvestment, currentInvestment);
    }

    const maxDrawdownPercent = maxInvestment > 0
      ? (maxDrawdown / maxInvestment) * 100
      : 0;

    return { maxDrawdown, maxDrawdownPercent };
  }

  /**
   * Расчет общего риска для сетки
   */
  private static calculateGridRisk(
    orders: GridOrder[],
    direction: Direction,
    stopLossPrice: number,
    deposit: number,
    riskPercent: number
  ): number {
    let totalRisk = 0;

    for (const order of orders) {
      if (direction === 'long' && order.price < stopLossPrice) {
        totalRisk += order.volume * (stopLossPrice - order.price);
      } else if (direction === 'short' && order.price > stopLossPrice) {
        totalRisk += order.volume * (order.price - stopLossPrice);
      }
    }

    // Ограничение риска процентом от депозита
    const maxRisk = (deposit * riskPercent) / 100;
    return Math.min(totalRisk, maxRisk);
  }

  /**
   * Расчет параметров риска
   */
  static calculateRisk(params: RiskParams): RiskResult {
    const {
      deposit,
      riskSize,
      entryPrice,
      stopLossPrice,
      takeProfitPrice,
      lotSize,
      instrument
    } = params;

    const dep = safeParseFloat(deposit);
    const riskPercent = safeParseFloat(riskSize);
    const entry = safeParseFloat(entryPrice);
    const sl = safeParseFloat(stopLossPrice);
    const tp = takeProfitPrice ? safeParseFloat(takeProfitPrice) : null;
    const lot = safeParseFloat(lotSize);

    // Базовые расчеты
    const riskAmount = (dep * riskPercent) / 100;
    const stopLossDistance = Math.abs(entry - sl);
    const stopLossPercent = (stopLossDistance / entry) * 100;

    // Максимальный размер позиции
    let positionSize = 0;
    if (stopLossDistance > 0) {
      positionSize = riskAmount / stopLossDistance;
    }

    // Ограничение по минимальному/максимальному лоту
    const minLot = instrument?.minLot || CALCULATOR_CONSTANTS.MIN_LOT_SIZE;
    const maxLot = instrument?.maxLot || CALCULATOR_CONSTANTS.MAX_LOT_SIZE;
    const lotStep = instrument?.step || 0.01;

    positionSize = Math.floor(positionSize / lotStep) * lotStep;
    positionSize = clamp(positionSize, minLot, maxLot);

    // Расчет требуемой маржи
    const marginRequired = positionSize * entry * 0.01; // 1% маржа
    const freeMarginAfter = dep - marginRequired;
    const marginLevel = marginRequired > 0 ? (dep / marginRequired) * 100 : 0;

    // Проверка на маржин-колл (уровень маржи ниже 100%)
    const isMarginCallPossible = marginLevel < 100;

    // Максимальный размер позиции с учетом маржи
    const maxPositionSize = (dep / (entry * 0.01)) * lotStep;

    return {
      riskAmount,
      riskPercent,
      stopLossDistance,
      stopLossPercent,
      positionSize,
      maxPositionSize,
      marginRequired,
      freeMarginAfter,
      marginLevel,
      isMarginCallPossible
    };
  }

  /**
   * Расчет уровней тейк-профита
   */
  static calculateTakeProfitLevels(
    tpLevels: TPLevel[],
    entryPrice: string,
    positionSize: number,
    direction: Direction
  ): TPDetail[] {
    const entry = safeParseFloat(entryPrice);
    const details: TPDetail[] = [];

    for (const level of tpLevels) {
      const price = safeParseFloat(level.price);
      const percent = safeParseFloat(level.percent);

      // Расчет расстояния до тейк-профита
      const distance = Math.abs(price - entry);
      const distancePercent = (distance / entry) * 100;

      // Расчет объема для этого уровня
      const volume = (positionSize * percent) / 100;

      // Расчет прибыли
      let profit = 0;
      if (direction === 'long') {
        profit = volume * (price - entry);
      } else {
        profit = volume * (entry - price);
      }

      const profitPercent = (profit / (positionSize * entry)) * 100;

      details.push({
        price,
        percent,
        volume,
        profit,
        profitPercent,
        distance,
        distancePercent
      });
    }

    return details;
  }

  /**
   * Пересчет значений при изменении цены входа
   */
  static recalculateOnPriceChange(
    entryPrice: number,
    currentState: CalculateParams
  ): PositionResult {
    const newParams = {
      ...currentState,
      entryPrice: entryPrice.toString()
    };

    return this.calculatePositionSize(newParams);
  }

  /**
   * Пересчет значений при изменении стоп-лосса
   */
  static recalculateOnStopLossChange(
    stopLossPrice: number,
    currentState: CalculateParams
  ): PositionResult {
    const newParams = {
      ...currentState,
      stopLossPrice: stopLossPrice.toString()
    };

    return this.calculatePositionSize(newParams);
  }

  /**
   * Проверка на маржин-колл
   */
  static checkMarginCall(
    deposit: number,
    positionSize: number,
    entryPrice: number,
    currentPrice: number,
    direction: Direction
  ): {
    isMarginCall: boolean;
    marginLevel: number;
    requiredMargin: number;
    currentEquity: number;
  } {
    const requiredMargin = positionSize * entryPrice * 0.01;
    let currentEquity = deposit;

    // Расчет текущей прибыли/убытка
    if (direction === 'long') {
      currentEquity += positionSize * (currentPrice - entryPrice);
    } else {
      currentEquity += positionSize * (entryPrice - currentPrice);
    }

    const marginLevel = requiredMargin > 0
      ? (currentEquity / requiredMargin) * 100
      : 0;

    const isMarginCall = marginLevel < 100;

    return {
      isMarginCall,
      marginLevel,
      requiredMargin,
      currentEquity
    };
  }

  /**
   * Расчет комиссий и свопов
   */
  static calculateFees(
    positionSize: number,
    entryPrice: number,
    instrument?: Instrument
  ): {
    commission: number;
    swap: number;
    spread: number;
    totalFees: number;
  } {
    let commission = 0;
    let swap = 0;
    let spread = 0;

    if (instrument) {
      // Комиссия
      if (instrument.commission) {
        commission = positionSize * entryPrice * (instrument.commission / 100);
      }

      // Спред
      if (instrument.spread) {
        spread = positionSize * instrument.spread;
      }

      // Своп (расчет за 1 день)
      // В реальном приложении нужно учитывать количество дней
      if (instrument.swapLong) {
        swap = positionSize * instrument.swapLong;
      }
    }

    const totalFees = commission + swap + spread;

    return {
      commission,
      swap,
      spread,
      totalFees
    };
  }
}

export default CalculationService;
