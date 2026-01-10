import {
  Alert,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemText,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import type { TeamMemberDto } from '../types';

interface Props {
  members: TeamMemberDto[];
  loading?: boolean;
  teamInfo?: { teamNumber?: number; shelterName?: string; teamId?: string };
}

const TeamMembers = ({ members, loading, teamInfo }: Props) => {
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
            <Typography variant="h6">Membros do time</Typography>
            {teamInfo?.teamNumber && <Chip size="small" label={`Time ${teamInfo.teamNumber}`} />}
            {teamInfo?.shelterName && <Chip size="small" label={teamInfo.shelterName} />}
          </Stack>

          {loading && (
            <Stack spacing={1}>
              {[1, 2, 3, 4, 5].map(i => (
                <ListItem key={i} disableGutters>
                  <ListItemText
                    primary={<Skeleton width={120} />}
                    secondary={<Skeleton width={200} />}
                  />
                </ListItem>
              ))}
            </Stack>
          )}

          {!loading && members.length === 0 && (
            <Alert severity="info">Nenhum membro retornado para este time.</Alert>
          )}

          {!loading && members.length > 0 && (
          <List dense disablePadding>
            {members.map(member => (
              <ListItem key={member.id} disableGutters>
                <ListItemText
                  primary={member.name}
                  secondary={[member.email, member.role ? `papel: ${member.role}` : null]
                    .filter(Boolean)
                    .join(' • ')}
                />
              </ListItem>
            ))}
          </List>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default TeamMembers;
