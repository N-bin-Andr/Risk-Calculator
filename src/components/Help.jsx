// src/components/Calculator/Help.jsx

import React from 'react';
import '../styles/styles.css';

const Help = () => {
    return (
        <div className="section-content">
            <h2>📚 Справка и помощь</h2>

            <div className="help-sections">
                {/* Секция с горячими клавишами */}
                <div className="help-section">
                    <h3>⚡ Горячие клавиши в калькуляторе</h3>
                    <div className="hotkeys-info" style={{
                        backgroundColor: '#fff3cd',
                        borderLeft: '4px solid #ffc107',
                        padding: '15px',
                        borderRadius: '6px',
                        marginBottom: '20px'
                    }}>
                        <p>
                            <strong>Горячие клавиши для быстрой работы:</strong>
                        </p>
                        <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
                            <li><strong>Ctrl + Enter</strong> - Рассчитать</li>
                            <li><strong>Ctrl + S</strong> - Отправить в Notion</li>
                            <li><strong>Ctrl + R</strong> - Экспорт в изображение</li>
                            <li><strong>Ctrl + G</strong> - Включить/выключить сетку</li>
                            <li><strong>Esc</strong> - Закрыть подсказки</li>
                        </ul>
                    </div>

                    <h4>💡 Подсказки по использованию:</h4>
                    <ol style={{ paddingLeft: '20px' }}>
                        <li>Заполните все обязательные поля (инструмент, направление, цены)</li>
                        <li>Используйте горячие клавиши для ускорения работы</li>
                        <li>Сохраняйте часто используемые настройки как шаблоны</li>
                    </ol>
                </div>

                {/* Раздел "Основы работы" */}
                <div className="help-section">
                    <h3>📊 Основы работы с калькулятором</h3>
                    <p><strong>Шаг 1:</strong> Выберите направление сделки (Long или Short)</p>
                    <p><strong>Шаг 2:</strong> Введите инструмент (например, BTCUSDT)</p>
                    <p><strong>Шаг 3:</strong> Укажите депозит и процент риска</p>
                    <p><strong>Шаг 4:</strong> Введите цену входа и Stop Loss</p>
                    <p><strong>Шаг 5:</strong> Добавьте уровни Take Profit (опционально)</p>
                    <p><strong>Шаг 6:</strong> Нажмите "Рассчитать" или используйте Ctrl+Enter</p>
                </div>

                {/* Раздел "Настройки инструментов" */}
                <div className="help-section">
                    <h3>⚙️ Настройки инструментов</h3>
                    <p>Для точного расчета пунктов (пипсов) важно настроить шаг цены:</p>
                    <ul style={{ paddingLeft: '20px' }}>
                        <li><strong>Криптовалюты:</strong> 0.01 (1 цент)</li>
                        <li><strong>Форекс пары:</strong> 0.0001 (1 пипс)</li>
                        <li><strong>Акции:</strong> 0.01 (1 цент)</li>
                        <li><strong>Индексы:</strong> 0.1 (10 центов)</li>
                    </ul>
                    <p>Шаг цены автоматически сохраняется для часто используемых инструментов.</p>
                </div>

                {/* Раздел "Сеточный вход" */}
                <div className="help-section">
                    <h3>📈 Сеточный вход</h3>
                    <p>Функция сеточного входа позволяет распределить позицию на несколько ордеров:</p>
                    <ul style={{ paddingLeft: '20px' }}>
                        <li><strong>Количество ордеров:</strong> от 1 до 6</li>
                        <li><strong>Распределение %:</strong> заполняйте по порядку, последнее поле рассчитывается автоматически</li>
                        <li><strong>Быстрые пресеты:</strong> "Равномерно", "Убывающее"</li>
                        <li><strong>Горячая клавиша:</strong> Ctrl+G для быстрого включения/выключения</li>
                    </ul>
                </div>

                {/* Раздел "Интеграция с Notion" */}
                <div className="help-section">
                    <h3>📤 Интеграция с Notion</h3>
                    <p>Для отправки отчетов в Notion необходимо:</p>
                    <ol style={{ paddingLeft: '20px' }}>
                        <li>Создать базу данных в Notion</li>
                        <li>Настроить переменные окружения:
                            <ul>
                                <li>REACT_APP_NOTION_TOKEN</li>
                                <li>REACT_APP_NOTION_DATABASE_ID</li>
                                <li>REACT_APP_NOTION_BACKTEST_DB</li>
                            </ul>
                        </li>
                        <li>Выполнить расчет в калькуляторе</li>
                        <li>Нажать "Отправить в Notion" или использовать Ctrl+S</li>
                    </ol>
                </div>

                {/* Раздел "Частые вопросы" */}
                <div className="help-section">
                    <h3>❓ Частые вопросы</h3>

                    <div className="faq-item" style={{ marginBottom: '15px' }}>
                        <h4>Q: Почему не работает отправка в Notion?</h4>
                        <p>A: Проверьте настройки переменных окружения и убедитесь, что база данных существует и доступна.</p>
                    </div>

                    <div className="faq-item" style={{ marginBottom: '15px' }}>
                        <h4>Q: Как сохранить шаг цены для инструмента?</h4>
                        <p>A: Нажмите кнопку ⚙️ рядом с полем ввода инструмента и укажите шаг цены.</p>
                    </div>

                    <div className="faq-item" style={{ marginBottom: '15px' }}>
                        <h4>Q: Можно ли использовать несколько Take Profit уровней?</h4>
                        <p>A: Да, можно добавить до 5 уровней TP, нажав кнопку "Добавить TP".</p>
                    </div>

                    <div className="faq-item">
                        <h4>Q: Где хранится история расчетов?</h4>
                        <p>A: Все отправленные в Notion отчеты сохраняются там. Локальная история инструментов доступна в разделе "История инструментов".</p>
                    </div>
                </div>

                {/* Раздел "Контакты" */}
                <div className="help-section">
                    <h3>📞 Контакты и поддержка</h3>
                    <p>Если у вас возникли проблемы или есть предложения по улучшению:</p>
                    <ul style={{ paddingLeft: '20px' }}>
                        <li>Проверьте консоль браузера (F12) на наличие ошибок</li>
                        <li>Убедитесь, что все переменные окружения настроены корректно</li>
                        <li>Обновите страницу при возникновении странного поведения</li>
                    </ul>
                    <p style={{ marginTop: '10px', fontStyle: 'italic' }}>
                        Приложение разработано для трейдеров. Для максимальной точности всегда проверяйте расчеты самостоятельно.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Help;
