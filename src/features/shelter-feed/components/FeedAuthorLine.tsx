import { Box, Typography } from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import type { FeedAuthor } from '../types';
import { formatAuthorLabel } from '../utils';

/** Autoria da publicação (só nome público). Itens antigos: "Autor não informado". */
export default function FeedAuthorLine({ author }: { author: FeedAuthor | null | undefined }) {
  return (
    <Box display="flex" alignItems="center" gap={1}>
      <PersonOutlineIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
      <Typography data-testid="shelter-feed-author" variant="body2" color="text.secondary">
        {formatAuthorLabel(author)}
      </Typography>
    </Box>
  );
}
