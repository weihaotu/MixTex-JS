import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Switch, FormControlLabel } from '@mui/material';
import { PopupPanel } from './PopupPanel';

const SettingsContent = styled.div`
    display: flex;
    flex-direction: column;
    gap: 16px;
`;

interface SettingsPanelProps {
  onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose }) => {
  const [settings, setSettings] = useState({
    useInlineDollars: false,
    convertAlignToEquations: false,
    onlyParseWhenShow: false
  });

  useEffect(() => {
    const loadSettings = async () => {
      const savedSettings = await window.electron.settings.get();
      setSettings(savedSettings);
    };
    loadSettings();
  }, []);

  const handleSettingChange = async (key: string) => {
    const newSettings = {
      ...settings,
      [key]: !settings[key as keyof typeof settings]
    };
    setSettings(newSettings);
    await window.electron.settings.set(key, newSettings[key as keyof typeof settings]);
  };

  return (
    <PopupPanel subTitle="设置" onClose={onClose}>
      <SettingsContent>
        <FormControlLabel
          control={
            <Switch
              checked={settings.useInlineDollars}
              onChange={() => handleSettingChange('useInlineDollars')}
              size="small"
            />
          }
          label="使用行内美元符号"
        />
        <FormControlLabel
          control={
            <Switch
              checked={settings.convertAlignToEquations}
              onChange={() => handleSettingChange('convertAlignToEquations')}
              size="small"
            />
          }
          label="转换对齐环境为方程组"
        />
        <FormControlLabel
          control={
            <Switch
              checked={settings.onlyParseWhenShow}
              onChange={() => handleSettingChange('onlyParseWhenShow')}
              size="small"
            />
          }
          label="仅在窗口显示时解析"
        />
      </SettingsContent>
    </PopupPanel>
  );
}; 