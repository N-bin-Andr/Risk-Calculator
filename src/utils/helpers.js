// src/utils/helpers.js

/**
 * Получение типа статуса для стилей
 * @param {string} status - Текстовый статус
 * @returns {string} Тип статуса (planned/cancelled/completed/info)
 */
export const getStatusType = (status) => {
    if (!status) return 'info';

    const statusLower = status.toLowerCase();
    if (statusLower.includes('запланирован') || statusLower.includes('открыт')) {
        return 'planned';
    } else if (statusLower.includes('отменён')) {
        return 'cancelled';
    } else if (statusLower.includes('завершен')) {
        return 'completed';
    }
    return 'info';
};

/**
 * Получение отображаемого текста статуса с иконкой
 * @param {string} status - Текстовый статус
 * @returns {string} Статус с иконкой
 */
export const getStatusDisplay = (status) => {
    const statusType = getStatusType(status);

    switch (statusType) {
        case 'planned':
            return '📅 Запланирован';
        case 'cancelled':
            return '❌ Отменён';
        case 'completed':
            return '✅ Завершен';
        default:
            return status || '📅 Запланирован';
    }
};

/**
 * Расчет суммы риска в USDT
 * @param {number|string} deposit - Депозит
 * @param {number|string} riskSize - Размер риска в процентах
 * @returns {number} Сумма риска в USDT
 */
export const calculateRiskAmount = (deposit, riskSize) => {
    const dep = parseFloat(deposit);
    const risk = parseFloat(riskSize);

    if (isNaN(dep) || isNaN(risk) || dep <= 0 || risk <= 0) {
        return 0;
    }

    return dep * (risk / 100); // Возвращаем число, а не строку
};

/**
 * Получение рекомендации по уровню риска
 * @param {number|string} riskSize - Размер риска в процентах
 * @returns {object} Объект с рекомендацией
 */
export const getRiskRecommendation = (riskSize) => {
    const risk = parseFloat(riskSize);

    if (isNaN(risk)) return null;

    if (risk <= 1) {
        return { text: 'Консервативный риск', color: '#28a745', emoji: '🟢' };
    } else if (risk <= 3) {
        return { text: 'Умеренный риск', color: '#ffc107', emoji: '🟡' };
    } else if (risk <= 5) {
        return { text: 'Агрессивный риск', color: '#fd7e14', emoji: '🟠' };
    } else {
        return { text: 'Высокий риск', color: '#dc3545', emoji: '🔴' };
    }
};

/**
 * Генерация уникального ID отчета
 * @returns {string} Уникальный ID формата ORDДДММГГГГЧЧММССF
 */
export const generateReportId = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `ORD${day}${month}${year}${hours}${minutes}${seconds}F`;
};

/**
 * Проверка, можно ли выполнить расчет
 * @param {object} state - Состояние калькулятора
 * @returns {boolean} Можно ли выполнить расчет
 */
export const canCalculate = (state) => {
    const { direction, slError, tpError, gridError, isDirectionChosen } = state;

    // Базовые проверки
    if (!direction || !isDirectionChosen) return false;
    if (slError || tpError || gridError) return false;

    // Проверка обязательных полей
    if (!state.instrument || !state.entryPrice || !state.slPrice || !state.deposit || !state.riskSize) {
        return false;
    }

    // Проверка сетки, если включена
    if (state.gridEnabled) {
        if (!state.gridDistribution || state.gridDistribution.length === 0) return false;

        // Проверка что все поля распределения заполнены
        const hasEmptyFields = state.gridDistribution.some((val, index) => {
            // Последнее поле может быть автоматическим
            if (index === state.gridDistribution.length - 1) return false;
            return !val || val.trim() === '';
        });

        if (hasEmptyFields) return false;
    }

    return true;
};

/**
 * Очистка объекта от пустых значений
 * @param {object} obj - Объект для очистки
 * @returns {object} Очищенный объект
 */
export const cleanObject = (obj) => {
    const cleaned = {};

    Object.keys(obj).forEach(key => {
        const value = obj[key];
        if (value !== null && value !== undefined && value !== '') {
            if (Array.isArray(value) && value.length > 0) {
                cleaned[key] = value;
            } else if (typeof value === 'object' && !Array.isArray(value)) {
                const nestedCleaned = cleanObject(value);
                if (Object.keys(nestedCleaned).length > 0) {
                    cleaned[key] = nestedCleaned;
                }
            } else if (!Array.isArray(value) && typeof value !== 'object') {
                cleaned[key] = value;
            }
        }
    });

    return cleaned;
};

/**
 * Дебаунс функция
 * @param {Function} func - Функция для дебаунса
 * @param {number} wait - Время ожидания в миллисекундах
 * @returns {Function} Дебаунсированная функция
 */
export const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

/**
 * Копирование текста в буфер обмена
 * @param {string} text - Текст для копирования
 * @returns {Promise<boolean>} Успешно ли скопировано
 */
export const copyToClipboard = async (text) => {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        // Fallback для старых браузеров
        try {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            return true;
        } catch (err2) {
            console.error('Ошибка копирования в буфер:', err2);
            return false;
        }
    }
};

/**
 * Скачивание файла
 * @param {string} content - Содержимое файла
 * @param {string} filename - Имя файла
 * @param {string} type - MIME тип
 */
export const downloadFile = (content, filename, type = 'text/plain') => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
