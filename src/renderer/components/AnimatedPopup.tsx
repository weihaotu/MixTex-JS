import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const StyledMotionDiv = styled(motion.div)`
    background: ${props => props.theme.colors.surface};
    border: 1px solid ${props => props.theme.colors.border};
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    overflow: hidden;
    max-width: 100%;
    max-height: 100%;
    display: flex;
    flex-direction: column;
`;

interface AnimatedPopupProps {
    children: React.ReactNode;
    initial?: any;
    animate?: any;
    exit?: any;
    transition?: any;
    onClick?: (e: React.MouseEvent) => void;
}

export const AnimatedPopup: React.FC<AnimatedPopupProps> = ({
    children,
    initial,
    animate,
    exit,
    transition,
    onClick
}) => {
    return (
        <StyledMotionDiv
            initial={initial}
            animate={animate}
            exit={exit}
            transition={transition}
            onClick={onClick}
        >
            {children}
        </StyledMotionDiv>
    );
}; 