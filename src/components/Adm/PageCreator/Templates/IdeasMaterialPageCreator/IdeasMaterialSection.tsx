import { useState, useEffect } from 'react';
import { Box, TextField, Typography, Tabs, Tab, Grid } from '@mui/material';
import { IdeasSection } from 'store/slices/ideas/ideasSlice';
import { IdeasMaterialDocuments } from './IdeasMaterialDocuments';
import { IdeasMaterialImages } from './IdeasMaterialImages';
import { IdeasMaterialVideos } from './IdeasMaterialVideos';
import { MediaItem, MediaType } from 'store/slices/types';

interface IdeasMaterialSectionProps {
  section: IdeasSection;
  onUpdate: (updatedSection: IdeasSection) => void;
  isCreationMode?: boolean;
}

export function IdeasMaterialSection({ section, onUpdate, isCreationMode = false }: IdeasMaterialSectionProps) {
  const [title, setTitle] = useState(section.title || '');
  const [description, setDescription] = useState(section.description || '');
  const [medias, setMedias] = useState<MediaItem[]>(section.medias || []);
  const [tabIndex, setTabIndex] = useState(0);

  useEffect(() => {
    setTitle(section.title || '');
    setDescription(section.description || '');
    setMedias(section.medias || []);
  }, [section]);

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
  };

  const handleChangeTab = (event: React.SyntheticEvent, newValue: number) => {
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
            label={isCreationMode ? "Título da sua ideia brilhante" : "Título da Seção"}
            fullWidth
            value={title}
            onChange={handleTitleChange}
            inputProps={{ 'data-testid': 'ideas-material-title' }}
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
            label={isCreationMode ? "Descreva sua ideia (brincadeira, versículo, história, etc.)" : "Descrição da Seção"}
            fullWidth
            multiline
            rows={4}
            value={description}
            onChange={handleDescriptionChange}
            inputProps={{ 'data-testid': 'ideas-material-description' }}
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
        <Tab data-testid="ideas-material-tab-documents" label="📄 Documentos" />
        <Tab data-testid="ideas-material-tab-images" label="🖼️ Imagens" />
        <Tab data-testid="ideas-material-tab-videos" label="🎥 Vídeos" />
      </Tabs>

      {tabIndex === 0 && (
        <IdeasMaterialDocuments
          documents={documents}
          setDocuments={(docs) => {
            const otherMedias = medias.filter((i) => i.mediaType !== MediaType.DOCUMENT);
            handleMediasChange([...otherMedias, ...docs]);
          }}
        />
      )}
      {tabIndex === 1 && (
        <IdeasMaterialImages
          images={images}
          setImages={(imgs) => {
            const otherMedias = medias.filter((i) => i.mediaType !== MediaType.IMAGE);
            handleMediasChange([...otherMedias, ...imgs]);
          }}
        />
      )}
      {tabIndex === 2 && (
        <IdeasMaterialVideos
          videos={videos}
          setVideos={(vids) => {
            const otherMedias = medias.filter((i) => i.mediaType !== MediaType.VIDEO);
            handleMediasChange([...otherMedias, ...vids]);
          }}
        />
      )}
    </Box>
  );
}
