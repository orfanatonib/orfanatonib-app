import React from 'react';
import { IconButton, Stack, Tooltip, Typography } from '@mui/material';
import {
  WhatsApp as WhatsAppIcon,
  ContentCopy as CopyIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import { CONTACT_BUTTON_SX, PROFILE_DETAIL_TEXTS } from './constants';
import type { ProfileCopyField } from './types';

interface Props {
  phone?: string;
  email?: string;
  copied: ProfileCopyField | null;
  onCopy: (text: string, field: ProfileCopyField) => void;
  onWhatsApp: (phone?: string) => void;
  onEmail: (email?: string) => void;
}

const Check: React.FC = () => <Typography sx={{ fontSize: '0.7rem', color: 'success.main' }}>✓</Typography>;

const ProfileContactActions: React.FC<Props> = ({ phone, email, copied, onCopy, onWhatsApp, onEmail }) => {
  if (!email && !phone) return null;
  return (
    <Stack direction="row" spacing={1} justifyContent="center" sx={{ mb: 2 }} data-testid="profile-detail-contact-actions">
      {phone && (
        <Tooltip title={PROFILE_DETAIL_TEXTS.whatsapp} arrow>
          <IconButton
            onClick={() => onWhatsApp(phone)}
            size="small"
            aria-label={PROFILE_DETAIL_TEXTS.whatsapp}
            data-testid="profile-detail-whatsapp"
            sx={{ bgcolor: '#25D366', color: 'white', width: 44, height: 44, '&:hover': { bgcolor: '#128C7E', transform: 'scale(1.05)' }, transition: 'all 0.2s' }}
          >
            <WhatsAppIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      {phone && (
        <Tooltip title={copied === 'phone' ? PROFILE_DETAIL_TEXTS.copied : PROFILE_DETAIL_TEXTS.copyPhone} arrow>
          <IconButton onClick={() => onCopy(phone, 'phone')} size="small" aria-label={PROFILE_DETAIL_TEXTS.copyPhone} data-testid="profile-detail-copy-phone" sx={CONTACT_BUTTON_SX}>
            {copied === 'phone' ? <Check /> : <PhoneIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      )}
      {email && (
        <Tooltip title={PROFILE_DETAIL_TEXTS.sendEmail} arrow>
          <IconButton onClick={() => onEmail(email)} size="small" aria-label={PROFILE_DETAIL_TEXTS.sendEmail} data-testid="profile-detail-send-email" sx={CONTACT_BUTTON_SX}>
            <EmailIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      {email && (
        <Tooltip title={copied === 'email' ? PROFILE_DETAIL_TEXTS.copied : PROFILE_DETAIL_TEXTS.copyEmail} arrow>
          <IconButton onClick={() => onCopy(email, 'email')} size="small" aria-label={PROFILE_DETAIL_TEXTS.copyEmail} data-testid="profile-detail-copy-email" sx={CONTACT_BUTTON_SX}>
            {copied === 'email' ? <Check /> : <CopyIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      )}
    </Stack>
  );
};

export default ProfileContactActions;
