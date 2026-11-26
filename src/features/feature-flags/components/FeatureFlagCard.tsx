import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import {
  Alert,
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  IconButton,
  Stack,
  Switch,
  Tooltip,
  Typography,
} from '@mui/material';

import { isEnforcedByApi } from '../areas';
import type { FeatureFlagResponse } from '../types';
import {
  audienceInfo,
  audienceWarning,
  featureFlagInitials,
  formatFeatureFlagDate,
} from '../utils/featureFlagUtils';

interface FeatureFlagCardProps {
  flag: FeatureFlagResponse;
  disabled: boolean;
  onToggle: (flag: FeatureFlagResponse) => void;
  onEdit: (flag: FeatureFlagResponse) => void;
  onCopy: (flag: FeatureFlagResponse) => void;
  onDelete: (flag: FeatureFlagResponse) => void;
}

export function FeatureFlagCard({
  flag,
  disabled,
  onToggle,
  onEdit,
  onCopy,
  onDelete,
}: FeatureFlagCardProps) {
  const audience = audienceInfo(flag.audience);
  const warning = audienceWarning(flag.key, flag.audience);
  const enforced = isEnforcedByApi(flag.key);

  return (
    <Card
      variant="outlined"
      data-testid={`feature-flags-card-${flag.id}`}
      sx={{ height: '100%', borderRadius: 3 }}
    >
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
        <Stack direction="row" spacing={1.5} alignItems="flex-start">
          <Avatar sx={{ bgcolor: flag.enabled ? 'success.main' : 'grey.500' }}>
            {featureFlagInitials(flag.key)}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="h6" component="h3" noWrap title={flag.name}>
              {flag.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
              {flag.key}
            </Typography>
          </Box>
          <Tooltip title={flag.enabled ? 'Desligar' : 'Ligar'}>
            <Switch
              checked={flag.enabled}
              disabled={disabled}
              onChange={() => onToggle(flag)}
              inputProps={{ 'aria-label': `Alternar ${flag.name}` }}
              data-testid={`feature-flags-card-toggle-${flag.id}`}
              sx={{ '& .MuiSwitch-switchBase': { minWidth: 44, minHeight: 44 } }}
            />
          </Tooltip>
        </Stack>

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Chip
            size="small"
            color={flag.enabled ? 'success' : 'default'}
            label={flag.enabled ? 'Ligada' : 'Desligada'}
          />
          <Chip size="small" color={audience.color} label={audience.label} />
          {enforced ? (
            <Tooltip title="A API recusa (403) o recurso quando a flag está desligada, mesmo fora da interface.">
              <Chip
                size="small"
                variant="outlined"
                color="primary"
                icon={<ShieldOutlinedIcon />}
                label="Imposta na API"
                data-testid={`feature-flags-card-enforced-${flag.id}`}
              />
            </Tooltip>
          ) : null}
          {flag.protected ? (
            <Tooltip title="Flag de fábrica: não pode ser renomeada nem removida. Para desativar, desligue-a.">
              <Chip
                size="small"
                variant="outlined"
                icon={<LockOutlinedIcon />}
                label="Protegida"
                data-testid={`feature-flags-card-protected-${flag.id}`}
              />
            </Tooltip>
          ) : null}
        </Stack>

        {warning ? (
          <Alert
            severity="warning"
            data-testid={`feature-flags-card-warning-${flag.id}`}
            sx={{ py: 0 }}
          >
            {warning}
          </Alert>
        ) : null}

        <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
          {flag.description || audience.description}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Alterada em {formatFeatureFlagDate(flag.updatedAt)}
        </Typography>

        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Tooltip title="Copiar chave">
            <IconButton
              type="button"
              aria-label="Copiar chave"
              onClick={() => onCopy(flag)}
              data-testid={`feature-flags-card-copy-${flag.id}`}
              sx={{ minWidth: 44, minHeight: 44 }}
            >
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Editar">
            <IconButton
              type="button"
              aria-label="Editar"
              onClick={() => onEdit(flag)}
              data-testid={`feature-flags-card-edit-${flag.id}`}
              sx={{ minWidth: 44, minHeight: 44 }}
            >
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={flag.protected ? 'Flag de fábrica: desligue em vez de excluir' : 'Excluir'}>
            <span>
            <IconButton
              type="button"
              color="error"
              aria-label="Excluir"
              onClick={() => onDelete(flag)}
              disabled={flag.protected}
              data-testid={`feature-flags-card-delete-${flag.id}`}
              sx={{ minWidth: 44, minHeight: 44 }}
            >
              <DeleteOutlinedIcon fontSize="small" />
            </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </CardContent>
    </Card>
  );
}
