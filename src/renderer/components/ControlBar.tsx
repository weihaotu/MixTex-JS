import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { SettingsPanel } from './SettingsPanel';
import { FeedbackPanel } from './FeedbackPanel';
import { AboutPanel } from './AboutPanel';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { IconButton, Menu, MenuItem, InputBase, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import DeleteIcon from '@mui/icons-material/Delete';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import { AnimatePresence, motion } from 'framer-motion';

const Bar = styled.div`
    height: 48px;
    background: ${props => props.theme.colors.surface};
    border-bottom: 1px solid ${props => props.theme.colors.border};
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 8px;
    flex-shrink: 0;
`;

const LeftSection = styled.div`
    display: flex;
    align-items: center;
`;

const CenterSection = styled.div`
    flex: 1;
    display: flex;
    justify-content: center;
    padding: 0 16px;
    max-width: 400px;
`;

const RightSection = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
`;

const SearchInput = styled(InputBase)`
  font-size: 14px;
  background: ${props => props.theme.colors.surface};
  border-radius: 16px;
  padding: 4px 12px;
  width: 100%;
  min-width: 200px;
  max-width: 300px;
  height: 32px;
  border: 1px solid ${props => props.theme.colors.border};

  & .MuiInputBase-input {
    padding: 0;
  }

  &:hover {
    border-color: ${props => props.theme.colors.borderHover};
    background: ${props => props.theme.colors.hover};
  }

  &.Mui-focused {
    border-color: ${props => props.theme.colors.primary};
    background: ${props => props.theme.colors.background};
    box-shadow: 0 0 0 1px ${props => props.theme.colors.primary};
  }
`;

const StyledMenu = styled(Menu)`
  & .MuiPaper-root {
    background-color: ${props => props.theme.colors.surface};
    min-width: 120px;
    border: 1px solid ${props => props.theme.colors.border};
    border-radius: 4px;
    margin-top: 4px;
  }
`;

const StyledMenuItem = styled(MenuItem)`
  font-size: 14px;
  padding: 8px 16px;
  
  &:hover {
    background-color: ${props => props.theme.colors.hover};
  }
`;

const PopupContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  background: rgba(0, 0, 0, 0);
  transition: background 0.2s ease;

  &.active {
    background: rgba(0, 0, 0, 0.3);
    pointer-events: auto;
  }
`;

const AnimatedPopup = styled(motion.div)`
  pointer-events: auto;
`;

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
`;

interface ControlBarProps {
    currentView: 'list' | 'snip';
    onViewChange: (view: 'list' | 'snip') => void;
    searchQuery?: string;
    onSearchChange?: (query: string) => void;
    onRefresh?: () => void;
    onDeleteCurrentSnip?: () => void;
}

export const ControlBar: React.FC<ControlBarProps> = ({
    currentView,
    onViewChange,
    searchQuery = '',
    onSearchChange,
    onRefresh,
    onDeleteCurrentSnip
}) => {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);
    const [showAbout, setShowAbout] = useState(false);
    const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        const handleClosePopups = () => {
            setIsSettingsOpen(false);
            setShowFeedback(false);
            setShowAbout(false);
            setMenuAnchorEl(null);
        };

        window.electron.on('close-popups', handleClosePopups);

        return () => {
            window.electron.off('close-popups', handleClosePopups);
        };
    }, []);

    const handleSettingsClick = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation();
        setMenuAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setMenuAnchorEl(null);
    };

    const handleSnip = async () => {
        try {
            const result = await window.electron.screenshot.capture();
            if (result.success && result.data) {
                // 切换到 snip 视图
                onViewChange('snip');
                // TODO: 显示 OCR 结果
            } else if (result.error) {
                console.error('Screenshot failed:', result.error);
            }
        } catch (error) {
            console.error('Screenshot error:', error);
        }
    };

    const handleClear = () => {
        if (currentView === 'snip' && onDeleteCurrentSnip) {
            setShowDeleteConfirm(true);
        }
    };

    const handleConfirmDelete = () => {
        setShowDeleteConfirm(false);
        if (onDeleteCurrentSnip) {
            onDeleteCurrentSnip();
        }
    };

    return (
        <>
            <Bar>
                <LeftSection>
                    {currentView === 'snip' ? (
                        <IconButton
                            size="small"
                            onClick={() => onViewChange('list')}
                            title="返回列表"
                        >
                            <ArrowBackIcon fontSize="small" />
                        </IconButton>
                    ) : (
                        <IconButton
                            size="small"
                            onClick={handleSnip}
                            title="截图"
                        >
                            <CameraAltIcon fontSize="small" />
                        </IconButton>
                    )}
                </LeftSection>

                <CenterSection>
                    {currentView === 'list' && (
                        <SearchInput
                            placeholder="搜索公式..."
                            value={searchQuery}
                            onChange={(e) => onSearchChange?.(e.target.value)}
                            startAdornment={<SearchIcon fontSize="small" style={{ marginRight: 8 }} />}
                        />
                    )}
                </CenterSection>

                <RightSection>
                    {currentView === 'list' && (
                        <IconButton
                            size="small"
                            onClick={onRefresh}
                            title="刷新"
                        >
                            <RefreshIcon fontSize="small" />
                        </IconButton>
                    )}
                    {currentView === 'snip' && (
                        <IconButton
                            size="small"
                            onClick={handleClear}
                            title="删除当前公式"
                        >
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    )}
                    <IconButton
                        size="small"
                        onClick={handleSettingsClick}
                        title="设置"
                    >
                        <SettingsIcon fontSize="small" />
                    </IconButton>
                </RightSection>
            </Bar>

            <StyledMenu
                anchorEl={menuAnchorEl}
                open={Boolean(menuAnchorEl)}
                onClose={handleMenuClose}
                onClick={e => e.stopPropagation()}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
            >
                <StyledMenuItem onClick={() => {
                    handleMenuClose();
                    setIsSettingsOpen(true);
                }}>
                    设置
                </StyledMenuItem>
                <StyledMenuItem onClick={() => {
                    handleMenuClose();
                    setShowFeedback(true);
                }}>
                    反馈
                </StyledMenuItem>
                <StyledMenuItem onClick={() => {
                    handleMenuClose();
                    setShowAbout(true);
                }}>
                    关于
                </StyledMenuItem>
            </StyledMenu>

            <PopupContainer className={isSettingsOpen || showFeedback || showAbout ? 'active' : ''}>
                <AnimatePresence>
                    {isSettingsOpen && (
                        <AnimatedPopup
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.2 }}
                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        >
                            <SettingsPanel onClose={() => setIsSettingsOpen(false)} />
                        </AnimatedPopup>
                    )}

                    {showFeedback && (
                        <AnimatedPopup
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.2 }}
                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        >
                            <FeedbackPanel onClose={() => setShowFeedback(false)} />
                        </AnimatedPopup>
                    )}

                    {showAbout && (
                        <AnimatedPopup
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.2 }}
                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        >
                            <AboutPanel onClose={() => setShowAbout(false)} />
                        </AnimatedPopup>
                    )}
                </AnimatePresence>
            </PopupContainer>

            <DeleteConfirmDialog
                open={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleConfirmDelete}
            />
        </>
    );
}; 