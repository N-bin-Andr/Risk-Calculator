# 📊 Risk Calculator - Калькулятор рисков для трейдинга

Профессиональный калькулятор для расчета параметров торговых позиций с поддержкой сеточного входа и управлением рисками.

## План рефакторинга: Оптимизация Trading Risk Calculator

### Текущие проблемы проекта:

- Гигантский компонент Calculator.jsx (650+ строк)
- Смешанная бизнес-логика в UI компонентах
- Отсутствие типизации
- Нет оптимизации производительности
- Монолитные стили
- Хрупкая структура состояний

### Цели рефакторинга:

✅ Повысить поддерживаемость кода
✅ Улучшить производительность
✅ Добавить TypeScript типизацию
✅ Разделить ответственность
✅ Оптимизировать ререндеры
✅ Создать модульную архитектуру

## 🏗️ НОВАЯ СТРУКТУРА ПРОЕКТА:

src/
├── types/ # TypeScript типы
│     ├── index.ts
│     ├── calculator.ts
│     └── notion.ts
│
├── hooks/ # Кастомные React хуки
│     ├── useInstrumentHistory.ts
│     ├── useCalculatorState.ts # НОВЫЙ: управление состоянием калькулятора
│     ├── useGridCalculations.ts # НОВЫЙ: расчеты сетки
│     ├── useValidation.ts # НОВЫЙ: валидация
│     └── useDebounce.ts # НОВЫЙ: дебаунс
│
├── contexts/ # React контексты
│     └── TradingContext.tsx # Общие данные (депозит, риск, настройки)
│
├── services/ # Бизнес-логика и API
│     ├── notionService.ts
│     ├── calculationService.ts # НОВЫЙ: вынесенная логика расчетов
│     ├── validationService.ts # НОВЫЙ: единая валидация
│     └── exportService.ts # НОВЫЙ: экспорт изображений
│
├── utils/ # Вспомогательные функции
│     ├── formatters.ts
│     ├── constants.ts
│     └── helpers.ts
│
├── components/ # React компоненты
│     ├── Calculator/ # НОВАЯ ПАПКА: все компоненты калькулятора
│     │       ├── Calculator.tsx # Главный компонент-контейнер
│     │       ├── DirectionSelector.tsx
│     │       ├── InstrumentInput.tsx
│     │       ├── PriceInputs.tsx
│     │       ├── GridSettingsPanel.tsx
│     │       ├── TakeProfitManager.tsx
│     │       ├── RiskManagementPanel.tsx
│     │       ├── CalculationResults.tsx
│     │       └── ExportActions.tsx
│     │
│     ├── InstrumentSettingsDialog/
│     │       └── InstrumentSettingsDialog.tsx
│     │
│     ├── common/ # Переиспользуемые UI компоненты
│     │       ├── Button/
│     │       ├── Input/
│     │       ├── Select/
│     │       └── Modal/
│     │
│     └── layout/ # Компоненты макета
│     └── Section.tsx
│
├── reducers/ # Redux-редьюсеры
│     └── calculatorReducer.ts
│
├── styles/
│     ├── globals.css # Базовые стили
│     ├── components/ # Глобальные стили компонентов
│     │       ├── forms.css
│     │       ├── buttons.css
│     │       └── layout.css
│     └── modules/ # CSS-модули
│             ├── Calculator.module.css
│             ├── GridSettings.module.css
|             ├── TakeProfitManager.module.css
│             └── ...
│
├── App.tsx
└── index.tsx

## 📋 ПОШАГОВЫЙ ПЛАН РЕАЛИЗАЦИИ:

### 🛡️ МЕРЫ ПРЕДОСТОРОЖНОСТИ:

#### Создать резервную копию перед началом:

```
git checkout -b refactor/optimization
git add .
git commit -m "Backup before refactoring"
```

#### Тестировать после каждого этапа:

- Проверять, что калькулятор рассчитывает правильно
- Проверять отправку в Notion
- Проверять экспорт изображений

#### Использовать Feature Flags для постепенного внедрения:

```
const ENABLE_NEW_CALCULATOR = process.env.REACT_APP_ENABLE_NEW_CALCULATOR === 'true';
return ENABLE_NEW_CALCULATOR ? <NewCalculator /> : <OldCalculator />;
```

### ФАЗА 1: Подготовка и TypeScript (2-3 часа)

#### Установить TypeScript зависимости:

```
npm install --save-dev typescript @types/react @types/react-dom @types/node
```

#### Создать tsconfig.json:

```
{
"compilerOptions": {
"target": "es5",
"lib": ["dom", "dom.iterable", "esnext"],
"allowJs": true,
"skipLibCheck": true,
"strict": true,
"forceConsistentCasingInFileNames": true,
"noEmit": true,
"esModuleInterop": true,
"module": "esnext",
"moduleResolution": "node",
"resolveJsonModule": true,
"isolatedModules": true,
"jsx": "react-jsx",
"baseUrl": "src",
"paths": {
"@/_": ["_"],
"@components/_": ["components/_"],
"@hooks/_": ["hooks/_"],
"@services/_": ["services/_"]
}
},
"include": ["src/**/*"],
"exclude": ["node_modules", "build"]
}
```

#### Создать TypeScript типы (src/types/):

- calculator.ts - типы для состояния калькулятора
- notion.ts - типы для интеграции с Notion
- instrument.ts - типы для инструментов

### ФАЗА 2: Вынос бизнес-логики (3-4 часа)

#### 1. Создать сервисы (src/services/):

```
// calculationService.ts
export class CalculationService {
static calculatePositionSize(params: CalculateParams): PositionResult { ... }
static calculateGrid(params: GridParams): GridResult { ... }
static calculateRisk(params: RiskParams): RiskResult { ... }
}

// validationService.ts
export class ValidationService {
static validateOrder(params: OrderParams): ValidationResult { ... }
static validateGrid(params: GridValidationParams): GridValidationResult { ... }
static validateTakeProfit(tpLevels: TPLevel[]): TPValidationResult { ... }
}
```

#### 2. Создать кастомные хуки (src/hooks/):

```
// useCalculatorState.ts
export const useCalculatorState = () => {
const [state, dispatch] = useReducer(calculatorReducer, initialState);
// Логика для localStorage, вычислений и т.д.
};

// useGridCalculations.ts
export const useGridCalculations = (state: CalculatorState) => {
return useMemo(() => calculateGridReport(state), [state]);
};

// useValidation.ts
export const useValidation = (state: CalculatorState) => {
return useMemo(() => ValidationService.validateOrder(state), [state]);
};
```

### ФАЗА 3: Разделение Calculator.jsx (4-5 часов)

#### 1. Создать компоненты-потомки в src/components/Calculator/:

DirectionSelector.tsx - выбор направления сделки
InstrumentInput.tsx - ввод инструмента с историей
PriceInputs.tsx - поля цен (вход, SL, TP)
GridSettingsPanel.tsx - настройки сетки
TakeProfitManager.tsx - управление TP уровнями
RiskManagementPanel.tsx - управление рисками
CalculationResults.tsx - отображение результатов
ExportActions.tsx - кнопки действий

#### 2. Рефакторить Calculator.tsx как контейнер:

```
const Calculator = () => {
const { state, dispatch, actions } = useCalculatorState();
const { errors, isValid } = useValidation(state);
const gridResults = useGridCalculations(state);

return (

<div className="calculator">
<DirectionSelector
        direction={state.direction}
        onChange={actions.setDirection}
      />
<InstrumentInput
        value={state.instrument}
        onChange={actions.setInstrument}
      />
{/_ ... другие компоненты _/}
</div>
);
};
```

### ФАЗА 4: Оптимизация производительности (2-3 часа)

#### 1. Добавить React.memo для всех подкомпонентов:

```
export const DirectionSelector = React.memo(({ direction, onChange }) => {
// Компонент
});
```

#### 2. Оптимизировать ререндеры через useCallback:

```
const handleInstrumentChange = useCallback(
(value: string) => dispatch({ type: 'SET_INSTRUMENT', value }),
[dispatch]
);
```

#### 3. Добавить useMemo для тяжелых вычислений:

```
const suggestions = useMemo(
() => getSuggestions(state.instrument),
[state.instrument]
);
```

#### 4. Реализовать дебаунс для инпутов:

```
const useDebounce = (value: string, delay: number) => {
const [debouncedValue, setDebouncedValue] = useState(value);

useEffect(() => {
const handler = setTimeout(() => setDebouncedValue(value), delay);
return () => clearTimeout(handler);
}, [value, delay]);

return debouncedValue;
};
```

### ФАЗА 5: Стили и CSS-модули (2-3 часа)

#### 1. Перейти на CSS-модули:

```
Calculator.module.css → Calculator.tsx
GridSettings.module.css → GridSettingsPanel.tsx
```

#### 2. Создать переиспользуемые UI компоненты:

- Button с вариантами (primary, secondary, danger)
- Input с поддержкой валидации
- Select с кастомными опциями
- Modal для диалоговых окон

### ФАЗА 6: Создание контекстов (1-2 часа)

#### TradingContext для общих данных:

```
const TradingContext = createContext<{
deposit: number;
riskSize: number;
instruments: Instrument[];
updateDeposit: (value: number) => void;
} | null>(null);

export const useTrading = () => {
const context = useContext(TradingContext);
if (!context) throw new Error('useTrading must be used within TradingProvider');
return context;
};
```

### ФАЗА 7: Тестирование и документация (2-3 часа)

#### Написать тесты для критической логики:

- Сервисы расчетов
- Валидация
- Редьюсеры
- Создать документацию компонентов:
- Storybook для UI компонентов
- JSDoc для функций и хуков

## 🚀 ПРИОРИТЕТЫ В РЕАЛИЗАЦИИ:

### ВЫСОКИЙ ПРИОРИТЕТ (делаем первыми):

✅ TypeScript базовая настройка - 1 час
✅ Разделение Calculator.jsx на подкомпоненты - 4 часа
✅ Вынос бизнес-логики в сервисы - 3 часа
✅ Оптимизация ререндеров - 2 часа

### СРЕДНИЙ ПРИОРИТЕТ:

✅ Создание кастомных хуков - 2 часа
✅ CSS-модули и стили - 2 часа
✅ UI компоненты общего назначения - 2 часа

### НИЗКИЙ ПРИОРИТЕТ:

✅ Контексты для глобального состояния - 1 час
✅ Тестирование - 2 часа
✅ Storybook документация - 2 часа

### ⚡ КЛЮЧЕВЫЕ ТОЧКИ ОПТИМИЗАЦИИ:

#### 1. Мемоизация вычислений:

// ВАЖНО: Расчет сетки только при изменении зависимостей

```
const gridResults = useMemo(() => {
if (!state.gridEnabled) return null;
return calculateGridReport({
deposit: state.deposit,
riskSize: state.riskSize,
entryPrice: state.entryPrice,
// ...
});
}, [
state.gridEnabled,
state.deposit,
state.riskSize,
state.entryPrice,
// ТОЛЬКО необходимые зависимости
]);
```

#### 2. Дебаунс для частых обновлений:

```
const [instrument, setInstrument] = useState('');
const debouncedInstrument = useDebounce(instrument, 300);

useEffect(() => {
if (debouncedInstrument) {
// Запрос к API или тяжелые вычисления
loadSuggestions(debouncedInstrument);
}
}, [debouncedInstrument]);
```

#### 3. Разделение состояния:

// НЕПРАВИЛЬНО: один большой объект состояния

```
const [state, setState] = useState(initialState);
```

// ПРАВИЛЬНО: раздельное состояние

```
const [instrument, setInstrument] = useState('');
const [direction, setDirection] = useState<'long' | 'short'>();
const [prices, setPrices] = useState({ entry: '', sl: '' });
// Или useReducer с разбивкой на суб-редьюсеры
```

#### 4. Ленивая загрузка компонентов:

```
const InstrumentSettingsDialog = lazy(() =>
import('./components/InstrumentSettingsDialog')
);

const GridSettingsPanel = lazy(() =>
import('./components/Calculator/GridSettingsPanel')
);
```

### 📊 ОЖИДАЕМЫЕ РЕЗУЛЬТАТЫ:

|-----------------------------|------------------------|--------------------------------|
|         Метрика             |     До оптимизации     |       После оптимизации        |
|-----------------------------|------------------------|--------------------------------|
| Размер бандла               |     ~500KB             |     ~350KB                     |
| Время первого рендера       |     2-3 сек            |     <1 сек                     |
| Рерандер при изменении поля |     650ms              |     <50ms                      |
| Сложность кода              | Высокая (650+ строк)   | Низкая (~100 строк/компонент)  |
| Поддерживаемость            |     Сложная            |     Простая                    |  
|-----------------------------|------------------------|--------------------------------|

## 📁 ПОЛНЫЙ СПИСОК ФАЙЛОВ, КОТОРЫЕ БУДЕМ СОЗДАВАТЬ/ПЕРЕИМЕНОВЫВАТЬ:
### УЖЕ СОЗДАНО/ПЕРЕИМЕНОВАНО (ФАЗА 1):
✅ tsconfig.json - в корне проекта
✅ src/react-app-env.d.ts - декларации для TypeScript
✅ src/types/base.ts - базовые типы
✅ src/types/instrument.ts - типы для инструментов
✅ src/App.tsx - переименован из App.jsx
✅ src/index.tsx - переименован из index.js

### СЛЕДУЮЩИЕ ДЛЯ ПЕРЕИМЕНОВАНИЯ (простые файлы):
src/components/Settings.jsx → Settings.tsx
src/components/History.jsx → History.tsx
src/components/Templates.jsx → Templates.tsx
src/components/Help.jsx → Help.tsx
src/App.test.js → App.test.tsx
src/reportWebVitals.js → reportWebVitals.ts
src/setupTests.js → setupTests.ts

### ЗАТЕМ (файлы с логикой):
src/services/notionService.js → notionService.ts
src/hooks/useInstrumentHistory.js → useInstrumentHistory.ts
src/reducers/calculatorReducer.js → calculatorReducer.ts
src/utils/calculateReport.js → calculateReport.ts
src/utils/validateCalculator.js → validateCalculator.ts

### ПОСЛЕДНИМИ (сложные файлы):
src/components/Calculator.jsx → Calculator.tsx
src/components/InstrumentSettingsDialog.jsx → InstrumentSettingsDialog.tsx

### НОВЫЕ ФАЙЛЫ ДЛЯ СОЗДАНИЯ (в рамках оптимизации):
src/types/calculator.ts - типы для калькулятора
src/types/notion.ts - типы для Notion
src/services/calculationService.ts - сервис расчетов
src/services/validationService.ts - сервис валидации
src/services/exportService.ts - сервис экспорта
src/utils/formatters.ts - форматирование данных
src/utils/constants.ts - константы проекта
src/utils/helpers.ts - вспомогательные функции
