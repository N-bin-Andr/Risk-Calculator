// ==================== БАЗОВЫЕ ТИПЫ ДЛЯ КАЛЬКУЛЯТОРА ====================

/**
 * Направление сделки
 */
export type Direction = 'long' | 'short';

/**
 * Тип объема для сетки
 */
export type GridVolumeType = 'fixed' | 'multiplied';

/**
 * Тип шага для сетки
 */
export type GridStepType = 'percent' | 'absolute';

/**
 * Инструмент торговли
 */
export interface Instrument {
  symbol: string;
  name: string;
  category: string;
  lotSize: number;
  minLot: number;
  maxLot: number;
  step: number;
  pipValue: number;
  commission?: number;
  spread?: number;
  swapLong?: number;
  swapShort?: number;
}

/**
 * Уровень тейк-профита
 */
export interface TPLevel {
  id: string;
  price: string;
  percent: string;
  volume?: string;
  note?: string;
}

/**
 * Детали расчетов тейк-профита
 */
export interface TPDetail {
  price: number;
  percent: number;
  volume: number;
  profit: number;
  profitPercent: number;
  distance: number;
  distancePercent: number;
}

/**
 * Ордер в сетке
 */
export interface GridOrder {
  level: number;
  price: number;
  volume: number;
  investment: number;
  profit: number;
  cumulativeVolume: number;
  cumulativeInvestment: number;
  cumulativeProfit: number;
}

/**
 * Отчет по сетке
 */
export interface GridReport {
  orders: GridOrder[];
  totalLevels: number;
  totalVolume: number;
  totalInvestment: number;
  averageEntryPrice: number;
  totalProfit: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  riskReward: number;
}

/**
 * Параметры расчета сетки
 */
export interface GridParams {
  gridEnabled: boolean;
  gridStartPrice: string;
  gridEndPrice: string;
  gridLevels: string;
  gridVolumeType: GridVolumeType;
  gridFirstVolume: string;
  gridVolumeMultiplier: string;
  gridStepType: GridStepType;
  gridStepValue: string;
  direction: Direction;
  entryPrice: string;
  stopLossPrice: string;
  lotSize: string;
  deposit: string;
  riskSize: string;
}

/**
 * Параметры расчета риска
 */
export interface RiskParams {
  deposit: string;
  riskSize: string;
  entryPrice: string;
  stopLossPrice: string;
  takeProfitPrice: string;
  lotSize: string;
  instrument?: Instrument;
}

/**
 * Результат расчета позиции
 */
export interface PositionResult {
  positionSize: number;
  lotSize: number;
  riskAmount: number;
  riskPercent: number;
  stopLossDistance: number;
  takeProfitDistance: number;
  riskRewardRatio: number;
  investment: number;
  potentialProfit: number;
  potentialLoss: number;
  margin: number;
  freeMargin: number;
  marginLevel: number;
  commission?: number;
  swap?: number;
  totalCost?: number;
}

/**
 * Параметры расчета позиции
 */
export interface CalculateParams {
  direction: Direction;
  entryPrice: string;
  stopLossPrice: string;
  takeProfitPrice: string;
  deposit: string;
  riskSize: string;
  lotSize: string;
  instrument?: Instrument;
  takeProfitLevels?: TPLevel[];
  gridEnabled?: boolean;
  gridParams?: GridParams;
}

/**
 * Результат расчета риска
 */
export interface RiskResult {
  riskAmount: number;
  riskPercent: number;
  stopLossDistance: number;
  stopLossPercent: number;
  positionSize: number;
  maxPositionSize: number;
  marginRequired: number;
  freeMarginAfter: number;
  marginLevel: number;
  isMarginCallPossible: boolean;
}

// ==================== ОСНОВНОЕ СОСТОЯНИЕ КАЛЬКУЛЯТОРА ====================

/**
 * Полное состояние калькулятора
 */
export interface CalculatorState {
  // Основные параметры
  direction: Direction;
  instrument: string;
  entryPrice: string;
  stopLossPrice: string;
  takeProfitPrice: string;

  // Управление рисками
  deposit: string;
  riskSize: string;
  stopLossPercent: string;
  takeProfitPercent: string;
  riskPerTrade: string;
  riskReward: string;
  lotSize: string;

  // Настройки сетки
  gridEnabled: boolean;
  gridStartPrice: string;
  gridEndPrice: string;
  gridLevels: string;
  gridVolumeType: GridVolumeType;
  gridFirstVolume: string;
  gridVolumeMultiplier: string;
  gridStepType: GridStepType;
  gridStepValue: string;

  // Уровни тейк-профита
  takeProfitLevels: TPLevel[];
  takeProfitLevelsEnabled: boolean;

  // Дополнительные настройки
  commissionEnabled: boolean;
  commission: string;
  swapEnabled: boolean;
  swapLong: string;
  swapShort: string;
  spreadEnabled: boolean;
  spread: string;

  // Результаты расчетов
  positionSize: string;
  riskAmount: string;
  investment: string;
  potentialProfit: string;
  potentialLoss: string;
  margin: string;
  freeMargin: string;
  marginLevel: string;

  // Флаги состояния
  isCalculating: boolean;
  isValid: boolean;
  lastCalculated?: Date;

  // История и шаблоны
  templateName?: string;
  note?: string;
  tags?: string[];
}

// ==================== ТИПЫ ДЛЯ REDUCER И ACTIONS ====================

/**
 * Базовый тип для действия
 */
export interface CalculatorActionBase {
  type: string;
  payload?: any;
}

/**
 * Конкретные типы действий
 */
export type CalculatorAction =
  | { type: 'SET_DIRECTION'; payload: Direction }
  | { type: 'SET_INSTRUMENT'; payload: string }
  | { type: 'SET_ENTRY_PRICE'; payload: string }
  | { type: 'SET_STOP_LOSS_PRICE'; payload: string }
  | { type: 'SET_TAKE_PROFIT_PRICE'; payload: string }
  | { type: 'SET_DEPOSIT'; payload: string }
  | { type: 'SET_RISK_SIZE'; payload: string }
  | { type: 'SET_STOP_LOSS_PERCENT'; payload: string }
  | { type: 'SET_TAKE_PROFIT_PERCENT'; payload: string }
  | { type: 'SET_RISK_PER_TRADE'; payload: string }
  | { type: 'SET_RISK_REWARD'; payload: string }
  | { type: 'SET_LOT_SIZE'; payload: string }
  | { type: 'TOGGLE_GRID_ENABLED' }
  | { type: 'SET_GRID_START_PRICE'; payload: string }
  | { type: 'SET_GRID_END_PRICE'; payload: string }
  | { type: 'SET_GRID_LEVELS'; payload: string }
  | { type: 'SET_GRID_VOLUME_TYPE'; payload: GridVolumeType }
  | { type: 'SET_GRID_FIRST_VOLUME'; payload: string }
  | { type: 'SET_GRID_VOLUME_MULTIPLIER'; payload: string }
  | { type: 'SET_GRID_STEP_TYPE'; payload: GridStepType }
  | { type: 'SET_GRID_STEP_VALUE'; payload: string }
  | { type: 'ADD_TAKE_PROFIT_LEVEL' }
  | { type: 'REMOVE_TAKE_PROFIT_LEVEL'; payload: string }
  | { type: 'UPDATE_TAKE_PROFIT_LEVEL'; payload: { id: string; field: keyof TPLevel; value: string } }
  | { type: 'TOGGLE_TAKE_PROFIT_LEVELS_ENABLED' }
  | { type: 'TOGGLE_COMMISSION_ENABLED' }
  | { type: 'SET_COMMISSION'; payload: string }
  | { type: 'TOGGLE_SWAP_ENABLED' }
  | { type: 'SET_SWAP_LONG'; payload: string }
  | { type: 'SET_SWAP_SHORT'; payload: string }
  | { type: 'TOGGLE_SPREAD_ENABLED' }
  | { type: 'SET_SPREAD'; payload: string }
  | { type: 'CALCULATE_RESULTS' }
  | { type: 'RESET_CALCULATOR' }
  | { type: 'LOAD_TEMPLATE'; payload: Partial<CalculatorState> }
  | { type: 'SET_TEMPLATE_NAME'; payload: string }
  | { type: 'SET_NOTE'; payload: string }
  | { type: 'ADD_TAG'; payload: string }
  | { type: 'REMOVE_TAG'; payload: string }
  | { type: 'SET_CALCULATION_STATE'; payload: boolean }
  | { type: 'SET_VALIDITY'; payload: boolean }
  | { type: 'UPDATE_MULTIPLE_FIELDS'; payload: Partial<CalculatorState> }
  | { type: 'RESET_FIELDS_EXCEPT'; payload: { keepFields: (keyof CalculatorState)[] } }
  | { type: 'RESET_FORM_WITH_KEEP'; payload: { keepFields: (keyof CalculatorState)[] } };

// ==================== ТИПЫ ДЛЯ ВАЛИДАЦИИ ====================

/**
 * Результат валидации
 */
export interface ValidationResult {
  errors: Record<string, string | undefined>;
  isValid: boolean;
}

/**
 * Параметры валидации сетки
 */
export interface GridValidationParams {
  gridEnabled: boolean;
  gridStartPrice: string;
  gridEndPrice: string;
  gridLevels: string;
  entryPrice: string;
  stopLossPrice: string;
  direction: Direction;
}

/**
 * Параметры валидации тейк-профита
 */
export interface TakeProfitValidationParams {
  takeProfitLevels: TPLevel[];
  entryPrice: string;
  stopLossPrice: string;
  direction: Direction;
  deposit: string;
  riskSize: string;
}

// Добавляем в раздел ТИПЫ ДЛЯ ВАЛИДАЦИИ:

/**
 * Результат валидации сетки
 */
export interface GridValidationResult {
  errors: ValidationErrors;
  isValid: boolean;
}

/**
 * Результат валидации тейк-профита
 */
export interface TakeProfitValidationResult {
  errors: ValidationErrors;
  isValid: boolean;
  takeProfitErrors?: string[];
}

/**
 * Ошибки валидации
 */
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

// ==================== ТИПЫ ДЛЯ ЭКСПОРТА ====================

/**
 * Данные для экспорта
 */
export interface ExportData {
  timestamp: Date;
  state: CalculatorState;
  calculations: {
    position: PositionResult;
    grid?: GridReport;
    takeProfits?: TPDetail[];
  };
  image?: string; // base64 encoded image
  settings?: {
    templateName: string;
    note: string;
    tags: string[];
  };
}

// ==================== ТИПЫ ДЛЯ ИСТОРИИ И ШАБЛОНОВ ====================

/**
 * Шаблон расчета
 */
export interface CalculatorTemplate {
  id: string;
  name: string;
  description?: string;
  state: Partial<CalculatorState>;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  isFavorite: boolean;
  usageCount: number;
}

/**
 * Запись в истории расчетов
 */
export interface CalculationHistory {
  id: string;
  timestamp: Date;
  instrument: string;
  direction: Direction;
  entryPrice: number;
  stopLossPrice: number;
  takeProfitPrice?: number;
  deposit: number;
  riskSize: number;
  positionSize: number;
  riskAmount: number;
  result?: 'profit' | 'loss' | 'pending';
  profitLoss?: number;
  note?: string;
  tags: string[];
  screenshot?: string;
  exportedToNotion?: boolean;
}

// ==================== ТИПЫ ДЛЯ API И СЕРВИСОВ ====================

/**
 * Параметры для отправки в Notion
 */
export interface NotionExportParams {
  databaseId: string;
  pageTitle: string;
  data: ExportData;
  tags?: string[];
  category?: string;
}

/**
 * Результат операции с сервисом
 */
export interface ServiceOperationResult {
  success: boolean;
  message?: string;
  data?: any;
  error?: Error;
}

// ==================== ТИПЫ ДЛЯ КОМПОНЕНТОВ ====================

/**
 * Пропсы для компонента калькулятора
 */
export interface CalculatorProps {
  initialState?: Partial<CalculatorState>;
  onCalculate?: (state: CalculatorState, results: PositionResult) => void;
  onExport?: (data: ExportData) => void;
  onSaveTemplate?: (template: CalculatorTemplate) => void;
  onLoadTemplate?: (templateId: string) => void;
  className?: string;
  disabled?: boolean;
}

/**
 * Контекст калькулятора
 */
export interface CalculatorContextType {
  state: CalculatorState;
  dispatch: React.Dispatch<CalculatorAction>;
  actions: {
    calculate: () => void;
    reset: () => void;
    saveTemplate: (name: string) => void;
    exportToImage: () => Promise<string>;
    exportToNotion: () => Promise<boolean>;
  };
  results: {
    position: PositionResult | null;
    grid: GridReport | null;
    takeProfits: TPDetail[] | null;
    validation: ValidationResult;
  };
  isLoading: boolean;
}

// ==================== УТИЛИТАРНЫЕ ТИПЫ ====================

/**
 * Тип для значений калькулятора (строки для формы, числа для расчетов)
 */
export type CalculatorValue = string | number | boolean;

/**
 * Тип для любого поля калькулятора
 */
export type CalculatorField = keyof CalculatorState;

/**
 * Карта значений калькулятора
 */
export type CalculatorValues = {
  [K in keyof CalculatorState]: CalculatorState[K];
};
