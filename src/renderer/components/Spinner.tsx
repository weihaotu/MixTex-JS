import React from 'react';
import styled, { keyframes } from 'styled-components';

const spin = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const SpinnerContainer = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.8);
  padding: 16px;
  border-radius: 8px;
`;

const SpinnerCircle = styled.div`
  width: 32px;
  height: 32px;
  border: 3px solid ${props => props.theme.colors.surface};
  border-top-color: ${props => props.theme.colors.primary};
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

const SpinnerText = styled.div`
  margin-left: 12px;
  color: ${props => props.theme.colors.text};
  font-size: 14px;
`;

export const Spinner: React.FC = () => {
    return (
        <SpinnerContainer>
            <SpinnerCircle />
            <SpinnerText>正在识别...</SpinnerText>
        </SpinnerContainer>
    );
}; 