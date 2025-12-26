import { Client } from '@notionhq/client';

// Функция принимает токен и ID базы как аргументы
export async function sendReportToNotion(reportData, isBacktest = false, token, databaseId) {
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
            'Deposit': { number: parseFloat(reportData.deposit) || 0 },
            '%R': { number: parseFloat(reportData.riskSize) || 0 },
            'Position': {
                select: {
                    name: reportData.direction === 'long' ? 'Long' :
                          reportData.direction === 'short' ? 'Short' : '—'
                }
            },
            'Entry Price': { number: parseFloat(reportData.entryPrice) || 0 },
            'SL Price': { number: parseFloat(reportData.slPrice) || 0 },
            'S/L Pips': { number: parseFloat(reportData.slPoints) || 0 },
            'V(c)': { number: parseFloat(reportData.vCoins) || 0 },
            'V($)': { number: parseFloat(reportData.vValue) || 0 },
            '$ Risk': { number: parseFloat(reportData.riskValue) || 0 },
            'Comments': {
                rich_text: [{ text: { content: reportData.traderNote || '—' } }]
            },
            'Status': {
                select: { name: reportData.status || 'Запланирован' }
            }
        };

        // Добавляем RR если есть
        if (reportData.rrRatio !== null && reportData.rrRatio !== undefined) {
            properties['Max R/R'] = { number: parseFloat(reportData.rrRatio) };
        }

        // Добавляем TP если есть
        if (reportData.takeProfitPrice !== null && reportData.takeProfitPrice !== undefined) {
            properties['Tp1 ($)'] = { number: parseFloat(reportData.takeProfitPrice) };
        }

        // Отправляем запрос в Notion
        await notion.pages.create({
            parent: { database_id: databaseId },
            properties: properties
        });

        console.log('✅ Отчёт успешно добавлен в Notion');
        return true;
    } catch (error) {
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
