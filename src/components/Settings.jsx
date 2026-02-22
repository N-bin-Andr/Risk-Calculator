// src/components/Calculator/Settings.jsx
import React from 'react';
import '../styles/styles.css';

const Settings = () => {
    return (
        <div className="section-content">
            <h2>⚙️ Настройки приложения</h2>

            <div className="settings-grid">
                <div className="setting-group">
                    <h3>Настройки Notion</h3>

                    <div className="setting-item">
                        <label htmlFor="notionToken">Notion Token:</label>
                        <input
                            type="password"
                            id="notionToken"
                            placeholder="Введите ваш токен Notion"
                            value={process.env.REACT_APP_NOTION_TOKEN ? '••••••••••' : ''}
                            readOnly
                        />
                    </div>

                    <div className="setting-item">
                        <label htmlFor="notionDbId">Database ID (основной):</label>
                        <input
                            type="text"
                            id="notionDbId"
                            placeholder="Введите ID основной базы"
                            value={process.env.REACT_APP_NOTION_DATABASE_ID || ''}
                            readOnly
                        />
                    </div>

                    <div className="setting-item">
                        <label htmlFor="notionBacktestDb">Database ID (бэктест):</label>
                        <input
                            type="text"
                            id="notionBacktestDb"
                            placeholder="Введите ID базы для бэктеста"
                            value={process.env.REACT_APP_NOTION_BACKTEST_DB || ''}
                            readOnly
                        />
                    </div>

                    <div className="info-note">
                        <p>⚠️ Настройки Notion задаются через переменные окружения в файле .env</p>
                        <p>Создайте файл .env.local и добавьте:</p>
                        <pre style={{ fontSize: '12px', background: '#f8f9fa', padding: '10px', borderRadius: '4px' }}>
REACT_APP_NOTION_TOKEN=your_token_here<br/>
REACT_APP_NOTION_DATABASE_ID=your_database_id_here<br/>
REACT_APP_NOTION_BACKTEST_DB=your_backtest_db_id_here
                        </pre>
                    </div>
                </div>

                <div className="setting-group">
                    <h3>Общие настройки</h3>

                    <div className="setting-item">
                        <label htmlFor="defaultDeposit">Депозит по умолчанию (USDT):</label>
                        <input
                            type="number"
                            id="defaultDeposit"
                            placeholder="1000"
                        />
                    </div>

                    <div className="setting-item">
                        <label htmlFor="defaultRisk">Риск по умолчанию (%):</label>
                        <input
                            type="number"
                            id="defaultRisk"
                            placeholder="2"
                            min="0.01"
                            max="100"
                            step="0.01"
                        />
                    </div>

                    <div className="setting-item">
                        <label htmlFor="priceStepDefault">Шаг цены по умолчанию:</label>
                        <input
                            type="number"
                            id="priceStepDefault"
                            placeholder="0.01"
                            min="0.000001"
                            step="0.000001"
                        />
                    </div>
                </div>

                <div className="setting-group">
                    <h3>Настройки интерфейса</h3>

                    <div className="setting-item">
                        <label htmlFor="themeSelect">Тема оформления:</label>
                        <select id="themeSelect">
                            <option value="light">Светлая</option>
                            <option value="dark">Темная</option>
                            <option value="auto">Авто (системная)</option>
                        </select>
                    </div>

                    <div className="setting-item">
                        <label htmlFor="languageSelect">Язык:</label>
                        <select id="languageSelect">
                            <option value="ru">Русский</option>
                            <option value="en">English</option>
                        </select>
                    </div>

                    <div className="setting-item">
                        <label htmlFor="gridOrdersDefault">Ордеров в сетке по умолчанию:</label>
                        <input
                            type="number"
                            id="gridOrdersDefault"
                            placeholder="3"
                            min="1"
                            max="6"
                        />
                    </div>
                </div>

                <div className="setting-group">
                    <h3>Управление данными</h3>

                    <div className="setting-item">
                        <label>История инструментов:</label>
                        <div className="action-buttons">
                            <button className="btn btn-secondary">Экспорт</button>
                            <button className="btn btn-danger">Очистить</button>
                        </div>
                    </div>

                    <div className="setting-item">
                        <label>История расчетов:</label>
                        <div className="action-buttons">
                            <button className="btn btn-secondary">Экспорт</button>
                            <button className="btn btn-danger">Очистить</button>
                        </div>
                    </div>

                    <div className="setting-item">
                        <label>Шаблоны сделок:</label>
                        <div className="action-buttons">
                            <button className="btn btn-secondary">Экспорт</button>
                            <button className="btn btn-danger">Очистить</button>
                        </div>
                    </div>

                    <div className="danger-zone">
                        <h4 style={{ color: '#dc3545' }}>⚠️ Опасная зона</h4>
                        <button className="btn btn-danger" style={{ width: '100%', marginTop: '10px' }}>
                            Сбросить все настройки
                        </button>
                        <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                            Это действие нельзя отменить. Будут удалены все настройки и данные.
                        </p>
                    </div>
                </div>
            </div>

            <div className="settings-footer" style={{ marginTop: '30px', textAlign: 'center' }}>
                <button className="btn btn-primary" style={{ padding: '10px 30px' }}>
                    💾 Сохранить настройки
                </button>
                <p style={{ marginTop: '10px', fontSize: '13px', color: '#666' }}>
                    Большинство настроек сохраняются автоматически
                </p>
            </div>
        </div>
    );
};

export default Settings;
