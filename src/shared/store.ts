const Store = require('electron-store');

export interface StoreSchema {
    useInlineDollars: boolean;
    convertAlignToEquations: boolean;
    onlyParseWhenShow: boolean;
    ocrPaused: boolean;
    feedbacks: Array<{
        image: string;
        text: string;
        feedback: string;
        timestamp?: number;
    }>;
    [key: string]: any;
}

type StoreType = typeof Store;
type StoreInstance = InstanceType<StoreType>;

// 扩展原始的 Store 类型以确保 get 和 set 方法可用
export interface TypedStore extends StoreInstance {
    get<K extends keyof StoreSchema>(key: K, defaultValue?: StoreSchema[K]): StoreSchema[K];
    set<K extends keyof StoreSchema>(key: K, value: StoreSchema[K]): void;
}

export const createStore = (): TypedStore => {
    return new Store({
        defaults: {
            useInlineDollars: false,
            convertAlignToEquations: false,
            onlyParseWhenShow: false,
            ocrPaused: false,
            feedbacks: [],
            ocrHistory: []
        }
    }) as TypedStore;
}; 