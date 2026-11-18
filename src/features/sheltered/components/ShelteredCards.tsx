import React, { useState } from "react";
import {
  Avatar,
  Box,
  ButtonBase,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Slide,
  Stack,
  TablePagination,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  CakeOutlined,
  ChildCare,
  Delete,
  Edit,
  ExpandMore,
  LocationOnOutlined,
  Phone,
  PersonOutlined,
  PlaceOutlined,
  SwapVert,
  Visibility,
  WhatsApp,
} from "@mui/icons-material";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/slices";
import { buildWhatsappLink } from "@/utils/whatsapp";
import { formatDate, gLabel, timeDifference } from "@/utils/dateUtils";
import { CopyButton } from "@/components/common/CopyButton";
import { initials } from "@/utils/textUtils";
import {
  MIN_TOUCH_TARGET_PX,
  SHELTERED_CARD_PAGE_SIZE_OPTIONS,
  SHELTERED_MESSAGES,
  SHELTERED_PAGE_SIZE_DEFAULT,
  SHELTERED_SORT_OPTIONS,
  SHELTERED_TESTID,
} from "../constants";
import { ShelteredOrderBy } from "../enums";
import { shortAddressLabel, toTestIdSuffix } from "../utils";
import type { ShelteredListProps } from "./ShelteredTable";

const isOrderBy = (value: string): value is ShelteredOrderBy =>
  SHELTERED_SORT_OPTIONS.some((option) => option.id === value);

export default function ShelteredCards({
  rows,
  total,
  pageIndex,
  pageSize,
  setPageIndex,
  setPageSize,
  sorting,
  setSorting,
  onOpenView,
  onStartEdit,
  onAskDelete,
}: ShelteredListProps) {
  const [expandedIds, setExpandedIds] = useState<ReadonlySet<string>>(new Set());
  const user = useSelector((state: RootState) => state.auth.user);

  const toggleExpanded = (id: string) =>
    setExpandedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const sortField = sorting?.id ?? ShelteredOrderBy.UPDATED_AT;
  const sortDesc = sorting?.desc ?? true;

  return (
    <Box data-testid={SHELTERED_TESTID.CARDS} sx={{ px: { xs: 0, sm: 1 }, py: 0 }}>
      <Stack
        direction="row"
        spacing={1}
        sx={{ mb: 1.25, px: { xs: 0, sm: 0.5 } }}
        alignItems="center"
        justifyContent="flex-end"
      >
        <FormControl size="small" sx={{ minWidth: { xs: 140, sm: 180 } }}>
          <InputLabel id="sheltered-cards-sort-label">Ordenar por</InputLabel>
          <Select
            labelId="sheltered-cards-sort-label"
            label="Ordenar por"
            value={sortField}
            onChange={(event) => {
              const { value } = event.target;
              if (isOrderBy(value)) setSorting({ id: value, desc: sortDesc });
            }}
            data-testid="sheltered-cards-sort-field"
            sx={{ ".MuiSelect-select": { py: 0.75 } }}
          >
            {SHELTERED_SORT_OPTIONS.map((option) => (
              <MenuItem
                key={option.id}
                value={option.id}
                data-testid={`sheltered-cards-sort-${option.id}`}
              >
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Tooltip title={sortDesc ? "Ordem: decrescente" : "Ordem: crescente"}>
          <IconButton
            size="small"
            onClick={() => setSorting({ id: sortField, desc: !sortDesc })}
            aria-label="Inverter ordem"
            data-testid="sheltered-cards-sort-direction"
            sx={{ minWidth: MIN_TOUCH_TARGET_PX, minHeight: MIN_TOUCH_TARGET_PX }}
          >
            <SwapVert fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>

      <Grid container spacing={{ xs: 1, sm: 1.25 }}>
        {rows.map((sheltered) => {
          const suffix = toTestIdSuffix(sheltered.id);
          const expanded = expandedIds.has(sheltered.id);
          const ageLabel = timeDifference(sheltered.birthDate);
          const tenureLabel = timeDifference(sheltered.joinedAt);
          const whatsappLink = buildWhatsappLink(
            sheltered.name,
            user?.name,
            sheltered.guardianPhone ?? undefined,
          );

          return (
            <Grid
              item
              xs={12}
              key={sheltered.id}
              sx={{ mb: { xs: 0.75, sm: 1 }, pb: { xs: 1, sm: 1.25 } }}
            >
              <Card
                variant="outlined"
                data-testid={`sheltered-card-${suffix}`}
                sx={{
                  borderRadius: 2,
                  overflow: "hidden",
                  transition: "all 0.2s ease",
                  bgcolor: "background.paper",
                  position: "relative",
                  maxHeight: expanded ? "none" : { xs: 170, sm: 170 },
                  border: "1px solid",
                  borderColor: "divider",
                  "&:hover": {
                    boxShadow: 4,
                    transform: { xs: "none", sm: "translateY(-2px)" },
                  },
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  sx={{
                    px: { xs: 1, sm: 1.25 },
                    pt: 1,
                    pb: 0.5,
                    gap: { xs: 0.75, sm: 1 },
                    mt: 0.5,
                  }}
                >
                  <Avatar
                    aria-hidden
                    sx={{
                      width: { xs: 40, sm: 48 },
                      height: { xs: 40, sm: 48 },
                      bgcolor: sheltered.shelter ? "primary.main" : "grey.500",
                      color: "common.white",
                      fontWeight: 700,
                      fontSize: { xs: 14, sm: 16 },
                      boxShadow: 2,
                      flexShrink: 0,
                    }}
                  >
                    {initials(sheltered.name)}
                  </Avatar>

                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography
                      variant="subtitle1"
                      fontWeight={700}
                      noWrap
                      title={sheltered.name}
                      sx={{ fontSize: { xs: "0.9rem", sm: "1rem" } }}
                    >
                      {sheltered.name}
                    </Typography>
                    <Chip
                      size="small"
                      color={sheltered.shelter ? "primary" : "default"}
                      variant={sheltered.shelter ? "filled" : "outlined"}
                      label={
                        sheltered.shelter
                          ? `Abrigo ${sheltered.shelter.name}`
                          : SHELTERED_MESSAGES.NO_SHELTER
                      }
                      data-testid={`sheltered-card-shelter-${suffix}`}
                      sx={{ fontSize: "0.7rem", height: 20, mt: 0.25 }}
                    />
                  </Box>

                  <ButtonBase
                    onClick={() => toggleExpanded(sheltered.id)}
                    aria-expanded={expanded}
                    aria-label={
                      expanded
                        ? `Recolher detalhes de ${sheltered.name}`
                        : `Expandir detalhes de ${sheltered.name}`
                    }
                    data-testid={`sheltered-card-toggle-${suffix}`}
                    sx={{
                      borderRadius: 2,
                      px: { xs: 0.75, sm: 1 },
                      py: 0.5,
                      minHeight: MIN_TOUCH_TARGET_PX,
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      border: "1px solid",
                      borderColor: "divider",
                      bgcolor: "background.paper",
                      flexShrink: 0,
                      "&:hover": { bgcolor: "action.hover" },
                    }}
                  >
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontWeight: 600, display: { xs: "none", sm: "block" } }}
                    >
                      {expanded ? "Recolher" : "Detalhes"}
                    </Typography>
                    <ExpandMore
                      fontSize="small"
                      sx={{
                        transition: "transform .15s ease",
                        transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                      }}
                    />
                  </ButtonBase>
                </Stack>

                <Box
                  sx={{
                    mx: { xs: 1, sm: 1.25 },
                    mb: 0.5,
                    p: { xs: 0.75, sm: 1 },
                    borderRadius: 2,
                    bgcolor: "background.default",
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Stack spacing={0.75}>
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      <PersonOutlined
                        aria-hidden
                        sx={{ fontSize: 18, color: "primary.main", flexShrink: 0 }}
                      />
                      <Typography
                        variant="body2"
                        title={sheltered.guardianName ?? SHELTERED_MESSAGES.NO_GUARDIAN}
                        data-testid={`sheltered-card-guardian-${suffix}`}
                        sx={{
                          fontWeight: 600,
                          color: "text.primary",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          minWidth: 0,
                          flex: 1,
                        }}
                      >
                        {sheltered.guardianName || SHELTERED_MESSAGES.NO_GUARDIAN}
                      </Typography>
                    </Stack>

                    {sheltered.guardianPhone && (
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <Tooltip title="Ligar">
                          <IconButton
                            size="small"
                            href={`tel:${sheltered.guardianPhone}`}
                            aria-label={`Ligar para o responsável por ${sheltered.name}`}
                            data-testid={`sheltered-card-call-${suffix}`}
                            sx={{
                              minWidth: MIN_TOUCH_TARGET_PX,
                              minHeight: MIN_TOUCH_TARGET_PX,
                            }}
                          >
                            <Phone fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {whatsappLink && (
                          <Tooltip title="WhatsApp">
                            <IconButton
                              size="small"
                              color="success"
                              component="a"
                              href={whatsappLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`Abrir WhatsApp do responsável por ${sheltered.name}`}
                              data-testid={`sheltered-card-whatsapp-${suffix}`}
                              sx={{
                                minWidth: MIN_TOUCH_TARGET_PX,
                                minHeight: MIN_TOUCH_TARGET_PX,
                              }}
                            >
                              <WhatsApp fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <CopyButton
                          value={sheltered.guardianPhone}
                          title="Copiar telefone"
                        />
                      </Stack>
                    )}
                  </Stack>
                </Box>

                {!expanded && (
                  <Box sx={{ px: { xs: 1, sm: 1.25 }, pb: 0.75 }}>
                    <Stack
                      direction="row"
                      spacing={0.5}
                      alignItems="center"
                      flexWrap="wrap"
                      rowGap={0.25}
                    >
                      <Chip
                        size="small"
                        variant="filled"
                        color="info"
                        label={gLabel(sheltered.gender)}
                        sx={{ fontWeight: 600, fontSize: "0.7rem", height: 20 }}
                      />
                      {ageLabel && (
                        <Chip
                          size="small"
                          variant="filled"
                          color="success"
                          label={ageLabel}
                          sx={{ fontWeight: 600, fontSize: "0.7rem", height: 20 }}
                        />
                      )}
                      {tenureLabel && (
                        <Chip
                          size="small"
                          variant="filled"
                          color="warning"
                          label={tenureLabel}
                          sx={{ fontWeight: 600, fontSize: "0.7rem", height: 20 }}
                        />
                      )}
                    </Stack>
                    <Stack
                      direction="row"
                      spacing={0.5}
                      alignItems="center"
                      sx={{ mt: 0.5 }}
                    >
                      <LocationOnOutlined
                        aria-hidden
                        sx={{ fontSize: 14, color: "text.secondary" }}
                      />
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          fontWeight: 500,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {shortAddressLabel(sheltered.address)}
                      </Typography>
                    </Stack>
                  </Box>
                )}

                <Slide direction="down" in={expanded} timeout={300}>
                  <Box data-testid={`sheltered-card-details-${suffix}`}>
                    <Divider sx={{ mx: { xs: 1, sm: 1.25 } }} />
                    <CardContent sx={{ p: { xs: 1.25, sm: 1.5 } }}>
                      <Stack spacing={2}>
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 1.25,
                            borderRadius: 2,
                            bgcolor: "background.default",
                            borderColor: "divider",
                          }}
                        >
                          <Stack spacing={1}>
                            <Stack direction="row" spacing={0.75} alignItems="center">
                              <ChildCare fontSize="small" color="primary" aria-hidden />
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                Informações do Acolhido
                              </Typography>
                            </Stack>
                            <Stack
                              direction="row"
                              spacing={1}
                              flexWrap="wrap"
                              useFlexGap
                              rowGap={1}
                            >
                              <Chip
                                size="small"
                                variant="outlined"
                                color="info"
                                label={gLabel(sheltered.gender)}
                              />
                              {ageLabel && (
                                <Chip
                                  size="small"
                                  variant="outlined"
                                  color="success"
                                  label={`Idade: ${ageLabel}`}
                                />
                              )}
                              {tenureLabel && (
                                <Chip
                                  size="small"
                                  variant="outlined"
                                  color="warning"
                                  label={`Tempo no abrigo: ${tenureLabel}`}
                                />
                              )}
                            </Stack>
                          </Stack>
                        </Paper>

                        <Paper
                          variant="outlined"
                          sx={{
                            p: 1.25,
                            borderRadius: 2,
                            bgcolor: "background.default",
                            borderColor: "divider",
                          }}
                        >
                          <Stack spacing={1}>
                            <Stack direction="row" spacing={0.75} alignItems="center">
                              <CakeOutlined fontSize="small" color="primary" aria-hidden />
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                Datas Importantes
                              </Typography>
                            </Stack>
                            <Stack
                              direction="row"
                              spacing={1}
                              flexWrap="wrap"
                              useFlexGap
                              rowGap={1}
                            >
                              <Chip
                                size="small"
                                variant="outlined"
                                label={`Nascimento: ${formatDate(sheltered.birthDate)}`}
                              />
                              <Chip
                                size="small"
                                variant="outlined"
                                label={`No abrigo desde: ${formatDate(sheltered.joinedAt)}`}
                              />
                            </Stack>
                          </Stack>
                        </Paper>

                        {sheltered.address && (
                          <Paper
                            variant="outlined"
                            sx={{
                              p: 1.25,
                              borderRadius: 2,
                              bgcolor: "background.default",
                              borderColor: "divider",
                            }}
                          >
                            <Stack spacing={1}>
                              <Stack direction="row" spacing={0.75} alignItems="center">
                                <PlaceOutlined
                                  fontSize="small"
                                  color="primary"
                                  aria-hidden
                                />
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                  Endereço
                                </Typography>
                              </Stack>
                              <Stack spacing={0.5}>
                                {(sheltered.address.street ||
                                  sheltered.address.number) && (
                                  <Typography
                                    variant="body2"
                                    sx={{ fontWeight: 500, lineHeight: 1.4 }}
                                  >
                                    {sheltered.address.street ?? ""}
                                    {sheltered.address.number
                                      ? `, ${sheltered.address.number}`
                                      : ""}
                                  </Typography>
                                )}
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{ lineHeight: 1.4 }}
                                >
                                  {sheltered.address.district
                                    ? `${sheltered.address.district} • `
                                    : ""}
                                  {sheltered.address.city} / {sheltered.address.state}
                                </Typography>
                                {sheltered.address.postalCode && (
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ lineHeight: 1.4 }}
                                  >
                                    CEP: {sheltered.address.postalCode}
                                  </Typography>
                                )}
                                {sheltered.address.complement && (
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ lineHeight: 1.4 }}
                                  >
                                    Complemento: {sheltered.address.complement}
                                  </Typography>
                                )}
                              </Stack>
                            </Stack>
                          </Paper>
                        )}
                      </Stack>
                    </CardContent>
                  </Box>
                </Slide>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 0.75,
                    px: { xs: 1, sm: 1.25 },
                    pb: { xs: 0.75, sm: 1 },
                    pt: 0.75,
                    bgcolor: "background.default",
                    borderTop: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontWeight: 500 }}
                  >
                    {sheltered.name}
                  </Typography>

                  <Stack direction="row" spacing={0.5}>
                    <Tooltip title="Visualizar detalhes">
                      <IconButton
                        size="small"
                        onClick={() => onOpenView(sheltered)}
                        aria-label={`Ver detalhes de ${sheltered.name}`}
                        data-testid={`sheltered-card-view-${suffix}`}
                        sx={{
                          color: "primary.main",
                          minWidth: MIN_TOUCH_TARGET_PX,
                          minHeight: MIN_TOUCH_TARGET_PX,
                        }}
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Editar acolhido">
                      <IconButton
                        size="small"
                        onClick={() => onStartEdit(sheltered)}
                        aria-label={`Editar ${sheltered.name}`}
                        data-testid={`sheltered-card-edit-${suffix}`}
                        sx={{
                          color: "info.main",
                          minWidth: MIN_TOUCH_TARGET_PX,
                          minHeight: MIN_TOUCH_TARGET_PX,
                        }}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Excluir acolhido">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => onAskDelete(sheltered)}
                        aria-label={`Excluir ${sheltered.name}`}
                        data-testid={`sheltered-card-delete-${suffix}`}
                        sx={{
                          minWidth: MIN_TOUCH_TARGET_PX,
                          minHeight: MIN_TOUCH_TARGET_PX,
                        }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Box>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Divider sx={{ mt: 1.25 }} />
      <TablePagination
        component="div"
        count={total}
        page={pageIndex}
        onPageChange={(_event, page) => setPageIndex(page)}
        rowsPerPage={pageSize}
        onRowsPerPageChange={(event) => {
          setPageSize(Number.parseInt(event.target.value, 10) || SHELTERED_PAGE_SIZE_DEFAULT);
          setPageIndex(0);
        }}
        rowsPerPageOptions={[...SHELTERED_CARD_PAGE_SIZE_OPTIONS]}
        labelRowsPerPage="Linhas"
        data-testid="sheltered-cards-pagination"
        sx={{ px: 0 }}
      />
    </Box>
  );
}
