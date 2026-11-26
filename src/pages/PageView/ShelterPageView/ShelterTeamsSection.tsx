import React from 'react';
import { Avatar, AvatarGroup, Box, Typography } from '@mui/material';
import { GroupOutlined } from '@mui/icons-material';

import type { TeamWithMembersDto } from '@/features/teams/types';

import { SHELTER_ACCENT, SHELTER_ACCENT_DARK, SHELTER_ACCENT_SOFT } from './constants';
import type { ShelterPhoto } from './ShelterPhotoDialog';
import { getInitials2, safeImgUrl } from './utils';

type Props = { teams: TeamWithMembersDto[]; onOpenPhoto: (photo: ShelterPhoto) => void };

type Person = TeamWithMembersDto['leaders'][number];

const Stack: React.FC<{ label: string; people: Person[]; testId: string; onOpenPhoto: (photo: ShelterPhoto) => void }> = ({ label, people, testId, onOpenPhoto }) => (
  <Box data-testid={testId} sx={{ minWidth: 0 }}>
    <Typography sx={{ fontWeight: 800, fontSize: '0.7rem', letterSpacing: 0.5, textTransform: 'uppercase', color: '#6b7280', mb: 0.5 }}>
      {label} · {people.length}
    </Typography>
    {people.length === 0 ? (
      <Typography sx={{ color: '#9ca3af', fontSize: '0.85rem' }}>Ninguém ainda</Typography>
    ) : (
      <AvatarGroup
        max={5}
        sx={{ justifyContent: 'flex-end', flexDirection: 'row', '& .MuiAvatar-root': { width: 36, height: 36, fontSize: '0.8rem', fontWeight: 800, border: '2px solid #fff' } }}
      >
        {people.map((person) => {
          const name = person.user?.name ?? '';
          const url = safeImgUrl(person.user?.mediaItem?.url);
          return (
            <Avatar
              key={person.id}
              alt={name}
              src={url}
              {...(url
                ? { role: 'button', tabIndex: 0, 'aria-label': `Ver foto de ${name}`, onClick: () => onOpenPhoto({ name, url }), onKeyDown: (event: React.KeyboardEvent) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onOpenPhoto({ name, url }); } } }
                : {})}
              sx={{ bgcolor: SHELTER_ACCENT_SOFT, color: SHELTER_ACCENT_DARK, cursor: url ? 'zoom-in' : 'default' }}
            >
              {getInitials2(name)}
            </Avatar>
          );
        })}
      </AvatarGroup>
    )}
  </Box>
);

/** Uma linha por equipe: número, descrição e quem lidera e participa (no máximo 5 rostos). */
const ShelterTeamsSection: React.FC<Props> = ({ teams, onOpenPhoto }) => {
  if (!teams?.length) return null;
  const ordered = [...teams].sort((a, b) => a.numberTeam - b.numberTeam);

  return (
    <Box data-testid="shelter-teams" component="section">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1.5 }}>
        <Box sx={{ width: 40, height: 40, borderRadius: 2.5, display: 'grid', placeItems: 'center', bgcolor: SHELTER_ACCENT_SOFT, color: SHELTER_ACCENT_DARK }}>
          <GroupOutlined />
        </Box>
        <Typography component="h2" sx={{ fontWeight: 900, fontSize: '1.15rem', color: '#1f2d3d' }}>
          Equipes do abrigo
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(3, minmax(0, 1fr))' }, gap: { xs: 1.25, md: 2 } }}>
        {ordered.map((team) => (
          <Box
            key={team.id}
            data-testid={`shelter-team-${team.numberTeam}`}
            sx={{ bgcolor: '#fff', border: '1px solid #f1e3d0', borderTop: `4px solid ${SHELTER_ACCENT}`, borderRadius: 3, p: { xs: 1.75, md: 2.25 } }}
          >
            <Typography sx={{ fontWeight: 900, fontSize: '1.1rem', color: '#1f2d3d' }}>Equipe {team.numberTeam}</Typography>
            {team.description && (
              <Typography sx={{ color: '#475569', fontSize: '0.9rem', mt: 0.25, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {team.description}
              </Typography>
            )}
            <Box sx={{ mt: 1.75, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1.5 }}>
              <Stack testId={`shelter-team-${team.numberTeam}-leaders`} label="Líderes" people={team.leaders ?? []} onOpenPhoto={onOpenPhoto} />
              <Stack testId={`shelter-team-${team.numberTeam}-members`} label="Membros" people={team.members ?? []} onOpenPhoto={onOpenPhoto} />
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default ShelterTeamsSection;
