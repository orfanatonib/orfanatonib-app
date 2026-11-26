import React, { useState } from 'react';
import { Box, Skeleton } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import DriveIcon from '@mui/icons-material/Google';
import CloudIcon from '@mui/icons-material/CloudQueue';
import FolderIcon from '@mui/icons-material/Folder';
import { MediaPlatform } from 'store/slices/types';

export function PlatformIcon({
  platform,
}: {
  platform?: MediaPlatform | string;
}) {
  switch (platform) {
    case MediaPlatform.GOOGLE_DRIVE:
      return <DriveIcon fontSize="small" />;
    case MediaPlatform.ONEDRIVE:
    case MediaPlatform.DROPBOX:
      return <CloudIcon fontSize="small" />;
    default:
      return <FolderIcon fontSize="small" />;
  }
}

interface ImageWithSkeletonProps {
  src: string;
  alt: string;
  sx?: SxProps<Theme>;
  onClick?: () => void;
}

export const ImageWithSkeleton: React.FC<ImageWithSkeletonProps> = ({
  src,
  alt,
  sx,
  onClick,
}) => {
  const [loaded, setLoaded] = useState(false);
  const base = (sx ?? {}) as Record<string, unknown>;
  return (
    <Box sx={{ position: 'relative' }}>
      {!loaded && (
        <Skeleton
          variant="rectangular"
          sx={{ ...base, position: 'absolute', top: 0, left: 0 }}
        />
      )}
      <Box
        component="img"
        data-testid="image-section-thumbnail"
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        onClick={onClick}
        sx={{ ...base, visibility: loaded ? 'visible' : 'hidden' }}
      />
    </Box>
  );
};
