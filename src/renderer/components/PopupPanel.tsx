import React from 'react';
import styled from 'styled-components';
import { IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const Container = styled.div`
    background: ${props => props.theme.colors.surface};
    border-radius: 8px;
    width: 100%;
    max-width: 500px;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
`;

const Header = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    border-bottom: 1px solid ${props => props.theme.colors.border};
`;

const Title = styled.div`
    font-size: 16px;
    font-weight: 500;
    color: ${props => props.theme.colors.textPrimary};
`;

const Content = styled.div`
    padding: 16px;
    overflow-y: auto;
    flex: 1;
`;

interface PopupPanelProps {
    subTitle: string;
    onClose: () => void;
    children: React.ReactNode;
}

export const PopupPanel: React.FC<PopupPanelProps> = ({ subTitle, onClose, children }) => {
    return (
        <Container>
            <Header>
                <Title>{subTitle}</Title>
                <IconButton size="small" onClick={onClose}>
                    <CloseIcon fontSize="small" />
                </IconButton>
            </Header>
            <Content>
                {children}
            </Content>
        </Container>
    );
}; 