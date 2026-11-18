import FactCheck from "@mui/icons-material/FactCheck";
import Refresh from "@mui/icons-material/Refresh";
import Visibility from "@mui/icons-material/Visibility";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  TablePagination,
  TextField,
  Typography,
} from "@mui/material";
import { useMemo, useState, type FormEvent } from "react";
import { Link as RouterLink } from "react-router-dom";

import {
  CONTENT_PACKAGE_STATUS_LABELS,
  CONTENT_STUDIO_REVIEW_CHECKLIST,
} from "../constants";
import { ContentAudience, ContentPackageStatus } from "../types";
import { useContentPackages } from "../hooks/useContentPackages";
import { formatContentStudioDateTime } from "../utils";
import { ContentStudioPageHeader } from "../components/ContentStudioPageHeader";
import { CONTENT_STUDIO_PAGE_SX } from "../styles";

export function ContentStudioReviewPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ContentPackageStatus | "">("");
  const [audience, setAudience] = useState<ContentAudience | "">("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const dateRangeInvalid = Boolean(startDate && endDate && startDate > endDate);
  const query = useMemo(
    () => ({
      page,
      limit: 10,
      reviewQueue: true,
      ...(search ? { search } : {}),
      ...(status ? { status } : {}),
      ...(audience ? { audience } : {}),
      ...(!dateRangeInvalid && startDate ? { startDate } : {}),
      ...(!dateRangeInvalid && endDate ? { endDate } : {}),
    }),
    [page, search, status, audience, startDate, endDate, dateRangeInvalid],
  );
  const { packages, total, limit, loading, error, reload } =
    useContentPackages(query);
  const applySearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };
  const clearFilters = () => {
    setSearchInput("");
    setSearch("");
    setStatus("");
    setAudience("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  return (
    <Box
      component="section"
      data-testid="content-studio-review-page"
      sx={CONTENT_STUDIO_PAGE_SX}
    >
      <Stack spacing={3}>
        <ContentStudioPageHeader
          title="Revisão editorial"
          description="Confira segurança, fidelidade e adequação antes de aprovar uma versão."
          backTo="/adm/estudio"
          backLabel="Voltar à visão geral"
        />

        <Card variant="outlined" data-testid="content-studio-review-queue">
          <CardContent>
            <Stack spacing={2}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                spacing={1}
              >
                <Box>
                  <Typography component="h2" variant="h6" fontWeight={700}>
                    Fila de revisão
                  </Typography>
                  <Typography color="text.secondary">
                    {total} pacote{total === 1 ? "" : "s"} na fila de revisão.
                  </Typography>
                </Box>
                <Button
                  onClick={() => void reload()}
                  startIcon={<Refresh />}
                  sx={{ minHeight: 44 }}
                >
                  Atualizar
                </Button>
              </Stack>

              <Box
                component="form"
                onSubmit={applySearch}
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, 1fr)",
                    lg: "repeat(3, 1fr)",
                  },
                  gap: 1.5,
                }}
                data-testid="content-studio-review-filters"
              >
                <TextField
                  label="Buscar tema ou referência"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  inputProps={{ "data-testid": "content-studio-review-search" }}
                />
                <FormControl>
                  <InputLabel id="content-studio-review-status-label">
                    Status
                  </InputLabel>
                  <Select
                    labelId="content-studio-review-status-label"
                    label="Status"
                    value={status}
                    onChange={(event) => {
                      setStatus(
                        event.target.value as ContentPackageStatus | "",
                      );
                      setPage(1);
                    }}
                    inputProps={{
                      "data-testid": "content-studio-review-status",
                    }}
                  >
                    <MenuItem value="">Todos na fila</MenuItem>
                    {[
                      ContentPackageStatus.PACKAGE_READY,
                      ContentPackageStatus.IN_REVIEW,
                      ContentPackageStatus.CHANGES_REQUESTED,
                      ContentPackageStatus.READY_FOR_PUBLICATION,
                    ].map((value) => (
                      <MenuItem key={value} value={value}>
                        {CONTENT_PACKAGE_STATUS_LABELS[value]}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl>
                  <InputLabel id="content-studio-review-audience-label">
                    Faixa
                  </InputLabel>
                  <Select
                    labelId="content-studio-review-audience-label"
                    label="Faixa"
                    value={audience}
                    onChange={(event) => {
                      setAudience(event.target.value as ContentAudience | "");
                      setPage(1);
                    }}
                    inputProps={{
                      "data-testid": "content-studio-review-audience",
                    }}
                  >
                    <MenuItem value="">Todas as faixas</MenuItem>
                    <MenuItem value={ContentAudience.BABY}>Bebês</MenuItem>
                    <MenuItem value={ContentAudience.CHILD}>Crianças</MenuItem>
                    <MenuItem value={ContentAudience.TEEN}>
                      Adolescentes
                    </MenuItem>
                    <MenuItem value={ContentAudience.ADULT}>Adultos</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  label="Criado de"
                  type="date"
                  value={startDate}
                  onChange={(event) => {
                    setStartDate(event.target.value);
                    setPage(1);
                  }}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{
                    "data-testid": "content-studio-review-start-date",
                  }}
                />
                <TextField
                  label="Criado até"
                  type="date"
                  value={endDate}
                  onChange={(event) => {
                    setEndDate(event.target.value);
                    setPage(1);
                  }}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{
                    "data-testid": "content-studio-review-end-date",
                  }}
                  error={dateRangeInvalid}
                  helperText={
                    dateRangeInvalid
                      ? "A data final deve ser igual ou posterior à inicial."
                      : undefined
                  }
                />
                <Stack direction="row" spacing={1}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={dateRangeInvalid}
                    sx={{ minHeight: 44 }}
                  >
                    Aplicar
                  </Button>
                  <Button onClick={clearFilters} sx={{ minHeight: 44 }}>
                    Limpar
                  </Button>
                </Stack>
              </Box>

              {loading && (
                <Stack
                  alignItems="center"
                  justifyContent="center"
                  minHeight={120}
                  spacing={2}
                >
                  <CircularProgress />
                  <Typography color="text.secondary">
                    Carregando fila…
                  </Typography>
                </Stack>
              )}

              {!loading && error && (
                <Alert
                  severity="error"
                  action={
                    <Button
                      color="inherit"
                      onClick={() => void reload()}
                      sx={{ minHeight: 44 }}
                    >
                      Tentar novamente
                    </Button>
                  }
                >
                  Não foi possível carregar a fila de revisão.
                </Alert>
              )}

              {!loading && !error && packages.length === 0 && (
                <Alert
                  severity="info"
                  data-testid="content-studio-review-empty"
                >
                  Nenhum pacote está pronto para revisão no momento.
                </Alert>
              )}

              {!loading && !error && packages.length > 0 && (
                <Stack spacing={1.5}>
                  {packages.map((contentPackage) => (
                    <Card key={contentPackage.id} variant="outlined">
                      <CardContent>
                        <Stack spacing={1.5}>
                          <Stack
                            direction={{ xs: "column", sm: "row" }}
                            justifyContent="space-between"
                            spacing={1}
                          >
                            <Box>
                              <Typography
                                component="h3"
                                variant="subtitle1"
                                fontWeight={700}
                              >
                                {contentPackage.theme}
                              </Typography>
                              <Typography color="text.secondary">
                                {contentPackage.biblicalReferences}
                              </Typography>
                            </Box>
                            <Chip
                              label={
                                CONTENT_PACKAGE_STATUS_LABELS[
                                  contentPackage.status
                                ]
                              }
                            />
                          </Stack>
                          <Typography color="text.secondary" variant="body2">
                            {contentPackage.approvedStagesCount} de{" "}
                            {contentPackage.requiredStagesCount} etapas
                            obrigatórias aprovadas. Atualizado em{" "}
                            {formatContentStudioDateTime(
                              contentPackage.updatedAt,
                            )}
                            .
                          </Typography>
                          <Button
                            component={RouterLink}
                            to={`/adm/estudio/pacotes/${contentPackage.id}`}
                            startIcon={<Visibility />}
                            sx={{ alignSelf: "flex-start", minHeight: 44 }}
                          >
                            Revisar pacote
                          </Button>
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              )}
              {!loading && !error && total > limit && (
                <TablePagination
                  component="div"
                  count={total}
                  page={page - 1}
                  rowsPerPage={limit}
                  rowsPerPageOptions={[10]}
                  onPageChange={(_, nextPage) => setPage(nextPage + 1)}
                  onRowsPerPageChange={() => undefined}
                  labelRowsPerPage="Pacotes por página"
                />
              )}
            </Stack>
          </CardContent>
        </Card>

        <Card variant="outlined" data-testid="content-studio-review-checklist">
          <CardContent>
            <Typography component="h2" variant="h6" fontWeight={700}>
              Checklist mínimo
            </Typography>
            <List>
              {CONTENT_STUDIO_REVIEW_CHECKLIST.map((item) => (
                <ListItem key={item} disableGutters alignItems="flex-start">
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <FactCheck color="primary" />
                  </ListItemIcon>
                  <ListItemText primary={item} />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}
