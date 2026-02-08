// src/utils/formatters.js - обновленная версия (удаляем статусные функции)

/**
 * Форматирование чисел с заданной точностью
 * @param {number|string} num - Число для форматирования
 * @param {number} decimals - Количество знаков после запятой
 * @returns {string} Отформатированное число или '—' при ошибке
 */
export const formatNumber = (num, decimals = 8) => {
    if (num === null || num === undefined || isNaN(num)) return '—';
    const number = parseFloat(num);
    if (isNaN(number)) return '—';
    return number.toFixed(decimals);
};

/**
 * Форматирование валюты
 * @param {number|string} amount - Сумма
 * @param {string} currency - Валюта (по умолчанию USDT)
 * @param {number} decimals - Количество знаков после запятой
 * @returns {string} Отформатированная сумма с валютой
 */
export const formatCurrency = (amount, currency = 'USDT', decimals = 2) => {
    if (amount === null || amount === undefined || isNaN(amount)) return '—';
    const number = parseFloat(amount);
    if (isNaN(number)) return '—';
    return `${number.toFixed(decimals)} ${currency}`;
};

/**
 * Форматирование процентов
 * @param {number|string} value - Значение в процентах
 * @param {number} decimals - Количество знаков после запятой
 * @returns {string} Отформатированный процент
 */
export const formatPercentage = (value, decimals = 2) => {
    if (value === null || value === undefined || isNaN(value)) return '—';
    const number = parseFloat(value);
    if (isNaN(number)) return '—';
    return `${number.toFixed(decimals)}%`;
};

/**
 * Форматирование больших чисел с разделителями тысяч
 * @param {number|string} num - Число для форматирования
 * @returns {string} Число с разделителями
 */
export const formatWithThousandsSeparator = (num) => {
    if (num === null || num === undefined || isNaN(num)) return '—';
    const number = parseFloat(num);
    if (isNaN(number)) return '—';
    return number.toLocaleString('ru-RU');
};

/**
 * Форматирование даты и времени
 * @param {Date|string} date - Дата
 * @param {boolean} includeTime - Включать ли время
 * @returns {string} Отформатированная дата
 */
export const formatDate = (date, includeTime = true) => {
    if (!date) return '—';

    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return '—';

    if (includeTime) {
        return dateObj.toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    return dateObj.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

/**
 * Сокращенное форматирование больших чисел (K, M, B)
 * @param {number|string} num - Число
 * @returns {string} Сокращенное число
 */
export const formatCompactNumber = (num) => {
    if (num === null || num === undefined || isNaN(num)) return '—';
    const number = parseFloat(num);
    if (isNaN(number)) return '—';

    if (number >= 1_000_000_000) {
        return (number / 1_000_000_000).toFixed(2) + 'B';
    }
    if (number >= 1_000_000) {
        return (number / 1_000_000).toFixed(2) + 'M';
    }
    if (number >= 1_000) {
        return (number / 1_000).toFixed(2) + 'K';
    }
    return number.toFixed(2);
};
