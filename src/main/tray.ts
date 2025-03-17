import { Tray, Menu, BrowserWindow, nativeImage, app } from 'electron';
import { join } from 'path';
import { createStore } from '../shared/store';

let tray: Tray | null = null;
const store = createStore();

export const setupTray = (mainWindow: BrowserWindow) => {
    const iconPath = join(__dirname, '../../assets/icon.png');
    const icon = nativeImage.createFromPath(iconPath);

    tray = new Tray(icon);

    const updateContextMenu = () => {
        const contextMenu = Menu.buildFromTemplate([
            {
                label: '显示窗口',
                click: () => {
                    mainWindow.show();
                    tray!.setContextMenu(updateContextMenu());
                }
            },
            {
                label: '只在最大化时启用',
                type: 'checkbox',
                checked: store.get('onlyParseWhenShow', false) as boolean,
                click: (menuItem) => {
                    store.set('onlyParseWhenShow', menuItem.checked);
                }
            },
            { type: 'separator' },
            {
                label: '退出',
                click: () => {
                    mainWindow.destroy();
                    app.quit();
                }
            }
        ]);

        return contextMenu;
    };

    tray.setToolTip('MixTeX');
    tray.setContextMenu(updateContextMenu());

    // 点击托盘图标显示窗口
    tray.on('click', () => {
        mainWindow.show();
        tray!.setContextMenu(updateContextMenu());
    });
}; 