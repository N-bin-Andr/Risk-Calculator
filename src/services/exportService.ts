import {
  ExportData,
  CalculatorState,
  PositionResult,
  GridReport,
  TPDetail,
  CalculatorTemplate,
  CalculationHistory,
  NotionExportParams,
  ServiceOperationResult
} from '../types/calculator';
import { EXPORT_CONSTANTS } from '../utils/constants';
import { formatDateTime, safeGetLocalStorage, safeSetLocalStorage } from '../utils/helpers';

/**
 * Сервис для экспорта данных калькулятора
 */
export class ExportService {
  /**
   * Экспорт данных калькулятора в JSON
   */
  static exportToJson(data: ExportData): string {
    try {
      const exportData = {
        ...data,
        timestamp: data.timestamp.toISOString(),
        settings: data.settings || {}
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Error exporting to JSON:', error);
      throw new Error('Failed to export data to JSON');
    }
  }

  /**
   * Экспорт данных калькулятора в CSV
   */
  static exportToCsv(data: ExportData): string {
    try {
      const { state, calculations } = data;
      const rows = [];

      // Заголовок
      rows.push(['Параметр', 'Значение']);

      // Основные параметры
      rows.push(['', '']);
      rows.push(['Основные параметры', '']);
      rows.push(['Инструмент', state.instrument]);
      rows.push(['Направление', state.direction === 'long' ? 'LONG' : 'SHORT']);
      rows.push(['Цена входа', state.entryPrice]);
      rows.push(['Стоп-лосс', state.stopLossPrice]);
      rows.push(['Тейк-профит', state.takeProfitPrice || '—']);
      rows.push(['Депозит', state.deposit]);
      rows.push(['Размер риска', `${state.riskSize}%`]);

      // Результаты расчетов
      if (calculations.position) {
        rows.push(['', '']);
        rows.push(['Результаты расчетов', '']);
        rows.push(['Размер позиции', calculations.position.positionSize.toFixed(2)]);
        rows.push(['Риск в деньгах', calculations.position.riskAmount.toFixed(2)]);
        rows.push(['Потенциальная прибыль', calculations.position.potentialProfit.toFixed(2)]);
        rows.push(['Потенциальный убыток', calculations.position.potentialLoss.toFixed(2)]);
        rows.push(['Риск/прибыль', calculations.position.riskRewardRatio.toFixed(2)]);
        rows.push(['Маржа', calculations.position.margin.toFixed(2)]);
      }

      // Уровни тейк-профита
      if (calculations.takeProfits && calculations.takeProfits.length > 0) {
        rows.push(['', '']);
        rows.push(['Уровни тейк-профита', '']);
        calculations.takeProfits.forEach((tp, index) => {
          rows.push([
            `Уровень ${index + 1}`,
            `${tp.price} (${tp.percent}%) - Прибыль: ${tp.profit.toFixed(2)}`
          ]);
        });
      }

      // Сетка
      if (calculations.grid && calculations.grid.orders.length > 0) {
        rows.push(['', '']);
        rows.push(['Сетка ордеров', '']);
        calculations.grid.orders.forEach(order => {
          rows.push([
            `Уровень ${order.level}`,
            `Цена: ${order.price.toFixed(5)}, Объем: ${order.volume.toFixed(2)}, Прибыль: ${order.profit.toFixed(2)}`
          ]);
        });
      }

      // Метаданные
      rows.push(['', '']);
      rows.push(['Метаданные', '']);
      rows.push(['Дата экспорта', formatDateTime(new Date(), 'DATETIME')]);
      rows.push(['Шаблон', data.settings?.templateName || '—']);
      rows.push(['Заметка', data.settings?.note || '—']);

      // Конвертируем в CSV
      const csvContent = rows.map(row =>
        row.map(cell => `"${cell}"`).join(',')
      ).join('\n');

      return csvContent;
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      throw new Error('Failed to export data to CSV');
    }
  }

  /**
   * Экспорт данных в изображение (используем html2canvas)
   */
  static async exportToImage(
    element: HTMLElement,
    options: {
      fileName?: string;
      format?: 'png' | 'jpeg';
      quality?: number;
    } = {}
  ): Promise<string> {
    try {
      const {
        fileName = `risk-calculator-${Date.now()}`,
        format = 'png',
        quality = 0.9
      } = options;

      // В реальном проекте здесь будет использоваться библиотека html2canvas
      // Для примера создадим заглушку

      // Проверяем, есть ли html2canvas в глобальной области видимости
      if (typeof window === 'undefined') {
        throw new Error('HTML2Canvas requires browser environment');
      }

      // Динамически импортируем html2canvas для code splitting
      const html2canvas = (await import('html2canvas')).default;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: EXPORT_CONSTANTS.IMAGE.BACKGROUND_COLOR,
        imageTimeout: 15000
      });

      const imageFormat = format === 'jpeg' ? 'image/jpeg' : 'image/png';
      const dataUrl = canvas.toDataURL(imageFormat, quality);

      // Сохраняем в localStorage для истории
      this.saveToHistory(dataUrl, fileName);

      // Создаем ссылку для скачивания
      this.downloadFile(dataUrl, `${fileName}.${format}`);

      return dataUrl;
    } catch (error) {
      console.error('Error exporting to image:', error);
      throw new Error('Failed to export to image');
    }
  }

  /**
   * Экспорт данных в Notion
   */
  static async exportToNotion(params: NotionExportParams): Promise<ServiceOperationResult> {
    try {
      const { databaseId, pageTitle, data, tags = [], category = 'Calculation' } = params;

      // Проверяем наличие Notion API ключа
      const notionApiKey = process.env.REACT_APP_NOTION_API_KEY;
      if (!notionApiKey) {
        return {
          success: false,
          message: 'Notion API key is not configured'
        };
      }

      // Подготавливаем данные для Notion
      const notionData = this.prepareDataForNotion(data, pageTitle, tags, category);

      // Отправляем запрос к Notion API
      const response = await fetch('https://api.notion.com/v1/pages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${notionApiKey}`,
          'Content-Type': 'application/json',
          'Notion-Version': EXPORT_CONSTANTS.NOTION.API_VERSION
        },
        body: JSON.stringify(notionData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Notion API error: ${errorText}`);
      }

      const result = await response.json();

      // Сохраняем информацию об экспорте
      this.saveExportRecord({
        id: result.id,
        title: pageTitle,
        timestamp: new Date(),
        data: data
      });

      return {
        success: true,
        message: 'Successfully exported to Notion',
        data: result
      };
    } catch (error) {
      console.error('Error exporting to Notion:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to export to Notion',
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }

  /**
   * Подготовка данных для экспорта в Notion
   */
  private static prepareDataForNotion(
    data: ExportData,
    title: string,
    tags: string[],
    category: string
  ): any {
    const { state, calculations } = data;

    return {
      parent: { database_id: process.env.REACT_APP_NOTION_DATABASE_ID || '' },
      properties: {
        // Заголовок
        Name: {
          title: [
            {
              text: {
                content: title
              }
            }
          ]
        },

        // Основные свойства
        Instrument: {
          rich_text: [
            {
              text: {
                content: state.instrument || 'N/A'
              }
            }
          ]
        },

        Direction: {
          select: {
            name: state.direction === 'long' ? 'LONG' : 'SHORT'
          }
        },

        Entry: {
          number: parseFloat(state.entryPrice) || 0
        },

        StopLoss: {
          number: parseFloat(state.stopLossPrice) || 0
        },

        TakeProfit: {
          number: parseFloat(state.takeProfitPrice) || 0
        },

        Deposit: {
          number: parseFloat(state.deposit) || 0
        },

        Risk: {
          number: parseFloat(state.riskSize) || 0
        },

        // Расчетные свойства
        PositionSize: {
          number: calculations.position?.positionSize || 0
        },

        RiskAmount: {
          number: calculations.position?.riskAmount || 0
        },

        RiskReward: {
          number: calculations.position?.riskRewardRatio || 0
        },

        // Метаданные
        Category: {
          select: {
            name: category
          }
        },

        Tags: {
          multi_select: tags.map(tag => ({ name: tag }))
        },

        Date: {
          date: {
            start: new Date().toISOString()
          }
        }
      },

      // Детальное содержимое
      children: [
        {
          object: 'block',
          type: 'heading_2',
          heading_2: {
            rich_text: [
              {
                text: {
                  content: 'Расчеты'
                }
              }
            ]
          }
        },
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                text: {
                  content: this.createNotionCalculationText(data)
                }
              }
            ]
          }
        }
      ]
    };
  }

  /**
   * Создание текста с расчетами для Notion
   */
  private static createNotionCalculationText(data: ExportData): string {
    const { calculations } = data;
    let text = '';

    if (calculations.position) {
      const p = calculations.position;
      text += `Размер позиции: ${p.positionSize.toFixed(2)}\n`;
      text += `Риск в деньгах: ${p.riskAmount.toFixed(2)}\n`;
      text += `Риск/прибыль: ${p.riskRewardRatio.toFixed(2)}\n`;
      text += `Потенциальная прибыль: ${p.potentialProfit.toFixed(2)}\n`;
      text += `Потенциальный убыток: ${p.potentialLoss.toFixed(2)}\n`;
      text += `Маржа: ${p.margin.toFixed(2)}\n`;
    }

    return text;
  }

  /**
   * Сохранение шаблона
   */
  static saveTemplate(template: CalculatorTemplate): ServiceOperationResult {
    try {
      const templates = safeGetLocalStorage<CalculatorTemplate[]>('calculator_templates', []);

      // Обновляем существующий или добавляем новый
      const existingIndex = templates.findIndex(t => t.id === template.id);
      if (existingIndex >= 0) {
        templates[existingIndex] = {
          ...template,
          updatedAt: new Date(),
          usageCount: template.usageCount + 1
        };
      } else {
        templates.push({
          ...template,
          createdAt: new Date(),
          updatedAt: new Date(),
          usageCount: 1
        });
      }

      // Ограничиваем количество шаблонов
      const maxTemplates = 50;
      const sortedTemplates = templates
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
        .slice(0, maxTemplates);

      const success = safeSetLocalStorage('calculator_templates', sortedTemplates);

      return {
        success,
        message: success ? 'Template saved successfully' : 'Failed to save template',
        data: template
      };
    } catch (error) {
      console.error('Error saving template:', error);
      return {
        success: false,
        message: 'Failed to save template',
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }

  /**
   * Загрузка шаблонов
   */
  static loadTemplates(): CalculatorTemplate[] {
    try {
      return safeGetLocalStorage<CalculatorTemplate[]>('calculator_templates', []);
    } catch (error) {
      console.error('Error loading templates:', error);
      return [];
    }
  }

  /**
   * Удаление шаблона
   */
  static deleteTemplate(templateId: string): ServiceOperationResult {
    try {
      const templates = safeGetLocalStorage<CalculatorTemplate[]>('calculator_templates', []);
      const filteredTemplates = templates.filter(t => t.id !== templateId);

      const success = safeSetLocalStorage('calculator_templates', filteredTemplates);

      return {
        success,
        message: success ? 'Template deleted successfully' : 'Failed to delete template',
        data: { deletedId: templateId }
      };
    } catch (error) {
      console.error('Error deleting template:', error);
      return {
        success: false,
        message: 'Failed to delete template',
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }

  /**
   * Сохранение в историю расчетов
   */
  static saveToHistory(imageData: string, description: string): void {
    try {
      const history = safeGetLocalStorage<CalculationHistory[]>('calculation_history', []);

      const historyItem: CalculationHistory = {
        id: `hist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        instrument: 'Saved Calculation',
        direction: 'long',
        entryPrice: 0,
        stopLossPrice: 0,
        deposit: 0,
        riskSize: 0,
        positionSize: 0,
        riskAmount: 0,
        tags: ['export'],
        screenshot: imageData,
        exportedToNotion: false,
        note: description
      };

      history.unshift(historyItem);

      // Ограничиваем историю 100 записями
      const maxHistory = 100;
      const limitedHistory = history.slice(0, maxHistory);

      safeSetLocalStorage('calculation_history', limitedHistory);
    } catch (error) {
      console.error('Error saving to history:', error);
    }
  }

  /**
   * Загрузка истории расчетов
   */
  static loadHistory(): CalculationHistory[] {
    try {
      return safeGetLocalStorage<CalculationHistory[]>('calculation_history', []);
    } catch (error) {
      console.error('Error loading history:', error);
      return [];
    }
  }

  /**
   * Очистка истории расчетов
   */
  static clearHistory(): ServiceOperationResult {
    try {
      const success = safeSetLocalStorage('calculation_history', []);

      return {
        success,
        message: success ? 'History cleared successfully' : 'Failed to clear history',
        data: null
      };
    } catch (error) {
      console.error('Error clearing history:', error);
      return {
        success: false,
        message: 'Failed to clear history',
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }

  /**
   * Сохранение записи об экспорте
   */
  private static saveExportRecord(record: {
    id: string;
    title: string;
    timestamp: Date;
    data: ExportData;
  }): void {
    try {
      const exports = safeGetLocalStorage<any[]>('export_records', []);
      exports.push(record);
      safeSetLocalStorage('export_records', exports);
    } catch (error) {
      console.error('Error saving export record:', error);
    }
  }

  /**
   * Скачивание файла
   */
  private static downloadFile(dataUrl: string, fileName: string): void {
    if (typeof window === 'undefined') return;

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = fileName;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Копирование текста в буфер обмена
   */
  static async copyToClipboard(text: string): Promise<ServiceOperationResult> {
    try {
      if (typeof navigator === 'undefined' || !navigator.clipboard) {
        // Fallback для старых браузеров
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);

        return {
          success: true,
          message: 'Copied to clipboard (fallback)'
        };
      }

      await navigator.clipboard.writeText(text);

      return {
        success: true,
        message: 'Copied to clipboard'
      };
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      return {
        success: false,
        message: 'Failed to copy to clipboard',
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }

  /**
   * Экспорт всех данных приложения
   */
  static exportAllData(): string {
    try {
      const data = {
        templates: this.loadTemplates(),
        history: this.loadHistory(),
        settings: safeGetLocalStorage('calculator_settings', {}),
        exportRecords: safeGetLocalStorage('export_records', []),
        exportDate: new Date().toISOString(),
        version: '1.0.0'
      };

      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.error('Error exporting all data:', error);
      throw new Error('Failed to export all data');
    }
  }

  /**
   * Импорт данных приложения
   */
  static importAllData(jsonData: string): ServiceOperationResult {
    try {
      const data = JSON.parse(jsonData);

      // Валидация данных
      if (!data.templates || !data.history || !data.settings) {
        throw new Error('Invalid data format');
      }

      // Восстанавливаем данные
      safeSetLocalStorage('calculator_templates', data.templates);
      safeSetLocalStorage('calculation_history', data.history);
      safeSetLocalStorage('calculator_settings', data.settings);

      if (data.exportRecords) {
        safeSetLocalStorage('export_records', data.exportRecords);
      }

      return {
        success: true,
        message: 'Data imported successfully',
        data: {
          templatesCount: data.templates.length,
          historyCount: data.history.length
        }
      };
    } catch (error) {
      console.error('Error importing data:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to import data',
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }
}

export default ExportService;
