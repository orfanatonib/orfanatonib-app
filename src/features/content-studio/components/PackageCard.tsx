import ArrowForward from "@mui/icons-material/ArrowForward";
import Groups from "@mui/icons-material/Groups";
import MenuBook from "@mui/icons-material/MenuBook";
import { Box, Button, Card, CardContent, Chip, LinearProgress, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

import { CONTENT_PACKAGE_STATUS_LABELS } from "../constants";
import { PACKAGE_STATUS_COLORS } from "../period.utils";
import { audienceNames, pluralize, stageProgress } from "../production.utils";
import type { ContentAudienceDefinitionResponse, ContentPackageListItemResponse } from "../types";
import { formatContentStudioDateTime } from "../utils";

interface PackageCardProps {
  item: ContentPackageListItemResponse;
  audiences: readonly ContentAudienceDefinitionResponse[];
}

/** Um material para visita na listagem: tema, referência, faixas, andamento e ação. */
export function PackageCard({ item, audiences }: PackageCardProps) {
  const progress = stageProgress(item);
  const color = PACKAGE_STATUS_COLORS[item.status];
  const names = audienceNames(item.audiences ?? [], audiences);
  const archived = item.status === "ARCHIVED";

  return (
    <Card variant="outlined" sx={{ opacity: archived ? 0.8 : 1 }}>
      <CardContent>
        <Stack spacing={1.75}>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "flex-start" }} spacing={1}>
            <Box sx={{ minWidth: 0 }}>
              <Typography component="h3" variant="subtitle1" fontWeight={700} sx={{ wordBreak: "break-word" }}>
                {item.theme}
              </Typography>
              <Stack direction="row" spacing={0.75} alignItems="center" color="text.secondary">
                <MenuBook sx={{ fontSize: 18 }} />
                <Typography variant="body2">{item.biblicalReferences}</Typography>
              </Stack>
            </Box>
            <Chip
              label={CONTENT_PACKAGE_STATUS_LABELS[item.status]}
              size="small"
              color={color}
              variant={color === "default" ? "outlined" : "filled"}
              sx={{ alignSelf: { xs: "flex-start", sm: "auto" } }}
            />
          </Stack>

          <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" alignItems="center">
            <Groups sx={{ fontSize: 18, color: "text.secondary" }} />
            {names.length > 0 ? (
              names.map((name) => <Chip key={name} label={name} size="small" variant="outlined" />)
            ) : (
              <Typography variant="body2" color="text.secondary">
                {item.tracksCount} {pluralize(item.tracksCount, "faixa", "faixas")}
              </Typography>
            )}
          </Stack>

          <Box>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                {progress.label}
              </Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                {progress.percent}%
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={progress.percent}
              color={progress.percent === 100 ? "success" : "primary"}
              aria-label={`Andamento: ${progress.label}`}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>

          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={1}>
            <Typography variant="caption" color="text.secondary">
              Criado em {formatContentStudioDateTime(item.createdAt)} · atualizado em {formatContentStudioDateTime(item.updatedAt)}
            </Typography>
            <Button
              component={RouterLink}
              to={`/adm/estudio/pacotes/${item.id}`}
              endIcon={<ArrowForward />}
              variant={archived ? "outlined" : "contained"}
              data-testid={`content-studio-package-${item.id}`}
              sx={{ minHeight: 44, alignSelf: { xs: "stretch", sm: "auto" } }}
            >
              {archived ? "Ver material" : "Continuar produção"}
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
