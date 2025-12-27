// Типы для инструментов и истории

export interface Instrument {
  name: string;
  count: number;
  priceStep: number | null;
  createdAt: string;
  lastUsed: string;
  lastUpdated?: string;
}

export interface InstrumentSuggestion {
  name: string;
  count: number;
  priceStep: number | null;
}
