import React, { useState } from 'react';

// Определяем интерфейс для настроек
interface AppSettings {
  theme: 'light' | 'dark';
  language: string;
  notifications: boolean;
}

// Доступные языки
type Language = 'ru' | 'en' | 'es' | 'fr';

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'light',
    language: 'ru',
    notifications: true
  });

  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSettings({
      ...settings,
      theme: e.target.value as 'light' | 'dark'
    });
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSettings({
      ...settings,
      language: e.target.value
    });
  };

  const handleNotificationsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings({
      ...settings,
      notifications: e.target.checked
    });
  };

  return (
    <div className="settings">
      <h3>Настройки приложения</h3>
      <div className="settings-grid">
        <div className="setting-group">
          <h4>Внешний вид</h4>
          <div className="setting-item">
            <label>Тема:</label>
            <select
              value={settings.theme}
              onChange={handleThemeChange}
            >
              <option value="light">Светлая</option>
              <option value="dark">Темная</option>
            </select>
          </div>
        </div>

        <div className="setting-group">
          <h4>Язык</h4>
          <div className="setting-item">
            <label>Язык интерфейса:</label>
            <select
              value={settings.language}
              onChange={handleLanguageChange}
            >
              <option value="ru">Русский</option>
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
            </select>
          </div>
        </div>

        <div className="setting-group">
          <h4>Уведомления</h4>
          <div className="setting-item">
            <label>Включить уведомления:</label>
            <input
              type="checkbox"
              checked={settings.notifications}
              onChange={handleNotificationsChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
