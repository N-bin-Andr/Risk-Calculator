// src/App.jsx
// Добавляем ленивую загрузку для страниц

import React, { useState, useEffect, Suspense, lazy } from 'react';
import Calculator from './components/Calculator';
import './styles/styles.css';

// Ленивая загрузка для тяжелых компонентов
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
            {/* ... остальной JSX без изменений */}
        </div>
    );
};

export default App;
