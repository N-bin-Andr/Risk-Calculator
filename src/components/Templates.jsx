
import React, { useState } from 'react';
import '../styles/styles.css';

const Templates = () => {
    const [templates, setTemplates] = useState([
        {
            id: 1,
            name: 'BTC Среднесрочный',
            instrument: 'BTCUSDT',
            direction: 'long',
            riskPercent: 2,
            gridEnabled: true,
            gridOrders: 3,
            distribution: [40, 30, 30]
        },
        {
            id: 2,
            name: 'Акции консервативный',
            instrument: '',
            direction: 'long',
            riskPercent: 1,
            gridEnabled: false,
            gridOrders: 1,
            distribution: [100]
        },
        {
            id: 3,
            name: 'Крипто агрессивный',
            instrument: '',
            direction: 'short',
            riskPercent: 5,
            gridEnabled: true,
            gridOrders: 4,
            distribution: [50, 30, 15, 5]
        },
    ]);

    const [newTemplateName, setNewTemplateName] = useState('');

    const handleSaveTemplate = () => {
        if (!newTemplateName.trim()) {
            alert('Введите название шаблона');
            return;
        }

        const newTemplate = {
            id: templates.length + 1,
            name: newTemplateName,
            instrument: '',
            direction: 'long',
            riskPercent: 2,
            gridEnabled: false,
            gridOrders: 3,
            distribution: [33.3, 33.3, 33.3]
        };

        setTemplates([...templates, newTemplate]);
        setNewTemplateName('');
        alert('Новый шаблон создан! Теперь вы можете настроить его параметры.');
    };

    const handleApplyTemplate = (template) => {
        alert(`Применяем шаблон: ${template.name}\nНаправление: ${template.direction}\nРиск: ${template.riskPercent}%\nСетка: ${template.gridEnabled ? 'Включена' : 'Выключена'}`);
        // Здесь будет логика применения шаблона к калькулятору
    };

    const handleDeleteTemplate = (id) => {
        if (window.confirm('Удалить этот шаблон?')) {
            setTemplates(templates.filter(t => t.id !== id));
        }
    };

    const getTotalDistribution = (distribution) => {
        return distribution.reduce((sum, val) => sum + val, 0).toFixed(1);
    };

    return (
        <div className="section-content">
            <h2>💾 Шаблоны сделок</h2>

            <div className="templates-intro" style={{ marginBottom: '30px' }}>
                <p>Создавайте шаблоны для часто используемых настроек и быстро применяйте их в калькуляторе.</p>

                <div className="template-creation" style={{
                    display: 'flex',
                    gap: '10px',
                    marginTop: '20px',
                    alignItems: 'center'
                }}>
                    <input
                        type="text"
                        placeholder="Название нового шаблона..."
                        value={newTemplateName}
                        onChange={(e) => setNewTemplateName(e.target.value)}
                        style={{ flex: 1, padding: '10px' }}
                    />
                    <button
                        className="btn btn-primary"
                        onClick={handleSaveTemplate}
                    >
                        ➕ Создать шаблон
                    </button>
                </div>
            </div>

            <div className="templates-grid">
                {templates.map(template => (
                    <div key={template.id} className="template-card">
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            marginBottom: '15px'
                        }}>
                            <h3 style={{ margin: 0 }}>{template.name}</h3>
                            <span style={{
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                backgroundColor: template.direction === 'long' ? '#d4edda' : '#f8d7da',
                                color: template.direction === 'long' ? '#155724' : '#721c24'
                            }}>
                                {template.direction === 'long' ? '📈 Long' : '📉 Short'}
                            </span>
                        </div>

                        <div className="template-details" style={{ fontSize: '14px', color: '#555' }}>
                            <p><strong>Инструмент:</strong> {template.instrument || 'Любой'}</p>
                            <p><strong>Риск:</strong> {template.riskPercent}%</p>
                            <p><strong>Сетка:</strong> {template.gridEnabled ? 'Да' : 'Нет'}</p>

                            {template.gridEnabled && (
                                <>
                                    <p><strong>Ордеров:</strong> {template.gridOrders}</p>
                                    <p><strong>Распределение:</strong> {getTotalDistribution(template.distribution)}%</p>

                                    <div className="distribution-bars">
                                        {template.distribution.map((percent, idx) => (
                                            <div key={idx} className="distribution-bar">
                                                <div
                                                    className="bar-fill"
                                                    style={{
                                                        height: `${percent * 1.5}px`,
                                                        backgroundColor: idx === 0 ? '#007bff' :
                                                                       idx === 1 ? '#28a745' :
                                                                       idx === 2 ? '#ffc107' : '#6c757d'
                                                    }}
                                                />
                                                <span>{percent}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="template-actions" style={{
                            display: 'flex',
                            gap: '10px',
                            marginTop: '20px'
                        }}>
                            <button
                                className="btn btn-primary"
                                onClick={() => handleApplyTemplate(template)}
                                style={{ flex: 1 }}
                            >
                                📝 Применить
                            </button>
                            <button
                                className="btn btn-secondary"
                                onClick={() => {
                                    alert('Редактирование шаблонов будет доступно в следующей версии');
                                }}
                            >
                                ✏️
                            </button>
                            <button
                                className="btn btn-danger"
                                onClick={() => handleDeleteTemplate(template.id)}
                            >
                                🗑️
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {templates.length === 0 && (
                <div className="empty-state" style={{ textAlign: 'center', padding: '40px' }}>
                    <h3>📂 Шаблоны не найдены</h3>
                    <p>Создайте свой первый шаблон для быстрого применения настроек</p>
                    <p className="hint">Шаблоны помогают экономить время при повторных расчетах</p>
                </div>
            )}

            <div className="templates-info" style={{
                marginTop: '30px',
                padding: '20px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                fontSize: '14px'
            }}>
                <h4>💡 Как использовать шаблоны:</h4>
                <ol style={{ paddingLeft: '20px' }}>
                    <li>Создайте шаблон с нужными настройками (риск, сетка, распределение)</li>
                    <li>Настройте шаблон под конкретные инструменты или оставьте универсальным</li>
                    <li>Применяйте шаблон в калькуляторе одним кликом</li>
                    <li>При необходимости корректируйте параметры после применения</li>
                </ol>
                <p style={{ marginTop: '10px', fontStyle: 'italic', color: '#666' }}>
                    Шаблоны сохраняются локально в вашем браузере.
                </p>
            </div>
        </div>
    );
};

export default Templates;
