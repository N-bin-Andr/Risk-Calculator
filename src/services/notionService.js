import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.REACT_APP_NOTION_TOKEN });
const archive = JSON.parse(localStorage.getItem('reportArchive') || '[]');


export async function sendReportToNotion(reportData, isBacktest = false) {
    const databaseId = isBacktest
        ? process.env.REACT_APP_NOTION_BACKTEST_DB
        : process.env.REACT_APP_NOTION_DATABASE_ID;

    try {
        const reportId = 'ORD-' + Date.now();
        if (!process.env.REACT_APP_NOTION_TOKEN || !databaseId) {
            throw new Error('❌ Notion конфигурация не задана');
        }

        await notion.pages.create({
            parent: { database_id: databaseId },
            properties: {
                'Name': {
                    title: [{ text: { content: reportId } }]
                },
                'ID': {
                    rich_text: [{ text: { content: reportId } }]
                },
                'Date': {
                    date: { start: reportData.date }
                },
                'Simbol': {
                    rich_text: [{ text: { content: reportData.instrument || '—' } }]
                },
                'Deposit': { number: reportData.deposit },
                '%R': { number: reportData.riskSize },
                'Position': {
                    select: { name: reportData.direction === 'buy' ? 'Buy' : 'Sell' }
                },
                'Entry Price': { number: reportData.entryPrice },
                'SL Price': { number: reportData.slPrice },
                'S/L Pips': { number: reportData.slPoints },
                'V(c)': { number: reportData.vCoins },
                'V($)': { number: reportData.vValue },
                '$ Risk': { number: reportData.riskValue },
                'Max R/R': { number: reportData.rrRatio || null },
                'Tp1 ($)': { number: reportData.takeProfitPrice || null },
                'Comments': {
                    rich_text: [{ text: { content: reportData.traderNote || '—' } }]
                },
                'Status': {
                    select: { name: reportData.status || 'Открыта' }
                }
            }
        });

        console.log('📤 Отправка отчёта:', reportData);
        console.log('✅ Отчёт успешно добавлен в Notion');
    } catch (error) {
        console.error('❌ Ошибка:', error.response?.data || error.message);
    }
}