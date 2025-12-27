import React, { useMemo } from 'react'; // Добавляем useMemo
import { useCalculatorState } from '../../hooks/useCalculatorState';
import { useValidation } from '../../hooks/useValidation';
import { useGridCalculations } from '../../hooks/useGridCalculations';
import { CalculationService } from '../../services/calculationService';
import DirectionSelector from './DirectionSelector';
import InstrumentInput from './InstrumentInput';
import PriceInputs from './PriceInputs';
import GridSettingsPanel from './GridSettingsPanel';
import TakeProfitManager from './TakeProfitManager';
import RiskManagementPanel from './RiskManagementPanel';
import CalculationResults from './CalculationResults';
import ExportActions from './ExportActions';
import styles from '../../styles/Calculator.module.css';

const Calculator: React.FC = () => {
  // Используем хук для состояния калькулятора
  const { state, actions } = useCalculatorState();
  const validation = useValidation(state);
  const gridResults = useGridCalculations(state);

  // Рассчитываем результаты позиции
  const positionResults = useMemo(() => {
    if (!validation.isValid) return null;

    try {
      return CalculationService.calculatePositionSize({
        direction: state.direction,
        entryPrice: state.entryPrice,
        stopLossPrice: state.stopLossPrice,
        takeProfitPrice: state.takeProfitPrice,
        deposit: state.deposit,
        riskSize: state.riskSize,
        lotSize: state.lotSize,
        instrument: undefined // Пока нет интеграции с TradingContext
      });
    } catch (error) {
      console.error('Error calculating position:', error);
      return null;
    }
  }, [state, validation.isValid]);

  // Рассчитываем тейк-профиты если есть позиция
  const takeProfitResults = useMemo(() => {
    if (!positionResults || state.takeProfitLevels.length === 0) {
      return null;
    }

    return CalculationService.calculateTakeProfitLevels(
      state.takeProfitLevels,
      state.entryPrice,
      positionResults.positionSize,
      state.direction
    );
  }, [positionResults, state.takeProfitLevels, state.entryPrice, state.direction]);

  // Обновляем результаты
  const allResults = useMemo(() => ({
    position: positionResults,
    grid: gridResults,
    takeProfits: takeProfitResults,
    validation
  }), [positionResults, gridResults, takeProfitResults, validation]);

  const handleCalculate = () => {
    if (validation.isValid) {
      actions.setCalculationState(true);
      // Здесь будет вызов расчета
      setTimeout(() => {
        actions.setCalculationState(false);
      }, 500);
    }
  };

  const handleReset = () => {
    if (window.confirm('Вы уверены, что хотите сбросить все поля?')) {
      actions.resetCalculator();
    }
  };

  return (
    <div className={styles.calculatorContainer}>
      <div className={styles.calculatorHeader}>
        <h1>📊 Калькулятор рисков</h1>
        <p className={styles.subtitle}>Профессиональный расчет параметров торговых позиций</p>
      </div>

      <div className={styles.calculatorGrid}>
        {/* Левая колонка - Основные настройки */}
        <div className={styles.leftColumn}>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Основные параметры</h2>
            <DirectionSelector
              direction={state.direction}
              onChange={actions.setDirection}
              disabled={state.isCalculating}
            />
            <InstrumentInput
              value={state.instrument}
              onChange={actions.setInstrument}
              error={validation.errors.instrument}
              disabled={state.isCalculating}
            />
            <PriceInputs
              entryPrice={state.entryPrice}
              stopLossPrice={state.stopLossPrice}
              takeProfitPrice={state.takeProfitPrice}
              onEntryPriceChange={actions.setEntryPrice}
              onStopLossChange={actions.setStopLossPrice}
              onTakeProfitChange={actions.setTakeProfitPrice}
              direction={state.direction}
              errors={{
                entryPrice: validation.errors.entryPrice,
                stopLossPrice: validation.errors.stopLossPrice,
                takeProfitPrice: validation.errors.takeProfitPrice
              }}
              disabled={state.isCalculating}
            />
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Управление рисками</h2>
            <RiskManagementPanel
              deposit={state.deposit}
              riskSize={state.riskSize}
              stopLossPercent={state.stopLossPercent}
              takeProfitPercent={state.takeProfitPercent}
              riskPerTrade={state.riskPerTrade}
              riskReward={state.riskReward}
              lotSize={state.lotSize}
              onDepositChange={actions.setDeposit}
              onRiskSizeChange={actions.setRiskSize}
              onStopLossPercentChange={actions.setStopLossPercent}
              onTakeProfitPercentChange={actions.setTakeProfitPercent}
              onRiskPerTradeChange={actions.setRiskPerTrade}
              onRiskRewardChange={actions.setRiskReward}
              onLotSizeChange={actions.setLotSize}
              errors={{
                deposit: validation.errors.deposit,
                riskSize: validation.errors.riskSize,
                stopLossPercent: validation.errors.stopLossPercent,
                takeProfitPercent: validation.errors.takeProfitPercent,
                riskPerTrade: validation.errors.riskPerTrade,
                riskReward: validation.errors.riskReward,
                lotSize: validation.errors.lotSize
              }}
              disabled={state.isCalculating}
            />
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Сетка ордеров</h2>
            <GridSettingsPanel
              enabled={state.gridEnabled}
              startPrice={state.gridStartPrice}
              endPrice={state.gridEndPrice}
              levels={state.gridLevels}
              volumeType={state.gridVolumeType}
              firstVolume={state.gridFirstVolume}
              volumeMultiplier={state.gridVolumeMultiplier}
              stepType={state.gridStepType}
              stepValue={state.gridStepValue}
              onToggleEnabled={actions.toggleGridEnabled}
              onStartPriceChange={actions.setGridStartPrice}
              onEndPriceChange={actions.setGridEndPrice}
              onLevelsChange={actions.setGridLevels}
              onVolumeTypeChange={actions.setGridVolumeType}
              onFirstVolumeChange={actions.setGridFirstVolume}
              onVolumeMultiplierChange={actions.setGridVolumeMultiplier}
              onStepTypeChange={actions.setGridStepType}
              onStepValueChange={actions.setGridStepValue}
              direction={state.direction}
              errors={{
                gridStartPrice: validation.errors.gridStartPrice,
                gridEndPrice: validation.errors.gridEndPrice,
                gridLevels: validation.errors.gridLevels
              }}
              disabled={state.isCalculating}
            />
          </div>
        </div>

        {/* Правая колонка - Результаты и дополнительные настройки */}
        <div className={styles.rightColumn}>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Уровни тейк-профита</h2>
            <TakeProfitManager
              levels={state.takeProfitLevels}
              enabled={state.takeProfitLevelsEnabled}
              onToggleEnabled={actions.toggleTakeProfitLevelsEnabled}
              onAddLevel={actions.addTakeProfitLevel}
              onRemoveLevel={actions.removeTakeProfitLevel}
              onUpdateLevel={actions.updateTakeProfitLevel}
              direction={state.direction}
              entryPrice={state.entryPrice}
              stopLossPrice={state.stopLossPrice}
              disabled={state.isCalculating}
            />
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Результаты расчетов</h2>
            <CalculationResults
              results={allResults}
              isLoading={state.isCalculating}
              isValid={validation.isValid}
              onCalculate={handleCalculate}
              onReset={handleReset}
            />
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Экспорт и сохранение</h2>
            <ExportActions
              templateName={state.templateName}
              note={state.note}
              tags={state.tags}
              onTemplateNameChange={actions.setTemplateName}
              onNoteChange={actions.setNote}
              onAddTag={actions.addTag}
              onRemoveTag={actions.removeTag}
              onSaveTemplate={() => {/* временно пусто */}}
              onExportToImage={() => {/* временно пусто */}}
              onExportToNotion={() => {/* временно пусто */}}
              disabled={state.isCalculating || !validation.isValid}
              hasResults={!!positionResults}
            />
          </div>
        </div>
      </div>

      {/* Статус валидации */}
      {!validation.isValid && (
        <div className={styles.validationStatus}>
          <div className={styles.validationError}>
            ⚠️ Имеются ошибки в заполнении. Пожалуйста, проверьте введенные данные.
          </div>
        </div>
      )}

      {/* Индикатор загрузки */}
      {state.isCalculating && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingSpinner}></div>
          <p>Выполняются расчеты...</p>
        </div>
      )}
    </div>
  );
};

export default Calculator;
