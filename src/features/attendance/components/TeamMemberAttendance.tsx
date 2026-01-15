import { memo } from 'react';
import {
  Alert,
  Box,
  Grid,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';

import type {
  ShelterWithTeamsDto,
  TeamWithMembersDto,
  TeamScheduleDto,
} from '../types';
import { useTeamAttendance } from '../hooks/useTeamAttendance';
import EventFilterSelector from './EventFilterSelector';
import AttendanceSummaryCard from './AttendanceSummaryCard';
import AttendanceQuickActions from './AttendanceQuickActions';
import AttendanceSubmitSection from './AttendanceSubmitSection';
import MembersList from './MembersList';

interface TeamMemberAttendanceProps {
  shelter: ShelterWithTeamsDto;
  team: TeamWithMembersDto;
  schedules: TeamScheduleDto[];
  loadingSchedules?: boolean;
  onBack: () => void;
  onAttendanceRegistered: () => void;
}

const TeamMemberAttendance = memo(({
  shelter,
  team,
  schedules,
  loadingSchedules = false,
  onBack,
  onAttendanceRegistered
}: TeamMemberAttendanceProps) => {
  const {
    scheduleId,
    setScheduleId,
    eventTypeFilter,
    setEventTypeFilter,
    filteredSchedules,
    membersOnly,
    memberAttendances,
    formState,
    existingRecordsScheduleId,
    loadingExistingRecords,
    hasExistingAttendance,
    presentCount,
    absentCount,
    handleMemberTypeChange,
    handleMemberCommentChange,
    bulkSetType,
    clearAllComments,
    clearError,
    clearFeedback,
    handleSubmit,
    safeSchedules,
  } = useTeamAttendance({
    team,
    schedules,
    onAttendanceRegistered,
  });

  const isSubmitDisabled =
    formState.loading ||
    loadingSchedules ||
    safeSchedules.length === 0 ||
    !scheduleId ||
    membersOnly.length === 0;

  const disabledReason = loadingSchedules
    ? 'Carregando eventos...'
    : safeSchedules.length === 0
      ? 'Nenhum evento disponível para esta equipe'
      : !scheduleId
        ? 'Selecione um evento'
        : membersOnly.length === 0
          ? 'Nenhum membro na equipe'
          : '';

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box
        sx={{
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
          p: { xs: 1, sm: 1.5, md: 2 },
          mb: { xs: 1, md: 2 },
          position: 'sticky',
          top: 0,
          zIndex: 10,
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={{ xs: 1, md: 2 }}>
          <IconButton
            onClick={onBack}
            aria-label="Voltar para seleção de equipes"
            sx={{ flexShrink: 0 }}
            size="small"
          >
            <ArrowBackIcon sx={{ fontSize: { xs: 20, md: 24 } }} />
          </IconButton>

          <Box flex={1} minWidth={0}>
            <Typography variant="h6" fontWeight="bold" noWrap sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
              Equipe {team.teamNumber}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap sx={{ fontSize: { xs: '0.7rem', md: '0.875rem' } }}>
              {shelter.shelterName} • {membersOnly.length} membro{membersOnly.length !== 1 ? 's' : ''}
            </Typography>
          </Box>

          {/* Desktop event filter */}
          <Box
            sx={{
              display: { xs: 'none', md: 'block' },
              minWidth: { md: 300, lg: 400 },
              maxWidth: { md: 300, lg: 400 },
            }}
          >
            <EventFilterSelector
              eventTypeFilter={eventTypeFilter}
              scheduleId={scheduleId}
              filteredSchedules={filteredSchedules}
              existingRecordsScheduleId={existingRecordsScheduleId}
              hasExistingAttendance={hasExistingAttendance}
              loadingSchedules={loadingSchedules}
              loadingExistingRecords={loadingExistingRecords}
              onEventTypeChange={setEventTypeFilter}
              onScheduleChange={setScheduleId}
            />
          </Box>
        </Stack>
      </Box>

      <Grid container spacing={{ xs: 1, sm: 1.5, md: 3 }} sx={{ flex: 1, overflow: 'hidden', px: { xs: 0.5, sm: 1, md: 0 } }}>
        {/* Sidebar */}
        <Grid item xs={12} md={4} lg={3}>
          <Stack spacing={{ xs: 1, sm: 1.5, md: 3 }}>
            {/* Mobile event filter */}
            <Box sx={{ display: { xs: 'block', md: 'none' } }}>
              <EventFilterSelector
                eventTypeFilter={eventTypeFilter}
                scheduleId={scheduleId}
                filteredSchedules={filteredSchedules}
                existingRecordsScheduleId={existingRecordsScheduleId}
                hasExistingAttendance={hasExistingAttendance}
                loadingSchedules={loadingSchedules}
                loadingExistingRecords={loadingExistingRecords}
                onEventTypeChange={setEventTypeFilter}
                onScheduleChange={setScheduleId}
                isMobile
              />
            </Box>

            {/* Editing existing attendance alert */}
            {hasExistingAttendance && (
              <Alert
                severity="info"
                icon={<EditIcon sx={{ fontSize: { xs: 22, md: 18 } }} />}
                sx={{
                  py: { xs: 1.5, md: 1 },
                  bgcolor: 'info.main',
                  color: 'info.contrastText',
                  border: 'none',
                  borderRadius: 2,
                  '& .MuiAlert-icon': {
                    color: 'info.contrastText',
                  },
                }}
              >
                <Typography variant="body2" fontWeight="bold" sx={{ fontSize: { xs: '0.9rem', md: '0.85rem' } }}>
                  Editando frequência existente
                </Typography>
              </Alert>
            )}

            {/* Mobile summary and quick actions side by side */}
            <Box sx={{ display: { xs: 'flex', md: 'none' }, gap: 1 }}>
              <AttendanceSummaryCard
                totalCount={membersOnly.length}
                presentCount={presentCount}
                absentCount={absentCount}
                isMobile
              />
              <AttendanceQuickActions
                onBulkSetType={bulkSetType}
                onClearComments={clearAllComments}
                disabled={formState.loading}
                isMobile
              />
            </Box>

            {/* Desktop summary */}
            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
              <AttendanceSummaryCard
                totalCount={membersOnly.length}
                presentCount={presentCount}
                absentCount={absentCount}
              />
            </Box>

            {/* Desktop quick actions */}
            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
              <AttendanceQuickActions
                onBulkSetType={bulkSetType}
                onClearComments={clearAllComments}
                disabled={formState.loading}
              />
            </Box>

            {/* Desktop submit section */}
            <Box
              sx={{
                display: { xs: 'none', md: 'block' },
                position: 'sticky',
                bottom: 0,
                pt: 2,
              }}
            >
              <AttendanceSubmitSection
                formState={formState}
                hasExistingAttendance={hasExistingAttendance}
                isDisabled={isSubmitDisabled}
                disabledReason={disabledReason}
                onSubmit={handleSubmit}
                onClearError={clearError}
                onClearFeedback={clearFeedback}
              />
            </Box>
          </Stack>
        </Grid>

        {/* Members list */}
        <Grid item xs={12} md={8} lg={9}>
          <MembersList
            members={membersOnly}
            memberAttendances={memberAttendances}
            onTypeChange={handleMemberTypeChange}
            onCommentChange={handleMemberCommentChange}
            onBulkSetType={bulkSetType}
            disabled={formState.loading}
            teamId={team.teamId}
            scheduleId={scheduleId}
          />
        </Grid>
      </Grid>

      {/* Mobile submit section */}
      <Box
        sx={{
          display: { xs: 'block', md: 'none' },
          position: 'sticky',
          bottom: 0,
          left: 0,
          right: 0,
          p: 2,
          bgcolor: 'background.default',
          borderTop: '1px solid',
          borderColor: 'divider',
          zIndex: 10,
        }}
      >
        <AttendanceSubmitSection
          formState={formState}
          hasExistingAttendance={hasExistingAttendance}
          isDisabled={isSubmitDisabled}
          disabledReason={disabledReason}
          onSubmit={handleSubmit}
          onClearError={clearError}
          onClearFeedback={clearFeedback}
          isMobile
        />
      </Box>
    </Box>
  );
});

TeamMemberAttendance.displayName = 'TeamMemberAttendance';

export default TeamMemberAttendance;
