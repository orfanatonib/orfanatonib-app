import React, { useState, ReactElement } from 'react';
import { useDispatch } from 'react-redux';
import { clearImageData } from '@/store/slices/image/imageSlice';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Container,
  Alert,
  IconButton,
  Tooltip,
  Divider,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';

import VideoPageCreator from '@/components/Adm/PageCreator/Templates/VideoPageCreator/VideoPageCreator';
import PhotoPageCreator from '@/components/Adm/PageCreator/Templates/ImagePageCreator/ImagePageCreator';
import MeditationPageCreator from '@/components/Adm/PageCreator/Templates/MeditationPageCreator/MeditationPageCreator';
import VisitMaterialPageCreator from '@/components/Adm/PageCreator/Templates/VisitMaterialPageCreator/VisitMaterialPageCreator';
import { IdeasMaterialPageCreator } from '@/components/Adm/PageCreator/Templates/IdeasMaterialPageCreator/IdeasMaterialPageCreator';
import BackHeader from '@/components/common/header/BackHeader';

import { PageTemplateType, PageTemplateOption } from './types';
import { PAGE_TEMPLATE_OPTIONS, PAGE_CREATOR_TEST_IDS } from './constants';
import { PageTemplateCard } from './PageTemplateCard';
import { getTemplateOptionByKey } from './utils';

const componentMap: Record<PageTemplateType, () => ReactElement> = {
  GALLERY: () => <PhotoPageCreator fromTemplatePage={true} />,
  VIDEOS: () => <VideoPageCreator fromTemplatePage={true} />,
  MEDITATION: () => <MeditationPageCreator fromTemplatePage={true} />,
  IDEAS: () => <IdeasMaterialPageCreator fromTemplatePage={true} />,
  VISIT_MATERIALS: () => <VisitMaterialPageCreator fromTemplatePage={true} />,
};

export default function SelectPageTemplate() {
  const [selectedOption, setSelectedOption] = useState<PageTemplateType | ''>('');
  const dispatch = useDispatch();

  const handleSelectOption = (option: PageTemplateOption) => {
    setSelectedOption(option.key);

    if (option.key === PageTemplateType.GALLERY) {
      dispatch(clearImageData());
    }
  };

  const handleBackToCards = () => {
    setSelectedOption('');
  };

  const currentOptionInfo = getTemplateOptionByKey(selectedOption);

  return (
    <Box
      data-testid={PAGE_CREATOR_TEST_IDS.CONTAINER}
      sx={{
        minHeight: '100vh',
        pb: 6,
        px: { xs: 2, md: 3 },
        bgcolor: '#f8fafc',
      }}
    >
      {/* Show Card Selection Mode view when no card is selected */}
      {!selectedOption ? (
        <>
          <BackHeader title="Criador de Páginas" />

          <Container
            maxWidth={false}
            sx={{
              width: { xs: '98%', md: '95%' },
              mx: 'auto',
              mt: 2,
              px: { xs: 1, sm: 2 },
            }}
          >
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography
                data-testid={PAGE_CREATOR_TEST_IDS.HEADER}
                variant="h4"
                component="h1"
                sx={{
                  fontWeight: 700,
                  color: 'text.primary',
                  mb: 1,
                  fontSize: { xs: '1.5rem', md: '2rem' },
                }}
              >
                Modelos de Página
              </Typography>
              <Typography
                data-testid={PAGE_CREATOR_TEST_IDS.SUBTITLE}
                variant="body1"
                color="text.secondary"
                sx={{ maxWidth: 640, mx: 'auto' }}
              >
                Selecione no modo card abaixo qual tipo de conteúdo deseja criar para disponibilizar na plataforma.
              </Typography>
            </Box>

            {/* Grid of cards */}
            <Grid
              container
              spacing={3}
              data-testid={PAGE_CREATOR_TEST_IDS.GRID}
              sx={{ mb: 4 }}
            >
              {PAGE_TEMPLATE_OPTIONS.map((option) => (
                <Grid key={option.key} item xs={12} sm={6} md={4}>
                  <PageTemplateCard
                    option={option}
                    isSelected={false}
                    onSelect={handleSelectOption}
                  />
                </Grid>
              ))}
            </Grid>

            <Alert
              severity="info"
              data-testid="page-creator-empty-selection-info"
              sx={{
                borderRadius: 3,
                py: 2,
                '& .MuiAlert-icon': { fontSize: 28 },
              }}
            >
              Clique em um dos cartões acima para abrir a página de criação.
            </Alert>
          </Container>
        </>
      ) : (
        /* Creation Page view when card IS selected (cards hide completely) */
        <Container
          maxWidth={false}
          sx={{
            width: { xs: '98%', md: '95%' },
            mx: 'auto',
            pt: 3,
            px: { xs: 1, sm: 2 },
          }}
        >
          {/* Header Navigation with Back Arrow */}
          <Box
            data-testid={PAGE_CREATOR_TEST_IDS.ACTIVE_BANNER}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
              mb: 3,
              pb: 2,
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Tooltip title="Voltar para a seleção de modelos em modo card">
                <Button
                  data-testid={PAGE_CREATOR_TEST_IDS.BACK_BUTTON}
                  variant="outlined"
                  color="primary"
                  startIcon={<ArrowBack />}
                  onClick={handleBackToCards}
                  sx={{
                    minHeight: 44,
                    minWidth: 44,
                    px: 2,
                    fontWeight: 600,
                    borderRadius: 2,
                    textTransform: 'none',
                  }}
                >
                  Voltar para modelos
                </Button>
              </Tooltip>

              <Divider orientation="vertical" flexItem sx={{ mx: 1, display: { xs: 'none', sm: 'block' } }} />

              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <Typography variant="caption" color="primary.main" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                  Criando nova página
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                  {currentOptionInfo?.title}
                </Typography>
              </Box>
            </Box>

            <Button
              data-testid={PAGE_CREATOR_TEST_IDS.CHANGE_BUTTON}
              variant="text"
              color="secondary"
              startIcon={<ArrowBack />}
              onClick={handleBackToCards}
              sx={{
                display: { xs: 'flex', sm: 'none' },
                minHeight: 44,
                minWidth: 44,
                fontWeight: 600,
              }}
            >
              Voltar
            </Button>
          </Box>

          {/* Creation Form Container */}
          <Paper
            elevation={3}
            data-testid={PAGE_CREATOR_TEST_IDS.SELECTED_PREVIEW}
            sx={{
              p: { xs: 2, md: 4 },
              borderRadius: 3,
              bgcolor: '#ffffff',
              transition: 'all 0.3s ease-in-out',
            }}
          >
            {componentMap[selectedOption]()}
          </Paper>
        </Container>
      )}
    </Box>
  );
}
