// src/components/Settings.jsx (добавить секцию с настройками биржи)

import React from 'react';
import ExchangeSettings from './Settings/ExchangeSettings';
import '../styles/styles.css';

const Settings = () => {
    return (
        <div className="section-content">
            <h2>⚙️ Настройки приложения</h2>

            <div className="settings-grid">
                {/* Добавляем секцию с настройками биржи */}
                <ExchangeSettings />

                {/* Остальные настройки */}
                <div className="setting-group">
                    <h3>Общие настройки</h3>
                    {/* ... остальные настройки ... */}
                </div>

                {/* ... остальные секции ... */}
            </div>
        </div>
    );
};

export default Settings;
