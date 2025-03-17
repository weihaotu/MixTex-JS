import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Close';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { snipHistoryApi } from '../api/snipHistory';
import type { SnipItem } from '../../shared/types';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';

const Container = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden;
    background: ${props => props.theme.colors.background};
`;

const ListContainer = styled.div`
    flex: 1;
    overflow-y: auto;
    padding: 8px;
`;

const SnipItem = styled.div`
    display: flex;
    align-items: flex-start;
    padding: 12px;
    border: 1px solid ${props => props.theme.colors.border};
    border-radius: 8px;
    margin-bottom: 8px;
    position: relative;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
        background: ${props => props.theme.colors.hover};
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
`;

const ImageContainer = styled.div`
    flex: 1;
    margin-right: 16px;
`;

const SnipImage = styled.img`
    max-width: 100%;
    height: auto;
    border-radius: 4px;
`;

const TimeInfo = styled.div`
    font-size: 12px;
    color: ${props => props.theme.colors.textSecondary};
    margin-top: 8px;
`;

const StatusDot = styled.div`
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: #ccc;
    position: absolute;
    right: 12px;
    top: 12px;

    &.active {
        background-color: #4caf50;
    }
`;

const StatusDotWrapper: React.FC<{ active?: boolean }> = ({ active }) => (
    <StatusDot className={active ? 'active' : ''} />
);

const DeleteButton = styled(IconButton)`
    position: absolute;
    right: 8px;
    top: 8px;
    opacity: 0;
    transition: opacity 0.2s;
    padding: 4px;

    ${SnipItem}:hover & {
        opacity: 1;
    }

    &:hover {
        color: ${props => props.theme.colors.error};
    }
`;

const LoadingContainer = styled.div`
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
`;

const EmptyContainer = styled.div`
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 16px;
    color: ${props => props.theme.colors.textSecondary};
`;

interface SnipListProps {
    onSnipSelect: (snip: SnipItem) => void;
    searchQuery?: string;
}

export const SnipList: React.FC<SnipListProps> = ({ onSnipSelect, searchQuery = '' }) => {
    const [snips, setSnips] = useState<SnipItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [snipToDelete, setSnipToDelete] = useState<string | null>(null);

    // 加载历史记录
    useEffect(() => {
        loadSnips();
    }, []);

    // 搜索功能
    useEffect(() => {
        if (searchQuery) {
            searchSnips(searchQuery);
        } else {
            loadSnips();
        }
    }, [searchQuery]);

    const loadSnips = async () => {
        try {
            setIsLoading(true);
            const items = await snipHistoryApi.getAll();
            setSnips(items);
        } catch (error) {
            console.error('Failed to load snips:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const searchSnips = async (query: string) => {
        try {
            setIsLoading(true);
            const items = await snipHistoryApi.search(query);
            setSnips(items);
        } catch (error) {
            console.error('Failed to search snips:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setSnipToDelete(id);
        setShowDeleteConfirm(true);
    };

    const handleConfirmDelete = async () => {
        if (snipToDelete) {
            try {
                await snipHistoryApi.delete(snipToDelete);
                setSnips(prevSnips => prevSnips.filter(snip => snip.id !== snipToDelete));
            } catch (error) {
                console.error('Failed to delete snip:', error);
            }
        }
        setShowDeleteConfirm(false);
        setSnipToDelete(null);
    };

    if (isLoading) {
        return (
            <Container>
                <LoadingContainer>
                    加载中...
                </LoadingContainer>
            </Container>
        );
    }

    return (
        <Container>
            <ListContainer>
                {snips.length === 0 ? (
                    <EmptyContainer>
                        {searchQuery ? '没有找到匹配的公式' : '暂无历史记录'}
                    </EmptyContainer>
                ) : (
                    snips.map(snip => (
                        <SnipItem key={snip.id} onClick={() => onSnipSelect(snip)}>
                            <ImageContainer>
                                <SnipImage src={snip.image} alt="Formula" />
                                <TimeInfo>
                                    {formatDistanceToNow(snip.timestamp, { locale: zhCN, addSuffix: true })}
                                </TimeInfo>
                            </ImageContainer>
                            <StatusDotWrapper active={snip.active} />
                            <DeleteButton
                                size="small"
                                onClick={(e) => handleDelete(e, snip.id)}
                            >
                                <DeleteIcon fontSize="small" />
                            </DeleteButton>
                        </SnipItem>
                    ))
                )}
            </ListContainer>

            {/* 使用 Portal 渲染确认对话框，确保它在 DOM 树的顶层 */}
            <DeleteConfirmDialog
                open={showDeleteConfirm}
                onClose={() => {
                    setShowDeleteConfirm(false);
                    setSnipToDelete(null);
                }}
                onConfirm={handleConfirmDelete}
            />
        </Container>
    );
}; 