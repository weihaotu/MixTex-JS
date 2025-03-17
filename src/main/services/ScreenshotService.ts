import { desktopCapturer, screen, BrowserWindow, ipcMain, app } from 'electron';
import { join } from 'path';

export class ScreenshotService {
    private static instance: ScreenshotService;
    private screenshotWindow: BrowserWindow | null = null;
    private resolveScreenshot: ((value: string) => void) | null = null;
    private rejectScreenshot: ((reason?: any) => void) | null = null;

    private constructor() {
        // 设置 IPC 监听器
        ipcMain.on('screenshot:confirm', (_, rect) => {
            this.handleScreenshotConfirm(rect);
        });

        ipcMain.on('screenshot:cancel', () => {
            this.handleScreenshotCancel();
        });
    }

    static getInstance(): ScreenshotService {
        if (!ScreenshotService.instance) {
            ScreenshotService.instance = new ScreenshotService();
        }
        return ScreenshotService.instance;
    }

    private async handleScreenshotConfirm(rect: { x: number, y: number, width: number, height: number }) {
        try {
            // 获取屏幕截图
            const primaryDisplay = screen.getPrimaryDisplay();
            const sources = await desktopCapturer.getSources({
                types: ['screen'],
                thumbnailSize: primaryDisplay.size
            });

            const primarySource = sources.find(source =>
                source.display_id === primaryDisplay.id.toString()
            );

            if (!primarySource || !this.resolveScreenshot) {
                throw new Error('无法获取屏幕截图');
            }

            // 将截图转换为 base64
            const fullImage = primarySource.thumbnail;
            const croppedImage = fullImage.crop(rect);
            const imageDataUrl = croppedImage.toDataURL();

            // 关闭截图窗口
            if (this.screenshotWindow) {
                this.screenshotWindow.close();
                this.screenshotWindow = null;
            }

            this.resolveScreenshot(imageDataUrl);
        } catch (error) {
            this.handleScreenshotCancel(error);
        }
    }

    private handleScreenshotCancel(error?: any) {
        if (this.screenshotWindow) {
            this.screenshotWindow.close();
            this.screenshotWindow = null;
        }

        if (this.rejectScreenshot) {
            this.rejectScreenshot(error || new Error('Screenshot canceled'));
        }
    }

    async takeScreenshot(): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                this.resolveScreenshot = resolve;
                this.rejectScreenshot = reject;

                // 获取主显示器
                const primaryDisplay = screen.getPrimaryDisplay();
                const { width, height } = primaryDisplay.size;

                // 创建截图窗口
                this.screenshotWindow = new BrowserWindow({
                    width,
                    height,
                    frame: false,
                    transparent: true,
                    fullscreen: true,
                    webPreferences: {
                        nodeIntegration: true,
                        contextIsolation: false
                    },
                    show: false
                });

                // 加载截图页面
                const isDev = !app.isPackaged;
                const screenshotPath = isDev
                    ? join(process.cwd(), 'public/screenshot.html')
                    : join(process.resourcesPath, 'app/public/screenshot.html');

                console.log('Loading screenshot page from:', screenshotPath);
                await this.screenshotWindow.loadFile(screenshotPath);

                // 显示窗口
                this.screenshotWindow.show();
            } catch (error) {
                console.error('Screenshot error:', error);
                this.handleScreenshotCancel(error);
            }
        });
    }
} 