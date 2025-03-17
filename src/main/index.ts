import { app, BrowserWindow, screen } from 'electron';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { setupTray } from './tray';
import { setupIPC } from './ipc/index';
import { setupClipboardWatcher } from './clipboard';

// 获取 __dirname 的等效值
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export let mainWindow: BrowserWindow | null = null;

function createWindow() {
    const { width } = screen.getPrimaryDisplay().workAreaSize;

    mainWindow = new BrowserWindow({
        width: 400,
        height: 800,
        minWidth: 400,
        minHeight: 600,
        x: width - 450, // 默认显示在屏幕右侧
        y: 100,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: false, // 允许加载本地资源
            preload: join(__dirname, '../preload/index.js')
        },
        // 添加以下配置来禁用自动填充
        autoHideMenuBar: true,
        focusable: true,      // 允许窗口可以获得焦点
        show: false          // 初始时不显示窗口
    });

    if (process.env.NODE_ENV === 'development') {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools({ mode: 'detach' });
    } else {
        mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
    }

    // 防止窗口被垃圾回收
    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // 添加以下事件处理
    mainWindow.once('ready-to-show', () => {
        mainWindow?.show();
    });

    // 设置所有 IPC 处理程序
    setupIPC(mainWindow);
}

// 确保只有一个实例在运行
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.show();
            mainWindow.focus();
        }
    });
}

app.whenReady().then(() => {
    createWindow();
    setupTray(mainWindow!);
    setupClipboardWatcher(mainWindow!);
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
}); 