import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Avatar,
  TextField,
  Button,
  Collapse,
  Snackbar,
  Alert,
  CircularProgress,
  Grid,
  useTheme,
  useMediaQuery,
  Chip,
  Stack,
  IconButton,
} from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store/slices';
import { motion, AnimatePresence } from 'framer-motion';
import CommentIcon from '@mui/icons-material/Comment';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PersonIcon from '@mui/icons-material/Person';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import HomeIcon from '@mui/icons-material/Home';
import SendIcon from '@mui/icons-material/Send';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import api from '@/config/axiosConfig';
import { setComments } from 'store/slices/comment/commentsSlice';

const CommentsSection: React.FC = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const commentsScrollRef = useRef<HTMLDivElement | null>(null);
  const rawComments = useSelector((state: RootState) => state.comments.comments);
  const comments = useMemo(() => rawComments?.filter((c) => c.published) || [], [rawComments]);

  const [formOpen, setFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successSnackbarOpen, setSuccessSnackbarOpen] = useState(false);
  const MAX_COMMENT_LENGTH = 500;

  const [formData, setFormData] = useState({
    name: '',
    comment: '',
    shelter: '',
    neighborhood: '',
  });

  const [errors, setErrors] = useState({
    name: false,
    comment: false,
    shelter: false,
    neighborhood: false,
  });

  const fetchComments = useCallback(async () => {
    try {
      const response = await api.get('/comments/published');
      dispatch(setComments(response.data));
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  }, [dispatch]);

  useEffect(() => {
    if (rawComments !== null) return;
    fetchComments();
  }, [fetchComments, rawComments]);

  const handleSubmit = async () => {
    const newErrors = {
      name: !formData.name.trim(),
      comment: !formData.comment.trim(),
      shelter: !formData.shelter.trim(),
      neighborhood: !formData.neighborhood.trim(),
    };
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;

    setIsSubmitting(true);
    try {
      await api.post('/comments', formData);
      setFormData({ name: '', comment: '', shelter: '', neighborhood: '' });
      setErrors({ name: false, comment: false, shelter: false, neighborhood: false });
      setFormOpen(false);
      setSuccessSnackbarOpen(true);
      await fetchComments();
    } catch (error) {
      console.error('Error sending comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSuccessSnackbarOpen(false);
  };

  const scrollComments = (direction: 'left' | 'right') => {
    if (commentsScrollRef.current) {
      const container = commentsScrollRef.current;
      const cardWidth = isMobile ? 280 : 380;
      const gap = 16;
      const scrollAmount = cardWidth + gap;
      const currentScroll = container.scrollLeft;
      const containerWidth = container.clientWidth;
      
      let targetScroll: number;
      if (direction === 'left') {
        const targetPosition = currentScroll - scrollAmount;
        targetScroll = Math.max(0, targetPosition);
      } else {
        const targetPosition = currentScroll + scrollAmount;
        const maxScroll = container.scrollWidth - containerWidth;
        targetScroll = Math.min(maxScroll, targetPosition);
      }
      
      container.scrollTo({
        left: targetScroll,
        behavior: 'smooth',
      });
    }
  };

  const labels: Record<string, string> = {
    name: 'Nome (obrigatório)',
    comment: 'Comentário (obrigatório)',
    shelter: 'Abrigo (obrigatório)',
    neighborhood: 'Bairro (obrigatório)',
  };

  const placeholders: Record<string, string> = {
    name: 'Seu nome',
    comment: 'Escreva seu comentário aqui...',
    shelter: 'Ex: Abrigo do Amor',
    neighborhood: 'Ex: Jardim das Flores',
  };

  const fieldIcons: Record<string, React.ReactNode> = {
    name: <PersonIcon />,
    comment: <CommentIcon />,
    shelter: <HomeIcon />,
    neighborhood: <LocationOnIcon />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Paper
        elevation={4}
        sx={{
          p: { xs: 2, sm: 2.5, md: 4 },
          mt: 0,
          borderRadius: 3,
          background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, rgba(255, 255, 255, 0.95) 100%)',
          border: '1px solid rgba(25, 118, 210, 0.2)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '4px',
            height: '100%',
            background: 'linear-gradient(180deg, #1976d2 0%, #1565c0 100%)',
            borderRadius: '0 4px 4px 0',
          },
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 200,
            height: 200,
            background: 'rgba(25, 118, 210, 0.05)',
            borderRadius: '50%',
            zIndex: 0,
          }}
        />

        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mb: { xs: 2.5, md: 4 },
            }}
          >
            <Box
              sx={{
                p: { xs: 1, md: 1.5 },
                borderRadius: 2,
                background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: { xs: 1.5, md: 2 },
                boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
              }}
            >
              <CommentIcon sx={{ fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.8rem' } }} />
            </Box>
            <Typography
              variant="h5"
              fontWeight={800}
              sx={{
                fontSize: { xs: '1.1rem', sm: '1.2rem', md: '1.6rem' },
                background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.3px',
              }}
            >
              Comentários dos Professores
            </Typography>
          </Box>

          <Box sx={{ mb: { xs: 2, md: 4 } }}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant="contained"
                size="medium"
                startIcon={<ExpandMoreIcon sx={{ transform: formOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }} />}
                onClick={() => setFormOpen(!formOpen)}
                sx={{
                  mb: { xs: 2.5, md: 3 },
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: { xs: '0.9rem', sm: '0.95rem', md: '1rem' },
                  fontWeight: 600,
                  px: { xs: 2.5, sm: 3, md: 3.5 },
                  py: { xs: 1.1, sm: 1.25, md: 1.5 },
                  minWidth: { xs: 'auto', md: 'auto' },
                  width: { xs: '100%', md: 'auto' },
                  background: formOpen 
                    ? 'linear-gradient(135deg, #d32f2f 0%, #c62828 100%)'
                    : 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                  boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                  '&:hover': {
                    background: formOpen
                      ? 'linear-gradient(135deg, #c62828 0%, #b71c1c 100%)'
                      : 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)',
                    boxShadow: '0 6px 20px rgba(25, 118, 210, 0.4)',
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.3s ease',
                  '& .MuiButton-startIcon': {
                    marginRight: { xs: 0.75, md: 1 },
                    '& svg': {
                      fontSize: { xs: '1.1rem', md: '1.3rem' },
                    },
                  },
                }}
              >
                {formOpen ? 'Fechar' : 'Adicionar Comentário'}
              </Button>
            </motion.div>

            <Collapse in={formOpen}>
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <Card
                  elevation={3}
                  sx={{
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)',
                    border: `2px solid ${theme.palette.primary.main}15`,
                    boxShadow: '0 8px 24px rgba(25, 118, 210, 0.1)',
                  }}
                >
                  <CardContent sx={{ p: { xs: 2.5, sm: 3, md: 4 } }}>
                    <Box sx={{ textAlign: 'center', mb: { xs: 3, md: 4 } }}>
                    <Typography
                      variant="h6"
                        fontWeight={800}
                        sx={{
                          fontSize: { xs: '1.1rem', sm: '1.2rem', md: '1.4rem' },
                          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                          backgroundClip: 'text',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          mb: 1,
                        }}
                    >
                      Compartilhe sua experiência
                    </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontSize: { xs: '0.8rem', md: '0.9rem' } }}
                      >
                        Sua opinião é muito importante para nós
                      </Typography>
                    </Box>

                    <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mb: { xs: 2, md: 3 } }}>
                      {['name', 'comment', 'shelter', 'neighborhood'].map((field) => (
                        <Grid item xs={12} sm={field === 'comment' ? 12 : 6} md={field === 'comment' ? 8 : 4} key={field}>
                          <Box sx={{ position: 'relative' }}>
                            <TextField
                              fullWidth
                              required
                              label={labels[field]}
                              placeholder={placeholders[field]}
                              variant="outlined"
                              size="medium"
                              multiline={field === 'comment'}
                              rows={field === 'comment' ? 5 : 1}
                              value={formData[field as keyof typeof formData]}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (field === 'comment' && value.length > MAX_COMMENT_LENGTH) return;
                                setFormData({ ...formData, [field]: value });
                                if (errors[field as keyof typeof errors] && value.trim()) {
                                  setErrors({ ...errors, [field]: false });
                              }
                              }}
                              error={errors[field as keyof typeof errors]}
                              helperText={
                                field === 'comment' 
                                  ? `${formData.comment.length}/${MAX_COMMENT_LENGTH} caracteres${errors.comment ? ' - Comentário é obrigatório' : ''}`
                                  : errors[field as keyof typeof errors]
                                  ? `${labels[field].split(' ')[0]} é obrigatório`
                                  : ''
                              }
                              InputProps={{
                                startAdornment: (
                                  <Box sx={{ mr: 1, color: 'primary.main', display: 'flex', alignItems: 'center' }}>
                                    {fieldIcons[field]}
                                  </Box>
                                ),
                              }}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: 2,
                                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                  transition: 'all 0.3s ease',
                                  '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 1)',
                                    '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'primary.main',
                                      borderWidth: 2,
                                    },
                                  },
                                  '&.Mui-focused': {
                                    backgroundColor: 'rgba(255, 255, 255, 1)',
                                    boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.1)',
                                  },
                                },
                                '& .MuiInputLabel-root': {
                                  fontSize: { xs: '0.875rem', md: '1rem' },
                                  fontWeight: 500,
                                },
                                '& .MuiOutlinedInput-input': {
                                  fontSize: { xs: '0.875rem', md: '1rem' },
                                  padding: { xs: '14px 16px', md: '16px 18px' },
                                },
                                '& .MuiFormHelperText-root': {
                                  fontSize: { xs: '0.75rem', md: '0.8rem' },
                                  mt: 0.5,
                                },
                              }}
                            />
                          </Box>
                        </Grid>
                      ))}
                    </Grid>

                    <Box sx={{ textAlign: 'center' }}>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          variant="contained"
                          color="primary"
                          size="medium"
                          onClick={handleSubmit}
                          disabled={isSubmitting}
                          endIcon={
                            isSubmitting ? (
                              <CircularProgress color="inherit" size={16} />
                            ) : (
                              <SendIcon sx={{ fontSize: { xs: '0.9rem', md: '1.25rem' } }} />
                            )
                          }
                          sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            fontSize: { xs: '0.9rem', sm: '0.95rem', md: '1rem' },
                            fontWeight: 600,
                            px: { xs: 3, sm: 3.5, md: 5 },
                            py: { xs: 1.1, sm: 1.25, md: 1.5 },
                            minWidth: { xs: '200px', md: 'auto' },
                            background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                            boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                            '&:hover': {
                              background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)',
                              boxShadow: '0 6px 20px rgba(25, 118, 210, 0.4)',
                              transform: 'translateY(-2px)',
                            },
                            '&:disabled': {
                              opacity: 0.7,
                              transform: 'none',
                            },
                            transition: 'all 0.3s ease',
                          }}
                        >
                          {isSubmitting ? 'Enviando...' : 'Enviar Comentário'}
                        </Button>
                      </motion.div>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Collapse>
          </Box>

          <AnimatePresence>
            {comments.length > 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Box
                  sx={{
                  position: 'relative',
                    width: '100%',
                  }}
                >
                  {comments.length > (isMobile ? 1 : 2) && (
                    <>
                      <IconButton
                        onClick={() => scrollComments('left')}
                        sx={{
                          position: 'absolute',
                          left: { xs: -2, sm: 8 },
                          top: '50%',
                          transform: 'translateY(-50%)',
                          bgcolor: 'white',
                    color: theme.palette.primary.main,
                          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                          zIndex: 3,
                          width: { xs: 36, sm: 42, md: 48 },
                          height: { xs: 36, sm: 42, md: 48 },
                          border: `2px solid ${theme.palette.primary.main}20`,
                          '&:hover': {
                            bgcolor: theme.palette.primary.main,
                            color: 'white',
                            transform: 'translateY(-50%) scale(1.1)',
                            boxShadow: `0 6px 20px ${theme.palette.primary.main}40`,
                            borderColor: theme.palette.primary.main,
                  },
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                      >
                        <ChevronLeftIcon sx={{ fontSize: { xs: '1.3rem', sm: '1.5rem', md: '1.75rem' } }} />
                      </IconButton>
                      <IconButton
                        onClick={() => scrollComments('right')}
                        sx={{
                          position: 'absolute',
                          right: { xs: -2, sm: 8 },
                          top: '50%',
                          transform: 'translateY(-50%)',
                          bgcolor: 'white',
                          color: theme.palette.primary.main,
                          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                          zIndex: 3,
                          width: { xs: 36, sm: 42, md: 48 },
                          height: { xs: 36, sm: 42, md: 48 },
                          border: `2px solid ${theme.palette.primary.main}20`,
                          '&:hover': {
                            bgcolor: theme.palette.primary.main,
                            color: 'white',
                            transform: 'translateY(-50%) scale(1.1)',
                            boxShadow: `0 6px 20px ${theme.palette.primary.main}40`,
                            borderColor: theme.palette.primary.main,
                          },
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                      >
                        <ChevronRightIcon sx={{ fontSize: { xs: '1.3rem', sm: '1.5rem', md: '1.75rem' } }} />
                      </IconButton>
                    </>
                  )}

                  <Box
                    ref={commentsScrollRef}
                    sx={{
                      display: 'flex',
                      gap: 2,
                      overflowX: 'auto',
                      overflowY: 'hidden',
                      scrollBehavior: 'smooth',
                      px: { xs: 12, sm: 6, md: 7 },
                      py: 2,
                      scrollSnapType: 'x mandatory',
                      '&::-webkit-scrollbar': {
                        height: 8,
                      },
                      '&::-webkit-scrollbar-track': {
                        background: 'rgba(25, 118, 210, 0.1)',
                        borderRadius: 4,
                      },
                      '&::-webkit-scrollbar-thumb': {
                        background: 'rgba(25, 118, 210, 0.3)',
                        borderRadius: 4,
                    '&:hover': {
                          background: 'rgba(25, 118, 210, 0.5)',
                    },
                  },
                    }}
                  >
                    {comments.map((comment, index) => (
                      <Card
                        key={comment.id}
                        elevation={4}
                        sx={{
                          minWidth: { xs: 280, sm: 340, md: 380 },
                          maxWidth: { xs: 280, sm: 340, md: 380 },
                          minHeight: { xs: 'auto', md: 340 },
                          borderRadius: { xs: 2.5, md: 3 },
                              background: 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)',
                          border: `2px solid ${theme.palette.primary.main}20`,
                          scrollSnapAlign: 'center',
                          scrollSnapStop: 'always',
                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          position: 'relative',
                          overflow: 'hidden',
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '4px',
                            background: 'linear-gradient(90deg, #1976d2 0%, #1565c0 100%)',
                            opacity: 0,
                            transition: 'opacity 0.3s ease',
                          },
                              '&:hover': {
                            transform: { xs: 'none', md: 'translateY(-6px)' },
                                borderColor: theme.palette.primary.main,
                            boxShadow: { xs: '0 4px 12px rgba(25, 118, 210, 0.2)', md: `0 20px 40px ${theme.palette.primary.main}25` },
                            '&::before': {
                              opacity: 1,
                            },
                              },
                            }}
                          >
                        <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 1.5, md: 2 } }}>
                                <Avatar
                                  sx={{
                                background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                                mr: { xs: 1.5, md: 2 },
                                width: { xs: 44, sm: 48, md: 56 },
                                height: { xs: 44, sm: 48, md: 56 },
                                fontSize: { xs: '1.1rem', sm: '1.2rem', md: '1.4rem' },
                                fontWeight: 'bold',
                                boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                                  }}
                                >
                                  {comment.name.charAt(0).toUpperCase()}
                                </Avatar>
                            <Box sx={{ flex: 1 }}>
                                  <Typography
                                    variant="h6"
                                fontWeight={700}
                                    sx={{
                                  fontSize: { xs: '0.95rem', sm: '1.05rem', md: '1.15rem' },
                                      mb: { xs: 0.25, md: 0.5 },
                                  background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                                  backgroundClip: 'text',
                                  WebkitBackgroundClip: 'text',
                                  WebkitTextFillColor: 'transparent',
                                    }}
                                  >
                                    {comment.name}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                sx={{ 
                                  fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.8rem' },
                                  fontWeight: 500,
                                }}
                                  >
                                {new Date(comment.createdAt).toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                })}
                                  </Typography>
                                </Box>
                              </Box>

                          <Box sx={{ flexGrow: 1, mb: { xs: 2, md: 2.5 } }}>
                                <Paper
                              elevation={0}
                                  sx={{
                                p: { xs: 1.75, sm: 2, md: 2.5 },
                                    borderRadius: 2,
                                background: 'linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%)',
                                borderLeft: `4px solid ${theme.palette.primary.main}`,
                                position: 'relative',
                                '&::before': {
                                  content: '"\\201C"',
                                  position: 'absolute',
                                  top: { xs: 8, md: 12 },
                                  left: { xs: 12, md: 16 },
                                  fontSize: { xs: '3rem', md: '4rem' },
                                  color: theme.palette.primary.main,
                                  opacity: 0.15,
                                  fontFamily: 'Georgia, serif',
                                  lineHeight: 1,
                                  zIndex: 0,
                                },
                                  }}
                                >
                                  <Typography
                                    variant="body1"
                                    sx={{
                                  fontSize: { xs: '0.875rem', sm: '0.95rem', md: '1.05rem' },
                                  lineHeight: { xs: 1.6, md: 1.8 },
                                      color: 'text.primary',
                                      fontStyle: 'italic',
                                  position: 'relative',
                                  zIndex: 1,
                                    }}
                                  >
                                {comment.comment}
                                  </Typography>
                                </Paper>
                              </Box>

                              <Box sx={{ mt: 'auto' }}>
                            <Stack direction="row" spacing={{ xs: 0.75, md: 1 }} flexWrap="wrap" useFlexGap>
                                  <Chip
                                icon={<HomeIcon sx={{ fontSize: { xs: '0.8rem', md: '0.9rem' } }} />}
                                    label={comment.shelter}
                                    size="small"
                                    sx={{
                                  background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                                      color: 'white',
                                  fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.8rem' },
                                  height: { xs: 26, sm: 28, md: 30 },
                                  fontWeight: 600,
                                  boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)',
                                      '& .MuiChip-label': {
                                    px: { xs: 1.25, md: 1.5 },
                                  },
                                  '& .MuiChip-icon': {
                                    color: 'white',
                                      },
                                    }}
                                  />
                                  <Chip
                                icon={<LocationOnIcon sx={{ fontSize: { xs: '0.8rem', md: '0.9rem' } }} />}
                                    label={comment.neighborhood}
                                    size="small"
                                    sx={{
                                  background: 'linear-gradient(135deg, #7b1fa2 0%, #6a1b9a 100%)',
                                      color: 'white',
                                  fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.8rem' },
                                  height: { xs: 26, sm: 28, md: 30 },
                                  fontWeight: 600,
                                  boxShadow: '0 2px 8px rgba(123, 31, 162, 0.3)',
                                      '& .MuiChip-label': {
                                    px: { xs: 1.25, md: 1.5 },
                                  },
                                  '& .MuiChip-icon': {
                                    color: 'white',
                                      },
                                    }}
                                  />
                                </Stack>
                              </Box>
                            </CardContent>
                          </Card>
                    ))}
                  </Box>
                </Box>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
              >
                <Paper
                  elevation={1}
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%)',
                  }}
                >
                  <CommentIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                    Nenhum comentário publicado ainda
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Envie o seu e ele aparecerá após avaliação.
                  </Typography>
                </Paper>
              </motion.div>
            )}
          </AnimatePresence>
        </Box>
      </Paper>

      <Snackbar
        open={successSnackbarOpen}
        autoHideDuration={8000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity="success"
          sx={{
            width: '100%',
            borderRadius: 2,
            boxShadow: 6,
          }}
        >
          ✅ Comentário enviado com sucesso! Ele será avaliado antes de ser publicado.
        </Alert>
      </Snackbar>
    </motion.div>
  );
};

export default CommentsSection;
