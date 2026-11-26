import React, { ReactElement } from 'react';
import {
  Card,
  CardActionArea,
  CardContent,
  Typography,
  Box,
  useTheme,
  Chip,
} from '@mui/material';
import {
  MenuBook,
  SelfImprovement,
  Collections,
  PlayCircle,
  Lightbulb,
  CheckCircle,
} from '@mui/icons-material';
import { IconType, PageTemplateOption } from './types';

interface PageTemplateCardProps {
  option: PageTemplateOption;
  isSelected: boolean;
  onSelect: (option: PageTemplateOption) => void;
}

const iconMap: Record<IconType, ReactElement> = {
  visit: <MenuBook fontSize="large" />,
  meditation: <SelfImprovement fontSize="large" />,
  gallery: <Collections fontSize="large" />,
  videos: <PlayCircle fontSize="large" />,
  ideas: <Lightbulb fontSize="large" />,
};

export const PageTemplateCard: React.FC<PageTemplateCardProps> = ({
  option,
  isSelected,
  onSelect,
}) => {
  const theme = useTheme();

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(option);
    }
  };

  return (
    <Card
      data-testid={option.testId}
      aria-selected={isSelected}
      tabIndex={0}
      onClick={() => onSelect(option)}
      onKeyDown={handleKeyDown}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        borderRadius: 3,
        transition: 'all 0.25s ease-in-out',
        border: isSelected
          ? `2px solid ${theme.palette.primary.main}`
          : `1px solid ${theme.palette.divider}`,
        boxShadow: isSelected
          ? `0 8px 24px rgba(${theme.palette.primary.main}, 0.2)`
          : '0 2px 8px rgba(0,0,0,0.06)',
        bgcolor: isSelected ? 'rgba(232, 245, 233, 0.4)' : '#ffffff',
        transform: isSelected ? 'translateY(-2px)' : 'none',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 8px 20px rgba(0, 0, 0, 0.12)`,
          borderColor: theme.palette.primary.main,
        },
      }}
    >
      <CardActionArea
        onClick={() => onSelect(option)}
        sx={{
          height: '100%',
          p: 2.5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
          minHeight: 180,
        }}
      >
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2,
          }}
        >
          <Box
            sx={{
              width: 54,
              height: 54,
              minWidth: 44,
              minHeight: 44,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: isSelected ? 'primary.main' : 'primary.light',
              color: isSelected ? '#ffffff' : 'primary.dark',
              transition: 'all 0.2s ease',
            }}
          >
            {iconMap[option.iconName]}
          </Box>

          {isSelected ? (
            <Chip
              icon={<CheckCircle sx={{ color: '#ffffff !important' }} />}
              label="Selecionado"
              color="primary"
              size="small"
              sx={{ fontWeight: 600 }}
            />
          ) : (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: 500 }}
            >
              {option.subtitle}
            </Typography>
          )}
        </Box>

        <Typography
          variant="h6"
          component="h3"
          sx={{
            fontWeight: 700,
            color: isSelected ? 'primary.dark' : 'text.primary',
            mb: 0.5,
            fontSize: '1.1rem',
          }}
        >
          {option.title}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            lineHeight: 1.4,
            textAlign: 'left',
          }}
        >
          {option.description}
        </Typography>
      </CardActionArea>
    </Card>
  );
};
