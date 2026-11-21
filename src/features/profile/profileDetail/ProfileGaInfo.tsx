import React from 'react';
import { Box, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import { Group as GroupIcon, Phone as PhoneIcon } from '@mui/icons-material';
import { PROFILE_DETAIL_TEXTS } from './constants';
import type { ProfileCopyField } from './types';

interface Props {
  leaderName?: string;
  leaderContact?: string;
  copied: ProfileCopyField | null;
  onCopy: (text: string, field: ProfileCopyField) => void;
}

const ProfileGaInfo: React.FC<Props> = ({ leaderName, leaderContact, copied, onCopy }) => (
  <Box sx={{ p: 1.5, bgcolor: 'rgba(33, 150, 243, 0.06)', borderRadius: 2, mb: 2 }} data-testid="profile-detail-ga">
    <Stack direction="row" spacing={1} alignItems="center">
      <GroupIcon sx={{ fontSize: 16, color: 'primary.main' }} />
      <Typography variant="caption" fontWeight={600} color="primary.main">
        GA: {leaderName}
      </Typography>
      {leaderContact && (
        <Tooltip title={PROFILE_DETAIL_TEXTS.copyGaContact} arrow>
          <IconButton
            size="small"
            onClick={() => onCopy(leaderContact, 'ga')}
            aria-label={PROFILE_DETAIL_TEXTS.copyGaContact}
            data-testid="profile-detail-copy-ga"
            sx={{ ml: 'auto', p: 0.5, minWidth: 44, minHeight: 44 }}
          >
            {copied === 'ga' ? <Typography sx={{ fontSize: '0.6rem', color: 'success.main' }}>✓</Typography> : <PhoneIcon sx={{ fontSize: 14 }} />}
          </IconButton>
        </Tooltip>
      )}
    </Stack>
  </Box>
);

export default ProfileGaInfo;
