import React, { useState, useEffect, ReactNode } from 'react'; // ← добавляем ReactNode
import Calculator from './components/Calculator';
import InstrumentHistory from './components/InstrumentHistory';
import Settings from './components/Settings';
import History from './components/History';
import Templates from './components/Templates';
import Help from './components/Help';
import './styles/styles.css';

interface Section {
  title: string;
  component: ReactNode; // ← используем ReactNode вместо JSX.Element
}

const App = () => {
  const [activeSection, setActiveSection] = useState<string>('calculator');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    document.body.className = darkMode ? 'dark-theme' : 'light-theme';
  }, [darkMode]);

  const sections: Record<string, Section> = {
    calculator: {
      title: 'Калькулятор',
      component: <Calculator />
    },
    instruments: {
      title: '📚 История инструментов',
      component: <InstrumentHistory />
    },
    settings: {
      title: '⚙️ Настройки',
      component: <Settings />
    },
    history: {
      title: '📖 История сделок',
      component: <History />
    },
    templates: {
      title: '📋 Шаблоны',
      component: <Templates />
    },
    help: {
      title: '❓ Помощь',
      component: <Help />
    }
  };

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="logo">
            <h1>MyRiskCalculator</h1>
            <p className="tagline">Профессиональный калькулятор рисков для трейдеров</p>
          </div>

          <nav className="main-nav">
            <ul className="nav-list">
              {Object.entries(sections).map(([key, section]) => (
                <li key={key}>
                  <button
                    className={`nav-link ${activeSection === key ? 'active' : ''}`}
                    onClick={() => setActiveSection(key)}
                  >
                    {section.title}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="user-info">
            <span className="version">v1.0.0</span>
            <button className="theme-toggle" onClick={toggleTheme}>
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="section-content">
          <h2>{sections[activeSection].title}</h2>
          {sections[activeSection].component}
        </div>
      </main>

      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>MyRiskCalculator</h4>
            <p>Профессиональный инструмент для управления рисками в трейдинге.</p>
          </div>
          <div className="footer-section">
            <h4>Контакты</h4>
            <p>По вопросам и предложениям:</p>
            <p>email: support@myriskcalculator.com</p>
          </div>
          <div className="footer-section">
            <h4>Лицензия</h4>
            <p>MIT License © 2024 MyRiskCalculator</p>
          </div>
        </div>
        <p className="copyright">
          Вся информация предоставляется "как есть". Автор не несет ответственности за ваши торговые решения.
        </p>
      </footer>
    </div>
  );
};

export default App;
