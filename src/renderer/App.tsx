import React from 'react';
import { ThemeProvider } from 'styled-components';
import { MainWindow } from './components/MainWindow';
import { GlobalStyle, theme } from './styles/theme';
import { SettingsProvider } from './contexts/SettingsContext';

const App: React.FC = () => {
    return (
        <ThemeProvider theme={theme}>
            <SettingsProvider>
                <GlobalStyle />
                <MainWindow />
            </SettingsProvider>
        </ThemeProvider>
    );
};

export default App; 