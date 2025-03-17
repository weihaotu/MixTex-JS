import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { DragHandle } from './DragHandle';
import { ControlBar } from './ControlBar';
import { OCRResult } from '@/shared/types';
import SnipView from './SnipView';
import { SnipList } from './SnipList';
import { AnimatePresence } from 'framer-motion';
import { SettingsPanel } from './SettingsPanel';
import { FeedbackPanel } from './FeedbackPanel';
import { AboutPanel } from './AboutPanel';
import { AnimatedPopup } from './AnimatedPopup';

const WindowContainer = styled.div`
    width: 100%;
    height: 100%;
    background: ${props => props.theme.colors.background};
    border: 1px solid ${props => props.theme.colors.border};
    border-radius: 8px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    position: relative;
`;

const ContentContainer = styled.div`
    flex: 1;
    overflow: hidden;
    position: relative;
    min-height: 0;
    display: flex;
    flex-direction: column;
`;

// 创建一个全屏遮罩层
const Overlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
`;

// 弹出窗口的容器
const PopupWrapper = styled.div`
    max-width: 90%;
    max-height: 90%;
    display: flex;
    flex-direction: column;
`;

// 添加一个用于显示调试图片的容器
const DebugImageContainer = styled.div`
  position: fixed;
  bottom: 10px;
  right: 10px;
  background: white;
  padding: 5px;
  border: 1px solid #ccc;
`;

const DebugImage = styled.img`
    max-width: 200px;
    max-height: 200px;
    object-fit: contain;
`;

const ImageLabel = styled.div`
    font-size: 12px;
    color: #666;
    text-align: center;
`;

export const MainWindow: React.FC = () => {
    const [output, setOutput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [originalImage, setOriginalImage] = useState<string>('');
    const [currentView, setCurrentView] = useState<'list' | 'snip'>('list');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentSnipId, setCurrentSnipId] = useState<string | null>(null);
    const [debugImages, setDebugImages] = useState<{
        original?: string;
        processed?: string;
    }>({});
    const lastPosition = useRef({ x: 0, y: 0 });
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);
    const [showAbout, setShowAbout] = useState(false);

    useEffect(() => {
        // 添加全局点击事件监听器
        const handleGlobalClick = () => {
            // 发送关闭弹出窗口的消息
            window.electron.window.closePopups();
        };

        window.addEventListener('click', handleGlobalClick);

        // 监听OCR结果
        const handleOcrResult = (data: OCRResult) => {
            console.log('Received OCR result:', {
                text: data.text,
                hasImage: !!data.image,
                hasProcessedImage: !!data.processedImage
            });

            // 先设置所有状态
            setOutput(data.text);
            setIsProcessing(false);

            // 设置原始图片
            if (data.image) {
                setOriginalImage(data.image);
            }

            // 更新调试图像
            setDebugImages(prev => ({
                ...prev,
                processed: data.processedImage
            }));

            // 如果是新的 snip，设置其 ID
            if (data.id) {
                setCurrentSnipId(data.id);
            }

            // 最后再切换视图
            setCurrentView('snip');
        };

        // 监听OCR错误
        const handleOcrError = (error: string) => {
            console.error('OCR Error:', error);
            setIsProcessing(false);
        };

        // Add listeners
        window.electron.on('ocr-result', handleOcrResult);
        window.electron.on('ocr-error', handleOcrError);

        // Cleanup
        return () => {
            window.removeEventListener('click', handleGlobalClick);
            window.electron.off('ocr-result', handleOcrResult);
            window.electron.off('ocr-error', handleOcrError);
        };
    }, []);

    const handleDragStart = (e: React.MouseEvent) => {
        lastPosition.current = { x: e.clientX, y: e.clientY };
    };

    const handleDrag = (e: React.MouseEvent) => {
        const deltaX = e.clientX - lastPosition.current.x;
        const deltaY = e.clientY - lastPosition.current.y;
        window.electron.window.move(deltaX, deltaY);
        lastPosition.current = { x: e.clientX, y: e.clientY };
    };

    const handleRefresh = async () => {
        // TODO: 实现刷新功能
        console.log('Refreshing snip list...');
    };

    const handleDeleteCurrentSnip = async () => {
        console.log('Deleting snip:', currentSnipId);
        if (currentSnipId) {
            try {
                await window.electron.snipHistory.delete(currentSnipId);
                // 清除当前状态
                setOutput('');
                setOriginalImage('');
                setCurrentSnipId(null);
                setDebugImages({});
                // 删除成功后再切换视图
                setCurrentView('list');
            } catch (error) {
                console.error('Failed to delete snip:', error);
            }
        }
    };

    // 处理弹出窗口的关闭
    const handleClosePopups = () => {
        setIsSettingsOpen(false);
        setShowFeedback(false);
        setShowAbout(false);
    };

    return (
        <WindowContainer>
            <DragHandle
                onDragStart={handleDragStart}
                onDrag={handleDrag}
                title={`TexOCR - ${currentView === 'list' ? 'Snip List' : 'Snip View'}`}
            />
            <ControlBar
                currentView={currentView}
                onViewChange={setCurrentView}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onRefresh={handleRefresh}
                onDeleteCurrentSnip={handleDeleteCurrentSnip}
            />
            <ContentContainer>
                {currentView === 'list' ? (
                    <SnipList
                        onSnipSelect={(snip) => {
                            setOutput(snip.latex);
                            setOriginalImage(snip.image);
                            setCurrentSnipId(snip.id);
                            if (snip.processedImage) {
                                setDebugImages(prev => ({
                                    ...prev,
                                    processed: snip.processedImage
                                }));
                            }
                            setCurrentView('snip');
                        }}
                        searchQuery={searchQuery}
                    />
                ) : (
                    <SnipView
                        originalImage={originalImage}
                        latexText={output}
                        isProcessing={isProcessing}
                    />
                )}
            </ContentContainer>

            {/* 弹出窗口 */}
            {(isSettingsOpen || showFeedback || showAbout) && (
                <Overlay onClick={handleClosePopups}>
                    <PopupWrapper>
                        <AnimatePresence>
                            {isSettingsOpen && (
                                <AnimatedPopup
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.2 }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <SettingsPanel onClose={handleClosePopups} />
                                </AnimatedPopup>
                            )}

                            {showFeedback && (
                                <AnimatedPopup
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.2 }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <FeedbackPanel onClose={handleClosePopups} />
                                </AnimatedPopup>
                            )}

                            {showAbout && (
                                <AnimatedPopup
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.2 }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <AboutPanel onClose={handleClosePopups} />
                                </AnimatedPopup>
                            )}
                        </AnimatePresence>
                    </PopupWrapper>
                </Overlay>
            )}
        </WindowContainer>
    );
}; 