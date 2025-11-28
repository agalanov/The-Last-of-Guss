import React from 'react';
import { Box } from '@mui/material';

interface GooseImageProps {
    onClick?: () => void;
    disabled?: boolean;
}

// Компонент изображения гуся (ASCII-арт)
export const GooseImage: React.FC<GooseImageProps> = ({ onClick, disabled }) => {
    return (
        <Box
            onClick={disabled ? undefined : onClick}
            sx={{
                cursor: disabled ? 'default' : 'pointer',
                userSelect: 'none',
                textAlign: 'center',
                fontFamily: 'monospace',
                fontSize: '14px',
                lineHeight: 1.2,
                color: 'text.primary',
                transition: 'transform 0.1s',
                '&:hover': disabled ? {} : {
                    transform: 'scale(1.05)',
                },
                '&:active': disabled ? {} : {
                    transform: 'scale(0.95)',
                },
            }}
        >
            <pre style={{ margin: 0 }}>
                {`            ░░░░░░░░░░░░░░░
          ░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░
        ░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░
        ░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░
      ░░░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░
    ░░▒▒▒▒░░░░▓▓▓▓▓▓▓▓▓▓▓▓░░░░▒▒▒▒░░
    ░░▒▒▒▒▒▒▒▒░░░░░░░░░░░░▒▒▒▒▒▒▒▒░░
    ░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░
      ░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░
        ░░░░░░░░░░░░░░░░░░░░░░░░░░`}
            </pre>
        </Box>
    );
};
