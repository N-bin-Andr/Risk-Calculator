// src/hooks/useDebounce.js

import { useState, useEffect } from 'react';

/**
 * Хук для дебаунсинга частых обновлений
 * @param {any} value - Значение для дебаунсинга
 * @param {number} delay - Задержка в миллисекундах
 * @returns {any} Дебаунсированное значение
 */
export function useDebounce(value, delay = 500) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        // Устанавливаем таймер для обновления дебаунсированного значения
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // Очищаем таймер при каждом изменении value или delay
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}
