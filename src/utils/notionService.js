// src/utils/notionService.js
// Переносим файл из services/ в utils/ и улучшаем обработку ошибок

import { Client } from '@notionhq/client';

/**
 * Отправка отчета в Notion
 * @param {object} reportData - Данные отчета
 * @param {boolean} isBacktest - Флаг бэктеста
 * @param {string} token - Токен доступа Notion
 * @param {string} databaseId - ID базы данных Notion
 * @returns {Promise<object>} Результат отправки
 */
export async function sendReportToNotion(reportData, isBacktest = false, token, databaseId) {
    try {
        // Проверка обязательных параметров
        if (!token || !databaseId) {
            throw new Error({
                success: false,
                code: 'CONFIG_ERROR',
                message: 'Notion конфигурация не задана',
                details: 'Проверьте переменные окружения NOTION_TOKEN и NOTION_DATABASE_ID'
            });
        }

        if (!reportData) {
            throw new Error({
                success: false,
                code: 'DATA_ERROR',
                message: 'Отсутствуют данные для отправки'
            });
        }

        const notion = new Client({ auth: token });
        const reportId = reportData.reportId || generateReportId();

        // Валидация обязательных полей
        const requiredFields = ['instrument', 'entryPrice', 'slPrice', 'deposit', 'riskSize'];
        const missingFields = requiredFields.filter(field => !reportData[field]);

        if (missingFields.length > 0) {
            throw new Error({
                success: false,
                code: 'VALIDATION_ERROR',
                message: 'Отсутствуют обязательные поля',
                details: `Не заполнены: ${missingFields.join(', ')}`
            });
        }

        // Подготовка свойств для Notion
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
            'Deposit': {
                number: parseFloat(reportData.deposit) || 0
            },
            '%R': {
                number: parseFloat(reportData.riskSize) || 0
            },
            'Position': {
                select: {
                    name: reportData.direction === 'long' ? 'Long' :
                          reportData.direction === 'short' ? 'Short' : '—'
                }
            },
            'Entry Price': {
                number: parseFloat(reportData.entryPrice) || 0
            },
            'SL Price': {
                number: parseFloat(reportData.slPrice) || 0
            },
            'S/L Pips': {
                number: parseFloat(reportData.slPoints) || 0
            },
            'V(c)': {
                number: parseFloat(reportData.vCoins) || 0
            },
            'V($)': {
                number: parseFloat(reportData.vValue) || 0
            },
            '$ Risk': {
                number: parseFloat(reportData.riskValue) || 0
            },
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

        // Добавляем данные сетки, если включены
        if (reportData.gridEnabled && reportData.gridReport) {
            properties['Grid Enabled'] = { checkbox: true };
            properties['Grid Orders'] = { number: reportData.gridOrdersCount || 0 };
            properties['Avg Entry Price'] = { number: parseFloat(reportData.gridReport.gridAveragePrice) || 0 };
            properties['Grid Investment'] = { number: parseFloat(reportData.gridReport.gridInvestment) || 0 };
        }

        // Отправляем запрос в Notion
        const response = await notion.pages.create({
            parent: { database_id: databaseId },
            properties: properties
        });

        console.log('✅ Отчёт успешно добавлен в Notion');

        return {
            success: true,
            message: 'Отчет успешно отправлен в Notion',
            reportId: reportId,
            notionPageId: response.id,
            notionUrl: response.url,
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        console.error('❌ Ошибка отправки в Notion:', error.message);

        // Обработка различных типов ошибок Notion API
        let errorMessage = 'Неизвестная ошибка при отправке в Notion';
        let errorDetails = error.message;

        if (error.code === 'validation_error') {
            errorMessage = 'Ошибка валидации Notion';
            errorDetails = 'Проверьте структуру базы данных и обязательные поля';
        } else if (error.code === 'unauthorized') {
            errorMessage = 'Неверный токен доступа Notion';
            errorDetails = 'Проверьте NOTION_TOKEN в настройках';
        } else if (error.code === 'object_not_found') {
            errorMessage = 'База данных Notion не найдена';
            errorDetails = 'Проверьте NOTION_DATABASE_ID в настройках';
        } else if (error.code === 'rate_limited') {
            errorMessage = 'Превышен лимит запросов к Notion';
            errorDetails = 'Попробуйте позже или увеличьте лимиты в настройках Notion';
        } else if (error.message && error.message.includes('network')) {
            errorMessage = 'Проблема с сетью';
            errorDetails = 'Проверьте подключение к интернету';
        }

        return {
            success: false,
            error: {
                code: error.code || 'UNKNOWN_ERROR',
                message: errorMessage,
                details: errorDetails,
                fullError: error.message
            },
            timestamp: new Date().toISOString()
        };
    }
}

/**
 * Проверка соединения с Notion
 * @param {string} token - Токен доступа Notion
 * @returns {Promise<object>} Результат проверки
 */
export async function checkNotionConnection(token) {
    try {
        if (!token) {
            return {
                success: false,
                message: 'Токен не указан'
            };
        }

        const notion = new Client({ auth: token });

        // Простой запрос для проверки токена
        await notion.users.me({});

        return {
            success: true,
            message: 'Соединение с Notion установлено'
        };
    } catch (error) {
        console.error('❌ Ошибка проверки соединения с Notion:', error.message);

        return {
            success: false,
            message: error.code === 'unauthorized'
                ? 'Неверный токен доступа'
                : `Ошибка соединения: ${error.message}`
        };
    }
}

// Вспомогательная функция для генерации ID (можно импортировать из helpers.js)
function generateReportId() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `ORD${day}${month}${year}${hours}${minutes}${seconds}F`;
}
