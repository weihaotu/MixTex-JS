import { app } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import { SnipHistoryData, SnipItem } from '../../shared/types';

export class SnipHistoryManager {
    private static instance: SnipHistoryManager;
    private historyFilePath: string;
    private imagesDir: string;
    private data: SnipHistoryData = {
        items: [],
        version: 1
    };

    private constructor() {
        const userDataPath = app.getPath('userData');
        this.historyFilePath = path.join(userDataPath, 'snip-history.json');
        this.imagesDir = path.join(userDataPath, 'snip-images');
    }

    public static getInstance(): SnipHistoryManager {
        if (!SnipHistoryManager.instance) {
            SnipHistoryManager.instance = new SnipHistoryManager();
        }
        return SnipHistoryManager.instance;
    }

    public async initialize(): Promise<void> {
        try {
            // 确保图片目录存在
            await fs.mkdir(this.imagesDir, { recursive: true });
            await this.loadHistory();
        } catch (error) {
            console.error('Failed to initialize history:', error);
            this.data = {
                items: [],
                version: 1
            };
            await this.saveHistory();
        }
    }

    private async loadHistory(): Promise<void> {
        try {
            const content = await fs.readFile(this.historyFilePath, 'utf-8');
            this.data = JSON.parse(content);
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
                this.data = {
                    items: [],
                    version: 1
                };
                await this.saveHistory();
            } else {
                throw error;
            }
        }
    }

    private async saveHistory(): Promise<void> {
        try {
            await fs.writeFile(
                this.historyFilePath,
                JSON.stringify(this.data, null, 2),
                'utf-8'
            );
        } catch (error) {
            console.error('Failed to save history:', error);
            throw error;
        }
    }

    private async saveImage(imageData: string, id: string, isProcessed: boolean = false): Promise<string> {
        // 从 base64 数据中提取实际的图片数据
        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
        const imageBuffer = Buffer.from(base64Data, 'base64');

        // 创建文件名
        const fileName = `${id}${isProcessed ? '_processed' : ''}.png`;
        const filePath = path.join(this.imagesDir, fileName);

        // 保存图片文件
        await fs.writeFile(filePath, imageBuffer);

        // 返回相对路径
        return fileName;
    }

    private async loadImage(fileName: string): Promise<string> {
        const filePath = path.join(this.imagesDir, fileName);
        const imageBuffer = await fs.readFile(filePath);
        return `data:image/png;base64,${imageBuffer.toString('base64')}`;
    }

    public async addSnip(snip: Omit<SnipItem, 'id' | 'timestamp'>): Promise<SnipItem> {
        const id = Date.now().toString();

        // 保存图片文件
        const imagePath = await this.saveImage(snip.image, id);
        const processedImagePath = await this.saveImage(snip.processedImage, id, true);

        const newSnip: SnipItem = {
            ...snip,
            id,
            timestamp: Date.now(),
            image: imagePath,
            processedImage: processedImagePath
        };

        this.data.items.unshift(newSnip);
        await this.saveHistory();
        return newSnip;
    }

    public async deleteSnip(id: string): Promise<void> {
        const snip = this.data.items.find(item => item.id === id);
        if (snip) {
            // 删除图片文件
            try {
                await fs.unlink(path.join(this.imagesDir, snip.image));
                await fs.unlink(path.join(this.imagesDir, snip.processedImage));
            } catch (error) {
                console.error('Failed to delete image files:', error);
            }
        }

        this.data.items = this.data.items.filter(item => item.id !== id);
        await this.saveHistory();
    }

    public async getSnips(): Promise<SnipItem[]> {
        // 读取所有图片数据
        const snips = await Promise.all(
            this.data.items.map(async (item) => ({
                ...item,
                image: await this.loadImage(item.image),
                processedImage: await this.loadImage(item.processedImage)
            }))
        );
        return snips;
    }

    public async searchSnips(query: string): Promise<SnipItem[]> {
        const matchedItems = this.data.items.filter(item =>
            item.latex.toLowerCase().includes(query.toLowerCase())
        );

        // 只为匹配的项加载图片数据
        const snips = await Promise.all(
            matchedItems.map(async (item) => ({
                ...item,
                image: await this.loadImage(item.image),
                processedImage: await this.loadImage(item.processedImage)
            }))
        );
        return snips;
    }

    public async clearHistory(): Promise<void> {
        // 删除所有图片文件
        for (const item of this.data.items) {
            try {
                await fs.unlink(path.join(this.imagesDir, item.image));
                await fs.unlink(path.join(this.imagesDir, item.processedImage));
            } catch (error) {
                console.error('Failed to delete image file:', error);
            }
        }

        this.data.items = [];
        await this.saveHistory();
    }
} 