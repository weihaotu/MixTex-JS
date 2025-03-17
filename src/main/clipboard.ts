import { clipboard, BrowserWindow } from 'electron';
import { createStore } from '../shared/store';
import { processImage } from '../ocr/utils';
import { OCRService } from '../ocr/infer';
import { SnipItem } from '../shared/types';
import { SnipHistoryManager } from './services/SnipHistoryManager';

const store = createStore();
let lastImage: string | null = null;
const ocrService = new OCRService();
const historyManager = SnipHistoryManager.getInstance();

export const setupClipboardWatcher = async (mainWindow: BrowserWindow) => {
    // 初始化 OCR 服务
    try {
        await ocrService.initialize();
        await historyManager.initialize();
    } catch (error) {
        console.error('Failed to initialize services:', error);
        return;
    }

    const checkClipboard = async () => {
        if (store.get('ocrPaused', false)) return;
        if (store.get('onlyParseWhenShow', false) && !mainWindow.isVisible()) return;

        try {
            const image = clipboard.readImage();
            if (!image.isEmpty()) {
                const imageDataUrl = image.toDataURL();

                // 避免重复处理相同的图片
                if (imageDataUrl === lastImage) return;
                lastImage = imageDataUrl;

                const startTime = Date.now();
                // 处理图像
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
                        processingTime: Date.now() - startTime
                    }
                };

                // 保存到历史记录
                const savedSnip = await historyManager.addSnip(newSnip);

                // 发送识别结果到渲染进程
                mainWindow.webContents.send('ocr-result', {
                    image: imageDataUrl,
                    processedImage: processedImage,
                    text: text,
                    id: savedSnip.id
                });
                console.log('OCR result sent with ID:', savedSnip.id);
            }
        } catch (error) {
            console.error('Clipboard watch error:', error);
        }
    };

    // 每100ms检查一次剪贴板
    setInterval(checkClipboard, 100);
};