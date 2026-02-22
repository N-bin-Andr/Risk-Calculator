// src/App.jsx
import React, { useState, useEffect, Suspense, lazy } from 'react';
import Calculator from './components/Calculator';
import './styles/styles.css';

// Ленивая загрузка
const Settings = lazy(() => import('./components/Settings'));
const History = lazy(() => import('./components/History'));
const Templates = lazy(() => import('./components/Templates'));
const Help = lazy(() => import('./components/Help'));

// Компонент загрузки
const LoadingFallback = () => (
    <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        fontSize: '18px',
        color: '#007bff'
    }}>
        <div className="loading-spinner" style={{ marginRight: '10px' }}></div>
        Загрузка...
    </div>
);

const App = () => {
    const [activeSection, setActiveSection] = useState('calculator');
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        const savedSection = localStorage.getItem('activeSection');
        if (savedSection) {
            setActiveSection(savedSection);
        }
    }, []);

    const handleSectionChange = (section) => {
        setActiveSection(section);
        setIsMenuOpen(false);
        localStorage.setItem('activeSection', section);
    };

    const renderSection = () => {
        switch (activeSection) {
            case 'calculator':
                return <Calculator />;
            case 'settings':
                return (
                    <Suspense fallback={<LoadingFallback />}>
                        <Settings />
                    </Suspense>
                );
            case 'history':
                return (
                    <Suspense fallback={<LoadingFallback />}>
                        <History />
                    </Suspense>
                );
            case 'templates':
                return (
                    <Suspense fallback={<LoadingFallback />}>
                        <Templates />
                    </Suspense>
                );
            case 'help':
                return (
                    <Suspense fallback={<LoadingFallback />}>
                        <Help />
                    </Suspense>
                );
            default:
                return <Calculator />;
        }
    };

    return (
        <div className="app">
            {/* Header */}
            <header className="app-header">
                <div className="header-content">
                    <div className="logo">
                        <h1>📊 Risk Calculator</h1>
                        <p className="tagline">Профессиональный калькулятор для трейдинга</p>
                    </div>

                    <nav className="main-nav">
                        <button
                            className="menu-toggle"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            aria-label="Toggle menu"
                        >
                            ☰
                        </button>

                        <ul className={`nav-list ${isMenuOpen ? 'open' : ''}`}>
                            <li>
                                <button
                                    className={`nav-link ${activeSection === 'calculator' ? 'active' : ''}`}
                                    onClick={() => handleSectionChange('calculator')}
                                >
                                    📈 Калькулятор
                                </button>
                            </li>
                            <li>
                                <button
                                    className={`nav-link ${activeSection === 'history' ? 'active' : ''}`}
                                    onClick={() => handleSectionChange('history')}
                                >
                                    📚 История
                                </button>
                            </li>
                            <li>
                                <button
                                    className={`nav-link ${activeSection === 'templates' ? 'active' : ''}`}
                                    onClick={() => handleSectionChange('templates')}
                                >
                                    💾 Шаблоны
                                </button>
                            </li>
                            <li>
                                <button
                                    className={`nav-link ${activeSection === 'settings' ? 'active' : ''}`}
                                    onClick={() => handleSectionChange('settings')}
                                >
                                    ⚙️ Настройки
                                </button>
                            </li>
                            <li>
                                <button
                                    className={`nav-link ${activeSection === 'help' ? 'active' : ''}`}
                                    onClick={() => handleSectionChange('help')}
                                >
                                    ❓ Помощь
                                </button>
                            </li>
                        </ul>
                    </nav>

                    <div className="user-info">
                        <span className="version">v1.0.0</span>
                        <button
                            className="theme-toggle"
                            onClick={() => {
                                alert('Переключение темы будет реализовано позже');
                            }}
                            aria-label="Toggle theme"
                        >
                            🌓
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="app-main">
                {renderSection()}
            </main>

            {/* Footer */}
            <footer className="app-footer">
                <div className="footer-content">
                    <div className="footer-section">
                        <h4>📊 Risk Calculator</h4>
                        <p>Профессиональный инструмент для расчета параметров торговых позиций с поддержкой сеточного входа и управлением рисками.</p>
                    </div>

                    <div className="footer-section">
                        <h4>🔧 Функции</h4>
                        <ul>
                            <li>📈 Расчет позиций для Forex, Акций, Крипто</li>
                            <li>📊 Сеточный вход с распределением</li>
                            <li>📤 Интеграция с Notion</li>
                            <li>💾 Сохранение шаблонов и истории</li>
                            <li>⚡ Горячие клавиши для быстрой работы</li>
                        </ul>
                    </div>

                    <div className="footer-section">
                        <h4>📞 Поддержка</h4>
                        <ul>
                            <li>📚 <button
                                className="footer-link"
                                onClick={() => handleSectionChange('help')}
                                style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 0 }}
                            >
                                Раздел помощи
                            </button></li>
                            <li>⚙️ <button
                                className="footer-link"
                                onClick={() => handleSectionChange('settings')}
                                style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 0 }}
                            >
                                Настройки приложения
                            </button></li>
                            <li>🐛 Сообщить об ошибке</li>
                            <li>💡 Предложить улучшение</li>
                        </ul>
                    </div>

                    <div className="footer-section">
                        <h4>🛠 Технологии</h4>
                        <p>React • CSS • Notion API • LocalStorage</p>
                        <p>Использует современные веб-технологии для быстрой и надежной работы.</p>
                    </div>

                    <div className="copyright">
                        <p>© {new Date().getFullYear()} Risk Calculator. Все права защищены.</p>
                        <p>Разработано для трейдеров. Используйте на свой риск.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default App;
