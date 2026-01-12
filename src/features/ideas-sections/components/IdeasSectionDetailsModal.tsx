import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography,
  Stack, Paper, Grid, Box, useMediaQuery, Chip, Divider, IconButton, Tooltip, Avatar
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { Close, Download, PlayArrow, Image as ImageIcon, AudioFile, VideoFile, PictureAsPdf, Person, Email, Phone, ContentCopy, WhatsApp } from '@mui/icons-material';
import { IdeasSection } from '../types';
import { formatDatePtBr, getMediaTypeIcon, getMediaTypeLabel, formatFileSize } from '../utils';
import { buildIdeasWhatsappLink, justDigits } from '@/utils/whatsapp';

interface Props {
  section: IdeasSection | null;
  open: boolean;
  onClose: () => void;
}

export default function IdeasSectionDetailsModal({ section, open, onClose }: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleWhatsApp = (phone: string, userName?: string, ideaTitle?: string) => {
    const link = buildIdeasWhatsappLink(userName, ideaTitle, phone);
    if (link) window.open(link, '_blank');
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  };

  const getMediaIcon = (mediaType: string) => {
    switch (mediaType) {
      case 'image':
        return <ImageIcon />;
      case 'video':
        return <VideoFile />;
      case 'audio':
        return <AudioFile />;
      case 'document':
        return <PictureAsPdf />;
      default:
        return <Download />;
    }
  };

  const renderMediaPreview = (media: any) => {
    if (media.mediaType === 'image') {
      return (
        <img
          src={media.url}
          alt={media.title}
          style={{
            width: '100%',
            height: '200px',
            objectFit: 'cover',
            borderRadius: 8,
          }}
        />
      );
    } else if (media.mediaType === 'video') {
      return (
        <Box
          sx={{
            width: '100%',
            height: '200px',
            bgcolor: 'grey.900',
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
          }}
        >
          <PlayArrow fontSize="large" />
        </Box>
      );
    } else {
      return (
        <Box
          sx={{
            width: '100%',
            height: '200px',
            bgcolor: 'grey.100',
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 1,
          }}
        >
          {getMediaIcon(media.mediaType)}
          <Typography variant="body2" color="text.secondary">
            {media.originalName || media.title}
          </Typography>
        </Box>
      );
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      aria-labelledby="dialog-title"
      sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}
    >
      <DialogTitle 
        id="dialog-title"
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pr: 1 
        }}
      >
        Detalhes da Seção de Ideias
        <Tooltip title="Fechar">
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Tooltip>
      </DialogTitle>
      
      <DialogContent sx={{ pb: 1 }}>
        {section ? (
          <Stack spacing={3} mt={0.5}>
            <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom color="primary">Informações Gerais</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Stack spacing={1}>
                    <Typography variant="body1"><strong>Título:</strong> {section.title || 'Não informado'}</Typography>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                      <strong>Descrição:</strong> {section.description || 'Não informado'}
                    </Typography>
                    <Box>
                      <Typography variant="body1" component="span"><strong>Status:</strong> </Typography>
                      <Chip 
                        label={section.public ? 'Público' : 'Privado'} 
                        color={section.public ? 'success' : 'default'}
                        size="small"
                      />
                    </Box>
                  </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Stack spacing={1}>
                    <Typography variant="body1"><strong>Criado em:</strong> {formatDatePtBr(section.createdAt)}</Typography>
                    <Typography variant="body1"><strong>Atualizado em:</strong> {formatDatePtBr(section.updatedAt)}</Typography>
                  </Stack>
                </Grid>
              </Grid>
            </Paper>

            {section.user && (
              <Paper 
                elevation={0} 
                sx={{ 
                  p: { xs: 2, sm: 3 }, 
                  border: '1px solid', 
                  borderColor: 'divider', 
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.03)} 0%, ${alpha(theme.palette.secondary.main, 0.03)} 100%)`,
                }}
              >
                <Typography variant="h6" gutterBottom color="primary">
                  👤 Compartilhado por
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <Avatar
                    sx={{
                      width: 56,
                      height: 56,
                      bgcolor: theme.palette.primary.main,
                      fontSize: '1.25rem',
                      fontWeight: 'bold',
                    }}
                  >
                    {getInitials(section.user.name)}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 200 }}>
                    <Typography variant="h6" fontWeight="bold">
                      {section.user.name}
                    </Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} mt={1} flexWrap="wrap">
                      <Chip
                        icon={<Email fontSize="small" />}
                        label={section.user.email}
                        size="small"
                        variant="outlined"
                        onClick={() => window.open(`mailto:${section.user!.email}`)}
                        deleteIcon={
                          <Tooltip title="Copiar email">
                            <ContentCopy fontSize="small" />
                          </Tooltip>
                        }
                        onDelete={() => handleCopy(section.user!.email)}
                        sx={{ 
                          cursor: 'pointer',
                          '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) }
                        }}
                      />
                      {section.user.phone && (
                        <Chip
                          icon={<WhatsApp fontSize="small" sx={{ color: '#25D366' }} />}
                          label={section.user.phone}
                          size="small"
                          variant="outlined"
                          onClick={() => handleWhatsApp(section.user!.phone!, section.user!.name, section.title)}
                          deleteIcon={
                            <Tooltip title="Copiar telefone">
                              <ContentCopy fontSize="small" />
                            </Tooltip>
                          }
                          onDelete={() => handleCopy(section.user!.phone!)}
                          sx={{ 
                            cursor: 'pointer',
                            borderColor: '#25D366',
                            color: '#25D366',
                            '&:hover': { bgcolor: alpha('#25D366', 0.1) }
                          }}
                        />
                      )}
                    </Stack>
                  </Box>
                </Box>
              </Paper>
            )}

            <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom color="primary">
                Mídias ({section.medias?.length || 0})
              </Typography>
              
              {(section.medias?.length ?? 0) > 0 ? (
                <Grid container spacing={2}>
                  {section.medias.map((media, index) => (
                    <Grid item xs={12} sm={6} md={4} key={media.id}>
                      <Paper 
                        elevation={1} 
                        sx={{ 
                          p: 2, 
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'divider'
                        }}
                      >
                        {renderMediaPreview(media)}
                        
                        <Box mt={2}>
                          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                            {media.title}
                          </Typography>
                          
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {media.description}
                          </Typography>
                          
                          <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5}>
                            <Chip
                              size="small"
                              label={`${getMediaTypeIcon(media.mediaType)} ${getMediaTypeLabel(media.mediaType)}`}
                              variant="outlined"
                              color="primary"
                            />
                            <Chip
                              size="small"
                              label={media.uploadType === 'upload' ? 'Upload' : 'Link'}
                              variant="filled"
                              color={media.uploadType === 'upload' ? 'success' : 'info'}
                            />
                            {media.isLocalFile && media.size && (
                              <Chip
                                size="small"
                                label={formatFileSize(media.size)}
                                variant="outlined"
                              />
                            )}
                          </Stack>
                          
                          {media.platformType && media.platformType !== 'ANY' && (
                            <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                              Plataforma: {media.platformType}
                            </Typography>
                          )}
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Nenhuma mídia disponível.
                </Typography>
              )}
            </Paper>
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary">Nenhuma seção selecionada.</Typography>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 1 : 1.5,
          alignItems: isMobile ? 'stretch' : 'center',
          p: { xs: 2, sm: 2.5 },
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          color="primary"
          aria-label="Fechar modal"
          sx={{ width: isMobile ? '100%' : 'auto' }}
        >
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
