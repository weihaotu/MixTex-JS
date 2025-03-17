import { ipcMain, BrowserWindow } from 'electron';
import { createStore } from '../../shared/store';
import { setupSnipHistoryHandlers } from './snipHistory';
import { setupScreenshotHandlers } from './screenshot';

const store = createStore();

export function setupWindowHandlers(mainWindow: BrowserWindow) {
    ipcMain.handle('window:minimize', () => {
        mainWindow.minimize();
    });

    ipcMain.handle('window:toggleMaximize', () => {
        if (mainWindow.isMaximized()) {
            mainWindow.unmaximize();
        } else {
            mainWindow.maximize();
        }
    });

    ipcMain.handle('window:close', () => {
        mainWindow.close();
    });

    ipcMain.handle('window:move', (_, deltaX: number, deltaY: number) => {
        const [x, y] = mainWindow.getPosition();
        mainWindow.setPosition(x + deltaX, y + deltaY);
    });

    ipcMain.handle('window:closePopups', () => {
        mainWindow.webContents.send('close-popups');
    });
}

export function setupIPC(mainWindow: BrowserWindow) {
    // 设置窗口相关的处理程序
    setupWindowHandlers(mainWindow);

    // 设置相关
    ipcMain.handle('settings:get', async () => {
        return {
            useInlineDollars: store.get('useInlineDollars', true),
            convertAlignToEquations: store.get('convertAlignToEquations', true),
            onlyParseWhenShow: store.get('onlyParseWhenShow', false),
            ocrPaused: store.get('ocrPaused', false)
        };
    });

    ipcMain.handle('settings:set', async (_, key: string, value: any) => {
        store.set(key, value);
    });

    // OCR 相关
    ipcMain.handle('ocr:toggle', async (_, isPaused: boolean) => {
        store.set('ocrPaused', isPaused);
    });

    // 反馈相关
    ipcMain.handle('feedback:save', async (_, data: { image: string, text: string, feedback: string }) => {
        // TODO: 实现反馈保存逻辑
    });

    // 剪贴板相关
    ipcMain.handle('clipboard:copy', async (_, text: string) => {
        // TODO: 实现复制到剪贴板的逻辑
    });

    ipcMain.handle('clipboard:write-image', async (_, data: string) => {
        // TODO: 实现图片写入剪贴板的逻辑
    });

    // 设置历史记录处理程序
    setupSnipHistoryHandlers();
    // 设置截图处理程序
    setupScreenshotHandlers();
} 