import { SnipItem } from '../../shared/types';

export const snipHistoryApi = {
    getAll: async (): Promise<SnipItem[]> => {
        return await window.electron.snipHistory.getAll();
    },

    add: async (snip: Omit<SnipItem, 'id' | 'timestamp'>): Promise<SnipItem> => {
        return await window.electron.snipHistory.add(snip);
    },

    delete: async (id: string): Promise<void> => {
        await window.electron.snipHistory.delete(id);
    },

    search: async (query: string): Promise<SnipItem[]> => {
        return await window.electron.snipHistory.search(query);
    },

    clear: async (): Promise<void> => {
        await window.electron.snipHistory.clear();
    }
}; 