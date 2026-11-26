import React, { useState } from 'react';
import { Backdrop, Box, Chip, Dialog, Fade, Stack, Typography, useMediaQuery, useTheme } from '@mui/material';
import { Cake as CakeIcon } from '@mui/icons-material';
import type { CompleteProfileListItem } from '../types';
import { calculateAge, formatBirthDate, getBirthdayStatus, getGenderStyle, roleConfig } from '../utils';
import ProfileAvatarBlock from '../profileDetail/ProfileAvatarBlock';
import ProfileContactActions from '../profileDetail/ProfileContactActions';
import ProfileGaInfo from '../profileDetail/ProfileGaInfo';
import ProfileHeaderBanner from '../profileDetail/ProfileHeaderBanner';
import ProfileImageZoom from '../profileDetail/ProfileImageZoom';
import ProfilePreferencesSection from '../profileDetail/ProfilePreferencesSection';
import { useProfileContactActions } from '../profileDetail/useProfileContactActions';
import { hasAnyPreference } from '../profileDetail/utils';

interface ProfileDetailModalProps {
    profile: CompleteProfileListItem | null;
    open: boolean;
    onClose: () => void;
}

const ProfileDetailModal: React.FC<ProfileDetailModalProps> = ({ profile, open, onClose }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [zoomOpen, setZoomOpen] = useState(false);
    const { copied, copy, openWhatsApp, openEmail } = useProfileContactActions();

    if (!profile) return null;

    const config = roleConfig[profile.role?.toLowerCase()] || roleConfig.member;
    const genderStyle = getGenderStyle(profile.personalData?.gender);
    const birthDate = profile.personalData?.birthDate;
    const birthdayStatus = getBirthdayStatus(birthDate);
    const age = calculateAge(birthDate);
    const imageUrl = profile.image?.url;
    const gaName = profile.personalData?.gaLeaderName;
    const gaContact = profile.personalData?.gaLeaderContact;

    return (
        <>
            <Dialog
                data-testid="profile-detail-modal"
                open={open}
                onClose={onClose}
                maxWidth="xs"
                fullWidth
                TransitionComponent={Fade}
                slots={{ backdrop: Backdrop }}
                slotProps={{ backdrop: { sx: { backdropFilter: 'blur(8px)', backgroundColor: 'rgba(0, 0, 0, 0.4)' } } }}
                PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden', m: isMobile ? 2 : 3, maxHeight: 'calc(100vh - 32px)' } }}
            >
                <ProfileHeaderBanner gradient={genderStyle.gradient} isBirthdayToday={birthdayStatus === 'today'} onClose={onClose} />
                <ProfileAvatarBlock name={profile.name} imageUrl={imageUrl} gradient={genderStyle.gradient} color={genderStyle.color} onZoom={() => setZoomOpen(true)} />

                <Box sx={{ px: 2.5, pt: 1.5, pb: 2.5 }}>
                    <Box sx={{ textAlign: 'center', mb: 2 }}>
                        <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }} data-testid="profile-detail-name">
                            {profile.name}
                        </Typography>

                        <Stack direction="row" spacing={1} justifyContent="center" alignItems="center" flexWrap="wrap">
                            <Chip
                                icon={config.icon}
                                label={config.label}
                                size="small"
                                data-testid="profile-detail-role"
                                sx={{ bgcolor: config.bgLight, color: config.color, fontWeight: 600, height: 24, '& .MuiChip-icon': { color: config.color }, '& .MuiChip-label': { px: 1, fontSize: '0.75rem' } }}
                            />
                            {birthDate && (
                                <Chip
                                    icon={<CakeIcon sx={{ fontSize: 14 }} />}
                                    label={age !== null ? `${age} anos` : formatBirthDate(birthDate)}
                                    size="small"
                                    data-testid="profile-detail-age"
                                    sx={{
                                        bgcolor: birthdayStatus ? 'rgba(246, 65, 108, 0.1)' : 'rgba(0,0,0,0.05)',
                                        color: birthdayStatus ? '#f6416c' : 'text.secondary',
                                        fontWeight: birthdayStatus ? 600 : 400,
                                        height: 24,
                                        '& .MuiChip-icon': { color: birthdayStatus ? '#f6416c' : 'text.disabled' },
                                        '& .MuiChip-label': { px: 1, fontSize: '0.75rem' },
                                    }}
                                />
                            )}
                        </Stack>
                    </Box>

                    <ProfileContactActions phone={profile.phone} email={profile.email} copied={copied} onCopy={copy} onWhatsApp={openWhatsApp} onEmail={openEmail} />

                    {(gaName || gaContact) && <ProfileGaInfo leaderName={gaName} leaderContact={gaContact} copied={copied} onCopy={copy} />}

                    {profile.preferences && hasAnyPreference(profile.preferences) && <ProfilePreferencesSection preferences={profile.preferences} />}
                </Box>
            </Dialog>

            <ProfileImageZoom open={zoomOpen} imageUrl={imageUrl} onClose={() => setZoomOpen(false)} />
        </>
    );
};

export default ProfileDetailModal;
