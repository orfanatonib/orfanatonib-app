import { FormControlLabel, Grid, Paper, Switch, TextField, Typography } from '@mui/material';
import {
  BASIC_INFO_HEADING,
  DEFAULT_PUBLIC_LABEL,
  DESCRIPTION_ROWS,
  PAGE_FORM_TEST_IDS,
  REQUIRED_FIELD_MESSAGE,
} from './constants';
import { PAGE_FIELD_SX, PAGE_PAPER_SX } from './styles';
import type { PageBasicInfoSectionProps } from './types';

/** Campos comuns do formulário: título, descrição e página pública. */
export default function PageBasicInfoSection({
  testId,
  titleLabel,
  descriptionLabel,
  publicLabel = DEFAULT_PUBLIC_LABEL,
  title,
  description,
  isPublic,
  touched,
  onTitleChange,
  onDescriptionChange,
  onPublicChange,
  onTouchedChange,
}: PageBasicInfoSectionProps) {
  const titleError = touched.title && !title.trim();
  const descriptionError = touched.description && !description.trim();

  return (
    <Paper
      data-testid={`${testId}-${PAGE_FORM_TEST_IDS.BASIC_INFO}`}
      elevation={2}
      sx={PAGE_PAPER_SX}
    >
      <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
        {BASIC_INFO_HEADING}
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label={titleLabel}
            required
            value={title}
            inputProps={{ 'data-testid': `${testId}-${PAGE_FORM_TEST_IDS.TITLE}` }}
            onChange={(e) => {
              onTitleChange(e.target.value);
              if (touched.title) onTouchedChange('title', false);
            }}
            onBlur={() => onTouchedChange('title', true)}
            error={titleError}
            helperText={titleError ? REQUIRED_FIELD_MESSAGE : ''}
            sx={PAGE_FIELD_SX}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label={descriptionLabel}
            required
            value={description}
            inputProps={{ 'data-testid': `${testId}-${PAGE_FORM_TEST_IDS.DESCRIPTION}` }}
            onChange={(e) => {
              onDescriptionChange(e.target.value);
              if (touched.description) onTouchedChange('description', false);
            }}
            onBlur={() => onTouchedChange('description', true)}
            error={descriptionError}
            helperText={descriptionError ? REQUIRED_FIELD_MESSAGE : ''}
            multiline
            rows={DESCRIPTION_ROWS}
            sx={PAGE_FIELD_SX}
          />
        </Grid>
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={isPublic}
                onChange={(e) => onPublicChange(e.target.checked)}
                inputProps={{ 'data-testid': `${testId}-${PAGE_FORM_TEST_IDS.PUBLIC}` } as object}
              />
            }
            label={publicLabel}
          />
        </Grid>
      </Grid>
    </Paper>
  );
}
