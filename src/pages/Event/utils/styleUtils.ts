export const getEstiloCard = (status: string, theme: any) => {
    switch (status) {
        case 'hoje':
            return {
                borderLeft: '8px solid #ef4444',
                background: 'linear-gradient(135deg, #fef2f2 0%, #ffffff 100%)',
                boxShadow: '0 8px 32px rgba(239, 68, 68, 0.15)',
            };
        case 'amanha':
            return {
                borderLeft: '8px solid #f59e0b',
                background: 'linear-gradient(135deg, #fffbeb 0%, #ffffff 100%)',
                boxShadow: '0 8px 32px rgba(245, 158, 11, 0.15)',
            };
        case 'semana':
            return {
                borderLeft: `8px solid ${theme.palette.secondary.main}`,
                background: 'linear-gradient(135deg, #f0f9ff 0%, #ffffff 100%)',
                boxShadow: '0 8px 32px rgba(59, 130, 246, 0.15)',
            };
        case 'mes':
            return {
                borderLeft: `8px solid ${theme.palette.primary.main}`,
                background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
                boxShadow: '0 8px 32px rgba(99, 102, 241, 0.15)',
            };
        case 'futuro':
            return {
                borderLeft: '8px solid #10b981',
                background: 'linear-gradient(135deg, #ecfdf5 0%, #ffffff 100%)',
                boxShadow: '0 8px 32px rgba(16, 185, 129, 0.15)',
            };
        case 'ontem':
            return {
                borderLeft: '8px solid #8b5cf6',
                background: 'linear-gradient(135deg, #faf5ff 0%, #ffffff 100%)',
                boxShadow: '0 8px 32px rgba(139, 92, 246, 0.15)',
            };
        case 'semana_passada':
            return {
                borderLeft: '8px solid #6b7280',
                background: 'linear-gradient(135deg, #f9fafb 0%, #ffffff 100%)',
                boxShadow: '0 8px 32px rgba(107, 114, 128, 0.15)',
            };
        case 'mes_passado':
        case 'antigo':
            return {
                borderLeft: '8px solid #9ca3af',
                background: 'linear-gradient(135deg, #f3f4f6 0%, #ffffff 100%)',
                boxShadow: '0 8px 32px rgba(156, 163, 175, 0.15)',
            };
        default:
            return {
                borderLeft: '8px solid #e5e7eb',
                background: 'linear-gradient(135deg, #f9fafb 0%, #ffffff 100%)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
            };
    }
};

export const getChipProps = (status: string, slotType?: string) => {
    if (slotType === 'hoje') {
        return { label: 'HOJE', color: 'error' as const, variant: 'filled' as const };
    }
    if (slotType === 'anterior') {
        return { label: 'ANTERIOR', color: 'default' as const, variant: 'outlined' as const };
    }
    if (slotType === 'proximo') {
        return { label: 'PRÓXIMO', color: 'secondary' as const, variant: 'filled' as const };
    }
    if (slotType === 'posterior') {
        return { label: 'POSTERIOR', color: 'primary' as const, variant: 'filled' as const };
    }

    switch (status) {
        case 'hoje':
            return { label: 'HOJE', color: 'error' as const, variant: 'filled' as const };
        case 'amanha':
            return { label: 'AMANHÃ', color: 'warning' as const, variant: 'filled' as const };
        case 'semana':
            return { label: 'ESTA SEMANA', color: 'secondary' as const, variant: 'filled' as const };
        case 'mes':
            return { label: 'ESTE MÊS', color: 'primary' as const, variant: 'filled' as const };
        case 'futuro':
            return { label: 'FUTURO', color: 'success' as const, variant: 'outlined' as const };
        case 'ontem':
            return { label: 'ONTEM', color: 'secondary' as const, variant: 'outlined' as const };
        case 'semana_passada':
            return { label: 'SEMANA PASSADA', color: 'default' as const, variant: 'outlined' as const };
        case 'mes_passado':
            return { label: 'MÊS PASSADO', color: 'default' as const, variant: 'outlined' as const };
        case 'antigo':
            return { label: 'ANTIGO', color: 'default' as const, variant: 'outlined' as const };
        default:
            return { label: 'EVENTO', color: 'default' as const, variant: 'outlined' as const };
    }
};
