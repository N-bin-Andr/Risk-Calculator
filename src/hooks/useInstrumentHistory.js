// src/hooks/useInstrumentHistory.js

import { useState, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';

export function useInstrumentHistory() {
    // Используем useLocalStorage вместо прямых вызовов localStorage
    const [history, setHistory] = useLocalStorage('instrumentHistory', []);

    // Убираем useEffect для загрузки, так как useLocalStorage уже делает это
    // Оставляем только для обратной совместимости, если нужно

    const saveToStorage = (updated) => {
        setHistory(updated);
    };

    const addInstrument = (name, priceStep = null) => {
        if (!name || typeof name !== 'string') return;
        const trimmed = name.trim();
        if (!trimmed) return;

        try {
            const currentHistory = history || [];
            const existing = currentHistory.find(item => item.name === trimmed);

            let updated;
            if (existing) {
                // Обновляем существующий инструмент
                updated = currentHistory.map(item =>
                    item.name === trimmed ? {
                        ...item,
                        count: item.count + 1,
                        priceStep: priceStep !== null ? priceStep : item.priceStep,
                        lastUsed: new Date().toISOString()
                    } : item
                );
            } else {
                // Добавляем новый инструмент
                updated = [{
                    name: trimmed,
                    count: 1,
                    priceStep: priceStep,
                    createdAt: new Date().toISOString(),
                    lastUsed: new Date().toISOString()
                }, ...currentHistory];
            }

            // Сортируем по частоте использования (по убыванию)
            updated = updated
                .sort((a, b) => b.count - a.count)
                .slice(0, 50); // максимум 50 записей

            saveToStorage(updated);
            return existing ? 'updated' : 'added';
        } catch (error) {
            console.error('Ошибка добавления инструмента:', error);
            return 'error';
        }
    };

    const updateInstrument = (name, updates) => {
        try {
            const currentHistory = history || [];
            const existingIndex = currentHistory.findIndex(item => item.name === name);

            if (existingIndex === -1) return false;

            const updated = [...currentHistory];
            updated[existingIndex] = {
                ...updated[existingIndex],
                ...updates,
                lastUpdated: new Date().toISOString()
            };

            saveToStorage(updated);
            return true;
        } catch (error) {
            console.error('Ошибка обновления инструмента:', error);
            return false;
        }
    };

    const updateInstrumentPriceStep = (name, priceStep) => {
        return updateInstrument(name, { priceStep });
    };

    const getSuggestions = (input) => {
        if (!input || typeof input !== 'string') return [];

        try {
            const currentHistory = history || [];
            return currentHistory
                .filter(item =>
                    item &&
                    item.name &&
                    item.name.toLowerCase().includes(input.toLowerCase())
                )
                .sort((a, b) => b.count - a.count)
                .map(item => ({
                    name: item.name,
                    count: item.count,
                    priceStep: item.priceStep
                }));
        } catch (error) {
            console.error('Ошибка получения подсказок:', error);
            return [];
        }
    };

    const getInstrument = (name) => {
        try {
            const currentHistory = history || [];
            return currentHistory.find(item => item.name === name) || null;
        } catch (error) {
            console.error('Ошибка получения инструмента:', error);
            return null;
        }
    };

    const deleteInstrument = (name) => {
        try {
            const currentHistory = history || [];
            const updated = currentHistory.filter(item => item.name !== name);
            saveToStorage(updated);
        } catch (error) {
            console.error('Ошибка удаления инструмента:', error);
        }
    };

    const deleteMultipleInstruments = (names) => {
        try {
            const currentHistory = history || [];
            const updated = currentHistory.filter(item => !names.includes(item.name));
            saveToStorage(updated);
        } catch (error) {
            console.error('Ошибка удаления нескольких инструментов:', error);
        }
    };

    const exportHistoryAsJSON = () => {
        try {
            const currentHistory = history || [];
            if (currentHistory.length === 0) {
                alert('История инструментов пуста');
                return;
            }

            const data = {
                exportedAt: new Date().toISOString(),
                totalInstruments: currentHistory.length,
                instruments: currentHistory
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], {
                type: 'application/json;charset=utf-8'
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `instrument-history-${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Ошибка экспорта истории:', error);
            alert('Не удалось экспортировать историю инструментов');
        }
    };

    const clearHistory = () => {
        if (window.confirm('Вы уверены, что хотите очистить всю историю инструментов?')) {
            saveToStorage([]);
        }
    };

    const getDefaultPriceStep = (instrumentName) => {
        // Определяем шаг цены по умолчанию на основе типа инструмента
        const lowerName = instrumentName.toLowerCase();

        // Для криптовалют (BTC, ETH, etc.)
        if (lowerName.includes('btc') || lowerName.includes('eth') ||
            lowerName.includes('usdt') || lowerName.includes('bnb')) {
            return 0.01; // 1 цент для крипто/USDT пар
        }

        // Для акций
        if (lowerName.includes('.mx') || lowerName.includes('.me')) {
            return 0.01; // 1 цент для акций
        }

        // Для форекс пар
        if (lowerName.includes('usd') || lowerName.includes('eur') ||
            lowerName.includes('gbp') || lowerName.includes('jpy')) {
            return 0.0001; // 1 пипс для форекс
        }

        // По умолчанию
        return 0.01;
    };

    return {
        history: history || [],
        addInstrument,
        updateInstrument,
        updateInstrumentPriceStep,
        getSuggestions,
        getInstrument,
        deleteInstrument,
        deleteMultipleInstruments,
        exportHistoryAsJSON,
        clearHistory,
        getDefaultPriceStep
    };
}
