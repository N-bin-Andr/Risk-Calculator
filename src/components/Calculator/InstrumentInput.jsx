// src/components/Calculator/InstrumentInput.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useDebounce } from '../../hooks';
import '../../styles/components/InstrumentInput.css';
import { validateInstrument } from '../../utils/validators';

const InstrumentInput = ({
    instrument,
    setInstrument,
    instrumentError,
    setInstrumentError,
    isDirectionChosen,
    tooltipText,
    historySuggestions,
    onInstrumentSelect,
    onOpenSettings,
    getSuggestions
}) => {
    const [localInstrument, setLocalInstrument] = useState(instrument || '');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [filteredSuggestions, setFilteredSuggestions] = useState([]);
    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
    const [isSearching, setIsSearching] = useState(false);

    const inputRef = useRef(null);
    const suggestionsRef = useRef(null);

    // Применяем дебаунс для поиска
    const debouncedSearchTerm = useDebounce(localInstrument, 300);

    // Синхронизация с родительским состоянием
    useEffect(() => {
        setLocalInstrument(instrument || '');
    }, [instrument]);

    // Фильтрация подсказок с использованием дебаунсированного значения
    useEffect(() => {
        const fetchSuggestions = async () => {
            if (debouncedSearchTerm.trim() && getSuggestions) {
                setIsSearching(true);

                // Имитация задержки или реальный API вызов
                setTimeout(() => {
                    const suggestions = getSuggestions(debouncedSearchTerm);
                    setFilteredSuggestions(suggestions);
                    setShowSuggestions(suggestions.length > 0);
                    setIsSearching(false);
                }, 100);
            } else {
                setFilteredSuggestions([]);
                setShowSuggestions(false);
                setIsSearching(false);
            }
        };

        fetchSuggestions();
    }, [debouncedSearchTerm, getSuggestions]);

    // Закрытие подсказок при клике вне компонента
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                suggestionsRef.current &&
                !suggestionsRef.current.contains(event.target) &&
                inputRef.current &&
                !inputRef.current.contains(event.target)
            ) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Обработчик изменения инструмента
    const handleInstrumentChange = (value) => {
        setLocalInstrument(value);
        setInstrument(value);

        // Валидация
        const error = validateInstrument(value);
        setInstrumentError(error);

        // Сбрасываем выделение в подсказках
        setSelectedSuggestionIndex(-1);
    };

    // Обработчик выбора инструмента из подсказок
    const handleSuggestionSelect = (suggestion) => {
        handleInstrumentChange(suggestion.name);
        setShowSuggestions(false);

        if (onInstrumentSelect) {
            onInstrumentSelect(suggestion);
        }
    };

    // Обработчик нажатия клавиш
    const handleKeyDown = (e) => {
        if (!showSuggestions || filteredSuggestions.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedSuggestionIndex(prev =>
                    prev < filteredSuggestions.length - 1 ? prev + 1 : prev
                );
                break;

            case 'ArrowUp':
                e.preventDefault();
                setSelectedSuggestionIndex(prev =>
                    prev > 0 ? prev - 1 : -1
                );
                break;

            case 'Enter':
                e.preventDefault();
                if (selectedSuggestionIndex >= 0) {
                    handleSuggestionSelect(filteredSuggestions[selectedSuggestionIndex]);
                }
                break;

            case 'Escape':
                setShowSuggestions(false);
                break;

            default:
                // Ничего не делаем для других клавиш
                break;
        }
    };

    // Обработчик открытия настроек инструмента
    const handleOpenSettings = () => {
        if (onOpenSettings && localInstrument) {
            onOpenSettings(localInstrument);
        }
    };

    return (
        <div className="instrument-input-container">
            <div className={`inline-field ${!isDirectionChosen ? 'disabled-field' : ''}`}>
                <label htmlFor="instrument-input">
                    Инструмент:
                    {localInstrument && (
                        <span className="saved-indicator" title="Инструмент выбран">
                            📈
                        </span>
                    )}
                    {isSearching && (
                        <span className="searching-indicator" title="Поиск...">
                            🔍
                        </span>
                    )}
                </label>

                <div className="instrument-input-wrapper" ref={inputRef}>
                    <input
                        id="instrument-input"
                        type="text"
                        value={localInstrument}
                        onChange={(e) => handleInstrumentChange(e.target.value)}
                        onFocus={() => localInstrument.trim() && setShowSuggestions(true)}
                        onKeyDown={handleKeyDown}
                        disabled={!isDirectionChosen}
                        placeholder="BTCUSDT"
                        className={`${instrumentError ? 'input-error' : ''} ${isSearching ? 'searching' : ''}`}
                        title={!isDirectionChosen ? tooltipText : 'Введите название инструмента (например: BTCUSDT)'}
                        autoComplete="off"
                    />

                    {localInstrument && (
                        <button
                            type="button"
                            className="instrument-settings-btn"
                            onClick={handleOpenSettings}
                            disabled={!isDirectionChosen}
                            title="Настройки инструмента"
                        >
                            ⚙️
                        </button>
                    )}
                </div>
            </div>

            {/* Отображение ошибки */}
            {instrumentError && (
                <span className="error-text">{instrumentError}</span>
            )}

            {/* Индикатор поиска */}
            {isSearching && (
                <div className="searching-message">
                    <span className="searching-spinner"></span>
                    Поиск инструментов...
                </div>
            )}

            {/* Подсказки */}
            {showSuggestions && filteredSuggestions.length > 0 && !isSearching && (
                <div className="suggestions-dropdown" ref={suggestionsRef}>
                    <div className="suggestions-header">
                        <span className="suggestions-title">История инструментов:</span>
                        <span className="suggestions-count">
                            {filteredSuggestions.length} найдено
                        </span>
                    </div>

                    <div className="suggestions-list">
                        {filteredSuggestions.map((suggestion, index) => (
                            <div
                                key={`${suggestion.name}-${index}`}
                                className={`suggestion-item ${index === selectedSuggestionIndex ? 'selected' : ''}`}
                                onClick={() => handleSuggestionSelect(suggestion)}
                                onMouseEnter={() => setSelectedSuggestionIndex(index)}
                            >
                                <div className="suggestion-content">
                                    <span className="suggestion-name">{suggestion.name}</span>
                                    <div className="suggestion-info">
                                        <span className="suggestion-count">
                                            {suggestion.count} использований
                                        </span>
                                        {suggestion.priceStep && (
                                            <span className="suggestion-step">
                                                Шаг: {suggestion.priceStep}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="suggestion-actions">
                                    <button
                                        type="button"
                                        className="suggestion-action-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (onOpenSettings) {
                                                onOpenSettings(suggestion.name);
                                            }
                                        }}
                                        title="Настройки инструмента"
                                    >
                                        ⚙️
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="suggestions-footer">
                        <span className="suggestions-hint">
                            Используйте ↑↓ для навигации, Enter для выбора, Esc для отмены
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InstrumentInput;
