import { ipcMain, nativeImage } from 'electron';
import { ScreenshotService } from '../services/ScreenshotService';
import { OCRService } from '../../ocr/infer';
import { processImage } from '../../ocr/utils';
import { SnipHistoryManager } from '../services/SnipHistoryManager';
import { SnipItem } from '../../shared/types';

const ocrService = new OCRService();
const historyManager = SnipHistoryManager.getInstance();
const screenshotService = ScreenshotService.getInstance();

export async function setupScreenshotHandlers() {
    // 初始化服务
    try {
        await ocrService.initialize();
    } catch (error) {
        console.error('Failed to initialize OCR service:', error);
        return;
    }

    // 处理截图请求
    ipcMain.handle('screenshot:capture', async () => {
        try {
            // 获取截图
            const imageDataUrl = await screenshotService.takeScreenshot();

            // 处理图像
            const image = nativeImage.createFromDataURL(imageDataUrl);
            const processedImage_bg = await processImage(image);

            // 进行 OCR 识别
            const { text, processedImage } = await ocrService.inference(processedImage_bg);

            // 创建新的 snip 记录
            const newSnip: Omit<SnipItem, 'id' | 'timestamp'> = {
                image: imageDataUrl,
                processedImage: processedImage,
                latex: text,
                active: true,
                metadata: {
                    originalSize: { width: image.getSize().width, height: image.getSize().height },
                    processingTime: Date.now()
                }
            };

            // 保存到历史记录
            const savedSnip = await historyManager.addSnip(newSnip);

            return {
                success: true,
                data: savedSnip
            };
        } catch (error) {
            console.error('Screenshot capture error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    });
} 