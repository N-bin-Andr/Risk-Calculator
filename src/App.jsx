import React, { useState } from 'react';
import Calculator from './components/Calculator';
import './styles/styles.css';

const App = () => {
    const [activeSection, setActiveSection] = useState('calculator');
    const [menuOpen, setMenuOpen] = useState(false);
    const [instrumentHistory, setInstrumentHistory] = useState(() => {
        try {
            const saved = JSON.parse(localStorage.getItem('instrumentHistory') || '[]');
            return Array.isArray(saved) ? saved : [];
        } catch (error) {
            console.error('Ошибка загрузки истории инструментов:', error);
            return [];
        }
    });

    const menuItems = [
        { id: 'calculator', label: '🔄 Калькулятор', component: <Calculator /> },
        { id: 'instruments', label: '📚 История инструментов', component: <InstrumentHistory history={instrumentHistory} setInstrumentHistory={setInstrumentHistory} /> },
        { id: 'settings', label: '⚙️ Настройки', component: <Settings /> },
        { id: 'history', label: '📊 История расчетов', component: <CalculationHistory /> },
        { id: 'templates', label: '📋 Шаблоны сеток', component: <GridTemplates /> },
        { id: 'help', label: '❓ Помощь', component: <Help /> },
    ];

    const Header = () => (
        <header className="app-header">
            <div className="header-content">
                <div className="logo">
                    <h1>📊 Risk Calculator Pro</h1>
                    <p className="tagline">Профессиональный калькулятор рисков для трейдинга</p>
                </div>

                <nav className="main-nav">
                    <button
                        className={`menu-toggle ${menuOpen ? 'active' : ''}`}
                        onClick={() => setMenuOpen(!menuOpen)}
                    >
                        ☰
                    </button>

                    <ul className={`nav-list ${menuOpen ? 'open' : ''}`}>
                        {menuItems.map(item => (
                            <li key={item.id}>
                                <button
                                    className={`nav-link ${activeSection === item.id ? 'active' : ''}`}
                                    onClick={() => {
                                        setActiveSection(item.id);
                                        setMenuOpen(false);
                                    }}
                                >
                                    {item.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="user-info">
                    <span className="version">v1.3.0</span>
                    <button className="theme-toggle">🌙</button>
                </div>
            </div>
        </header>
    );

    const Footer = () => (
        <footer className="app-footer">
            <div className="footer-content">
                <div className="footer-section">
                    <h4>Risk Calculator Pro</h4>
                    <p>Профессиональный инструмент для расчета торговых позиций</p>
                </div>

                <div className="footer-section">
                    <h4>Функции</h4>
                    <ul>
                        <li>📈 Калькулятор рисков</li>
                        <li>📚 История инструментов</li>
                        <li>📊 Сеточный вход</li>
                        <li>📐 Настройка шага цены</li>
                    </ul>
                </div>

                <div className="footer-section">
                    <h4>Поддержка</h4>
                    <p>По вопросам и предложениям:</p>
                    <p>📧 support@riskcalc.pro</p>
                    <p className="copyright">© 2024 Risk Calculator Pro. Все права защищены.</p>
                </div>
            </div>
        </footer>
    );

    // Компонент для истории инструментов
    function InstrumentHistory({ history, setInstrumentHistory }) {
        const [selectedInstruments, setSelectedInstruments] = useState([]);
        const [searchTerm, setSearchTerm] = useState('');
        const [editingInstrument, setEditingInstrument] = useState(null);
        const [priceStepInput, setPriceStepInput] = useState('');

        // Фильтрация истории по поисковому запросу
        const filteredHistory = history.filter(item =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

        const toggleInstrumentSelection = (name) => {
            setSelectedInstruments(prev =>
                prev.includes(name)
                    ? prev.filter(item => item !== name)
                    : [...prev, name]
            );
        };

        const toggleSelectAll = () => {
            if (selectedInstruments.length === filteredHistory.length) {
                setSelectedInstruments([]);
            } else {
                setSelectedInstruments(filteredHistory.map(item => item.name));
            }
        };

        const handleDeleteSelected = () => {
            const updatedHistory = history.filter(item => !selectedInstruments.includes(item.name));
            setInstrumentHistory(updatedHistory);
            localStorage.setItem('instrumentHistory', JSON.stringify(updatedHistory));
            setSelectedInstruments([]);
        };

        const handleUpdatePriceStep = (name, priceStep) => {
            const updatedHistory = history.map(item => {
                if (item.name === name) {
                    return {
                        ...item,
                        priceStep: priceStep !== null && priceStep !== '' ? parseFloat(priceStep) : null,
                        lastUpdated: new Date().toISOString()
                    };
                }
                return item;
            });

            setInstrumentHistory(updatedHistory);
            localStorage.setItem('instrumentHistory', JSON.stringify(updatedHistory));
            setEditingInstrument(null);
            setPriceStepInput('');
        };

        const startEditPriceStep = (instrument) => {
            setEditingInstrument(instrument.name);
            setPriceStepInput(instrument.priceStep !== null && instrument.priceStep !== undefined ? instrument.priceStep.toString() : '');
        };

        const cancelEdit = () => {
            setEditingInstrument(null);
            setPriceStepInput('');
        };

        const getDefaultPriceStep = (instrumentName) => {
            const lowerName = instrumentName.toLowerCase();

            if (lowerName.includes('btc') || lowerName.includes('eth') ||
                lowerName.includes('usdt') || lowerName.includes('bnb')) {
                return 0.01;
            }

            if (lowerName.includes('.mx') || lowerName.includes('.me')) {
                return 0.01;
            }

            if (lowerName.includes('usd') || lowerName.includes('eur') ||
                lowerName.includes('gbp') || lowerName.includes('jpy')) {
                return 0.0001;
            }

            return 0.01;
        };

        const exportHistoryAsJSON = () => {
            if (history.length === 0) {
                alert('История инструментов пуста');
                return;
            }

            const data = {
                exportedAt: new Date().toISOString(),
                totalInstruments: history.length,
                version: '1.3.0',
                instruments: history.map(item => ({
                    name: item.name,
                    count: item.count,
                    priceStep: item.priceStep,
                    createdAt: item.createdAt || new Date().toISOString(),
                    lastUsed: item.lastUsed || new Date().toISOString(),
                    lastUpdated: item.lastUpdated || null
                }))
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], {
                type: 'application/json;charset=utf-8'
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `instrument-history-${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        };

        const clearHistory = () => {
            if (window.confirm('Вы уверены, что хотите очистить всю историю инструментов?')) {
                setInstrumentHistory([]);
                localStorage.removeItem('instrumentHistory');
                setSelectedInstruments([]);
            }
        };

        const formatPriceStep = (priceStep, instrumentName) => {
            if (priceStep === null || priceStep === undefined || priceStep === '') {
                return (
                    <span className="default-price-step" title="Используется значение по умолчанию">
                        {getDefaultPriceStep(instrumentName)} (по умолчанию)
                    </span>
                );
            }

            return (
                <span className="price-step-cell" title={`Шаг цены: ${priceStep} USDT`}>
                    {priceStep} USDT
                </span>
            );
        };

        return (
            <div className="section-content">
                <h2>📚 История инструментов</h2>

                <div className="history-controls">
                    <div className="search-box">
                        <input
                            type="text"
                            placeholder="🔍 Поиск инструмента..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                    </div>

                    <div className="action-buttons">
                        <button
                            onClick={exportHistoryAsJSON}
                            disabled={history.length === 0}
                            className="btn"
                        >
                            📥 Экспорт в JSON
                        </button>
                        <button
                            onClick={clearHistory}
                            disabled={history.length === 0}
                            className="btn btn-danger"
                        >
                            🗑️ Очистить всю историю
                        </button>
                    </div>
                </div>

                {history.length === 0 ? (
                    <div className="empty-state">
                        <p>📝 История инструментов пуста</p>
                        <p className="hint">Инструменты будут автоматически добавляться при расчетах в калькуляторе</p>
                    </div>
                ) : (
                    <>
                        <div className="selection-controls">
                            <label className="select-all-checkbox">
                                <input
                                    type="checkbox"
                                    checked={selectedInstruments.length === filteredHistory.length && filteredHistory.length > 0}
                                    onChange={toggleSelectAll}
                                />
                                <span>Выделить все ({filteredHistory.length})</span>
                            </label>

                            {selectedInstruments.length > 0 && (
                                <button
                                    onClick={handleDeleteSelected}
                                    className="btn btn-danger btn-small"
                                >
                                    🗑️ Удалить выбранные ({selectedInstruments.length})
                                </button>
                            )}
                        </div>

                        <div className="instrument-history-table-container">
                            <table className="instrument-history-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '50px' }}></th>
                                        <th>Инструмент</th>
                                        <th>Использован</th>
                                        <th>Шаг цены</th>
                                        <th>Действия</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredHistory.map((item, index) => (
                                        <tr key={item.name} className={index % 2 === 0 ? 'even' : 'odd'}>
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedInstruments.includes(item.name)}
                                                    onChange={() => toggleInstrumentSelection(item.name)}
                                                />
                                            </td>
                                            <td>
                                                <span className="instrument-name">{item.name}</span>
                                            </td>
                                            <td>
                                                <span className="usage-count">{item.count} раз</span>
                                            </td>
                                            <td>
                                                {editingInstrument === item.name ? (
                                                    <div className="edit-price-step">
                                                        <input
                                                            type="number"
                                                            step="0.000001"
                                                            min="0.000001"
                                                            max="1000"
                                                            value={priceStepInput}
                                                            onChange={(e) => setPriceStepInput(e.target.value)}
                                                            placeholder="Шаг цены..."
                                                            style={{ width: '100px', marginRight: '5px' }}
                                                        />
                                                        <button
                                                            className="btn-small"
                                                            onClick={() => handleUpdatePriceStep(item.name, priceStepInput)}
                                                        >
                                                            💾
                                                        </button>
                                                        <button
                                                            className="btn-small btn-danger"
                                                            onClick={cancelEdit}
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        {formatPriceStep(item.priceStep, item.name)}
                                                        <button
                                                            className="btn-settings"
                                                            onClick={() => startEditPriceStep(item)}
                                                            style={{ marginLeft: '8px' }}
                                                            title="Изменить шаг цены"
                                                        >
                                                            ⚙️
                                                        </button>
                                                    </>
                                                )}
                                            </td>
                                            <td>
                                                <div className="instrument-actions">
                                                    <button
                                                        className="btn-small"
                                                        onClick={() => {
                                                            setActiveSection('calculator');
                                                            // Здесь можно добавить логику передачи инструмента в калькулятор
                                                        }}
                                                        title="Использовать в калькуляторе"
                                                    >
                                                        Использовать
                                                    </button>
                                                    <button
                                                        className="btn-small btn-danger"
                                                        onClick={() => {
                                                            const updatedHistory = history.filter(h => h.name !== item.name);
                                                            setInstrumentHistory(updatedHistory);
                                                            localStorage.setItem('instrumentHistory', JSON.stringify(updatedHistory));
                                                        }}
                                                        title="Удалить инструмент"
                                                    >
                                                        Удалить
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="history-stats">
                            <p>
                                <strong>Всего инструментов:</strong> {history.length} |
                                <strong> Отображается:</strong> {filteredHistory.length} |
                                <strong> Выбрано:</strong> {selectedInstruments.length}
                            </p>
                            <p style={{ fontSize: '12px', marginTop: '5px', color: '#6c757d' }}>
                                <strong>Шаг цены:</strong> Отображается кастомное значение или значение по умолчанию
                            </p>
                        </div>

                        <div className="price-step-info-section">
                            <h4>📋 Информация о шагах цены:</h4>
                            <div className="info-grid">
                                <div className="info-item">
                                    <span className="info-label">Криптовалюты:</span>
                                    <span className="info-value">0.01 USDT (1 цент)</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Форекс:</span>
                                    <span className="info-value">0.0001 USDT (1 пипс)</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Акции:</span>
                                    <span className="info-value">0.01 USDT (1 цент)</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">По умолчанию:</span>
                                    <span className="info-value">0.01 USDT</span>
                                </div>
                            </div>
                            <p className="info-note">
                                💡 Шаг цены влияет на точность расчета пунктов (пипсов) между ценой входа и SL.
                                Нажмите ⚙️ чтобы установить кастомное значение для инструмента.
                            </p>
                        </div>
                    </>
                )}
            </div>
        );
    }

    function Settings() {
        return (
            <div className="section-content">
                <h2>⚙️ Настройки приложения</h2>
                <div className="settings-grid">
                    <div className="setting-group">
                        <h3>Основные настройки</h3>
                        <div className="setting-item">
                            <label>Валюта по умолчанию:</label>
                            <select defaultValue="USDT">
                                <option value="USDT">USDT</option>
                                <option value="BTC">BTC</option>
                                <option value="ETH">ETH</option>
                            </select>
                        </div>
                        <div className="setting-item">
                            <label>Язык интерфейса:</label>
                            <select defaultValue="ru">
                                <option value="ru">Русский</option>
                                <option value="en">English</option>
                            </select>
                        </div>
                        <div className="setting-item">
                            <label>Шаг цены по умолчанию:</label>
                            <select defaultValue="auto">
                                <option value="auto">Авто (определять по инструменту)</option>
                                <option value="0.01">0.01 USDT (1 цент)</option>
                                <option value="0.001">0.001 USDT</option>
                                <option value="0.0001">0.0001 USDT (1 пипс)</option>
                            </select>
                        </div>
                    </div>

                    <div className="setting-group">
                        <h3>Интеграции</h3>
                        <div className="setting-item">
                            <label>Notion Integration:</label>
                            <input type="checkbox" defaultChecked />
                        </div>
                        <div className="setting-item">
                            <label>API Token:</label>
                            <input type="password" placeholder="Введите токен" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    function CalculationHistory() {
        const [history] = useState([
            { id: 1, instrument: 'BTCUSDT', direction: 'Long', date: '2024-01-15', profit: '+2.5%' },
            { id: 2, instrument: 'ETHUSDT', direction: 'Short', date: '2024-01-14', profit: '-1.2%' },
        ]);

        return (
            <div className="section-content">
                <h2>📊 История расчетов</h2>
                <div className="history-controls">
                    <button className="btn">📥 Экспорт всей истории</button>
                    <button className="btn btn-danger">🗑️ Очистить историю</button>
                </div>

                <table className="history-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Инструмент</th>
                            <th>Направление</th>
                            <th>Дата</th>
                            <th>Результат</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {history.map(item => (
                            <tr key={item.id}>
                                <td>{item.id}</td>
                                <td><strong>{item.instrument}</strong></td>
                                <td><span className={`direction ${item.direction.toLowerCase()}`}>{item.direction}</span></td>
                                <td>{item.date}</td>
                                <td className={item.profit.startsWith('+') ? 'profit' : 'loss'}>{item.profit}</td>
                                <td>
                                    <button className="btn-small">👁️</button>
                                    <button className="btn-small">📋</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    function GridTemplates() {
        const templates = [
            { name: 'Равномерная', distribution: [33.3, 33.3, 33.3] },
            { name: 'Убывающая', distribution: [60, 30, 10] },
            { name: 'Возрастающая', distribution: [20, 30, 50] },
            { name: 'Пирамида', distribution: [40, 30, 20, 10] },
        ];

        return (
            <div className="section-content">
                <h2>📋 Шаблоны сеточного распределения</h2>
                <div className="templates-grid">
                    {templates.map((template, index) => (
                        <div key={index} className="template-card">
                            <h3>{template.name}</h3>
                            <div className="distribution-bars">
                                {template.distribution.map((percent, i) => (
                                    <div key={i} className="distribution-bar">
                                        <div
                                            className="bar-fill"
                                            style={{ height: `${percent}%` }}
                                            title={`${percent}%`}
                                        ></div>
                                        <span>Ордер {i + 1}</span>
                                    </div>
                                ))}
                            </div>
                            <button className="btn">Применить</button>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    function Help() {
        return (
            <div className="section-content">
                <h2>❓ Помощь и документация</h2>
                <div className="help-sections">
                    <div className="help-section">
                        <h3>📖 Как пользоваться калькулятором</h3>
                        <ol>
                            <li>Выберите направление сделки (Long/Short)</li>
                            <li>Введите торговый инструмент (например, BTCUSDT)</li>
                            <li>Укажите размер депозита и риск на сделку</li>
                            <li>Введите цену входа и Stop Loss</li>
                            <li>При необходимости добавьте уровни Take Profit</li>
                            <li>Нажмите "Рассчитать" для получения результатов</li>
                        </ol>
                    </div>

                    <div className="help-section">
                        <h3>📊 Сеточный вход</h3>
                        <p>Сеточный вход позволяет распределить позицию на несколько ордеров:</p>
                        <ul>
                            <li>Активируйте чекбокс "Сеточный вход"</li>
                            <li>Укажите количество ордеров (1-10)</li>
                            <li>Заполните проценты распределения</li>
                            <li>Последнее поле рассчитывается автоматически</li>
                        </ul>
                    </div>

                    <div className="help-section">
                        <h3>📐 Шаг цены (Tick Size)</h3>
                        <p>Шаг цены влияет на точность расчетов:</p>
                        <ul>
                            <li><strong>Криптовалюты:</strong> 0.01 USDT (1 цент)</li>
                            <li><strong>Форекс:</strong> 0.0001 USDT (1 пипс)</li>
                            <li><strong>Акции:</strong> 0.01 USDT (1 цент)</li>
                            <li><strong>Настройка:</strong> Нажмите ⚙️ рядом с инструментом</li>
                        </ul>
                        <p>Формула: Пункты = |Цена входа - Stop Loss| / Шаг цены</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="app">
            <Header />

            <main className="app-main">
                {menuItems.find(item => item.id === activeSection)?.component}
            </main>

            <Footer />
        </div>
    );
};

export default App;
