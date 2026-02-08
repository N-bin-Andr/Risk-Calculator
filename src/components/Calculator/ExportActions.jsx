// src/components/Calculator/ExportActions.jsx
import React from 'react';
import '../../styles/components/ExportActions.css';

const ExportActions = ({
    reportData,
    isSendingToNotion,
    notionStatus,
    slError,
    tpError,
    gridError,
    isDirectionChosen,
    onCalculate,
    onSendToNotion,
    onExportToImage,
    onResetForm
}) => {
    // Определяем можно ли выполнять действия
    const canCalculate = isDirectionChosen && !slError && !tpError && !gridError;
    const canExport = reportData && !isSendingToNotion && !slError && !tpError && !gridError;
    const canSendToNotion = reportData && !isSendingToNotion && !slError && !tpError && !gridError;

    // Горячие клавиши для кнопок
    const hotkeys = {
        calculate: 'Ctrl+Enter',
        sendToNotion: 'Ctrl+S',
        exportImage: 'Ctrl+E',
        reset: 'Ctrl+R'
    };

    return (
        <div className="export-actions-container">
            {/* Блок горячих клавиш */}
            <div className="hotkeys-info">
                <span className="hotkeys-title">⚡ Горячие клавиши:</span>
                <div className="hotkeys-list">
                    <span className="hotkey-item" title="Рассчитать">
                        {hotkeys.calculate}
                    </span>
                    <span className="hotkey-item" title="Отправить в Notion">
                        {hotkeys.sendToNotion}
                    </span>
                    <span className="hotkey-item" title="Экспорт в изображение">
                        {hotkeys.exportImage}
                    </span>
                    <span className="hotkey-item" title="Очистить форму">
                        {hotkeys.reset}
                    </span>
                </div>
            </div>

            {/* Кнопки действий */}
            <div className="actions-buttons-grid">
                {/* Кнопка Рассчитать */}
                <button
                    type="button"
                    className="action-button calculate-button"
                    onClick={onCalculate}
                    disabled={!canCalculate}
                    title={!isDirectionChosen ? "Сначала выберите направление сделки" :
                           slError || tpError || gridError ? "Исправьте ошибки перед расчетом" :
                           "Рассчитать параметры ордера"}
                    data-hotkey={hotkeys.calculate}
                >
                    <span className="button-icon">📈</span>
                    <span className="button-text">Рассчитать</span>
                    <span className="button-hotkey">{hotkeys.calculate}</span>
                </button>

                {/* Кнопка Отправить в Notion */}
                <button
                    type="button"
                    className="action-button notion-button"
                    onClick={onSendToNotion}
                    disabled={!canSendToNotion}
                    title={!reportData ? "Сначала выполните расчет" :
                           isSendingToNotion ? "Идет отправка..." :
                           "Отправить отчет в Notion"}
                    data-hotkey={hotkeys.sendToNotion}
                >
                    <span className="button-icon">
                        {isSendingToNotion ? '⏳' : '📤'}
                    </span>
                    <span className="button-text">
                        {isSendingToNotion ? 'Отправка...' : 'Notion'}
                    </span>
                    <span className="button-hotkey">{hotkeys.sendToNotion}</span>
                </button>

                {/* Кнопка Экспорт в изображение */}
                <button
                    type="button"
                    className="action-button export-button"
                    onClick={onExportToImage}
                    disabled={!canExport}
                    title={!reportData ? "Сначала выполните расчет" : "Экспорт отчета в изображение"}
                    data-hotkey={hotkeys.exportImage}
                >
                    <span className="button-icon">📷</span>
                    <span className="button-text">Экспорт</span>
                    <span className="button-hotkey">{hotkeys.exportImage}</span>
                </button>

                {/* Кнопка Очистить форму */}
                <button
                    type="button"
                    className="action-button reset-button"
                    onClick={onResetForm}
                    title="Очистить форму (сохраняет депозит и риск)"
                    data-hotkey={hotkeys.reset}
                >
                    <span className="button-icon">🗑️</span>
                    <span className="button-text">Очистить</span>
                    <span className="button-hotkey">{hotkeys.reset}</span>
                </button>
            </div>

            {/* Статус отправки в Notion */}
            {notionStatus && (
                <div className={`notion-status-display ${notionStatus.includes('✅') ? 'success' :
                               notionStatus.includes('❌') ? 'error' : 'info'}`}>
                    <div className="notion-status-content">
                        <span className="status-icon">
                            {notionStatus.includes('✅') ? '✅' :
                             notionStatus.includes('❌') ? '❌' : '⏳'}
                        </span>
                        <span className="status-text">{notionStatus}</span>

                        {isSendingToNotion && (
                            <div className="sending-progress">
                                <div className="progress-bar">
                                    <div className="progress-fill" />
                                </div>
                                <div className="loading-spinner" />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Подсказки по кнопкам */}
            <div className="actions-hints">
                <div className="hint-item">
                    <span className="hint-bullet">💡</span>
                    <span className="hint-text">
                        <strong>Рассчитать</strong> - выполнить расчет параметров ордера
                    </span>
                </div>
                <div className="hint-item">
                    <span className="hint-bullet">💡</span>
                    <span className="hint-text">
                        <strong>Notion</strong> - отправить отчет в базу данных Notion
                    </span>
                </div>
                <div className="hint-item">
                    <span className="hint-bullet">💡</span>
                    <span className="hint-text">
                        <strong>Экспорт</strong> - сохранить отчет как изображение
                    </span>
                </div>
                <div className="hint-item">
                    <span className="hint-bullet">💡</span>
                    <span className="hint-text">
                        <strong>Очистить</strong> - сбросить форму (депозит и риск сохраняются)
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ExportActions;
