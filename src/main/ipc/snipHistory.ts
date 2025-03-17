import { ipcMain } from 'electron';
import { SnipHistoryManager } from '../services/SnipHistoryManager';
import { SnipItem } from '../../shared/types';

export function setupSnipHistoryHandlers() {
    const historyManager = SnipHistoryManager.getInstance();

    // 初始化历史记录管理器
    historyManager.initialize().catch(error => {
        console.error('Failed to initialize history manager:', error);
    });

    // 获取所有历史记录
    ipcMain.handle('snip-history:get-all', async () => {
        return await historyManager.getSnips();
    });

    // 添加新的记录
    ipcMain.handle('snip-history:add', async (_, snip: Omit<SnipItem, 'id' | 'timestamp'>) => {
        return await historyManager.addSnip(snip);
    });

    // 删除记录
    ipcMain.handle('snip-history:delete', async (_, id: string) => {
        await historyManager.deleteSnip(id);
    });

    // 搜索记录
    ipcMain.handle('snip-history:search', async (_, query: string) => {
        return await historyManager.searchSnips(query);
    });

    // 清空历史记录
    ipcMain.handle('snip-history:clear', async () => {
        await historyManager.clearHistory();
    });
} 