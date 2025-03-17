import React from 'react';
import styled from 'styled-components';
import { Spinner } from './Spinner';

const Container = styled.div`
  flex: 1;
  padding: 12px;
  position: relative;
`;

const TextArea = styled.textarea`
  width: 100%;
  height: 100%;
  resize: none;
  border: none;
  background: ${props => props.theme.colors.surface};
  color: ${props => props.theme.colors.text};
  padding: 8px;
  font-family: 'Consolas', monospace;
  font-size: 14px;
  
  &:focus {
    outline: none;
  }
`;

interface OutputAreaProps {
  text: string;
  isProcessing: boolean;
}

export const OutputArea: React.FC<OutputAreaProps> = ({
  text,
  isProcessing
}) => {
  return (
    <Container>
      <TextArea
        value={text}
        readOnly
      />
      {isProcessing && <Spinner />}
    </Container>
  );
}; 