❌ Еще не выполнено:
Полное разделение Calculator.jsx на подкомпоненты
Интеграция созданных компонентов
Оптимизация производительности
Завершение перехода на CSS-модули

🎯 КРИТИЧЕСКИЕ ПРОБЛЕМЫ СЕЙЧАС
Calculator.jsx всё еще огромный (650+ строк) - не разделен на компоненты
Логика смешана с UI - все вычисления и обработчики в одном файле
Нет использования созданных компонентов - GridSettingsPanel, TakeProfitManager и другие не используются
Стили всё еще в одном файле - нет модульного подхода

🚀 ПРЕДЛАГАЮ СЛЕДУЮЩИЕ ШАГИ

## ШАГ 1: РАЗДЕЛЕНИЕ Calculator.jsx НА КОМПОНЕНТЫ (Высокий приоритет)

Нужно интегрировать созданные компоненты:

```
// В Calculator.tsx заменить монолитный код на:
import { GridSettingsPanel } from './components/Calculator/GridSettingsPanel';
import { TakeProfitManager } from './components/Calculator/TakeProfitManager';
import { RiskManagementPanel } from './components/Calculator/RiskManagementPanel';
import { CalculationResults } from './components/Calculator/CalculationResults';
import { ExportActions } from './components/Calculator/ExportActions';
```

## ШАГ 2: ИНТЕГРАЦИЯ КАСТОМНЫХ ХУКОВ

Использовать созданные хуки вместо inline-логики:

```
// Заменить текущие useMemo и useCallback на:
const { errors, isValid } = useValidation(state);
const gridResults = useGridCalculations(state);
const debouncedInstrument = useDebounce(state.instrument, 300);
```

## ШАГ 3: ОПТИМИЗАЦИЯ ПРОИЗВОДИТЕЛЬНОСТИ

Добавить:
React.memo для всех подкомпонентов
Правильные зависимости в useMemo/useCallback
Ленивую загрузку компонентов

## ШАГ 4: CSS-МОДУЛИ

Перенести стили из styles.css в модули:
Calculator.module.css
GridSettings.module.css
TakeProfitManager.module.css

## 📋 КОНКРЕТНЫЙ ПЛАН ДЕЙСТВИЙ

### ФАЗА 1: Подготовка (30 минут)

Создать резервную копию Calculator.jsx
Убедиться, что все созданные компоненты готовы к использованию
Проверить импорты типов

### ФАЗА 2: Рефакторинг Calculator.jsx (3-4 часа)

#### Часть A: Вынести GridSettingsPanel

```
// Заменить весь блок сетки (строки ~300-400) на:
<GridSettingsPanel
  state={state}
  dispatch={dispatch}
  isDirectionChosen={isDirectionChosen}
  isGridFieldEnabled={isGridFieldEnabled}
  getGridFieldPlaceholder={getGridFieldPlaceholder}
/>
```

#### Часть B: Вынести TakeProfitManager

```
<TakeProfitManager
  tpLevels={state.tpLevels}
  dispatch={dispatch}
  tpError={state.tpError}
  isDirectionChosen={isDirectionChosen}
/>
```

#### Часть C: Вынести RiskManagementPanel

```
<RiskManagementPanel
  slPrice={state.slPrice}
  slError={state.slError}
  dispatch={dispatch}
  riskSize={riskSize}
  setRiskSize={setRiskSize}
  isDirectionChosen={isDirectionChosen}
/>
```

#### Часть D: Вынести CalculationResults

```
<CalculationResults
  state={state}
  gridEnabled={state.gridEnabled}
  currentPriceStep={currentPriceStep}
  instrument={state.instrument}
  notionStatus={notionStatus}
  isSendingToNotion={isSendingToNotion}
/>
```

### ФАЗА 3: Интеграция хуков (1-2 часа)

```
// Вместо useEffect для валидации:
const validation = useValidation(state);
// Использовать validation.errors, validation.isValid

// Вместо manual grid calculations:
const gridCalculations = useGridCalculations(state);
// Использовать gridCalculations.results
```

### ФАЗА 4: Оптимизация (1 час)

Добавить React.memo ко всем новым компонентам
Исправить зависимости
Добавить дебаунс для инпутов

### ФАЗА 5: CSS-модули (1-2 часа)

```
/* Calculator.module.css */
.calculator { /* стили */ }
.formSection { /* стили */ }

/* GridSettings.module.css */
.gridSettings { /* стили */ }
.gridField { /* стили */ }
```

## 🛠️ ТЕХНИЧЕСКИЕ ДЕТАЛИ ДЛЯ НАЧАЛА

Сначала нужно проверить все созданные компоненты - они могут нуждаться в доработке
Типизация - убедиться, что пропсы правильно типизированы
Контексты - использовать TradingContext для общих данных

## 📈 ОЖИДАЕМЫЕ РЕЗУЛЬТАТЫ ПОСЛЕ РЕФАКТОРИНГА

Компонент Строк сейчас Строк после Уменьшение
Calculator.jsx 650+ ~150 77%
GridSettingsPanel 0 ~150 -
TakeProfitManager 0 ~100 -
Общая поддерживаемость Сложная Простая +
