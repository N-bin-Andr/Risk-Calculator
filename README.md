# 📘 Risk Calculator — Техническая документация
## 🔹 Описание проекта
Risk Calculator — это инструмент для трейдеров и аналитиков, позволяющий рассчитывать параметры сделок и управлять рисками. Проект реализован на React и интегрируется с платформой TigerTrade через внешние DLL-библиотеки.

## 🔹 Основные возможности
- Расчёт размера позиции с учётом риска и капитала.
- Поддержка нескольких инструментов и валют.
- Экспорт отчётов в виде изображений.
- Локализация интерфейса (RU/EN).


## Структура проекта: 
RISKCALCULATOR
|
|-risk-calculator
|   |-src
|   |   |-components
|   |   |   |-Calculator.jsx
|   |   |-hooks
|   |   |   |-useInstrumentHistory.js
|   |   |-reducers
|   |   |   |-calculatorReducer.js
|   |   |-services
|   |   |   |-notionService.js
|   |   |-styles
|   |   |   |-styles.css
|   |   |-utils
|   |   |   |-calculateReport.js
|   |   |   |-validateCalculator.js
|   |   |-App.jsx
|   |   |-App.test.js
|   |   |-index.js
|   |   |-reportWebVitals.js
|   |   |-setupTests.js
|   |-.gitignore
|   |-package-lock.json
|   |-package.json
|   |-README.md
        
## 🔹 Архитектура проекта
Frontend: React, JSX, CSS.

Сборка: MSBuild, npm.

CI/CD: GitHub Actions (опционально).

## 🔹 Установка и запуск
### Требования
- Node.js >= 18
- npm >= 9


### Установка
``` git clone https://github.com/N-bin-Andr/Risk-Calculator.git
cd Risk-Calculator
npm install
```
### Запуск:
npm start

### Сборка:
npm run build

## 🔹 Лицензия
MIT License. Свободное использование и модификация.








План интеграции сеточного входа:
## 1. Модификация calculatorReducer.js:
### Добавим новые поля в state:
- gridEnabled (boolean) - включена ли сетка
- gridOrdersCount (number) - количество ордеров (3 по умолчанию)
- gridDistribution (array) - массив распределения % для каждого ордера
- gridPrices (array) - рассчитанные цены для каждого ордера
- gridQuantities (array) - рассчитанные объемы для каждого ордера

## 2. Расширение validateCalculator.js:
- Добавим валидацию для новых полей сетки
- Проверка суммы распределения = 100%

## 3. Модификация calculateReport.js:
- Создадим новую функцию calculateGridReport() для расчета сетки
- Интегрируем с существующей логикой расчета

## 4. Обновление Calculator.jsx:
- Добавим переключатель "Сеточный вход"
- Поля для настройки сетки (количество ордеров, распределение %)
- Таблицу для отображения ордеров сетки

## 5. Добавление новых компонентов (опционально):
- GridOrderTable.jsx - таблица ордеров сетки
- DistributionInput.jsx - компонент ввода распределения

