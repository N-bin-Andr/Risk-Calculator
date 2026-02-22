// src/components/Calculator/Calculator.jsx

import React from 'react';
import { useCalculator } from '../../hooks';
import InstrumentInput from './InstrumentInput';
import InstrumentTypeSelector from './InstrumentTypeSelector';
import GridSettingsPanel from './GridSettingsPanel';
import TakeProfitManager from './TakeProfitManager';
import RiskManagementPanel from './RiskManagementPanel';
import CalculationResults from './CalculationResults';
import ExportActions from './ExportActions';
import InstrumentSettingsDialog from '../InstrumentSettingsDialog/InstrumentSettingsDialog';
import '../../styles/components/Calculator.css';

const Calculator = () => {
    // Используем хук со всей логикой
    const {
        // Состояние
        state,
        dispatch,
        deposit,
        setDeposit,
        riskSize,
        setRiskSize,
        notionStatus,
        isSendingToNotion,
        instrumentSettingsOpen,
        selectedInstrumentForSettings,
        selectedInstrumentType,
        calculationResults,
        calculationError,
        history,

        // Данные для UI
        tooltipText,
        reportData,

        // Методы
        handleInstrumentTypeSelect,
        getInstrumentSuggestions,
        handleOpenInstrumentSettings,
        handleCloseInstrumentSettings,
        handleSaveInstrumentSettings,
        isGridFieldEnabled,
        getGridFieldPlaceholder,
        calculateLastGridField,
        handleCalculate,
        handleSendToNotion,
        handleExportToImage,
        handleResetForm,
        handleDirectionChange
    } = useCalculator();

    const {
        instrument,
        instrumentError,
        direction,
        isDirectionChosen,
        entryPrice,
        slPrice,
        slError,
        tpLevels,
        tpError,
        gridEnabled,
        gridOrdersCount,
        gridDistribution,
        gridError,
        gridPrices,
        gridQuantities,
        gridAveragePrice,
        gridTotalQuantity,
        gridInvestment,
        vCoins,
        vValue,
        riskValue,
        rrRatio,
        traderNote,
        status,
        isBacktest,
        showReport,
        currentPriceStep
    } = state;

    return (
        <div className="calculator">
            <h2>📊 Калькулятор рисков</h2>

            <div className="calculator-header-note">
                <p>
                    <span>💡</span>
                    <span>
                        Заполните форму и нажмите "Рассчитать". Для сохранения результатов используйте "Notion" или "Экспорт".
                    </span>
                </p>
            </div>

            {/* Сообщение об ошибке расчета */}
            {calculationError && (
                <div className="calculation-error">
                    <div className="error-icon">⚠️</div>
                    <div className="error-message">{calculationError}</div>
                </div>
            )}

            <form onSubmit={(e) => e.preventDefault()}>
                {/* Основные поля */}
                <fieldset className="form-section">
                    <legend>📝 Основные параметры</legend>

                    {/* Ввод инструмента */}
                    <InstrumentInput
                        instrument={instrument}
                        setInstrument={(value) => dispatch({ type: 'SET_FIELD', field: 'instrument', value })}
                        instrumentError={instrumentError}
                        setInstrumentError={(error) => dispatch({ type: 'SET_FIELD', field: 'instrumentError', value: error })}
                        isDirectionChosen={isDirectionChosen}
                        tooltipText={tooltipText}
                        historySuggestions={history}
                        onInstrumentSelect={(selectedInstrument) => {
                            dispatch({ type: 'SET_FIELD', field: 'instrument', value: selectedInstrument.name });
                            dispatch({ type: 'SET_FIELD', field: 'instrumentError', value: '' });
                        }}
                        onOpenSettings={handleOpenInstrumentSettings}
                        getSuggestions={getInstrumentSuggestions}
                    />

                    {/* Выбор типа инструмента */}
                    <InstrumentTypeSelector
                        selectedType={selectedInstrumentType}
                        onTypeSelect={handleInstrumentTypeSelect}
                        instrument={instrument}
                        isDirectionChosen={isDirectionChosen}
                        tooltipText={tooltipText}
                    />

                    {/* Выбор направления сделки */}
                    <div className="inline-field">
                        <label>Направление:</label>
                        <div className="direction-buttons">
                            <button
                                type="button"
                                className={`direction-btn ${direction === 'long' ? 'active' : ''}`}
                                onClick={() => handleDirectionChange('long')}
                            >
                                📈 Long
                            </button>
                            <button
                                type="button"
                                className={`direction-btn ${direction === 'short' ? 'active' : ''}`}
                                onClick={() => handleDirectionChange('short')}
                            >
                                📉 Short
                            </button>
                        </div>
                    </div>

                    {/* Цена входа */}
                    <div className={`inline-field ${!isDirectionChosen ? 'disabled-field' : ''}`}
                         title={!isDirectionChosen ? tooltipText : ''}>
                        <label>Цена входа (USDT):</label>
                        <input
                            type="number"
                            step="0.0001"
                            min="0"
                            value={entryPrice}
                            onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'entryPrice', value: e.target.value })}
                            disabled={!isDirectionChosen}
                            placeholder="0.0000"
                        />
                    </div>
                </fieldset>

                {/* Панель управления рисками */}
                <RiskManagementPanel
                    deposit={deposit}
                    setDeposit={setDeposit}
                    riskSize={riskSize}
                    setRiskSize={setRiskSize}
                    slPrice={slPrice}
                    slError={slError}
                    isDirectionChosen={isDirectionChosen}
                    dispatch={dispatch}
                    entryPrice={entryPrice}
                    direction={direction}
                    tooltipText={tooltipText}
                />

                {/* Менеджер Take Profit */}
                <TakeProfitManager
                    tpLevels={tpLevels}
                    tpError={tpError}
                    isDirectionChosen={isDirectionChosen}
                    dispatch={dispatch}
                    tooltipText={tooltipText}
                />

                {/* Настройки сетки */}
                <GridSettingsPanel
                    gridEnabled={gridEnabled}
                    gridOrdersCount={gridOrdersCount}
                    gridDistribution={gridDistribution}
                    isDirectionChosen={isDirectionChosen}
                    dispatch={dispatch}
                    isGridFieldEnabled={isGridFieldEnabled}
                    getGridFieldPlaceholder={getGridFieldPlaceholder}
                    calculateLastGridField={calculateLastGridField}
                />

                {/* Заметка трейдера */}
                <fieldset className="form-section">
                    <legend>📝 Заметка трейдера</legend>
                    <div className="trader-note-container">
                        <textarea
                            className="trader-note"
                            value={traderNote}
                            onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'traderNote', value: e.target.value })}
                            placeholder="Добавьте заметки о сделке, стратегии или другие комментарии..."
                            rows="3"
                        />
                    </div>
                </fieldset>

                {/* Статус сделки */}
                <fieldset className="form-section">
                    <legend>📊 Статус сделки</legend>
                    <div className="inline-field">
                        <label>Статус:</label>
                        <select
                            value={status}
                            onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'status', value: e.target.value })}
                        >
                            <option value="Запланирован">Запланирован</option>
                            <option value="Открыт">Открыт</option>
                            <option value="Отменён">Отменён</option>
                            <option value="Завершен">Завершен</option>
                        </select>
                    </div>

                    <div className="inline-checkbox">
                        <input
                            type="checkbox"
                            id="isBacktest"
                            checked={isBacktest}
                            onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'isBacktest', value: e.target.checked })}
                        />
                        <label htmlFor="isBacktest">Это бэктест (тест стратегии)</label>
                    </div>
                </fieldset>

                {/* Кнопки действий */}
                <ExportActions
                    reportData={reportData}
                    isSendingToNotion={isSendingToNotion}
                    notionStatus={notionStatus}
                    slError={slError}
                    tpError={tpError}
                    gridError={gridError}
                    isDirectionChosen={isDirectionChosen}
                    onCalculate={handleCalculate}
                    onSendToNotion={handleSendToNotion}
                    onExportToImage={handleExportToImage}
                    onResetForm={handleResetForm}
                />
            </form>

            {/* Результаты расчета */}
            {showReport && calculationResults && (
                <CalculationResults
                    gridEnabled={gridEnabled}
                    gridPrices={gridPrices}
                    gridQuantities={gridQuantities}
                    gridDistribution={gridDistribution}
                    gridAveragePrice={gridAveragePrice}
                    gridTotalQuantity={gridTotalQuantity}
                    gridInvestment={gridInvestment}
                    vCoins={calculationResults.positionSize || calculationResults.positionLots || calculationResults.shares || 0}
                    vValue={calculationResults.positionValue || 0}
                    riskValue={calculationResults.riskAmount || 0}
                    rrRatio={calculationResults.tpResults?.[0]?.rrRatio || calculationResults.rrRatio || 0}
                    instrument={instrument}
                    currentPriceStep={currentPriceStep}
                    notionStatus={notionStatus}
                    isSendingToNotion={isSendingToNotion}
                    status={status}
                    calculationResults={calculationResults}
                    calculatorType={calculationResults.calculatorType}
                    marginRequired={calculationResults.marginRequired}
                    freeMargin={calculationResults.freeMargin}
                    pipValue={calculationResults.pipValuePerLot}
                    stopLossPips={calculationResults.stopLossPips}
                />
            )}

            {/* Диалог настроек инструмента */}
            <InstrumentSettingsDialog
                isOpen={instrumentSettingsOpen}
                onClose={handleCloseInstrumentSettings}
                instrumentName={selectedInstrumentForSettings}
                currentPriceStep={currentPriceStep}
                onSave={handleSaveInstrumentSettings}
            />
        </div>
    );
};

export default Calculator;
