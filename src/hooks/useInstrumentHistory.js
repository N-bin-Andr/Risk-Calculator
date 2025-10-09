import { useState, useEffect } from 'react';

export function useInstrumentHistory() {
    const [history, setHistory] = useState([]);

    useEffect(() => {
        const saved = JSON.parse(localStorage.getItem('instrumentHistory') || '[]');
        setHistory(saved);
    }, []);

    const saveToStorage = updated => {
        localStorage.setItem('instrumentHistory', JSON.stringify(updated));
        setHistory(updated);
    };

    const addInstrument = name => {
        if (!name || typeof name !== 'string') return;
        const trimmed = name.trim();
        if (!trimmed) return;

        const saved = JSON.parse(localStorage.getItem('instrumentHistory') || '[]');
        const existing = saved.find(item => item.name === trimmed);

        let updated;
        if (existing) {
            updated = saved.map(item =>
                item.name === trimmed ? { ...item, count: item.count + 1 } : item
            );
        } else {
            updated = [{ name: trimmed, count: 1 }, ...saved];
        }

        updated = updated
            .sort((a, b) => b.count - a.count)
            .slice(0, 50); // максимум 50

        saveToStorage(updated);
    };

    const getSuggestions = input => {
        if (!input) return [];
        return history
            .filter(item => item.name.toLowerCase().includes(input.toLowerCase()))
            .sort((a, b) => b.count - a.count)
            .map(item => item.name);
    };

    const deleteInstrument = name => {
        const updated = history.filter(item => item.name !== name);
        saveToStorage(updated);
    };
    const exportHistoryAsJSON = () => {
        const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `instrument-history-${Date.now()}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    return {
        history,
        addInstrument,
        getSuggestions,
        deleteInstrument,
        exportHistoryAsJSON
    };
}
