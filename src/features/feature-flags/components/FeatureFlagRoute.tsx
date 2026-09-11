import type { ReactElement } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Box, CircularProgress, Typography, Paper } from '@mui/material';
import { useIsFeatureEnabled, FeatureFlagKeys } from '@/features/feature-flags';
import {
    selectFeatureFlagsLastFetched,
    selectFeatureFlagsLoading,
} from '@/store/selectors/featureFlagsSelectors';

interface FeatureFlagRouteProps {
    featureKey: FeatureFlagKeys | string;
    children: ReactElement;
    fallbackPath?: string;
    showMessage?: boolean;
}

export const FeatureFlagRoute = ({
    featureKey,
    children,
    fallbackPath = '/',
    showMessage = false,
}: FeatureFlagRouteProps) => {
    const isEnabled = useIsFeatureEnabled(featureKey);
    const loading = useSelector(selectFeatureFlagsLoading);
    const lastFetched = useSelector(selectFeatureFlagsLastFetched);

    // Until the flags have actually been fetched once, "disabled" is unknown,
    // not false — redirecting here would bounce the user off a valid deep link
    // just because the request had not landed yet.
    if (loading || lastFetched === null) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '400px',
                    p: 3,
                }}
                data-testid="feature-flag-route-loading"
            >
                <CircularProgress aria-label="Carregando funcionalidades" />
            </Box>
        );
    }

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
                    data-testid="feature-flag-route-disabled"
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

    return (
        <Box data-testid="feature-flag-route-enabled" sx={{ display: 'contents' }}>
            {children}
        </Box>
    );
};
