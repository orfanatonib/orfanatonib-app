import React from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Chip,
    CircularProgress,
    Alert,
    Grid,
    Button,
} from '@mui/material';
import { useFeatureFlags } from '../hooks/useFeatureFlags';
import type { FeatureFlag } from '@/store/slices/feature-flags/featureFlagsSlice';

export const FeatureFlagsPage: React.FC = () => {
    const { flags, loading, error, refetch, clearError: handleClearError } = useFeatureFlags({
        autoFetch: true,
    });

    if (loading && flags.length === 0) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" component="h1">
                    Feature Flags ({flags.length})
                </Typography>
                <Button variant="contained" onClick={refetch} disabled={loading}>
                    {loading ? 'Refreshing...' : 'Refresh'}
                </Button>
            </Box>

            {error && (
                <Alert severity="error" onClose={handleClearError} sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            <Grid container spacing={3}>
                {flags.map((flag: FeatureFlag) => (
                    <Grid item xs={12} md={6} lg={4} key={flag.id}>
                        <Card>
                            <CardContent>
                                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <Typography variant="h6" component="h2">
                                        {flag.name}
                                    </Typography>
                                    <Chip
                                        label={flag.enabled ? 'Enabled' : 'Disabled'}
                                        color={flag.enabled ? 'success' : 'default'}
                                        size="small"
                                    />
                                </Box>

                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    {flag.description}
                                </Typography>

                                <Box sx={{ mb: 1 }}>
                                    <Typography variant="caption" color="text.secondary">
                                        Key:
                                    </Typography>
                                    <Typography variant="body2" component="code" sx={{ ml: 1, fontFamily: 'monospace' }}>
                                        {flag.key}
                                    </Typography>
                                </Box>

                                <Box sx={{ mb: 1 }}>
                                    <Typography variant="caption" color="text.secondary">
                                        Environment:
                                    </Typography>
                                    <Chip label={flag.environment} size="small" sx={{ ml: 1 }} />
                                </Box>

                                {flag.metadata && (
                                    <Box sx={{ mt: 2 }}>
                                        <Typography variant="caption" color="text.secondary">
                                            Metadata:
                                        </Typography>
                                        <Box
                                            component="pre"
                                            sx={{
                                                mt: 1,
                                                p: 1,
                                                bgcolor: 'grey.100',
                                                borderRadius: 1,
                                                fontSize: '0.75rem',
                                                overflow: 'auto',
                                            }}
                                        >
                                            {JSON.stringify(flag.metadata, null, 2)}
                                        </Box>
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {flags.length === 0 && !loading && (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Typography variant="h6" color="text.secondary">
                        No feature flags found
                    </Typography>
                </Box>
            )}
        </Box>
    );
};
