import {
  Avatar,
  Badge,
  Box,
  CardContent,
  Chip,
  Stack,
  Typography,
} from '@mui/material';
import ImageIcon from '@mui/icons-material/Image';
import ScheduleIcon from '@mui/icons-material/Schedule';
import UpdateIcon from '@mui/icons-material/Update';
import type { FormattedDateTime } from '@/features/image-pages/utils';

interface SectionHeaderProps {
  caption: string;
  description?: string;
  mediaCount: number;
  created: FormattedDateTime | null;
  updated: FormattedDateTime | null;
}

export default function SectionHeader({
  caption,
  description,
  mediaCount,
  created,
  updated,
}: SectionHeaderProps) {
  return (
    <CardContent
      data-testid="image-section-header"
      sx={{ p: { xs: 2, sm: 3, md: 4 }, pb: 2 }}
    >
      <Box
        display="flex"
        alignItems="flex-start"
        gap={{ xs: 2, sm: 3 }}
        mb={{ xs: 2, sm: 3 }}
        flexDirection={{ xs: 'column', sm: 'row' }}
      >
        <Box
          display="flex"
          alignItems="center"
          gap={{ xs: 2, sm: 3 }}
          width={{ xs: '100%', sm: 'auto' }}
        >
          <Avatar
            sx={{
              width: { xs: 40, sm: 48, md: 56 },
              height: { xs: 40, sm: 48, md: 56 },
              bgcolor: 'success.main',
              boxShadow: 3,
            }}
          >
            <ImageIcon
              sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem', md: '1.8rem' } }}
            />
          </Avatar>

          <Box flex={1}>
            <Box
              display="flex"
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              gap={{ xs: 1, sm: 2 }}
              mb={1}
              flexDirection={{ xs: 'column', sm: 'row' }}
            >
              <Typography
                variant="h5"
                fontWeight="bold"
                color="success.main"
                sx={{
                  fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.6rem' },
                  lineHeight: { xs: 1.2, md: 1.3 },
                  mb: { xs: 1, sm: 0 },
                }}
              >
                {caption}
              </Typography>
              <Badge
                badgeContent={mediaCount}
                color="secondary"
                sx={{
                  '& .MuiBadge-badge': {
                    fontSize: { xs: '0.65rem', sm: '0.75rem' },
                    fontWeight: 'bold',
                  },
                }}
              >
                <Chip
                  label="Imagens"
                  size="small"
                  sx={{
                    bgcolor: 'success.light',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: { xs: '0.65rem', sm: '0.75rem' },
                    height: { xs: 20, sm: 24 },
                  }}
                />
              </Badge>
            </Box>

            {description && (
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{
                  fontSize: { xs: '0.85rem', sm: '0.95rem', md: '1rem' },
                  lineHeight: { xs: 1.4, md: 1.6 },
                  mb: { xs: 1.5, md: 2 },
                }}
              >
                {description}
              </Typography>
            )}

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={{ xs: 1, sm: 2 }}
            >
              {created && (
                <Box display="flex" alignItems="center" gap={1}>
                  <ScheduleIcon
                    sx={{ fontSize: '1rem', color: 'text.secondary' }}
                  />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      lineHeight: 1.4,
                    }}
                  >
                    {created.date} às {created.time}
                  </Typography>
                </Box>
              )}
              {updated && updated.date !== created?.date && (
                <Box display="flex" alignItems="center" gap={1}>
                  <UpdateIcon
                    sx={{ fontSize: '1rem', color: 'text.secondary' }}
                  />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      lineHeight: 1.4,
                    }}
                  >
                    {updated.date} às {updated.time}
                  </Typography>
                </Box>
              )}
            </Stack>
          </Box>
        </Box>
      </Box>
    </CardContent>
  );
}
