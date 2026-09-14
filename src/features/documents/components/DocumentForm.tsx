import React, { useEffect, useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Grid,
  CircularProgress,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Paper,
  IconButton,
  Tooltip,
  Alert,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InsertLinkIcon from '@mui/icons-material/InsertLink';
import DescriptionIcon from '@mui/icons-material/Description';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';

import { useDispatch, useSelector } from 'react-redux';
import { setDocumentData, setMedia, clearDocumentData, clearMedia } from 'store/slices/documents/documentSlice';
import { RootState } from 'store/slices';
import { MediaItem, MediaType, MediaUploadType, MediaPlatform } from '../types';
import { createDocument, updateDocument } from '../api';

interface Props {
  isEditing: boolean;
  onSuccess: () => void;
  onCancel?: () => void;
}

const DocumentForm: React.FC<Props> = ({ isEditing, onSuccess, onCancel }) => {
  const dispatch = useDispatch();
  const documentData = useSelector((s: RootState) => s.document.documentData);
  const mediaData = useSelector((s: RootState) => s.document.media);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [mediaTitle, setMediaTitle] = useState('');
  const [mediaDescription, setMediaDescription] = useState('');
  const [uploadType, setUploadType] = useState<MediaUploadType>(MediaUploadType.UPLOAD);
  const [url, setUrl] = useState('');
  const [platformType, setPlatformType] = useState<MediaPlatform>(MediaPlatform.ANY);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isEditing && documentData) {
      setName(documentData.name || '');
      setDescription(documentData.description || '');
      if (mediaData) {
        setMediaTitle(mediaData.title || documentData.name || '');
        setMediaDescription(mediaData.description || '');
        setUploadType(mediaData.uploadType || MediaUploadType.UPLOAD);
        setUrl(mediaData.url || '');
        setPlatformType(mediaData.platformType ?? MediaPlatform.ANY);
      }
    } else {
      dispatch(clearDocumentData());
      dispatch(clearMedia());
      resetForm();
    }
  }, [isEditing, documentData, mediaData, dispatch]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setMediaTitle('');
    setMediaDescription('');
    setUploadType(MediaUploadType.UPLOAD);
    setUrl('');
    setPlatformType(MediaPlatform.ANY);
    setFile(null);
    setErrorMsg(null);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!mediaTitle || mediaTitle === name) {
      setMediaTitle(val);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('O nome do documento é obrigatório.');
      return;
    }

    if (uploadType === MediaUploadType.LINK && !url.trim()) {
      setErrorMsg('A URL do documento é obrigatória para links externos.');
      return;
    }

    if (uploadType === MediaUploadType.UPLOAD && !file && (!isEditing || !mediaData?.isLocalFile)) {
      setErrorMsg('Por favor, selecione um arquivo (PDF, DOCX ou DOC).');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      const finalMediaTitle = mediaTitle.trim() || name.trim();

      const mediaDto: MediaItem = {
        id: isEditing && mediaData?.id ? mediaData.id : undefined,
        title: finalMediaTitle,
        description: mediaDescription || description || '',
        uploadType,
        mediaType: MediaType.DOCUMENT,
        isLocalFile: uploadType === MediaUploadType.UPLOAD,
        url: uploadType === MediaUploadType.LINK ? url.trim() : '',
        platformType: uploadType === MediaUploadType.LINK ? platformType : undefined,
        originalName: uploadType === MediaUploadType.UPLOAD && file ? file.name : undefined,
        size: uploadType === MediaUploadType.UPLOAD && file ? file.size : undefined,
        fileField: uploadType === MediaUploadType.UPLOAD ? 'file' : undefined,
      };

      const documentDto = {
        ...(isEditing && documentData?.id ? { id: documentData.id } : {}),
        name: name.trim(),
        description: description.trim(),
        media: mediaDto,
      };

      if (uploadType === MediaUploadType.UPLOAD && file) {
        formData.append('file', file);
      }
      formData.append('documentData', JSON.stringify(documentDto));

      if (isEditing && documentData?.id) {
        await updateDocument(documentData.id, formData);
      } else {
        await createDocument(formData);
      }

      dispatch(setDocumentData(documentDto));
      dispatch(setMedia(mediaDto));
      onSuccess();
      if (!isEditing) resetForm();
    } catch {
      setErrorMsg('Erro ao salvar documento. Verifique os dados e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ pt: 1 }}>
      {errorMsg && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setErrorMsg(null)}>
          {errorMsg}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Seção 1: Informações do Documento */}
        <Grid item xs={12}>
          <Typography variant="subtitle2" fontWeight={700} color="primary.main" textTransform="uppercase" letterSpacing={0.5} mb={1}>
            1. Informações Básicas
          </Typography>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Nome do Documento *"
            placeholder="Ex: Regulamento Interno 2026"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            required
            variant="outlined"
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Descrição do Documento"
            placeholder="Breve resumo sobre o conteúdo do documento..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            rows={2}
          />
        </Grid>

        {/* Seção 2: Tipo de Anexo / Mídia */}
        <Grid item xs={12}>
          <Typography variant="subtitle2" fontWeight={700} color="primary.main" textTransform="uppercase" letterSpacing={0.5} mt={1} mb={1}>
            2. Anexo do Documento
          </Typography>

          <Paper
            variant="outlined"
            sx={{
              p: 2.5,
              borderRadius: 3,
              bgcolor: 'background.neutral',
              borderColor: 'divider',
            }}
          >
            <Stack spacing={2.5}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography variant="body2" fontWeight={600} color="text.secondary">
                  Forma de Disponibilização:
                </Typography>

                <ToggleButtonGroup
                  value={uploadType}
                  exclusive
                  onChange={(_, val) => val && setUploadType(val)}
                  size="small"
                  sx={{
                    bgcolor: 'background.paper',
                    '& .MuiToggleButton-root': {
                      px: 2,
                      py: 0.75,
                      fontWeight: 600,
                      textTransform: 'none',
                    },
                  }}
                >
                  <ToggleButton value={MediaUploadType.UPLOAD}>
                    <CloudUploadIcon fontSize="small" sx={{ mr: 1 }} />
                    Upload de Arquivo
                  </ToggleButton>
                  <ToggleButton value={MediaUploadType.LINK}>
                    <InsertLinkIcon fontSize="small" sx={{ mr: 1 }} />
                    Link Externo
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>

              {uploadType === MediaUploadType.UPLOAD ? (
                <Box>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 3,
                      borderStyle: 'dashed',
                      borderWidth: 2,
                      borderColor: file ? 'primary.main' : 'divider',
                      bgcolor: file ? 'primary.50' : 'background.paper',
                      textAlign: 'center',
                      borderRadius: 3,
                      transition: 'all 0.2s',
                    }}
                  >
                    {file ? (
                      <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
                        <CheckCircleIcon color="primary" sx={{ fontSize: 32 }} />
                        <Box textAlign="left">
                          <Typography variant="subtitle2" fontWeight={700}>
                            {file.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Tamanho: {formatFileSize(file.size)}
                          </Typography>
                        </Box>
                        <Tooltip title="Remover arquivo selecionado">
                          <IconButton size="small" color="error" onClick={() => setFile(null)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    ) : isEditing && mediaData?.isLocalFile ? (
                      <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
                        <DescriptionIcon color="primary" sx={{ fontSize: 32 }} />
                        <Box textAlign="left">
                          <Typography variant="subtitle2" fontWeight={700}>
                            {mediaData.originalName || mediaData.title || 'Arquivo atual anexado'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Arquivo já salvo no servidor
                          </Typography>
                        </Box>
                        <Button component="label" size="small" variant="outlined" startIcon={<CloudUploadIcon />}>
                          Substituir
                          <input type="file" hidden accept=".pdf,.doc,.docx" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                        </Button>
                      </Stack>
                    ) : (
                      <Stack spacing={1} alignItems="center">
                        <CloudUploadIcon sx={{ fontSize: 44, color: 'text.secondary' }} />
                        <Typography variant="body2" fontWeight={600}>
                          Clique para selecionar um arquivo do computador
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Formatos aceitos: PDF, DOC, DOCX
                        </Typography>
                        <Button
                          component="label"
                          variant="contained"
                          size="small"
                          startIcon={<CloudUploadIcon />}
                          sx={{ mt: 1, borderRadius: 2 }}
                        >
                          Selecionar Arquivo
                          <input
                            type="file"
                            hidden
                            accept=".pdf,.doc,.docx"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                          />
                        </Button>
                      </Stack>
                    )}
                  </Paper>
                </Box>
              ) : (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={8}>
                    <TextField
                      fullWidth
                      label="URL do Documento (Link) *"
                      placeholder="https://drive.google.com/file/d/..."
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth>
                      <InputLabel>Plataforma</InputLabel>
                      <Select
                        value={platformType}
                        label="Plataforma"
                        onChange={(e) => setPlatformType(e.target.value as MediaPlatform)}
                      >
                        <MenuItem value={MediaPlatform.GOOGLE_DRIVE}>Google Drive</MenuItem>
                        <MenuItem value={MediaPlatform.ONEDRIVE}>OneDrive</MenuItem>
                        <MenuItem value={MediaPlatform.DROPBOX}>Dropbox</MenuItem>
                        <MenuItem value={MediaPlatform.ANY}>Outro Link</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              )}
            </Stack>
          </Paper>
        </Grid>

        {/* Botões de Ação */}
        <Grid item xs={12} display="flex" justifyContent="flex-end" gap={1.5} pt={2}>
          {onCancel && (
            <Button
              variant="outlined"
              color="inherit"
              onClick={onCancel}
              disabled={loading}
              startIcon={<CloseIcon />}
              sx={{ borderRadius: 2, px: 3 }}
            >
              Cancelar
            </Button>
          )}
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            sx={{ borderRadius: 2, px: 4, fontWeight: 700 }}
          >
            {loading ? 'Salvando...' : isEditing ? 'Atualizar Documento' : 'Salvar Documento'}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DocumentForm;
