import React, { useState } from 'react';
import { Avatar, Box, Button, Chip, Typography } from '@mui/material';
import { ExpandLess, ExpandMore, Groups as GroupsIcon } from '@mui/icons-material';

import { PEOPLE_PREVIEW_COUNT, SHELTER_ACCENT, SHELTER_ACCENT_DARK } from './constants';
import type { ShelterPhoto } from './ShelterPhotoDialog';
import { getInitials2, makeImgErrorHandler, safeImgUrl } from './utils';

type Person = {
  id: string;
  user: { name?: string | null; mediaItem?: { url?: string | null } | null };
};

type Props = {
  leaders: Person[];
  members: Person[];
  getLeaderTeams: (id: string) => number[];
  getMemberTeams: (id: string) => number[];
  onOpenPhoto: (photo: ShelterPhoto) => void;
};

type Role = 'leaders' | 'members';

const PersonCard: React.FC<{ person: Person; teams: number[]; role: Role; onOpenPhoto: (photo: ShelterPhoto) => void }> = ({ person, teams, role, onOpenPhoto }) => {
  const name = person.user?.name || 'Sem nome';
  const photoUrl = safeImgUrl(person.user?.mediaItem?.url);
  return (
    <Box
      data-testid={`shelter-person-${person.id}`}
      sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, bgcolor: '#fff', border: '1px solid #f1e3d0', borderRadius: 3, minWidth: 0 }}
    >
      <Avatar
        data-testid={`shelter-person-avatar-${person.id}`}
        src={photoUrl}
        alt={name}
        imgProps={{ onError: makeImgErrorHandler() }}
        {...(photoUrl
          ? { role: 'button', tabIndex: 0, 'aria-label': `Ver foto de ${name}`, onClick: () => onOpenPhoto({ name, url: photoUrl }), onKeyDown: (event: React.KeyboardEvent) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onOpenPhoto({ name, url: photoUrl }); } } }
          : {})}
        sx={{ width: 52, height: 52, cursor: photoUrl ? 'zoom-in' : 'default', fontWeight: 900, bgcolor: role === 'leaders' ? SHELTER_ACCENT : '#fde5c4', color: role === 'leaders' ? '#fff' : SHELTER_ACCENT_DARK }}
      >
        {getInitials2(name) || (role === 'leaders' ? 'L' : 'M')}
      </Avatar>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography sx={{ fontWeight: 800, color: '#1f2d3d', lineHeight: 1.25, wordBreak: 'break-word' }}>{name}</Typography>
        {teams.length > 0 && (
          <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {teams.map((team) => (
              <Chip
                key={team}
                size="small"
                icon={<GroupsIcon sx={{ fontSize: 14 }} />}
                label={`Equipe ${team}`}
                sx={{ height: 22, fontWeight: 700, fontSize: '0.72rem', bgcolor: '#fff3e0', color: SHELTER_ACCENT_DARK, '& .MuiChip-icon': { color: SHELTER_ACCENT_DARK } }}
              />
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
};

/** Líderes e membros numa única seção: alternância por papel e "Ver mais" para listas longas. */
const ShelterPeopleSection: React.FC<Props> = ({ leaders, members, getLeaderTeams, getMemberTeams, onOpenPhoto }) => {
  const [role, setRole] = useState<Role>(leaders.length > 0 ? 'leaders' : 'members');
  const [expanded, setExpanded] = useState(false);

  if (leaders.length === 0 && members.length === 0) return null;

  const people = role === 'leaders' ? leaders : members;
  const getTeams = role === 'leaders' ? getLeaderTeams : getMemberTeams;
  const visible = expanded ? people : people.slice(0, PEOPLE_PREVIEW_COUNT);
  const hidden = people.length - visible.length;

  const tabs: { value: Role; label: string; count: number }[] = [
    { value: 'leaders', label: 'Líderes', count: leaders.length },
    { value: 'members', label: 'Membros', count: members.length },
  ];

  const select = (next: Role) => {
    setRole(next);
    setExpanded(false);
  };

  return (
    <Box data-testid="shelter-people" component="section" sx={{ bgcolor: '#fffdf9', border: '1px solid #f1e3d0', borderRadius: 3, p: { xs: 1.5, md: 2.5 } }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { sm: 'center' }, justifyContent: 'space-between', gap: 1.5, mb: 2 }}>
        <Typography component="h2" sx={{ fontWeight: 900, fontSize: '1.15rem', color: '#1f2d3d' }}>
          Quem faz parte
        </Typography>
        <Box role="group" aria-label="Filtrar por papel" sx={{ display: 'flex', gap: 1 }}>
          {tabs.map((tab) => {
            const active = role === tab.value;
            return (
              <Chip
                key={tab.value}
                data-testid={`shelter-people-tab-${tab.value}`}
                clickable
                aria-pressed={active}
                disabled={tab.count === 0}
                label={`${tab.label} · ${tab.count}`}
                onClick={() => select(tab.value)}
                sx={{
                  flex: { xs: 1, sm: 'none' },
                  height: 40,
                  px: 0.75,
                  fontWeight: 800,
                  bgcolor: active ? SHELTER_ACCENT : '#fff',
                  color: active ? '#fff' : '#334155',
                  border: '1px solid',
                  borderColor: active ? SHELTER_ACCENT : '#e5d5bf',
                  '&:hover': { bgcolor: active ? SHELTER_ACCENT_DARK : '#fff3e0' },
                }}
              />
            );
          })}
        </Box>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' }, gap: { xs: 1.25, md: 1.75 } }}>
        {visible.map((person) => (
          <PersonCard key={person.id} person={person} teams={getTeams(person.id)} role={role} onOpenPhoto={onOpenPhoto} />
        ))}
      </Box>

      {people.length > PEOPLE_PREVIEW_COUNT && (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Button
            data-testid="shelter-people-toggle"
            onClick={() => setExpanded((value) => !value)}
            endIcon={expanded ? <ExpandLess /> : <ExpandMore />}
            sx={{ minHeight: 44, px: 3, borderRadius: 3, textTransform: 'none', fontWeight: 800, color: SHELTER_ACCENT_DARK, border: '1px solid #e5d5bf', width: { xs: '100%', sm: 'auto' } }}
          >
            {expanded ? 'Ver menos' : `Ver mais ${hidden}`}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default ShelterPeopleSection;
