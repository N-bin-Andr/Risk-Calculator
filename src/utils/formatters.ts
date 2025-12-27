import { FORMATTING_CONSTANTS } from './constants';

/**
 * Форматирование чисел с разделителями тысяч и фиксированной точностью
 */
export const formatNumber = (
  value: number | string,
  options: {
    decimals?: number;
    decimalSeparator?: string;
    thousandSeparator?: string;
    minDecimals?: number;
    maxDecimals?: number;
  } = {}
): string => {
  const {
    decimals = 2,
    decimalSeparator = FORMATTING_CONSTANTS.NUMBER_FORMATS.DECIMAL_SEPARATOR,
    thousandSeparator = FORMATTING_CONSTANTS.NUMBER_FORMATS.THOUSAND_SEPARATOR,
    minDecimals = 0,
    maxDecimals = 8
  } = options;

  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    return '0';
  }

  // Определяем точность
  let actualDecimals = decimals;
  if (minDecimals !== undefined && maxDecimals !== undefined) {
    const stringValue = numValue.toString();
    const decimalPlaces = stringValue.includes('.')
      ? stringValue.split('.')[1].length
      : 0;
    actualDecimals = Math.max(minDecimals, Math.min(maxDecimals, decimalPlaces));
  }

  // Форматируем с разделителями тысяч
  const formatted = numValue.toLocaleString('en-US', {
    minimumFractionDigits: actualDecimals,
    maximumFractionDigits: actualDecimals,
    useGrouping: true
  });

  // Заменяем разделители на кастомные
  return formatted
    .replace(/,/g, 'THOUSAND')
    .replace(/\./g, 'DECIMAL')
    .replace(/THOUSAND/g, thousandSeparator)
    .replace(/DECIMAL/g, decimalSeparator);
};

/**
 * Форматирование валюты
 */
export const formatCurrency = (
  value: number | string,
  currencySymbol: string = FORMATTING_CONSTANTS.NUMBER_FORMATS.CURRENCY_SYMBOL,
  options?: Parameters<typeof formatNumber>[1]
): string => {
  const formatted = formatNumber(value, options);
  return `${currencySymbol}${formatted}`;
};

/**
 * Форматирование процентов
 */
export const formatPercent = (
  value: number | string,
  options?: Parameters<typeof formatNumber>[1]
): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  const formatted = formatNumber(numValue, {
    decimals: 2,
    minDecimals: 2,
    maxDecimals: 2,
    ...options
  });
  return `${formatted}${FORMATTING_CONSTANTS.NUMBER_FORMATS.PERCENT_SYMBOL}`;
};

/**
 * Форматирование цены с учетом точности инструмента
 */
export const formatPrice = (
  value: number | string,
  pipPrecision: number = 5,
  options?: Partial<Parameters<typeof formatNumber>[1]>
): string => {
  return formatNumber(value, {
    decimals: pipPrecision,
    minDecimals: 2,
    maxDecimals: pipPrecision,
    ...options
  });
};

/**
 * Форматирование размера лота
 */
export const formatLot = (
  value: number | string,
  options?: Parameters<typeof formatNumber>[1]
): string => {
  return formatNumber(value, {
    decimals: 2,
    minDecimals: 2,
    maxDecimals: 3,
    ...options
  });
};

/**
 * Форматирование даты и времени
 */
export const formatDateTime = (
  date: Date | string | number,
  format: keyof typeof FORMATTING_CONSTANTS.DATE_FORMATS = 'DATETIME',
  locale: keyof typeof FORMATTING_CONSTANTS.LOCALES = 'EN'
): string => {
  const dateObj = typeof date === 'string' || typeof date === 'number'
    ? new Date(date)
    : date;

  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }

  const localeStr = FORMATTING_CONSTANTS.LOCALES[locale];
  const dateFormat = FORMATTING_CONSTANTS.DATE_FORMATS[format];

  // Для упрощения используем toLocaleString
  // В реальном проекте можно использовать библиотеку типа date-fns или moment.js
  if (format === 'SHORT_DATE') {
    return dateObj.toLocaleDateString(localeStr, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  if (format === 'LONG_DATE') {
    return dateObj.toLocaleDateString(localeStr, {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  if (format === 'SHORT_TIME') {
    return dateObj.toLocaleTimeString(localeStr, {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  if (format === 'LONG_TIME') {
    return dateObj.toLocaleTimeString(localeStr, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  if (format === 'DATETIME') {
    return `${dateObj.toLocaleDateString(localeStr, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })} ${dateObj.toLocaleTimeString(localeStr, {
      hour: '2-digit',
      minute: '2-digit'
    })}`;
  }

  if (format === 'TIMESTAMP') {
    return dateObj.toISOString();
  }

  // По умолчанию
  return dateObj.toLocaleString(localeStr);
};

/**
 * Форматирование размера файла
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Форматирование времени в читаемый формат
 */
export const formatDuration = (milliseconds: number): string => {
  if (milliseconds < 1000) {
    return `${milliseconds}ms`;
  }

  const seconds = Math.floor(milliseconds / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes < 60) {
    return `${minutes}m ${remainingSeconds}s`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours < 24) {
    return `${hours}h ${remainingMinutes}m`;
  }

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  return `${days}d ${remainingHours}h`;
};

/**
 * Обрезание текста с добавлением многоточия
 */
export const truncateText = (
  text: string,
  maxLength: number,
  ellipsis: string = '...'
): string => {
  if (text.length <= maxLength) {
    return text;
  }

  return text.substring(0, maxLength - ellipsis.length) + ellipsis;
};

/**
 * Форматирование телефонного номера (если понадобится)
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
 * Форматирование для отображения в таблицах
 */
export const formatForTable = (
  value: any,
  type: 'string' | 'number' | 'currency' | 'percent' | 'date' | 'boolean' = 'string'
): string => {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  switch (type) {
    case 'number':
      return formatNumber(value);

    case 'currency':
      return formatCurrency(value);

    case 'percent':
      return formatPercent(value);

    case 'date':
      return formatDateTime(value, 'SHORT_DATE');

    case 'boolean':
      return value ? '✓' : '✗';

    case 'string':
    default:
      return String(value);
  }
};

/**
 * Сериализация объекта для сохранения в localStorage
 */
export const serializeForStorage = (data: any): string => {
  return JSON.stringify(data, (key, value) => {
    // Обрабатываем Date объекты
    if (value instanceof Date) {
      return { __type: 'Date', value: value.toISOString() };
    }

    // Обрабатываем undefined (преобразуем в null)
    if (value === undefined) {
      return null;
    }

    return value;
  });
};

/**
 * Десериализация объекта из localStorage
 */
export const deserializeFromStorage = <T = any>(json: string): T => {
  return JSON.parse(json, (key, value) => {
    // Восстанавливаем Date объекты
    if (value && value.__type === 'Date') {
      return new Date(value.value);
    }

    return value;
  });
};

export default {
  formatNumber,
  formatCurrency,
  formatPercent,
  formatPrice,
  formatLot,
  formatDateTime,
  formatFileSize,
  formatDuration,
  truncateText,
  formatPhoneNumber,
  formatForTable,
  serializeForStorage,
  deserializeFromStorage
};
