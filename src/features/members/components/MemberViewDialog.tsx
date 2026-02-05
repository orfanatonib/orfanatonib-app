import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Divider,
  Typography,
  Stack,
  useTheme,
  useMediaQuery,
  Avatar,
  Box,
  Paper,
} from "@mui/material";
import { Edit as EditIcon, Person as PersonIcon, Home as HomeIcon, Groups as GroupsIcon, SupervisorAccount as SupervisorIcon } from "@mui/icons-material";
import ImagePreviewDialog from "@/components/Common/ImagePreviewDialog";
import { MemberProfile } from "../types";
import { fmtDate } from "@/utils/dates";

import { useSelector } from "react-redux";
import { RootState } from "@/store/slices";
import { UserRole } from "@/store/slices/auth/authSlice";
import { useNavigate } from "react-router-dom";

type Props = {
  open: boolean;
  member: MemberProfile | null;
  onClose: () => void;
};

export default function MemberViewDialog({ open, member, onClose }: Props) {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));
  const { user } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  // const [teamManagementOpen, setTeamManagementOpen] = React.useState(false); // No longer needed

  // If no member, render nothing or skeleton? Dialog usually handles open=false
  if (!member) return null;

  const shelterName = member.shelter?.name;
  const shelterId = member.shelter?.id;
  const teamNumber = member.shelter?.team?.numberTeam;
  const leaderName = member.shelter?.leader?.user?.name;

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight="bold">Detalhes do Membro</Typography>
          {shelterId && user?.role === UserRole.ADMIN && (
            <Button
              startIcon={<EditIcon />}
              size="small"
              variant="outlined"
              onClick={() => {
                onClose();
                navigate(`/adm/abrigos/${shelterId}/edit`);
              }}
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >
              Gerenciar Equipe
            </Button>
          )}
        </DialogTitle>

        <DialogContent dividers sx={{ p: 0 }}>
          <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', bgcolor: 'grey.50' }}>
            <Avatar
              src={member.user.imageProfile?.url}
              onClick={() => member.user.imageProfile?.url && setPreviewImage(member.user.imageProfile.url)}
              sx={{
                width: 80,
                height: 80,
                mb: 2,
                bgcolor: 'primary.main',
                fontSize: '2rem',
                cursor: member.user.imageProfile?.url ? 'pointer' : 'default',
              }}
            >
              {member.user.name?.[0]?.toUpperCase() || <PersonIcon />}
            </Avatar>
            <Typography variant="h5" align="center" gutterBottom fontWeight="bold">
              {member.user.name || "—"}
            </Typography>
            <Typography variant="body1" color="text.secondary" align="center">
              {member.user.email || "—"}
            </Typography>
          </Box>

          <Box sx={{ p: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1, mb: 2, fontWeight: 'bold' }}>
              Vínculo com Abrigo
            </Typography>

            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Stack spacing={2}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar sx={{ bgcolor: 'secondary.light', color: 'secondary.dark', width: 32, height: 32 }}>
                    <HomeIcon fontSize="small" />
                  </Avatar>
                  <Box flex={1}>
                    <Typography variant="caption" color="text.secondary">Abrigo</Typography>
                    <Typography variant="body1" fontWeight={500}>{shelterName || "Não vinculado"}</Typography>
                  </Box>
                </Box>

                {shelterName && (
                  <>
                    <Divider flexItem />
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar sx={{ bgcolor: 'info.light', color: 'info.dark', width: 32, height: 32 }}>
                        <GroupsIcon fontSize="small" />
                      </Avatar>
                      <Box flex={1}>
                        <Typography variant="caption" color="text.secondary">Equipe</Typography>
                        <Typography variant="body1" fontWeight={500}>
                          {teamNumber ? `Equipe ${teamNumber}` : "Sem equipe"}
                        </Typography>
                      </Box>
                    </Box>
                  </>
                )}

                {leaderName && (
                  <>
                    <Divider flexItem />
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar sx={{ bgcolor: 'warning.light', color: 'warning.dark', width: 32, height: 32 }}>
                        <SupervisorIcon fontSize="small" />
                      </Avatar>
                      <Box flex={1}>
                        <Typography variant="caption" color="text.secondary">Líder</Typography>
                        <Typography variant="body1" fontWeight={500}>{leaderName}</Typography>
                      </Box>
                    </Box>
                  </>
                )}
              </Stack>
            </Paper>

            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Criado em</Typography>
                <Typography variant="body2">{fmtDate(member.createdAt)}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Atualizado em</Typography>
                <Typography variant="body2">{fmtDate(member.updatedAt)}</Typography>
              </Grid>
            </Grid>
          </Box>

        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} size="large" fullWidth variant="contained" sx={{ borderRadius: 2 }}>Fechar</Button>
        </DialogActions>

        {/* TeamManagementDialog removed as we redirect to edit page */}
      </Dialog>

      <ImagePreviewDialog
        imageUrl={previewImage}
        onClose={() => setPreviewImage(null)}
        alt="Foto do Membro"
      />
    </>
  );
}
