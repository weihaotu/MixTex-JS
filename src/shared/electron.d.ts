export interface ElectronAPI {
    settings: {
        get: () => Promise<{
            useInlineDollars: boolean;
            convertAlignToEquations: boolean;
            onlyParseWhenShow: boolean;
            ocrPaused: boolean;
        }>;
        set: (key: string, value: any) => Promise<void>;
    };
    ocr: {
        toggle: (isPaused: boolean) => Promise<void>;
    };
    window: {
        minimize: () => Promise<void>;
        move: (x: number, y: number) => Promise<void>;
        closePopups: () => Promise<void>;
        toggleMaximize: () => Promise<void>;
        close: () => Promise<void>;
    };
    screenshot: {
        capture: () => Promise<{
            success: boolean;
            data?: SnipItem;
            error?: string;
        }>;
    };
    feedback: {
        save: (data: {
            image: string;
            text: string;
            feedback: string;
        }) => Promise<void>;
    };
    clipboard: {
        copy: (text: string) => Promise<void>;
        writeImage: (data: string) => Promise<void>;
    };
    snipHistory: {
        getAll: () => Promise<SnipItem[]>;
        add: (snip: Omit<SnipItem, 'id' | 'timestamp'>) => Promise<SnipItem>;
        delete: (id: string) => Promise<void>;
        search: (query: string) => Promise<SnipItem[]>;
        clear: () => Promise<void>;
    };
    on: (channel: string, callback: (...args: any[]) => void) => void;
    off: (channel: string, callback: (...args: any[]) => void) => void;
}

declare global {
    interface Window {
        electron: ElectronAPI;
    }
} 