import React from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Grid,
  TextField, Alert, Box, FormControl, InputLabel, Select, MenuItem,
  FormControlLabel, Switch, Typography
} from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import { UserRole } from "@/store/slices/auth/authSlice";
import { UpadateUserForm } from "../types";
import { maskPhoneBR } from "@/utils/masks";
import { normalizeName } from "@/utils/textUtils";

type Props = {
  open: boolean;
  value: (UpadateUserForm & { confirmPassword?: string; editPassword?: boolean }) | null;
  onChange: (v: UpadateUserForm & { confirmPassword?: string; editPassword?: boolean }) => void;
  loading: boolean;
  error: string;
  onCancel: () => void;
  onConfirm: () => void;
};

const roleLabels: Record<UserRole, string> = {
  [UserRole.LEADER]: "Líder",
  [UserRole.MEMBER]: "Membro",
  [UserRole.ADMIN]: "Administrador",
};

export default function UserEditDialog({
  open, value, onChange, loading, error, onCancel, onConfirm,
}: Props) {
  if (!value) return null;

  const roleOptions = [UserRole.LEADER, UserRole.MEMBER];

  const editingPassword = !!value.editPassword;
  const senhaInvalida =
    editingPassword &&
    (!!value.password || !!value.confirmPassword) &&
    value.password !== value.confirmPassword;

  const isMember = value.role === UserRole.MEMBER;

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle>Editar Usuário</DialogTitle>
      <DialogContent dividers sx={{ p: { xs: 2, md: 3 } }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Nome"
              value={value.name}
              onChange={(e) => onChange({ ...value, name: e.target.value })}
              onBlur={() => onChange({ ...value, name: normalizeName(value.name || "") })}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Papel</InputLabel>
              <Select
                label="Papel"
                value={value.role}
                onChange={(e) => onChange({ ...value, role: e.target.value as UserRole })}
              >
                {roleOptions.map((role) => (
                  <MenuItem key={role} value={role}>
                    {roleLabels[role]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Telefone"
              inputMode="numeric"
              value={maskPhoneBR(value.phone || "")}
              onChange={(e) => onChange({ ...value, phone: maskPhoneBR(e.target.value) })}
              placeholder="(DD) 9XXXX-XXXX"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={
                <Switch
                  checked={value.active}
                  onChange={(e) => onChange({ ...value, active: e.target.checked })}
                />
              }
              label="Ativo"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={
                <Switch
                  checked={value.completed}
                  onChange={(e) => onChange({ ...value, completed: e.target.checked })}
                />
              }
              label="Cadastro completo"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={
                <Switch
                  checked={editingPassword}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    onChange({
                      ...value,
                      editPassword: checked,
                      password: checked ? value.password : "",
                      confirmPassword: checked ? value.confirmPassword : "",
                    });
                  }}
                />
              }
              label="Editar senha?"
            />
          </Grid>

          {isMember && (
            <Grid item xs={12}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: "background.default",
                }}
              >
                <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                  Equipe do membro
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  {value.memberTeamLabel ||
                    "Nenhuma (ainda não vinculado a uma equipe)."}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Equipe que o usuário informou no cadastro ou que foi atribuída pela coordenação (apenas visualização).
                </Typography>
              </Box>
            </Grid>
          )}

          {editingPassword && (
            <>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Nova Senha"
                  type="password"
                  value={value.password}
                  onChange={(e) => onChange({ ...value, password: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Confirmar Senha"
                  type="password"
                  value={value.confirmPassword ?? ""}
                  onChange={(e) => onChange({ ...value, confirmPassword: e.target.value })}
                />
              </Grid>
              {senhaInvalida && (
                <Grid item xs={12}>
                  <Alert severity="error">As senhas não coincidem.</Alert>
                </Grid>
              )}
            </>
          )}
        </Grid>

        {loading && (
          <Box textAlign="center" my={2}>
            <CircularProgress size={24} />
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onCancel} sx={{ color: "text.secondary" }}>Cancelar</Button>
        <Button variant="contained" onClick={onConfirm} disabled={loading || senhaInvalida}>
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
