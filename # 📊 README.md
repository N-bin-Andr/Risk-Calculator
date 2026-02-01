# 📊 Risk Calculator - Калькулятор рисков для трейдинга

Профессиональный калькулятор для расчета параметров торговых позиций с поддержкой сеточного входа и управлением рисками. Поддерживает различные типы инструментов (Форекс, Акции, Крипто, Фьючерсы).

## 🏗️ СТРУКТУРА ПРОЕКТА

src/
├── components/
│ ├── Calculator/ # Компоненты калькулятора (будут созданы)
│ │ ├── Calculator.jsx # Главный контейнер
│ │ ├── InstrumentInput.jsx
│ │ ├── GridSettingsPanel.jsx
│ │ ├── TakeProfitManager.jsx
│ │ ├── RiskManagementPanel.jsx
│ │ ├── CalculationResults.jsx
│ │ ├── ExportActions.jsx
│ │ ├── InstrumentTypeSelector.jsx
│ │ └── index.js
│ │
│ ├── InstrumentSettingsDialog/
│ │ └── InstrumentSettingsDialog.jsx
│ │
│ ├── Settings.jsx
│ ├── History.jsx
│ ├── Templates.jsx
│ └── Help.jsx
│
├── hooks/
│ ├── useInstrumentHistory.js
│ ├── useDebounce.js # Будет создан
│ ├── useLocalStorage.js # Будет создан
│ └── useCalculator.js # Будет создан
│
├── reducers/
│ └── calculatorReducer.js
│
├── services/
│ └── notionService.js
│
├── calculations/ # НОВАЯ ПАПКА - будет создана
│ ├── index.js
│ ├── calculators/
│ │ ├── ForexCalculator.js
│ │ ├── StockCalculator.js
│ │ ├── CryptoCalculator.js
│ │ ├── FuturesCalculator.js
│ │ └── CFDsCalculator.js
│ │
│ ├── utils/
│ │ ├── lotCalculations.js
│ │ ├── marginCalculations.js
│ │ ├── commissionCalculations.js
│ │ └── riskCalculations.js
│ │
│ └── types/
│ ├── instrumentTypes.js
│ ├── forexPairs.js
│ ├── cryptoPairs.js
│ └── stockSymbols.js
│
├── utils/
│ ├── calculateReport.js
│ ├── validateCalculator.js
│ ├── gridValidation.js
│ ├── notionService.js # Будет перемещен из services/
│ ├── formatters.js # Будет создан
│ ├── validators.js # Будет создан
│ └── helpers.js # Будет создан
│
├── styles/
│ ├── globals.css # Будет создан из styles.css
│ ├── components/ # Будет создана
│ │ ├── Calculator.css
│ │ ├── GridSettings.css
│ │ ├── TakeProfitManager.css
│ │ ├── RiskManagement.css
│ │ ├── InstrumentInput.css
│ │ └── CalculationResults.css
│ │
│ ├── layout/ # Будет создана
│ │ ├── header.css
│ │ ├── footer.css
│ │ └── forms.css
│ │
│ └── themes/ # Будет создана
│ ├── light.css
│ └── dark.css
│
├── App.jsx
├── App.test.js
├── index.js
├── reportWebVitals.js
└── setupTests.js

📋 ТЕКУЩИЙ СТАТУС ПРОЕКТА
✅ ЧТО УЖЕ СДЕЛАНО:
ФАЗА 0: Подготовка (ЗАВЕРШЕНО)
Создана ветка refactor/calculator-split

Создан план рефакторинга (REFACTOR_PLAN.md)

Создана резервная копия Calculator.jsx

Определена окончательная структура проекта

СУЩЕСТВУЮЩИЕ ФАЙЛЫ (рабочие):
components/Calculator.jsx - монолитный компонент (650+ строк)

components/InstrumentSettingsDialog.jsx - диалог настроек инструмента

hooks/useInstrumentHistory.js - хук истории инструментов

reducers/calculatorReducer.js - управление состоянием

services/notionService.js - интеграция с Notion API

utils/calculateReport.js - логика расчетов

utils/validateCalculator.js - валидация полей

utils/gridValidation.js - валидация сетки

styles/styles.css - все стили в одном файле

🚧 ЧТО НУЖНО СДЕЛАТЬ:
ФАЗА 1: Разделение Calculator.jsx на компоненты (ПРИОРИТЕТ)
Шаг 1: GridSettingsPanel.jsx

Создать файл: components/Calculator/GridSettingsPanel.jsx

Создать стили: styles/components/GridSettings.css

Интегрировать в Calculator.jsx

Протестировать: включение/выключение сетки, распределение процентов

Шаг 2: TakeProfitManager.jsx

Создать файл: components/Calculator/TakeProfitManager.jsx

Создать стили: styles/components/TakeProfitManager.css

Интегрировать в Calculator.jsx

Протестировать: добавление/удаление TP уровней

Шаг 3: RiskManagementPanel.jsx

Создать файл: components/Calculator/RiskManagementPanel.jsx

Создать стили: styles/components/RiskManagement.css

Интегрировать в Calculator.jsx

Протестировать: ввод депозита, риска, SL

Шаг 4: CalculationResults.jsx

Создать файл: components/Calculator/CalculationResults.jsx

Создать стили: styles/components/CalculationResults.css

Интегрировать в Calculator.jsx

Протестировать: отображение результатов, статус Notion

Шаг 5: ExportActions.jsx

Создать файл: components/Calculator/ExportActions.jsx

Создать стили: styles/components/ExportActions.css

Интегрировать в Calculator.jsx

Протестировать: кнопки "Рассчитать", "Отправить в Notion", "Экспорт"

Шаг 6: InstrumentInput.jsx

Создать файл: components/Calculator/InstrumentInput.jsx

Создать стили: styles/components/InstrumentInput.css

Интегрировать в Calculator.jsx

Протестировать: ввод инструмента, история, настройки

Шаг 7: InstrumentTypeSelector.jsx

Создать файл: components/Calculator/InstrumentTypeSelector.jsx

Создать стили: styles/components/InstrumentTypeSelector.css

Интегрировать в Calculator.jsx

Протестировать: выбор типа инструмента

Шаг 8: Создать index.js для компонентов

Создать файл: components/Calculator/index.js

Экспортировать все компоненты калькулятора

ФАЗА 2: Создание структуры calculations/ (для разных типов инструментов)
Шаг 1: Базовые файлы

Создать папку: calculations/

Создать: calculations/index.js (фасад)

Создать: calculations/types/instrumentTypes.js

Создать: calculations/types/forexPairs.js

Создать: calculations/types/cryptoPairs.js

Создать: calculations/types/stockSymbols.js

Шаг 2: Калькуляторы

Создать: calculations/calculators/ForexCalculator.js

Создать: calculations/calculators/StockCalculator.js

Создать: calculations/calculators/CryptoCalculator.js

Создать: calculations/calculators/FuturesCalculator.js

Создать: calculations/calculators/CFDsCalculator.js

Шаг 3: Утилиты расчетов

Создать: calculations/utils/lotCalculations.js

Создать: calculations/utils/marginCalculations.js

Создать: calculations/utils/commissionCalculations.js

Создать: calculations/utils/riskCalculations.js

ФАЗА 3: Создание хуков
Шаг 1: useDebounce.js

Создать: hooks/useDebounce.js

Шаг 2: useLocalStorage.js

Создать: hooks/useLocalStorage.js

Шаг 3: useCalculator.js

Создать: hooks/useCalculator.js

ФАЗА 4: Реорганизация utils/
Шаг 1: Перемещение notionService.js

Переместить: services/notionService.js → utils/notionService.js

Обновить импорты

Шаг 2: Создание новых утилит

Создать: utils/formatters.js

Создать: utils/validators.js

Создать: utils/helpers.js

ФАЗА 5: Реорганизация стилей
Шаг 1: Разделение styles.css

Создать: styles/globals.css (глобальные стили)

Создать: styles/components/ (стили компонентов)

Создать: styles/layout/ (стили макета)

Создать: styles/themes/ (темы)

Шаг 2: Обновление импортов

Обновить импорты во всех компонентах

ФАЗА 6: Оптимизация
Шаг 1: React.memo

Добавить React.memo для всех компонентов

Шаг 2: useCallback/useMemo

Оптимизировать обработчики и вычисления

Шаг 3: Ленивая загрузка

Реализовать lazy loading для тяжелых компонентов

🎯 ТЕКУЩАЯ ЗАДАЧА (НАЧАТЬ С ЭТОГО)
СЕЙЧАС ВЫПОЛНЯЕМ: ФАЗА 1, Шаг 1 - GridSettingsPanel.jsx
Что нужно сделать:

Создать папку components/Calculator/

Создать файл components/Calculator/GridSettingsPanel.jsx

Создать файл styles/components/GridSettings.css

Скопировать код сетки из Calculator.jsx в новый компонент

Интегрировать GridSettingsPanel в Calculator.jsx

Протестировать работу

Критерии успеха:

✅ Сетка включается/выключается

✅ Можно менять количество ордеров

✅ Заполняется распределение процентов

✅ Последнее поле рассчитывается автоматически

✅ Быстрые пресеты работают

✅ Ошибки валидации отображаются

## 🔧 КАК РАБОТАТЬ С ПРОЕКТОМ
### Запуск проекта:
npm start

### Создание компонента:
#### 1. Создать файл компонента
touch src/components/Calculator/НовыйКомпонент.jsx

#### 2. Создать файл стилей
touch src/styles/components/НовыйКомпонент.css

#### 3. Протестировать
npm start
Тестирование после каждого изменения:
Проверить консоль браузера на ошибки

Проверить основные функции калькулятора:

Ввод инструмента

Выбор направления

Ввод цены входа и SL

Работа сетки (если применимо)

Расчет результатов

Отправка в Notion

Экспорт изображений

### Коммиты:
#### После каждого успешного шага
git add .
git commit -m "ШАГ [номер]: [краткое описание]"
#### Пример: git commit -m "ШАГ 1.1: Создан GridSettingsPanel.jsx"f

📝 ПРИМЕЧАНИЯ ДЛЯ ПРОДОЛЖЕНИЯ РАБОТЫ
При переходе в новый диалог:
Загрузить этот README.md

Загрузить текущие файлы проекта

Спросить: "На каком шаге остановились?"

Продолжить с текущего шага

Архитектурные решения:
НЕ используем TypeScript - только чистый React/JSX

НЕ используем Context API - передаем пропсы напрямую

НЕ создаем UI-кит - используем существующие стили

ДЕЛАЕМ по одному шагу - тестируем после каждого

Важные зависимости:
html2canvas - для экспорта изображений

localStorage - для сохранения истории и настроек

Notion API - для отправки отчетов

🐛 ИЗВЕСТНЫЕ ПРОБЛЕМЫ (если возникнут)
Ошибки импорта - проверять пути к файлам

Стили не применяются - проверять импорты CSS

Состояние не обновляется - проверять пропсы и редьюсер

Горячие клавиши не работают - проверять useEffect в Calculator.jsx

📞 КОНТАКТНАЯ ИНФОРМАЦИЯ (для ИИ-помощника)
Текущий помощник: DeepSeek
Ветка: refactor/calculator-split
Последнее действие: Определение структуры проекта
Следующее действие: Создание GridSettingsPanel.jsx

