 // src/components/Calculator/History.jsx
import React, { useState } from 'react';
import '../styles/styles.css';

const History = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItems, setSelectedItems] = useState([]);

    // Заглушка данных для демонстрации
    const mockHistory = [
        { id: 1, instrument: 'BTCUSDT', direction: 'long', entryPrice: 45000, slPrice: 44000, date: '2024-01-15', status: 'Завершен', profit: '+1200' },
        { id: 2, instrument: 'ETHUSDT', direction: 'short', entryPrice: 2500, slPrice: 2600, date: '2024-01-14', status: 'Отменен', profit: '0' },
        { id: 3, instrument: 'AAPL.US', direction: 'long', entryPrice: 185.50, slPrice: 180.00, date: '2024-01-13', status: 'Завершен', profit: '+450' },
        { id: 4, instrument: 'EURUSD', direction: 'short', entryPrice: 1.0950, slPrice: 1.1000, date: '2024-01-12', status: 'Открыт', profit: '+85' },
        { id: 5, instrument: 'SOLUSDT', direction: 'long', entryPrice: 95.00, slPrice: 90.00, date: '2024-01-11', status: 'Завершен', profit: '-320' },
    ];

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedItems(mockHistory.map(item => item.id));
        } else {
            setSelectedItems([]);
        }
    };

    const handleSelectItem = (id) => {
        setSelectedItems(prev =>
            prev.includes(id)
                ? prev.filter(itemId => itemId !== id)
                : [...prev, id]
        );
    };

    const filteredHistory = mockHistory.filter(item =>
        item.instrument.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.direction.includes(searchTerm.toLowerCase())
    );

    return (
        <div className="section-content">
            <h2>📚 История расчетов</h2>

            <div className="history-controls">
                <div className="search-box">
                    <input
                        type="text"
                        className="search-input"
                        placeholder="🔍 Поиск по инструменту или направлению..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="action-buttons">
                    <button className="btn">
                        📥 Импорт истории
                    </button>
                    <button className="btn btn-secondary">
                        📤 Экспорт в CSV
                    </button>
                    <button
                        className="btn btn-danger"
                        disabled={selectedItems.length === 0}
                    >
                        🗑️ Удалить выбранное ({selectedItems.length})
                    </button>
                </div>
            </div>

            {selectedItems.length > 0 && (
                <div className="selection-controls">
                    <div className="select-all-checkbox">
                        <input
                            type="checkbox"
                            id="selectAll"
                            checked={selectedItems.length === mockHistory.length}
                            onChange={handleSelectAll}
                        />
                        <label htmlFor="selectAll">
                            Выбрано: {selectedItems.length} из {mockHistory.length}
                        </label>
                    </div>
                    <button
                        className="btn-small btn-danger"
                        onClick={() => setSelectedItems([])}
                    >
                        Снять выделение
                    </button>
                </div>
            )}

            {filteredHistory.length > 0 ? (
                <div className="instrument-history-table-container">
                    <table className="instrument-history-table">
                        <thead>
                            <tr>
                                <th style={{ width: '50px' }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedItems.length === mockHistory.length}
                                        onChange={handleSelectAll}
                                    />
                                </th>
                                <th>Инструмент</th>
                                <th>Направление</th>
                                <th>Цена входа</th>
                                <th>Stop Loss</th>
                                <th>Дата</th>
                                <th>Статус</th>
                                <th>Прибыль/Убыток</th>
                                <th>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredHistory.map((item) => (
                                <tr key={item.id} className={item.id % 2 === 0 ? 'even' : 'odd'}>
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={selectedItems.includes(item.id)}
                                            onChange={() => handleSelectItem(item.id)}
                                        />
                                    </td>
                                    <td className="instrument-name">{item.instrument}</td>
                                    <td>
                                        <span className={`direction ${item.direction}`}>
                                            {item.direction === 'long' ? 'Long 📈' : 'Short 📉'}
                                        </span>
                                    </td>
                                    <td>{item.entryPrice.toLocaleString()}</td>
                                    <td>{item.slPrice.toLocaleString()}</td>
                                    <td>{item.date}</td>
                                    <td>
                                        <span style={{
                                            padding: '3px 8px',
                                            borderRadius: '4px',
                                            fontSize: '12px',
                                            fontWeight: '500',
                                            backgroundColor: item.status === 'Завершен' ? '#d4edda' :
                                                           item.status === 'Открыт' ? '#d1ecf1' :
                                                           item.status === 'Отменен' ? '#f8d7da' : '#fff3cd',
                                            color: item.status === 'Завершен' ? '#155724' :
                                                  item.status === 'Открыт' ? '#0c5460' :
                                                  item.status === 'Отменен' ? '#721c24' : '#856404'
                                        }}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className={item.profit.startsWith('+') ? 'profit' :
                                                  item.profit.startsWith('-') ? 'loss' : ''}>
                                        {item.profit} USDT
                                    </td>
                                    <td>
                                        <div className="instrument-actions">
                                            <button className="btn-small" title="Повторить расчет">
                                                🔄
                                            </button>
                                            <button className="btn-small" title="Экспорт">
                                                📤
                                            </button>
                                            <button className="btn-small btn-danger" title="Удалить">
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="empty-state">
                    <h3>📭 История расчетов пуста</h3>
                    <p>Здесь будут отображаться ваши предыдущие расчеты</p>
                    <p className="hint">Начните использовать калькулятор, чтобы заполнить историю</p>
                </div>
            )}

            <div className="history-stats">
                <p>
                    Всего записей: <strong>{mockHistory.length}</strong> |
                    Завершено: <strong>{mockHistory.filter(item => item.status === 'Завершен').length}</strong> |
                    Прибыль: <strong className="profit">+{mockHistory.filter(item => item.profit.startsWith('+')).reduce((sum, item) => sum + parseInt(item.profit), 0)} USDT</strong>
                </p>
            </div>
        </div>
    );
};

export default History;
