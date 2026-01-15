import { useState, useEffect, useRef } from 'react';
import { Box, TextField, Typography, Tabs, Tab, Grid, Snackbar, Alert } from '@mui/material';
import { IdeasSection } from 'store/slices/ideas/ideasSlice';
import { IdeasMaterialDocumentsUser } from './IdeasMaterialDocumentsUser';
import { IdeasMaterialImagesUser } from './IdeasMaterialImagesUser';
import { IdeasMaterialVideosUser } from './IdeasMaterialVideosUser';
import { MediaItem, MediaType } from 'store/slices/types';

interface IdeasMaterialSectionUserProps {
  section: IdeasSection;
  onUpdate: (updatedSection: IdeasSection) => void;
}

export function IdeasMaterialSectionUser({ section, onUpdate }: IdeasMaterialSectionUserProps) {
  const [title, setTitle] = useState(section.title || '');
  const [description, setDescription] = useState(section.description || '');
  const [medias, setMedias] = useState<MediaItem[]>(section.medias || []);
  const [tabIndex, setTabIndex] = useState(0);
  const [pendingMedia, setPendingMedia] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const lastMediaCountRef = useRef(medias.length);

  useEffect(() => {
    setTitle(section.title || '');
    setDescription(section.description || '');
    setMedias(section.medias || []);
  }, [section]);

  useEffect(() => {
    if (medias.length > 0) {
      const mediaCounters = {
        [MediaType.DOCUMENT]: 0,
        [MediaType.IMAGE]: 0,
        [MediaType.VIDEO]: 0,
      };

      const updatedMedias = medias.map((media) => {
        mediaCounters[media.mediaType as MediaType.DOCUMENT | MediaType.IMAGE | MediaType.VIDEO]++;
        const mediaNumber = mediaCounters[media.mediaType as MediaType.DOCUMENT | MediaType.IMAGE | MediaType.VIDEO];
        let generatedTitle = '';
        let generatedDescription = '';

        if (media.mediaType === MediaType.DOCUMENT) {
          generatedTitle = title.trim()
            ? `Documento ${mediaNumber} da ideia "${title}"`
            : `Documento ${mediaNumber}`;
          generatedDescription = title.trim()
            ? `Documento ${mediaNumber} para auxiliar na Ideia "${title}"`
            : `Documento ${mediaNumber}`;
        } else if (media.mediaType === MediaType.IMAGE) {
          generatedTitle = title.trim()
            ? `Imagem ${mediaNumber} da ideia "${title}"`
            : `Imagem ${mediaNumber}`;
          generatedDescription = title.trim()
            ? `Imagem ${mediaNumber} para auxiliar na Ideia "${title}"`
            : `Imagem ${mediaNumber}`;
        } else if (media.mediaType === MediaType.VIDEO) {
          generatedTitle = title.trim()
            ? `Vídeo ${mediaNumber} da ideia "${title}"`
            : `Vídeo ${mediaNumber}`;
          generatedDescription = title.trim()
            ? `Vídeo ${mediaNumber} para auxiliar na Ideia "${title}"`
            : `Vídeo ${mediaNumber}`;
        }

        return {
          ...media,
          title: generatedTitle,
          description: generatedDescription,
        };
      });

      setMedias(updatedMedias);
      onUpdate({ ...section, title, description, medias: updatedMedias });
    }
  }, [title]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    onUpdate({ ...section, title: newTitle, description, medias });
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDescription = e.target.value;
    setDescription(newDescription);
    onUpdate({ ...section, title, description: newDescription, medias });
  };

  const handleMediasChange = (newMedias: MediaItem[]) => {
    setMedias(newMedias);
    onUpdate({ ...section, title, description, medias: newMedias });

    if (newMedias.length > lastMediaCountRef.current) {
      setPendingMedia(false);
    }
    lastMediaCountRef.current = newMedias.length;
  };

  const [shakeButton, setShakeButton] = useState(false);

  const handleChangeTab = (event: React.SyntheticEvent, newValue: number) => {
    if (pendingMedia) {
      setShowAlert(true);
      setShakeButton(true);
      setTimeout(() => setShakeButton(false), 820);
      return;
    }
    setTabIndex(newValue);
  };

  const documents = medias.filter((i) => i.mediaType === MediaType.DOCUMENT);
  const images = medias.filter((i) => i.mediaType === MediaType.IMAGE);
  const videos = medias.filter((i) => i.mediaType === MediaType.VIDEO);

  return (
    <Box>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={5}>
          <TextField
            label="Título da sua ideia brilhante"
            fullWidth
            value={title}
            onChange={handleTitleChange}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                transition: 'all 0.2s ease',
                '&:hover:not(.Mui-error)': {
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'primary.main',
                  },
                },
                '&.Mui-focused': {
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderWidth: 2,
                  },
                },
              },
            }}
          />
        </Grid>
        <Grid item xs={12} md={7}>
          <TextField
            label="Descreva sua ideia (brincadeira, versículo, história, etc.)"
            fullWidth
            multiline
            rows={4}
            value={description}
            onChange={handleDescriptionChange}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                transition: 'all 0.2s ease',
                '&:hover:not(.Mui-error)': {
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'primary.main',
                  },
                },
                '&.Mui-focused': {
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderWidth: 2,
                  },
                },
              },
            }}
          />
        </Grid>
      </Grid>

      <Typography
        variant="h6"
        sx={{
          mb: 3,
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        📎 Itens de Mídia
      </Typography>

      <Tabs
        value={tabIndex}
        onChange={handleChangeTab}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          mb: 3,
          borderBottom: 1,
          borderColor: 'divider',
          '& .MuiTabs-indicator': {
            height: 3,
            borderRadius: '3px 3px 0 0',
          },
          '& .MuiTab-root': {
            fontSize: { xs: '0.875rem', md: '1rem' },
            fontWeight: 600,
            textTransform: 'none',
            minHeight: 56,
            px: { xs: 2, md: 3 },
            '&.Mui-selected': {
              color: 'primary.main',
            },
          },
        }}
      >
        <Tab label="📄 Documentos" />
        <Tab label="🖼️ Imagens" />
        <Tab label="🎥 Vídeos" />
      </Tabs>

      {tabIndex === 0 && (
        <IdeasMaterialDocumentsUser
          documents={documents}
          setDocuments={(docs) => {
            const otherMedias = medias.filter((i) => i.mediaType !== MediaType.DOCUMENT);
            handleMediasChange([...otherMedias, ...docs]);
          }}
          ideaTitle={title}
          onPendingChange={setPendingMedia}
          shakeButton={shakeButton}
        />
      )}
      {tabIndex === 1 && (
        <IdeasMaterialImagesUser
          images={images}
          setImages={(imgs) => {
            const otherMedias = medias.filter((i) => i.mediaType !== MediaType.IMAGE);
            handleMediasChange([...otherMedias, ...imgs]);
          }}
          ideaTitle={title}
          onPendingChange={setPendingMedia}
          shakeButton={shakeButton}
        />
      )}
      {tabIndex === 2 && (
        <IdeasMaterialVideosUser
          videos={videos}
          setVideos={(vids) => {
            const otherMedias = medias.filter((i) => i.mediaType !== MediaType.VIDEO);
            handleMediasChange([...otherMedias, ...vids]);
          }}
          ideaTitle={title}
          onPendingChange={setPendingMedia}
          shakeButton={shakeButton}
        />
      )}

      <Snackbar
        open={showAlert}
        autoHideDuration={5000}
        onClose={() => setShowAlert(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ mb: 4, zIndex: 1400 }}
      >
        <Alert
          onClose={() => setShowAlert(false)}
          severity="warning"
          sx={{
            width: '100%',
            fontSize: '1rem',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
          }}
        >
          Você selecionou um arquivo mas não adicionou à lista. Clique em "Adicionar" antes de trocar de aba.
        </Alert>
      </Snackbar>
    </Box>
  );
}
