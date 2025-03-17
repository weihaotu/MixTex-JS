import { createGlobalStyle } from 'styled-components';

export const theme = {
  colors: {
    primary: '#4A90E2',
    primaryDark: '#357ABD',
    background: '#FFFFFF',
    surface: '#F5F5F5',
    textPrimary: '#333333',
    textSecondary: '#666666',
    border: '#E0E0E0',
    hover: '#EEEEEE',
    error: '#E53935'
  }
};

export const GlobalStyle = createGlobalStyle`
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html, body {
    width: 100%;
    height: 100%;
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
      Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  }

  #root {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    position: relative;
  }
`; 