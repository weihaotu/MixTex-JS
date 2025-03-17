import { contextBridge, ipcRenderer } from 'electron';
import { OCRResult } from '../shared/types';
import { ElectronAPI } from '../shared/electron';

const api: ElectronAPI = {
    settings: {
        get: () => ipcRenderer.invoke('settings:get'),
        set: (key: string, value: any) => ipcRenderer.invoke('settings:set', key, value)
    },
    ocr: {
        toggle: (isPaused: boolean) => ipcRenderer.invoke('ocr:toggle', isPaused)
    },
    window: {
        minimize: () => ipcRenderer.invoke('window:minimize'),
        move: (x: number, y: number) => ipcRenderer.invoke('window:move', x, y),
        closePopups: () => ipcRenderer.invoke('window:closePopups'),
        toggleMaximize: () => ipcRenderer.invoke('window:toggleMaximize'),
        close: () => ipcRenderer.invoke('window:close')
    },
    screenshot: {
        capture: () => ipcRenderer.invoke('screenshot:capture')
    },
    feedback: {
        save: (data: { image: string, text: string, feedback: string }) =>
            ipcRenderer.invoke('feedback:save', data)
    },
    clipboard: {
        copy: (text: string) => ipcRenderer.invoke('clipboard:copy', text),
        writeImage: (data: string) => ipcRenderer.invoke('clipboard:write-image', data)
    },
    snipHistory: {
        getAll: () => ipcRenderer.invoke('snip-history:get-all'),
        add: (snip: any) => ipcRenderer.invoke('snip-history:add', snip),
        delete: (id: string) => ipcRenderer.invoke('snip-history:delete', id),
        search: (query: string) => ipcRenderer.invoke('snip-history:search', query),
        clear: () => ipcRenderer.invoke('snip-history:clear')
    },
    on: (channel: string, callback: Function) => {
        const subscription = (_event: Electron.IpcRendererEvent, data: OCRResult) => {
            console.log('Preload received:', { channel, data });
            callback(data);
        };
        ipcRenderer.on(channel, subscription);
        return () => {
            ipcRenderer.removeListener(channel, subscription);
        };
    },
    off: (channel: string, callback: (...args: any[]) => void) => {
        ipcRenderer.removeListener(channel, callback);
    }
};

// 在这里定义你需要暴露给渲染进程的 API
contextBridge.exposeInMainWorld('electron', api); 