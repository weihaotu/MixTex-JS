import React from 'react';
import styled from 'styled-components';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';

const StyledDialog = styled(Dialog)`
    & .MuiDialog-paper {
        background-color: ${props => props.theme.colors.surface};
        border: 1px solid ${props => props.theme.colors.border};
        border-radius: 8px;
        min-width: 300px;
    }

    & .MuiDialogTitle-root {
        color: ${props => props.theme.colors.textPrimary};
    }

    & .MuiDialogContent-root {
        color: ${props => props.theme.colors.textSecondary};
        padding: 16px 24px;
    }

    & .MuiBackdrop-root {
        background-color: rgba(0, 0, 0, 0.3);
    }
`;

interface DeleteConfirmDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
    open,
    onClose,
    onConfirm
}) => {
    return (
        <StyledDialog
            open={open}
            onClose={onClose}
            onClick={e => e.stopPropagation()}
            disablePortal={false}
            container={document.body}
        >
            <DialogTitle>确认删除</DialogTitle>
            <DialogContent>
                确定要删除这条记录吗？此操作无法撤销。
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={onClose}
                    color="inherit"
                    size="small"
                >
                    取消
                </Button>
                <Button
                    onClick={onConfirm}
                    color="error"
                    variant="contained"
                    size="small"
                >
                    删除
                </Button>
            </DialogActions>
        </StyledDialog>
    );
}; 