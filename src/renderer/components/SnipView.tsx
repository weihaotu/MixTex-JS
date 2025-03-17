import React from 'react';
import styled from 'styled-components';
import { Button, CircularProgress } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import 'katex/dist/katex.min.css';
import katex from 'katex';

// 引入 Fira Code 字体
import '@fontsource/fira-code';

const Container = styled.div`
    display: flex;
    flex-direction: column;
    padding: 16px;
    gap: 16px;
    flex: 1;
    overflow-y: auto;
`;

const ImageContainer = styled.div`
    background: ${props => props.theme.colors.surface};
    border: 1px solid ${props => props.theme.colors.border};
    border-radius: 8px;
    padding: 16px;
    display: flex;
    justify-content: center;
    align-items: center;
`;

const Image = styled.img`
    max-width: 100%;
    max-height: 300px;
    height: auto;
    border-radius: 4px;
    object-fit: contain;
`;

const TextContainer = styled.div`
    background: ${props => props.theme.colors.surface};
    border: 1px solid ${props => props.theme.colors.border};
    border-radius: 8px;
    padding: 16px;
    font-family: 'Consolas', monospace;
    font-size: 14px;
    line-height: 1.5;
    white-space: pre-wrap;
    word-break: break-all;
    color: ${props => props.theme.colors.textPrimary};
    overflow-x: auto;

    .katex-display {
        margin: 0;
        overflow-x: auto;
    }
`;

const LoadingContainer = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    height: 200px;
`;

const CopyOptionsContainer = styled.div`
    background: ${props => props.theme.colors.surface};
    border: 1px solid ${props => props.theme.colors.border};
    border-radius: 8px;
    padding: 16px;
`;

const CopyOptionsList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
`;

const CopyOption = styled.div`
    display: flex;
    align-items: center;
    padding: 10px;
    background: ${props => props.theme.colors.background};
    border-radius: 4px;
    gap: 10px;
`;

const CopyOptionText = styled.div`
    flex: 1;
    font-family: 'Fira Code', monospace;
    font-size: 14px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

interface SnipViewProps {
    originalImage: string;
    latexText: string;
    isProcessing: boolean;
}

const SnipView: React.FC<SnipViewProps> = ({
    originalImage,
    latexText,
    isProcessing
}) => {
    const copyOptions = [
        {
            label: '行内公式',
            content: latexText ? `${latexText}` : ''
        },
        {
            label: '单行公式',
            content: latexText ? `$${latexText}$` : ''
        },
        {
            label: '双美元符号',
            content: latexText ? `$$\n${latexText}\n$$` : ''
        },
        {
            label: '自定义环境',
            content: latexText ? `\\begin{equation}\n${latexText}\n\\end{equation}` : ''
        }
    ];

    const handleCopy = (content: string) => {
        navigator.clipboard.writeText(content);
    };

    // LaTeX渲染函数
    const renderLatex = (tex: string) => {
        tex = `\\begin{aligned}\n${tex}\n\\end{aligned}`
        try {
            return katex.renderToString(tex, {
                displayMode: true,
                throwOnError: false,
                strict: false
            });
        } catch (error) {
            console.error('LaTeX rendering error:', error);
            return tex;
        }
    };

    return (
        <Container>
            <ImageContainer>
                <Image src={originalImage} alt="Original" />
            </ImageContainer>
            {isProcessing ? (
                <LoadingContainer>
                    <CircularProgress size={32} />
                </LoadingContainer>
            ) : (
                <TextContainer
                    dangerouslySetInnerHTML={{ __html: renderLatex(latexText) }}
                />
            )}
            <CopyOptionsContainer>
                <CopyOptionsList>
                    {copyOptions.map((option, index) => (
                        <CopyOption key={index}>
                            <CopyOptionText>
                                {option.content.replace(/\n/g, ' ') || ''}
                            </CopyOptionText>
                            <Button
                                variant="contained"
                                size="small"
                                startIcon={<ContentCopyIcon />}
                                onClick={() => handleCopy(option.content)}
                                disabled={!option.content}
                            >
                                复制
                            </Button>
                        </CopyOption>
                    ))}
                </CopyOptionsList>
            </CopyOptionsContainer>
        </Container>
    );
};

export default SnipView; 