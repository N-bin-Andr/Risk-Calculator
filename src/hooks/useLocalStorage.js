// src/hooks/useLocalStorage.js

import { useState, useEffect } from 'react';

/**
 * Хук для работы с localStorage
 * @param {string} key - Ключ в localStorage
 * @param {any} initialValue - Начальное значение
 * @returns {[any, Function]} Массив [storedValue, setValue]
 */
export function useLocalStorage(key, initialValue) {
    // Функция для получения значения из localStorage
    const readValue = () => {
        if (typeof window === 'undefined') {
            return initialValue;
        }

        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.warn(`Ошибка чтения localStorage по ключу "${key}":`, error);
            return initialValue;
        }
    };

    // Состояние для хранения значения
    const [storedValue, setStoredValue] = useState(readValue);

    // Функция для обновления значения в state и localStorage
    const setValue = (value) => {
        if (typeof window === 'undefined') {
            console.warn('localStorage недоступен');
            return;
        }

        try {
            // Разрешаем value быть функцией для совместимости с useState
            const valueToStore = value instanceof Function ? value(storedValue) : value;

            // Сохраняем в state
            setStoredValue(valueToStore);

            // Сохраняем в localStorage
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.warn(`Ошибка записи в localStorage по ключу "${key}":`, error);
        }
    };

    // Слушаем изменения localStorage в других вкладках
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === key && e.newValue !== null) {
                setStoredValue(JSON.parse(e.newValue));
            }
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [key]);

    return [storedValue, setValue];
}
