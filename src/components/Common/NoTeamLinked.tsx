import React from 'react';
import { Box, Paper, Typography, Button, Alert, Avatar, Container, Link, Chip } from '@mui/material';
import GroupRemoveIcon from '@mui/icons-material/GroupRemove';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import PhoneIcon from '@mui/icons-material/Phone';
import WhatsApp from '@mui/icons-material/WhatsApp';
import { motion } from 'framer-motion';
import { SUPPORT_CONTACTS, buildTeamLinkingWhatsappLink } from '@/utils/whatsapp';

interface NoTeamLinkedProps {
    title?: string;
    description?: string;
    onBack?: () => void;
    showBackButton?: boolean;
}
const NoTeamLinked: React.FC<NoTeamLinkedProps> = ({
    title = 'Nenhum abrigo vinculado',
    description = 'Você ainda não está vinculado a nenhum abrigo. Entre em contato com o administrador do sistema para ser associado a um abrigo.',
    onBack,
    showBackButton = true,
}) => {
    return (
        <Box
            sx={{
                minHeight: '100vh',
                bgcolor: 'background.default',
                py: 4,
            }}
        >
            <Container maxWidth="md">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <Paper
                        elevation={2}
                        sx={{
                            p: { xs: 3, md: 5 },
                            borderRadius: 3,
                            textAlign: 'center',
                        }}
                    >
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'center',
                                mb: 3,
                            }}
                        >
                            <Avatar
                                sx={{
                                    width: { xs: 80, md: 100 },
                                    height: { xs: 80, md: 100 },
                                    bgcolor: 'info.light',
                                    mb: 2,
                                }}
                            >
                                <GroupRemoveIcon sx={{ fontSize: { xs: 40, md: 50 } }} />
                            </Avatar>
                        </Box>

                        <Typography
                            variant="h5"
                            fontWeight={700}
                            gutterBottom
                            sx={{ mb: 2 }}
                        >
                            {title}
                        </Typography>

                        <Typography
                            variant="body1"
                            color="text.secondary"
                            sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}
                        >
                            {description}
                        </Typography>

                        <Alert
                            severity="info"
                            icon={<InfoOutlined />}
                            sx={{
                                borderRadius: 2,
                                textAlign: 'left',
                                maxWidth: 600,
                                mx: 'auto',
                            }}
                        >
                            <Typography variant="body2">
                                <strong>O que fazer?</strong>
                                <br />
                                Entre em contato com o administrador do sistema para solicitar a vinculação a um abrigo. Após a vinculação, você poderá visualizar e gerenciar as informações aqui.
                            </Typography>

                            <Box sx={{ mt: 2.5, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                                <Typography variant="body2" fontWeight={600} sx={{ mb: 2 }}>
                                    Contatos para suporte:
                                </Typography>
                                <Box
                                    sx={{
                                        display: 'grid',
                                        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                                        gap: 2
                                    }}
                                >
                                    <Link
                                        href={buildTeamLinkingWhatsappLink(SUPPORT_CONTACTS.PHONE_1)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        underline="none"
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1.5,
                                            p: 1.5,
                                            borderRadius: 2,
                                            bgcolor: 'rgba(37, 211, 102, 0.08)',
                                            border: '1px solid rgba(37, 211, 102, 0.3)',
                                            transition: 'all 0.2s',
                                            '&:hover': {
                                                bgcolor: 'rgba(37, 211, 102, 0.15)',
                                                transform: 'translateY(-2px)',
                                                boxShadow: '0 4px 12px rgba(37, 211, 102, 0.2)'
                                            }
                                        }}
                                    >
                                        <WhatsApp sx={{ fontSize: 28, color: '#25D366', flexShrink: 0 }} />
                                        <Box sx={{ minWidth: 0 }}>
                                            <Typography variant="body2" fontWeight={600} color="text.primary" noWrap>
                                                {SUPPORT_CONTACTS.FORMATTED_1}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', md: 'block' } }}>
                                                Clique para enviar mensagem
                                            </Typography>
                                        </Box>
                                    </Link>
                                    <Link
                                        href={buildTeamLinkingWhatsappLink(SUPPORT_CONTACTS.PHONE_2)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        underline="none"
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1.5,
                                            p: 1.5,
                                            borderRadius: 2,
                                            bgcolor: 'rgba(37, 211, 102, 0.08)',
                                            border: '1px solid rgba(37, 211, 102, 0.3)',
                                            transition: 'all 0.2s',
                                            '&:hover': {
                                                bgcolor: 'rgba(37, 211, 102, 0.15)',
                                                transform: 'translateY(-2px)',
                                                boxShadow: '0 4px 12px rgba(37, 211, 102, 0.2)'
                                            }
                                        }}
                                    >
                                        <WhatsApp sx={{ fontSize: 28, color: '#25D366', flexShrink: 0 }} />
                                        <Box sx={{ minWidth: 0 }}>
                                            <Typography variant="body2" fontWeight={600} color="text.primary" noWrap>
                                                {SUPPORT_CONTACTS.FORMATTED_2}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', md: 'block' } }}>
                                                Clique para enviar mensagem
                                            </Typography>
                                        </Box>
                                    </Link>
                                </Box>
                            </Box>
                        </Alert>

                        {showBackButton && onBack && (
                            <Button variant="outlined" onClick={onBack} sx={{ mt: 3 }}>
                                Voltar
                            </Button>
                        )}
                    </Paper>
                </motion.div>
            </Container>
        </Box>
    );
};

export default NoTeamLinked;
