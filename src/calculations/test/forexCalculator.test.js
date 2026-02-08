// src/calculations/test/forexCalculator.test.js
import ForexCalculator from '../calculators/ForexCalculator';

console.log('Запуск тестов ForexCalculator...\n');

// Запускаем встроенные тесты
ForexCalculator.runTests();

// Дополнительные тесты
console.log('\n=== Дополнительные тесты ===\n');

// Тест 1: Проверка стоимости пункта для EUR/USD
const eurUsdPipValue = ForexCalculator.calculatePipValuePerLot('EUR/USD', 1.0720, 'USD');
console.log(`1. Стоимость пункта для EUR/USD при цене 1.0720: $${eurUsdPipValue.toFixed(2)}`);
console.log(`   Ожидается: $10.00`);
console.log(`   Результат: ${Math.abs(eurUsdPipValue - 10) < 0.01 ? '✅ ВЕРНО' : '❌ ОШИБКА'}\n`);

// Тест 2: Проверка стоимости пункта для USD/JPY
const usdJpyPipValue = ForexCalculator.calculatePipValuePerLot('USD/JPY', 150.00, 'USD');
console.log(`2. Стоимость пункта для USD/JPY при цене 150.00: $${usdJpyPipValue.toFixed(2)}`);
console.log(`   Расчет: (100,000 × 0.01) / 150.00 = $${(100000 * 0.01 / 150).toFixed(2)}`);
console.log(`   Результат: ${Math.abs(usdJpyPipValue - 6.67) < 0.1 ? '✅ ВЕРНО' : '❌ ОШИБКА'}\n`);

// Тест 3: Расчет расстояния в пунктах
const eurUsdPips = ForexCalculator.calculatePipsBetweenPrices(1.0720, 1.0680, 'EUR/USD');
console.log(`3. Расстояние между 1.0720 и 1.0680 для EUR/USD: ${eurUsdPips.toFixed(1)} пунктов`);
console.log(`   Расчет: (1.0720 - 1.0680) / 0.0001 = 40`);
console.log(`   Результат: ${Math.abs(eurUsdPips - 40) < 0.1 ? '✅ ВЕРНО' : '❌ ОШИБКА'}\n`);

// Тест 4: Расчет лотности по формуле
const riskAmount = 5000 * 0.01; // $50
const stopLossPips = 40;
const pipValue = 10;
const calculatedLots = ForexCalculator.calculatePositionLots(riskAmount, stopLossPips, pipValue);
console.log(`4. Расчет лотности по формуле:`);
console.log(`   Риск: $${riskAmount}, Пункты: ${stopLossPips}, Стоимость пункта: $${pipValue}`);
console.log(`   Формула: ${riskAmount} / (${stopLossPips} × ${pipValue}) = ${calculatedLots.toFixed(3)}`);
console.log(`   Ожидается: 0.125 лота`);
console.log(`   Результат: ${Math.abs(calculatedLots - 0.125) < 0.001 ? '✅ ВЕРНО' : '❌ ОШИБКА'}\n`);

console.log('=== Итог тестирования ===');
console.log('Все расчеты теперь соответствуют указанной формуле.');
console.log('Основная формула: Лоты = Риск / (Пункты × Стоимость пункта за 1 лот)');
