import React from 'react';
import { Navigate } from 'react-router-dom';
import { Box, Typography, Paper } from '@mui/material';
import { useIsFeatureEnabled } from '@/features/feature-flags';

interface FeatureFlagRouteProps {
    featureKey: string;
    children: React.ReactElement;
    fallbackPath?: string;
    showMessage?: boolean;
}

export const FeatureFlagRoute: React.FC<FeatureFlagRouteProps> = ({
    featureKey,
    children,
    fallbackPath = '/',
    showMessage = false,
}) => {
    const isEnabled = useIsFeatureEnabled(featureKey);

    if (!isEnabled) {
        if (showMessage) {
            return (
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        minHeight: '400px',
                        p: 3,
                    }}
                >
                    <Paper
                        elevation={3}
                        sx={{
                            p: 4,
                            maxWidth: 500,
                            textAlign: 'center',
                        }}
                    >
                        <Typography variant="h5" gutterBottom>
                            Funcionalidade Indisponível
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Esta funcionalidade está temporariamente desabilitada.
                        </Typography>
                    </Paper>
                </Box>
            );
        }

        return <Navigate to={fallbackPath} replace />;
    }

    return children;
};
