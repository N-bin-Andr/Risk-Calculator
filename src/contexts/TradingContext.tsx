import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Instrument } from '../types/calculator';
import { INSTRUMENT_CONSTANTS, STORAGE_CONSTANTS } from '../utils/constants';
import { safeGetLocalStorage, safeSetLocalStorage } from '../utils/helpers';

// Создаем полные объекты инструментов с дополнением недостающих полей
const createFullInstrument = (instr: any): Instrument => {
  const categoryDefaults = INSTRUMENT_CONSTANTS.CATEGORY_DEFAULTS[
    instr.category as keyof typeof INSTRUMENT_CONSTANTS.CATEGORY_DEFAULTS
  ] || {
    minLot: 0.01,
    maxLot: 100,
    step: 0.01,
    pipValue: 1
  };

  return {
    ...instr,
    minLot: instr.minLot || categoryDefaults.minLot,
    maxLot: instr.maxLot || categoryDefaults.maxLot,
    step: instr.step || categoryDefaults.step,
    pipValue: instr.pipValue || categoryDefaults.pipValue,
    commission: instr.commission || 0,
    spread: instr.spread || 0,
    swapLong: instr.swapLong || 0,
    swapShort: instr.swapShort || 0
  };
};

// Создаем копию массива популярных инструментов с полными объектами
const initialInstruments = INSTRUMENT_CONSTANTS.POPULAR_INSTRUMENTS.map(createFullInstrument);

interface TradingContextType {
  // Общие настройки
  deposit: number;
  riskSize: number;
  instruments: Instrument[];
  selectedInstrument: Instrument | null;

  // Методы обновления
  updateDeposit: (value: number) => void;
  updateRiskSize: (value: number) => void;
  updateInstruments: (instruments: Instrument[]) => void;
  selectInstrument: (instrument: Instrument) => void;
  clearSelectedInstrument: () => void;

  // Управление историей
  addInstrumentToHistory: (instrument: Instrument) => void;
  clearInstrumentHistory: () => void;
  getInstrumentHistory: () => Instrument[];

  // Поиск и фильтрация
  searchInstruments: (query: string) => Instrument[];
  getInstrumentBySymbol: (symbol: string) => Instrument | null;
  getInstrumentsByCategory: (category: string) => Instrument[];
}

// Создаем контекст с типом
const TradingContext = createContext<TradingContextType | null>(null);

// Провайдер контекста
export const TradingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Состояние депозита
  const [deposit, setDeposit] = useState<number>(() => {
    const saved = safeGetLocalStorage<any>(STORAGE_CONSTANTS.KEYS.SETTINGS, { deposit: 10000 });
    return saved?.deposit || 10000;
  });

  // Размер риска (%)
  const [riskSize, setRiskSize] = useState<number>(() => {
    const saved = safeGetLocalStorage<any>(STORAGE_CONSTANTS.KEYS.SETTINGS, { riskSize: 2 });
    return saved?.riskSize || 2;
  });

  // Список инструментов
  const [instruments, setInstruments] = useState<Instrument[]>(initialInstruments);

  // Выбранный инструмент
  const [selectedInstrument, setSelectedInstrument] = useState<Instrument | null>(null);

  // История инструментов
  const [instrumentHistory, setInstrumentHistory] = useState<Instrument[]>(() => {
    return safeGetLocalStorage<Instrument[]>(STORAGE_CONSTANTS.KEYS.INSTRUMENT_HISTORY, []);
  });

  // Сохранение настроек в localStorage
  useEffect(() => {
    safeSetLocalStorage(STORAGE_CONSTANTS.KEYS.SETTINGS, {
      deposit,
      riskSize,
      lastUpdated: new Date().toISOString()
    });
  }, [deposit, riskSize]);

  // Сохранение истории инструментов
  useEffect(() => {
    safeSetLocalStorage(STORAGE_CONSTANTS.KEYS.INSTRUMENT_HISTORY, instrumentHistory);
  }, [instrumentHistory]);

  // Методы обновления
  const updateDeposit = (value: number) => {
    if (value >= 0) {
      setDeposit(value);
    }
  };

  const updateRiskSize = (value: number) => {
    if (value >= 0 && value <= 100) {
      setRiskSize(value);
    }
  };

  const updateInstruments = (newInstruments: Instrument[]) => {
    setInstruments(newInstruments);
  };

  const selectInstrument = (instrument: Instrument) => {
    setSelectedInstrument(instrument);
    addInstrumentToHistory(instrument);
  };

  const clearSelectedInstrument = () => {
    setSelectedInstrument(null);
  };

  // Управление историей
  const addInstrumentToHistory = (instrument: Instrument) => {
    setInstrumentHistory(prev => {
      // Удаляем дубликаты
      const filtered = prev.filter(item => item.symbol !== instrument.symbol);
      // Добавляем в начало и ограничиваем размер
      return [instrument, ...filtered].slice(0, STORAGE_CONSTANTS.LIMITS.MAX_INSTRUMENT_HISTORY);
    });
  };

  const clearInstrumentHistory = () => {
    setInstrumentHistory([]);
  };

  const getInstrumentHistory = () => {
    return instrumentHistory;
  };

  // Поиск и фильтрация
  const searchInstruments = (query: string): Instrument[] => {
    if (!query.trim()) {
      return [];
    }

    const lowerQuery = query.toLowerCase();
    return instruments.filter(instrument =>
      instrument.symbol.toLowerCase().includes(lowerQuery) ||
      instrument.name.toLowerCase().includes(lowerQuery) ||
      instrument.category.toLowerCase().includes(lowerQuery)
    );
  };

  const getInstrumentBySymbol = (symbol: string): Instrument | null => {
    return instruments.find(instrument => instrument.symbol === symbol) || null;
  };

  const getInstrumentsByCategory = (category: string): Instrument[] => {
    return instruments.filter(instrument => instrument.category === category);
  };

  // Сброс к стандартным инструментам
  const resetToDefaultInstruments = () => {
    setInstruments([...initialInstruments]);
  };

  // Значение контекста
  const contextValue: TradingContextType = {
    deposit,
    riskSize,
    instruments,
    selectedInstrument,

    updateDeposit,
    updateRiskSize,
    updateInstruments,
    selectInstrument,
    clearSelectedInstrument,

    addInstrumentToHistory,
    clearInstrumentHistory,
    getInstrumentHistory,

    searchInstruments,
    getInstrumentBySymbol,
    getInstrumentsByCategory,
  };

  return (
    <TradingContext.Provider value={contextValue}>
      {children}
    </TradingContext.Provider>
  );
};

// Хук для использования контекста
export const useTrading = () => {
  const context = useContext(TradingContext);
  if (!context) {
    throw new Error('useTrading must be used within TradingProvider');
  }
  return context;
};

export default TradingContext;
