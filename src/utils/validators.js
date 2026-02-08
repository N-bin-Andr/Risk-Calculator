// src/utils/validators.js

/**
 * Валидация цены
 * @param {string|number} price - Цена для валидации
 * @param {string} fieldName - Название поля (для сообщения об ошибке)
 * @returns {string} Сообщение об ошибке или пустая строка
 */
export const validatePrice = (price, fieldName = 'Цена') => {
    if (price === null || price === undefined || price === '') {
        return `${fieldName} обязательна для заполнения`;
    }

    const num = parseFloat(price);
    if (isNaN(num)) {
        return `${fieldName} должна быть числом`;
    }

    if (num <= 0) {
        return `${fieldName} должна быть больше 0`;
    }

    return '';
};

/**
 * Валидация процента
 * @param {string|number} percent - Процент для валидации
 * @param {string} fieldName - Название поля
 * @returns {string} Сообщение об ошибке или пустая строка
 */
export const validatePercentage = (percent, fieldName = 'Процент') => {
    if (percent === null || percent === undefined || percent === '') {
        return `${fieldName} обязателен для заполнения`;
    }

    const num = parseFloat(percent);
    if (isNaN(num)) {
        return `${fieldName} должен быть числом`;
    }

    if (num < 0) {
        return `${fieldName} не может быть отрицательным`;
    }

    if (num > 100) {
        return `${fieldName} не может превышать 100%`;
    }

    return '';
};

/**
 * Валидация направления сделки
 * @param {string} direction - Направление (long/short)
 * @returns {string} Сообщение об ошибке или пустая строка
 */
export const validateDirection = (direction) => {
    if (!direction) {
        return 'Выберите направление сделки';
    }

    if (direction !== 'long' && direction !== 'short') {
        return 'Направление должно быть "Long" или "Short"';
    }

    return '';
};

/**
 * Валидация Stop Loss относительно цены входа
 * @param {string|number} slPrice - Цена Stop Loss
 * @param {string|number} entryPrice - Цена входа
 * @param {string} direction - Направление сделки
 * @returns {string} Сообщение об ошибке или пустая строка
 */
export const validateStopLoss = (slPrice, entryPrice, direction) => {
    if (!slPrice || slPrice === '' || !entryPrice || entryPrice === '') {
        return ''; // Не валидируем пустые поля
    }

    const sl = parseFloat(slPrice);
    const ep = parseFloat(entryPrice);

    if (isNaN(sl) || isNaN(ep)) {
        return 'Цена входа и Stop Loss должны быть числами';
    }

    if (sl === ep) {
        return 'Stop Loss не должен совпадать с ценой входа';
    }

    if (direction === 'long' && sl > ep) {
        return 'Для Long позиции Stop Loss должен быть ниже цены входа';
    }

    if (direction === 'short' && sl < ep) {
        return 'Для Short позиции Stop Loss должен быть выше цены входа';
    }

    return '';
};

/**
 * Валидация Take Profit относительно цены входа
 * @param {number} tpPrice - Цена Take Profit
 * @param {number} entryPrice - Цена входа
 * @param {string} direction - Направление сделки
 * @returns {string} Сообщение об ошибке или пустая строка
 */
export const validateTakeProfit = (tpPrice, entryPrice, direction) => {
    const tp = parseFloat(tpPrice);
    const ep = parseFloat(entryPrice);

    if (isNaN(tp) || isNaN(ep)) {
        return 'Цена входа и Take Profit должны быть числами';
    }

    if (tp === ep) {
        return 'Take Profit не должен совпадать с ценой входа';
    }

    if (direction === 'long' && tp < ep) {
        return 'Для Long позиции Take Profit должен быть выше цены входа';
    }

    if (direction === 'short' && tp > ep) {
        return 'Для Short позиции Take Profit должен быть ниже цены входа';
    }

    return '';
};

/**
 * Валидация депозита
 * @param {string|number} deposit - Размер депозита
 * @returns {string} Сообщение об ошибке или пустая строка
 */
export const validateDeposit = (deposit) => {
    if (deposit === null || deposit === undefined || deposit === '') {
        return 'Депозит обязателен для заполнения';
    }

    const num = parseFloat(deposit);
    if (isNaN(num)) {
        return 'Депозит должен быть числом';
    }

    if (num <= 0) {
        return 'Депозит должен быть больше 0';
    }

    if (num > 1000000000) {
        return 'Депозит слишком большой (макс. 1,000,000,000)';
    }

    return '';
};

/**
 * Валидация размера риска
 * @param {string|number} riskSize - Размер риска в процентах
 * @returns {string} Сообщение об ошибке или пустая строка
 */
export const validateRiskSize = (riskSize) => {
    if (riskSize === null || riskSize === undefined || riskSize === '') {
        return 'Размер риска обязателен для заполнения';
    }

    const num = parseFloat(riskSize);
    if (isNaN(num)) {
        return 'Размер риска должен быть числом';
    }

    if (num <= 0) {
        return 'Размер риска должен быть больше 0%';
    }

    if (num > 100) {
        return 'Размер риска не может превышать 100%';
    }

    if (num > 50) {
        return 'Высокий риск (более 50%). Рекомендуется не более 5%';
    }

    return '';
};

/**
 * Валидация инструмента
 * @param {string} instrument - Название инструмента
 * @returns {string} Сообщение об ошибке или пустая строка
 */
export const validateInstrument = (instrument) => {
    if (!instrument || instrument.trim() === '') {
        return 'Инструмент обязателен для заполнения';
    }

    if (instrument.length < 2) {
        return 'Название инструмента слишком короткое';
    }

    if (instrument.length > 50) {
        return 'Название инструмента слишком длинное (макс. 50 символов)';
    }

    // Проверка на допустимые символы
    const validPattern = /^[A-Za-z0-9./-]+$/;
    if (!validPattern.test(instrument)) {
        return 'Название инструмента содержит недопустимые символы';
    }

    return '';
};
