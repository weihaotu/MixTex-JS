import React from 'react';
import styled from 'styled-components';
import { PopupPanel } from './PopupPanel';
import { Typography, Link } from '@mui/material';

const AboutContent = styled.div`
    display: flex;
    flex-direction: column;
    gap: 16px;
    text-align: center;
`;

const Version = styled(Typography)`
    color: ${props => props.theme.colors.textSecondary};
`;

interface AboutPanelProps {
  onClose: () => void;
}

export const AboutPanel: React.FC<AboutPanelProps> = ({ onClose }) => {
  return (
    <PopupPanel subTitle="关于" onClose={onClose}>
      <AboutContent>
        <Typography variant="body1">
          TexOCR 是一个基于 OCR 技术的 LaTeX 公式识别工具
        </Typography>
        <Version variant="body2">
          版本 1.0.0
        </Version>
        <Typography variant="body2">
          <Link href="https://github.com/yourusername/texocr" target="_blank" rel="noopener">
            GitHub 仓库
          </Link>
        </Typography>
      </AboutContent>
    </PopupPanel>
  );
}; 