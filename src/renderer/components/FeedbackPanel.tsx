import React from 'react';
import styled from 'styled-components';
import { PopupPanel } from './PopupPanel';
import { TextField, Button } from '@mui/material';

const FeedbackContent = styled.div`
    display: flex;
    flex-direction: column;
    gap: 16px;
`;

interface FeedbackPanelProps {
  onClose: () => void;
}

export const FeedbackPanel: React.FC<FeedbackPanelProps> = ({ onClose }) => {
  const handleSubmit = async () => {
    // TODO: 实现反馈提交功能
    onClose();
  };

  return (
    <PopupPanel subTitle="反馈" onClose={onClose}>
      <FeedbackContent>
        <TextField
          multiline
          rows={4}
          placeholder="请输入您的反馈意见..."
          variant="outlined"
          size="small"
          fullWidth
        />
        <Button
          variant="contained"
          onClick={handleSubmit}
          fullWidth
        >
          提交反馈
        </Button>
      </FeedbackContent>
    </PopupPanel>
  );
}; 