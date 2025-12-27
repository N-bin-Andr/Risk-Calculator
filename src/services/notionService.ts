import { Client } from '@notionhq/client';

// Определяем интерфейс для данных отчета
interface ReportData {
  reportId?: string;
  date?: string;
  instrument?: string;
  deposit: number | string;
  riskSize: number | string;
  direction?: 'long' | 'short';
  entryPrice: number | string;
  slPrice: number | string;
  slPoints: number | string;
  vCoins: number | string;
  vValue: number | string;
  riskValue: number | string;
  traderNote?: string;
  status?: string;
  rrRatio?: number | string;
  takeProfitPrice?: number | string;
}

// Функция принимает токен и ID базы как аргументы
export async function sendReportToNotion(
  reportData: ReportData,
  isBacktest: boolean = false,
  token: string,
  databaseId: string
): Promise<boolean> {
  try {
    if (!token || !databaseId) {
      console.error('❌ Notion конфигурация не задана');
      throw new Error('Notion конфигурация не задана. Проверьте переменные окружения.');
    }

    const notion = new Client({ auth: token });
    const reportId = reportData.reportId || 'ORD-' + Date.now();

    // Подготавливаем свойства для Notion
    const properties = {
      'Name': {
        title: [{ text: { content: reportId } }]
      },
      'ID': {
        rich_text: [{ text: { content: reportId } }]
      },
      'Date': {
        date: { start: reportData.date || new Date().toISOString().split('T')[0] }
      },
      'Simbol': {
        rich_text: [{ text: { content: reportData.instrument || '—' } }]
      },
      'Deposit': { number: parseFloat(reportData.deposit as string) || 0 },
      '%R': { number: parseFloat(reportData.riskSize as string) || 0 },
      'Position': {
        select: {
          name: reportData.direction === 'long' ? 'Long' :
                reportData.direction === 'short' ? 'Short' : '—'
        }
      },
      'Entry Price': { number: parseFloat(reportData.entryPrice as string) || 0 },
      'SL Price': { number: parseFloat(reportData.slPrice as string) || 0 },
      'S/L Pips': { number: parseFloat(reportData.slPoints as string) || 0 },
      'V(c)': { number: parseFloat(reportData.vCoins as string) || 0 },
      'V($)': { number: parseFloat(reportData.vValue as string) || 0 },
      '$ Risk': { number: parseFloat(reportData.riskValue as string) || 0 },
      'Comments': {
        rich_text: [{ text: { content: reportData.traderNote || '—' } }]
      },
      'Status': {
        select: { name: reportData.status || 'Запланирован' }
      }
    };

    // Добавляем RR если есть
    if (reportData.rrRatio !== null && reportData.rrRatio !== undefined) {
      (properties as any)['Max R/R'] = { number: parseFloat(reportData.rrRatio as string) };
    }

    // Добавляем TP если есть
    if (reportData.takeProfitPrice !== null && reportData.takeProfitPrice !== undefined) {
      (properties as any)['Tp1 ($)'] = { number: parseFloat(reportData.takeProfitPrice as string) };
    }

    // Отправляем запрос в Notion
    await notion.pages.create({
      parent: { database_id: databaseId },
      properties: properties as any
    });

    console.log('✅ Отчёт успешно добавлен в Notion');
    return true;
  } catch (error: any) {
    console.error('❌ Ошибка отправки в Notion:', error.message);
    if (error.code === 'validation_error') {
      throw new Error('Ошибка валидации Notion. Проверьте структуру базы данных.');
    } else if (error.code === 'unauthorized') {
      throw new Error('Неверный токен доступа Notion.');
    } else if (error.code === 'object_not_found') {
      throw new Error('База данных Notion не найдена. Проверьте database_id.');
    } else {
      throw new Error(`Ошибка Notion: ${error.message}`);
    }
  }
}
