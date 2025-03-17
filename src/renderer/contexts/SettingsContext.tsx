import React, { createContext, useContext, useState, useEffect } from 'react';
import { Settings } from '../../shared/types';

const defaultSettings: Settings = {
    useInlineDollars: false,
    convertAlignToEquations: false,
    onlyParseWhenShow: false,
    ocrPaused: false
};

const SettingsContext = createContext<{
    settings: Settings;
    updateSettings: (key: keyof Settings, value: boolean) => void;
}>({
    settings: defaultSettings,
    updateSettings: () => { }
});

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<Settings>(defaultSettings);

    useEffect(() => {
        // 加载设置
        window.electron.settings.get().then((savedSettings: Settings) => {
            setSettings(savedSettings);
        });
    }, []);

    const updateSettings = async (key: keyof Settings, value: boolean) => {
        await window.electron.settings.set(key, value);
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSettings }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => useContext(SettingsContext); 