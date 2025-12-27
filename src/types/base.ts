// Базовые типы для проекта

export type Direction = 'long' | 'short' | '';

export type Status = 'Запланирован' | 'Открыт' | 'Отменён';

export interface TPLevel {
  price: string;
  percent: string;
}

export interface GridOrder {
  price: number;
  quantity: number;
  percent: number;
  amount: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}
