// ==================== БАЗОВЫЕ КОНСТАНТЫ ПРОЕКТА ====================

/**
 * Константы для калькулятора рисков
 */
export const CALCULATOR_CONSTANTS = {
  // Настройки по умолчанию
  DEFAULT_DEPOSIT: '10000',
  DEFAULT_RISK_SIZE: '2',
  DEFAULT_LOT_SIZE: '0.01',
  DEFAULT_STOP_LOSS_PERCENT: '1',
  DEFAULT_TAKE_PROFIT_PERCENT: '2',
  DEFAULT_RISK_PER_TRADE: '200',
  DEFAULT_RISK_REWARD: '2',

  // Лимиты
  MIN_DEPOSIT: 100,
  MAX_DEPOSIT: 10000000,
  MIN_RISK_SIZE: 0.01,
  MAX_RISK_SIZE: 100,
  MIN_LOT_SIZE: 0.01,
  MAX_LOT_SIZE: 100,
  MIN_STOP_LOSS_PERCENT: 0.01,
  MAX_STOP_LOSS_PERCENT: 100,
  MIN_TAKE_PROFIT_PERCENT: 0.01,
  MAX_TAKE_PROFIT_PERCENT: 1000,

  // Настройки сетки
  DEFAULT_GRID_LEVELS: '5',
  MIN_GRID_LEVELS: 2,
  MAX_GRID_LEVELS: 100,
  DEFAULT_GRID_STEP_VALUE: '1',
  DEFAULT_GRID_VOLUME_MULTIPLIER: '1.5',
  DEFAULT_GRID_FIRST_VOLUME: '0.01',

  // Настройки комиссий и свопов
  DEFAULT_COMMISSION: '5',
  DEFAULT_SPREAD: '2',
  DEFAULT_SWAP_LONG: '0.5',
  DEFAULT_SWAP_SHORT: '0.5',

  // Точность вычислений
  PRECISION: {
    PRICE: 5,
    PERCENT: 2,
    CURRENCY: 2,
    LOT: 2,
    RATIO: 2
  }
} as const;

/**
 * Константы для инструментов
 */
export const INSTRUMENT_CONSTANTS = {
  // Категории инструментов
  CATEGORIES: {
    FOREX: 'forex',
    CRYPTO: 'crypto',
    STOCKS: 'stocks',
    INDICES: 'indices',
    COMMODITIES: 'commodities',
    METALS: 'metals'
  },

  // Популярные инструменты
  POPULAR_INSTRUMENTS: [
    { symbol: 'EURUSD', name: 'Euro / US Dollar', category: 'forex', lotSize: 100000 },
    { symbol: 'GBPUSD', name: 'British Pound / US Dollar', category: 'forex', lotSize: 100000 },
    { symbol: 'USDJPY', name: 'US Dollar / Japanese Yen', category: 'forex', lotSize: 100000 },
    { symbol: 'BTCUSD', name: 'Bitcoin / US Dollar', category: 'crypto', lotSize: 1 },
    { symbol: 'ETHUSD', name: 'Ethereum / US Dollar', category: 'crypto', lotSize: 1 },
    { symbol: 'XAUUSD', name: 'Gold / US Dollar', category: 'metals', lotSize: 100 },
    { symbol: 'XAGUSD', name: 'Silver / US Dollar', category: 'metals', lotSize: 1000 },
    { symbol: 'US500', name: 'S&P 500 Index', category: 'indices', lotSize: 1 },
    { symbol: 'AAPL', name: 'Apple Inc.', category: 'stocks', lotSize: 1 },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', category: 'stocks', lotSize: 1 }
  ],

  // Дефолтные настройки для категорий
  CATEGORY_DEFAULTS: {
    forex: { lotSize: 100000, minLot: 0.01, maxLot: 100, step: 0.01, pipValue: 10 },
    crypto: { lotSize: 1, minLot: 0.001, maxLot: 100, step: 0.001, pipValue: 1 },
    stocks: { lotSize: 1, minLot: 1, maxLot: 1000, step: 1, pipValue: 1 },
    indices: { lotSize: 1, minLot: 0.01, maxLot: 100, step: 0.01, pipValue: 1 },
    commodities: { lotSize: 100, minLot: 0.01, maxLot: 100, step: 0.01, pipValue: 10 },
    metals: { lotSize: 100, minLot: 0.01, maxLot: 100, step: 0.01, pipValue: 10 }
  }
} as const;

/**
 * Константы для валидации
 */
export const VALIDATION_CONSTANTS = {
  // Регулярные выражения
  PATTERNS: {
    PRICE: /^\d+(\.\d+)?$/,
    PERCENT: /^\d+(\.\d+)?$/,
    LOT: /^\d+(\.\d+)?$/,
    INTEGER: /^\d+$/
  },

  // Сообщения об ошибках
  MESSAGES: {
    REQUIRED: 'Это поле обязательно для заполнения',
    INVALID_NUMBER: 'Введите корректное число',
    INVALID_PRICE: 'Цена должна быть положительным числом',
    INVALID_PERCENT: 'Процент должен быть от 0.01 до 100',
    INVALID_LOT: 'Размер лота должен быть положительным числом',
    INVALID_GRID_LEVELS: 'Количество уровней должно быть от 2 до 100',
    SL_BELOW_ENTRY: 'Для LONG стоп-лосс должен быть ниже цены входа',
    SL_ABOVE_ENTRY: 'Для SHORT стоп-лосс должен быть выше цены входа',
    TP_ABOVE_ENTRY: 'Для LONG тейк-профит должен быть выше цены входа',
    TP_BELOW_ENTRY: 'Для SHORT тейк-профит должен быть ниже цены входа',
    GRID_START_BELOW_END: 'Для LONG начальная цена должна быть ниже конечной',
    GRID_START_ABOVE_END: 'Для SHORT начальная цена должна быть выше конечной'
  },

  // Пороговые значения
  THRESHOLDS: {
    MAX_TP_LEVELS: 10,
    MAX_TAGS: 5,
    MAX_NOTE_LENGTH: 500,
    MAX_TEMPLATE_NAME_LENGTH: 50
  }
} as const;

/**
 * Константы для экспорта
 */
export const EXPORT_CONSTANTS = {
  // Форматы экспорта
  FORMATS: {
    PNG: 'image/png',
    JPEG: 'image/jpeg',
    PDF: 'application/pdf',
    CSV: 'text/csv',
    JSON: 'application/json'
  },

  // Настройки изображений
  IMAGE: {
    WIDTH: 1200,
    HEIGHT: 800,
    QUALITY: 0.9,
    BACKGROUND_COLOR: '#ffffff',
    TEXT_COLOR: '#333333',
    PRIMARY_COLOR: '#1890ff',
    SUCCESS_COLOR: '#52c41a',
    DANGER_COLOR: '#f5222d',
    WARNING_COLOR: '#faad14'
  },

  // Настройки Notion
  NOTION: {
    DATABASE_ID: process.env.REACT_APP_NOTION_DATABASE_ID || '',
    API_VERSION: '2022-06-28',
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000
  }
} as const;

/**
 * Константы для UI/UX
 */
export const UI_CONSTANTS = {
  // Анимации
  ANIMATION: {
    DURATION: {
      FAST: 150,
      NORMAL: 300,
      SLOW: 500
    },
    TIMING: 'cubic-bezier(0.4, 0, 0.2, 1)'
  },

  // Размеры
  SIZES: {
    BORDER_RADIUS: '8px',
    BOX_SHADOW: '0 2px 8px rgba(0, 0, 0, 0.15)',
    HEADER_HEIGHT: '64px',
    SIDEBAR_WIDTH: '280px',
    MODAL_WIDTH: '520px'
  },

  // Цветовая схема
  COLORS: {
    PRIMARY: '#1890ff',
    PRIMARY_HOVER: '#40a9ff',
    SUCCESS: '#52c41a',
    WARNING: '#faad14',
    ERROR: '#f5222d',
    INFO: '#1890ff',
    TEXT_PRIMARY: '#333333',
    TEXT_SECONDARY: '#666666',
    TEXT_DISABLED: '#999999',
    BORDER: '#d9d9d9',
    BACKGROUND: '#f5f5f5',
    BACKGROUND_HOVER: '#fafafa'
  },

  // Отступы
  SPACING: {
    XS: '4px',
    SM: '8px',
    MD: '16px',
    LG: '24px',
    XL: '32px',
    XXL: '48px'
  }
} as const;

/**
 * Константы для локального хранилища
 */
export const STORAGE_CONSTANTS = {
  // Ключи для localStorage
  KEYS: {
    CALCULATOR_STATE: 'risk_calculator_state',
    INSTRUMENT_HISTORY: 'risk_calculator_instrument_history',
    TEMPLATES: 'risk_calculator_templates',
    SETTINGS: 'risk_calculator_settings',
    CALCULATION_HISTORY: 'risk_calculator_calculation_history'
  },

  // Сроки хранения
  EXPIRY: {
    HISTORY: 30 * 24 * 60 * 60 * 1000, // 30 дней в миллисекундах
    TEMPLATES: 365 * 24 * 60 * 60 * 1000 // 365 дней
  },

  // Лимиты
  LIMITS: {
    MAX_HISTORY_ITEMS: 100,
    MAX_TEMPLATES: 50,
    MAX_INSTRUMENT_HISTORY: 20
  }
} as const;

/**
 * Константы для форматирования
 */
export const FORMATTING_CONSTANTS = {
  // Форматы чисел
  NUMBER_FORMATS: {
    DECIMAL_SEPARATOR: '.',
    THOUSAND_SEPARATOR: ',',
    CURRENCY_SYMBOL: '$',
    PERCENT_SYMBOL: '%'
  },

  // Форматы даты и времени
  DATE_FORMATS: {
    SHORT_DATE: 'DD.MM.YYYY',
    LONG_DATE: 'DD MMMM YYYY',
    SHORT_TIME: 'HH:mm',
    LONG_TIME: 'HH:mm:ss',
    DATETIME: 'DD.MM.YYYY HH:mm',
    TIMESTAMP: 'YYYY-MM-DDTHH:mm:ss.SSSZ'
  },

  // Локализация
  LOCALES: {
    RU: 'ru-RU',
    EN: 'en-US'
  }
} as const;

// Экспорт всех констант
export default {
  CALCULATOR_CONSTANTS,
  INSTRUMENT_CONSTANTS,
  VALIDATION_CONSTANTS,
  EXPORT_CONSTANTS,
  UI_CONSTANTS,
  STORAGE_CONSTANTS,
  FORMATTING_CONSTANTS
};
