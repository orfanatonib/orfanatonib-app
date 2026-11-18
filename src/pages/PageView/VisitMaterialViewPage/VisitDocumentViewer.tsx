import { useState } from 'react';
import { Button } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DescriptionIcon from '@mui/icons-material/Description';
import DownloadButton from './DownloadButton';
import { VISIT_MATERIAL_MEDIA_CONFIG } from '@/features/visit-materials/constants';
import { VisitMaterialMediaSection } from '@/features/visit-materials/types';
import VisitMediaCard from './VisitMediaCard';
import { formatMediaSizeMb } from './utils';
import { MediaItem } from 'store/slices/types';
import { getMediaPreviewUrl } from 'utils/getMediaPreviewUrl';
import MediaDocumentPreviewModal from 'utils/MediaDocumentPreviewModal';

interface Props {
  document: MediaItem;
}

export default function VisitDocumentViewer({ document }: Props) {
  const [open, setOpen] = useState(false);

  const previewUrl = getMediaPreviewUrl(document);
  const fileSize = formatMediaSizeMb(document.size);

  return (
    <VisitMediaCard
      testId="visit-media-document"
      icon={DescriptionIcon}
      accentColor={VISIT_MATERIAL_MEDIA_CONFIG[VisitMaterialMediaSection.DOCUMENTS].color}
      title={document.title}
      fileSize={fileSize}
      description={document.description}
      actions={
        <>
          <Button
            data-testid="visit-media-document-preview"
            fullWidth
            variant="contained"
            startIcon={<VisibilityIcon />}
            onClick={() => setOpen(true)}
            disabled={!previewUrl}
            sx={{ minHeight: 44, textTransform: 'none', fontWeight: 600 }}
          >
            {previewUrl ? 'Visualizar documento' : 'Visualização não disponível'}
          </Button>
          <DownloadButton
            url={document.url}
            filename={document.originalName || document.title || 'documento'}
            size="medium"
            fullWidth
          />
        </>
      }
    >
      <MediaDocumentPreviewModal
        open={open}
        onClose={() => setOpen(false)}
        media={document}
        title={document.title}
      />
    </VisitMediaCard>
  );
}
