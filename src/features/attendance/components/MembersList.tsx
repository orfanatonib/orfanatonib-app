import { memo, useMemo, useState, useEffect } from 'react';
import {
  Alert,
  Box,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

import { AttendanceType } from '../types';
import type { TeamMemberDto } from '../types';
import MemberAttendanceCard from './MemberAttendanceCard';

const MOBILE_PAGE_SIZE = 5;
const DESKTOP_PAGE_SIZE = 10;

interface MemberAttendanceRow {
  member: TeamMemberDto;
  type: AttendanceType;
  comment: string;
}

interface MembersListProps {
  members: TeamMemberDto[];
  memberAttendances: Record<string, MemberAttendanceRow>;
  onTypeChange: (memberId: string, type: AttendanceType) => void;
  onCommentChange: (memberId: string, comment: string) => void;
  onBulkSetType: (type: AttendanceType) => void;
  disabled?: boolean;
  teamId: string;
  scheduleId: string;
}

const MembersList = memo(({
  members,
  memberAttendances,
  onTypeChange,
  onCommentChange,
  onBulkSetType,
  disabled = false,
  teamId,
  scheduleId,
}: MembersListProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = isMobile ? MOBILE_PAGE_SIZE : DESKTOP_PAGE_SIZE;
  const totalPages = Math.ceil(members.length / pageSize);

  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return members.slice(start, start + pageSize);
  }, [members, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [teamId, scheduleId]);

  return (
    <Card
      variant="outlined"
      sx={{
        height: { xs: 'auto', md: 'calc(100vh - 200px)' },
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <CardHeader
        sx={{ py: { xs: 1, md: 2 }, px: { xs: 1.5, md: 2 } }}
        avatar={
          <Box
            sx={{
              width: { xs: 28, md: 40 },
              height: { xs: 28, md: 40 },
              borderRadius: 1.5,
              bgcolor: 'secondary.main',
              color: 'secondary.contrastText',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <GroupsIcon sx={{ fontSize: { xs: 16, md: 24 } }} />
          </Box>
        }
        title={`Membros (${members.length})`}
        titleTypographyProps={{
          variant: 'subtitle1',
          fontWeight: 'bold',
          sx: { fontSize: { xs: '0.85rem', md: '1rem' } }
        }}
        subheader="Marque presença ou falta"
        subheaderTypographyProps={{
          sx: { fontSize: { xs: '0.65rem', md: '0.875rem' }, display: { xs: 'none', sm: 'block' } }
        }}
        action={
          <Stack
            direction="row"
            spacing={1}
            sx={{ display: { xs: 'none', md: 'flex' } }}
          >
            <Tooltip title="Marcar todos como presentes">
              <IconButton
                onClick={() => onBulkSetType(AttendanceType.PRESENT)}
                size="small"
                aria-label="Marcar todos como presentes"
              >
                <CheckCircleIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Marcar todos como falta">
              <IconButton
                onClick={() => onBulkSetType(AttendanceType.ABSENT)}
                size="small"
                aria-label="Marcar todos como falta"
              >
                <CancelIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        }
      />

      <CardContent
        sx={{
          flex: 1,
          overflow: 'auto',
          p: { xs: '8px !important', sm: '12px !important', md: '16px !important' },
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            bgcolor: 'grey.100',
          },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: 'grey.400',
            borderRadius: '4px',
            '&:hover': {
              bgcolor: 'grey.500',
            },
          },
        }}
      >
        {members.length === 0 ? (
          <Alert severity="info">Nenhum membro encontrado nesta equipe.</Alert>
        ) : (
          <Box
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              bgcolor: 'background.paper',
              overflow: 'hidden',
            }}
          >
            {paginatedMembers.map((member, index) => {
              const attendance = memberAttendances[member.id];
              if (!attendance) return null;

              return (
                <Box
                  key={member.id}
                  sx={{
                    bgcolor: index % 2 === 0 ? 'background.paper' : 'grey.50',
                    '&:not(:last-child)': {
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                    },
                  }}
                >
                  <MemberAttendanceCard
                    member={member}
                    attendance={attendance}
                    onTypeChange={(type) => onTypeChange(member.id, type)}
                    onCommentChange={(comment) => onCommentChange(member.id, comment)}
                    disabled={disabled}
                  />
                </Box>
              );
            })}
          </Box>
        )}
      </CardContent>

      {totalPages > 1 && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: { xs: 1.5, md: 2 },
            py: { xs: 1.5, md: 1.5 },
            px: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: 'grey.50',
            flexShrink: 0,
          }}
        >
          <IconButton
            size="medium"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}
          >
            <NavigateBeforeIcon />
          </IconButton>

          <Box sx={{ textAlign: 'center', minWidth: { xs: 110, md: 140 } }}>
            <Typography
              variant="body2"
              fontWeight="bold"
              sx={{ fontSize: { xs: '0.85rem', md: '0.875rem' } }}
            >
              {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, members.length)} de {members.length}
            </Typography>
          </Box>

          <IconButton
            size="medium"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}
          >
            <NavigateNextIcon />
          </IconButton>
        </Box>
      )}
    </Card>
  );
});

MembersList.displayName = 'MembersList';

export default MembersList;
