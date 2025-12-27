import { CalculatorState, Direction, Instrument } from '../types/calculator';

/**
 * Глубокое копирование объекта
 */
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as T;
  }

  if (typeof obj === 'object') {
    const clonedObj = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }

  return obj;
};

/**
 * Проверка, является ли значение числом
 */
export const isNumeric = (value: any): boolean => {
  if (typeof value === 'number') return !isNaN(value);
  if (typeof value !== 'string') return false;

  const num = parseFloat(value);
  return !isNaN(num) && isFinite(num) && value.trim() !== '';
};

/**
 * Преобразование строки в число с безопасной проверкой
 */
export const safeParseFloat = (value: string | number, defaultValue: number = 0): number => {
  if (typeof value === 'number') {
    return isNaN(value) ? defaultValue : value;
  }

  if (typeof value !== 'string') {
    return defaultValue;
  }

  const trimmed = value.trim();
  if (trimmed === '') {
    return defaultValue;
  }

  const num = parseFloat(trimmed);
  return isNaN(num) ? defaultValue : num;
};

/**
 * Преобразование строки в целое число с безопасной проверкой
 */
export const safeParseInt = (value: string | number, defaultValue: number = 0, radix: number = 10): number => {
  if (typeof value === 'number') {
    return isNaN(value) ? defaultValue : Math.floor(value);
  }

  if (typeof value !== 'string') {
    return defaultValue;
  }

  const trimmed = value.trim();
  if (trimmed === '') {
    return defaultValue;
  }

  const num = parseInt(trimmed, radix);
  return isNaN(num) ? defaultValue : num;
};

/**
 * Ограничение числа в заданном диапазоне
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

/**
 * Проверка на пустой объект
 */
export const isEmptyObject = (obj: Record<string, any>): boolean => {
  return Object.keys(obj).length === 0;
};

/**
 * Генерация уникального ID
 */
export const generateId = (prefix: string = 'id'): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return `${prefix}_${timestamp}_${random}`;
};

/**
 * Задержка выполнения (sleep)
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Дебаунс функции
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func(...args);
      timeout = null;
    }, wait);
  };
};

/**
 * Троттлинг функции
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
};

/**
 * Получение инициалов из имени
 */
export const getInitials = (name: string): string => {
  if (!name || typeof name !== 'string') {
    return '?';
  }

  const parts = name.split(' ').filter(part => part.length > 0);
  if (parts.length === 0) {
    return '?';
  }

  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

/**
 * Форматирование номера телефона
 */
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
  }

  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{1})(\d{3})(\d{3})(\d{4})/, '+$1 ($2) $3-$4');
  }

  return phone;
};

/**
 * Создание диапазона чисел
 */
export const range = (start: number, end: number, step: number = 1): number[] => {
  const result: number[] = [];

  if (step === 0) {
    throw new Error('Step cannot be zero');
  }

  if (step > 0) {
    for (let i = start; i < end; i += step) {
      result.push(i);
    }
  } else {
    for (let i = start; i > end; i += step) {
      result.push(i);
    }
  }

  return result;
};

/**
 * Группировка массива объектов по ключу
 */
export const groupBy = <T extends Record<string, any>>(
  array: T[],
  key: keyof T
): Record<string, T[]> => {
  return array.reduce((result, item) => {
    const groupKey = String(item[key] || 'unknown');
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
};

/**
 * Удаление дубликатов из массива
 */
export const unique = <T>(array: T[]): T[] => {
  return [...new Set(array)];
};

/**
 * Удаление дубликатов объектов по ключу
 */
export const uniqueBy = <T extends Record<string, any>>(
  array: T[],
  key: keyof T
): T[] => {
  const seen = new Set();
  return array.filter(item => {
    const value = item[key];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
};

/**
 * Сортировка объектов по ключу
 */
export const sortBy = <T extends Record<string, any>>(
  array: T[],
  key: keyof T,
  order: 'asc' | 'desc' = 'asc'
): T[] => {
  return [...array].sort((a, b) => {
    const aValue = a[key];
    const bValue = b[key];

    if (aValue < bValue) {
      return order === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return order === 'asc' ? 1 : -1;
    }
    return 0;
  });
};

/**
 * Разделение массива на чанки
 */
export const chunk = <T>(array: T[], size: number): T[][] => {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
};

/**
 * Проверка, является ли устройство мобильным
 */
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    window.navigator.userAgent
  );
};

/**
 * Проверка, поддерживает ли браузер localStorage
 */
export const isLocalStorageAvailable = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const testKey = '__test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Сохранение данных в localStorage с обработкой ошибок
 */
export const safeSetLocalStorage = (key: string, value: any): boolean => {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  try {
    const serialized = JSON.stringify(value);
    window.localStorage.setItem(key, serialized);
    return true;
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
    return false;
  }
};

/**
 * Чтение данных из localStorage с обработкой ошибок
 */
export const safeGetLocalStorage = <T = any>(key: string, defaultValue: T = null as any): T => {
  if (!isLocalStorageAvailable()) {
    return defaultValue;
  }

  try {
    const item = window.localStorage.getItem(key);
    if (item === null) {
      return defaultValue;
    }

    return JSON.parse(item) as T;
  } catch (e) {
    console.error('Failed to read from localStorage:', e);
    return defaultValue;
  }
};

/**
 * Удаление данных из localStorage с обработкой ошибок
 */
export const safeRemoveLocalStorage = (key: string): boolean => {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  try {
    window.localStorage.removeItem(key);
    return true;
  } catch (e) {
    console.error('Failed to remove from localStorage:', e);
    return false;
  }
};

/**
 * Хеширование строки (простая реализация)
 */
export const hashString = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
};

/**
 * Создание query string из объекта
 */
export const toQueryString = (params: Record<string, any>): string => {
  const queryParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      queryParams.append(key, String(value));
    }
  });

  const queryString = queryParams.toString();
  return queryString ? `?${queryString}` : '';
};

/**
 * Парсинг query string в объект
 */
export const fromQueryString = (queryString: string): Record<string, string> => {
  const params = new URLSearchParams(queryString);
  const result: Record<string, string> = {};

  params.forEach((value, key) => {
    result[key] = value;
  });

  return result;
};

export default {
  deepClone,
  isNumeric,
  safeParseFloat,
  safeParseInt,
  clamp,
  isEmptyObject,
  generateId,
  sleep,
  debounce,
  throttle,
  getInitials,
  formatPhoneNumber,
  range,
  groupBy,
  unique,
  uniqueBy,
  sortBy,
  chunk,
  isMobileDevice,
  isLocalStorageAvailable,
  safeSetLocalStorage,
  safeGetLocalStorage,
  safeRemoveLocalStorage,
  hashString,
  toQueryString,
  fromQueryString
};
