import React, { useState } from 'react';
import styled from 'styled-components';
import { IconButton } from '@mui/material';
import MinimizeIcon from '@mui/icons-material/Remove';
import MaximizeIcon from '@mui/icons-material/CropSquare';
import CloseIcon from '@mui/icons-material/Close';

const Handle = styled.div`
    height: 32px;
    background: ${props => props.theme.colors.surface};
    border-bottom: 1px solid ${props => props.theme.colors.border};
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 8px;
    -webkit-app-region: no-drag;
    user-select: none;
    flex-shrink: 0;
`;

const DragArea = styled.div`
    flex: 1;
    height: 100%;
    display: flex;
    align-items: center;
    -webkit-app-region: drag;
`;

const Title = styled.div`
    font-size: 14px;
    color: ${props => props.theme.colors.textPrimary};
    margin-left: 8px;
`;

const WindowControls = styled.div`
    display: flex;
    gap: 4px;
`;

const ControlButton = styled(IconButton)`
    padding: 4px;
    &:hover {
        background-color: ${props => props.theme.colors.hover};
    }
`;

const CloseButton = styled(ControlButton)`
    &:hover {
        background-color: ${props => props.theme.colors.error};
        color: white;
    }
`;

interface DragHandleProps {
    onDragStart: (e: React.MouseEvent) => void;
    onDrag: (e: React.MouseEvent) => void;
    title?: string;
}

export const DragHandle: React.FC<DragHandleProps> = ({
    onDragStart,
    onDrag,
    title = 'TexOCR'
}) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        onDragStart(e);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) {
            onDrag(e);
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleMinimize = async () => {
        try {
            await window.electron.window.minimize();
        } catch (error) {
            console.error('Failed to minimize window:', error);
        }
    };

    const handleMaximize = async () => {
        try {
            await window.electron.window.toggleMaximize();
        } catch (error) {
            console.error('Failed to toggle maximize window:', error);
        }
    };

    const handleClose = async () => {
        try {
            await window.electron.window.close();
        } catch (error) {
            console.error('Failed to close window:', error);
        }
    };

    return (
        <Handle
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            <DragArea onMouseDown={handleMouseDown}>
                <Title>{title}</Title>
            </DragArea>
            <WindowControls>
                <ControlButton
                    size="small"
                    onClick={() => void handleMinimize()}
                    title="最小化"
                >
                    <MinimizeIcon fontSize="small" />
                </ControlButton>
                <ControlButton
                    size="small"
                    onClick={() => void handleMaximize()}
                    title="最大化"
                >
                    <MaximizeIcon fontSize="small" />
                </ControlButton>
                <CloseButton
                    size="small"
                    onClick={() => void handleClose()}
                    title="关闭"
                >
                    <CloseIcon fontSize="small" />
                </CloseButton>
            </WindowControls>
        </Handle>
    );
}; 