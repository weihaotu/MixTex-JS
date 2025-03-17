export interface Settings {
    useInlineDollars: boolean;
    convertAlignToEquations: boolean;
    onlyParseWhenShow: boolean;
    ocrPaused: boolean;
}

export interface FeedbackData {
    image: string;
    text: string;
    feedback: string;
    timestamp: number;
}

export interface SnipItem {
    id: string;
    image: string;
    processedImage: string;
    latex: string;
    timestamp: number;
    active: boolean;
    metadata?: {
        originalSize: { width: number, height: number };
        processingTime?: number;
    };
}

export interface SnipHistoryData {
    items: SnipItem[];
    version: number;
}

// 实现兼容的 ImageData 类
export class ImageDataPolyfill {
    public data: Uint8ClampedArray;
    public width: number;
    public height: number;

    constructor(data: Uint8ClampedArray, width: number, height: number) {
        this.data = data;
        this.width = width;
        this.height = height;
    }
}

export interface ModelConfig {
    maxLength: number;
    numLayers: number;
    hiddenSize: number;
    numAttentionHeads: number;
    batchSize: number;
}

export interface OCRResult {
    text: string;
    image?: string;
    processedImage?: string;
    id?: string;
} 