import React, { useMemo, useState } from "react";
import {
  Box, Card, CardContent, Chip, Grid, IconButton, Stack,
  Typography, MenuItem, Select, FormControl, InputLabel,
  Divider, TablePagination, Tooltip, Collapse, ButtonBase,
  Paper, Avatar, Slide, Link
} from "@mui/material";
import { Visibility, Edit, Delete, SwapVert, CakeOutlined, PlaceOutlined, ExpandMore as ExpandMoreIcon, LocationOnOutlined, Phone as PhoneIcon, ChildCare, PersonOutlined, WhatsApp } from "@mui/icons-material";
import { SortingState } from "@tanstack/react-table";
import { ShelteredResponseDto } from "../types";
import { RootState } from "@/store/slices";
import { useSelector } from "react-redux";
import { buildWhatsappLink } from "@/utils/whatsapp";
import { formatDate, gLabel, ageFrom, timeDifference } from "@/utils/dateUtils";
import { CopyButton, initials } from "@/utils/components";

type Props = {
  rows: ShelteredResponseDto[];
  total: number;
  pageIndex: number;
  pageSize: number;
  setPageIndex: (n: number) => void;
  setPageSize: (n: number) => void;
  sorting: SortingState;
  setSorting: (s: SortingState) => void;
  onOpenView: (row: ShelteredResponseDto) => void;
  onStartEdit: (row: ShelteredResponseDto) => void;
  onAskDelete: (row: ShelteredResponseDto) => void;
};

export default function ShelteredrenCards(props: Props) {
  const {
    rows, total, pageIndex, pageSize, setPageIndex, setPageSize,
    sorting, setSorting, onOpenView, onStartEdit, onAskDelete
  } = props;

  const [open, setOpen] = useState<Set<string>>(new Set());
  const { user } = useSelector((state: RootState) => state.auth);
  
  const toggle = (id: string) =>
    setOpen((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const currentSort = sorting?.[0] ?? { id: "updatedAt", desc: true };
  const sortField = String(currentSort.id ?? "updatedAt");
  const sortDesc = !!currentSort.desc;

  const handleSortField = (field: string) => setSorting([{ id: field, desc: sortDesc }]);
  const toggleSortDir = () => setSorting([{ id: sortField, desc: !sortDesc }]);

  const sortOptions = useMemo(() => ([
    { id: "name", label: "Nome" },
    { id: "birthDate", label: "Nascimento" },
    { id: "joinedAt", label: "No abrigo desde" },
    { id: "updatedAt", label: "Atualizado em" },
    { id: "createdAt", label: "Criado em" },
  ]), []);

  return (
    <Box sx={{ px: { xs: 0, sm: 1 }, py: 0 }}>
      <Stack
        direction="row"
        spacing={1}
        sx={{ mb: 1.25, px: { xs: 0, sm: 0.5 } }}
        alignItems="center"
        justifyContent="flex-end"
      >
        <FormControl size="small" sx={{ minWidth: { xs: 140, sm: 180 } }}>
          <InputLabel>Ordenar por</InputLabel>
          <Select
            label="Ordenar por"
            value={sortField}
            onChange={(e) => handleSortField(String(e.target.value))}
            sx={{ ".MuiSelect-select": { py: 0.75 } }}
          >
            {sortOptions.map(o => <MenuItem key={o.id} value={o.id}>{o.label}</MenuItem>)}
          </Select>
        </FormControl>
        <Tooltip title={sortDesc ? "Ordem: Descendente" : "Ordem: Ascendente"}>
          <IconButton size="small" onClick={toggleSortDir} aria-label="Inverter ordem">
            <SwapVert fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>

      <Grid container spacing={{ xs: 1, sm: 1.25 }}>
        {rows.map((c) => {
          const expanded = open.has(c.id);
          const age = ageFrom(c.birthDate);
          const ageDetailedText = timeDifference(c.birthDate);
          const tenure = timeDifference(c.joinedAt);
          const addrPreview = c.address ? `${c.address.city} / ${c.address.state}` : "—";
          const wa = buildWhatsappLink(c.name, user?.name, c.guardianPhone);

          return (
            <Grid item xs={12} key={c.id} sx={{ mb: { xs: 0.75, sm: 1 }, pb: { xs: 1, sm: 1.25 } }}>
              <Card
                variant="outlined"
                sx={{
                  borderRadius: 2,
                  overflow: "hidden",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    boxShadow: 4,
                    transform: { xs: "none", sm: "translateY(-2px)" },
                    "& .sheltered-avatar": {
                      transform: "scale(1.05)",
                    }
                  },
                  bgcolor: "background.paper",
                  position: "relative",
                  maxHeight: !expanded ? { xs: 170, sm: 170 } : "none",
                  border: "1px solid",
                  borderColor: "divider",
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
                    className="sheltered-avatar"
                    sx={{
                      width: { xs: 40, sm: 48 },
                      height: { xs: 40, sm: 48 },
                      bgcolor: c.shelter ? "primary.main" : "grey.500",
                      color: "white",
                      fontWeight: 700,
                      fontSize: { xs: 14, sm: 16 },
                      boxShadow: 2,
                      transition: "transform 0.2s ease",
                      flexShrink: 0,
                    }}
                    aria-label={`Avatar do abrigado ${c.name}`}
                  >
                    {initials(c.name)}
                  </Avatar>

                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography
                      variant="subtitle1"
                      fontWeight={700}
                      noWrap
                      title={c.name}
                      sx={{ fontSize: { xs: "0.9rem", sm: "1rem" } }}
                    >
                      {c.name}
                    </Typography>
                    <Chip
                      size="small"
                      color={c.shelter ? "primary" : "default"}
                      variant={c.shelter ? "filled" : "outlined"}
                      label={c.shelter ? `Abrigo ${c.shelter.name}` : "Sem abrigo"}
                      sx={{
                        fontSize: "0.7rem",
                        height: 20,
                        mt: 0.25
                      }}
                    />
                  </Box>

                  <ButtonBase
                    onClick={() => toggle(c.id)}
                    aria-label={expanded ? "Recolher" : "Expandir"}
                    sx={{
                      borderRadius: 2,
                      px: { xs: 0.75, sm: 1 },
                      py: 0.5,
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
                      sx={{
                        fontWeight: 600,
                        display: { xs: "none", sm: "block" }
                      }}
                    >
                      {expanded ? "Recolher" : "Detalhes"}
                    </Typography>
                    <ExpandMoreIcon
                      fontSize="small"
                      sx={{ transition: "transform .15s ease", transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
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
                      <PersonOutlined sx={{ fontSize: 18, color: "primary.main", flexShrink: 0 }} />
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            color: "text.primary",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis"
                          }}
                          title={c.guardianName || "Sem responsável"}
                        >
                          {c.guardianName || "Sem responsável"}
                        </Typography>
                      </Box>
                    </Stack>

                    {c.guardianPhone && (
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <Tooltip title="Ligar">
                          <IconButton size="small" href={`tel:${c.guardianPhone}`} sx={{ p: 0.5 }}>
                            <PhoneIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={wa ? "WhatsApp" : "Sem telefone"}>
                          <span>
                            <IconButton
                              size="small"
                              color="success"
                              component="a"
                              href={wa || undefined}
                              target="_blank"
                              rel="noopener noreferrer"
                              disabled={!wa}
                              aria-label="abrir WhatsApp"
                              sx={{ p: 0.5 }}
                            >
                              <WhatsApp fontSize="medium" />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <CopyButton value={c.guardianPhone} title="Copiar telefone" />
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
                      {c.gender && (
                        <Chip
                          size="small"
                          variant="filled"
                          label={gLabel(c.gender)}
                          color="info"
                          sx={{
                            fontWeight: 600,
                            fontSize: "0.7rem",
                            height: 20,
                            "& .MuiChip-label": { px: 0.5 }
                          }}
                        />
                      )}
                      {ageDetailedText && (
                        <Chip
                          size="small"
                          variant="filled"
                          label={ageDetailedText}
                          color="success"
                          sx={{
                            fontWeight: 600,
                            fontSize: "0.7rem",
                            height: 20,
                            "& .MuiChip-label": { px: 0.5 }
                          }}
                        />
                      )}
                      {tenure && (
                        <Chip
                          size="small"
                          variant="filled"
                          label={tenure}
                          color="warning"
                          sx={{
                            fontWeight: 600,
                            fontSize: "0.7rem",
                            height: 20,
                            "& .MuiChip-label": { px: 0.5 }
                          }}
                        />
                      )}
                    </Stack>
                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5 }}>
                      <LocationOnOutlined sx={{ fontSize: 14, color: "text.secondary" }} />
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          fontWeight: 500,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis"
                        }}
                      >
                        {addrPreview}
                      </Typography>
                    </Stack>
                  </Box>
                )}

                <Slide direction="down" in={expanded} timeout={300}>
                  <Box>
                    <Divider sx={{ mx: { xs: 1, sm: 1.25 } }} />
                    <CardContent sx={{ p: { xs: 1.25, sm: 1.5 } }}>
                      <Stack spacing={2}>
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 1.25,
                            borderRadius: 2,
                            bgcolor: "background.default",
                            border: "1px solid",
                            borderColor: "divider",
                          }}
                        >
                          <Stack spacing={1}>
                            <Stack direction="row" spacing={0.75} alignItems="center">
                              <ChildCare fontSize="small" color="primary" />
                              <Typography variant="subtitle2" color="text.primary" sx={{ fontWeight: 600 }}>
                                Informações do Abrigado
                              </Typography>
                            </Stack>
                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap rowGap={1}>
                              {c.gender && (
                                <Chip
                                  size="small"
                                  variant="outlined"
                                  label={gLabel(c.gender)}
                                  color="info"
                                  sx={{ fontWeight: 500 }}
                                />
                              )}
                              {ageDetailedText && (
                                <Chip
                                  size="small"
                                  variant="outlined"
                                  label={`Idade: ${ageDetailedText}`}
                                  color="success"
                                  sx={{ fontWeight: 500 }}
                                />
                              )}
                              {tenure && (
                                <Chip
                                  size="small"
                                  variant="outlined"
                                  label={`Tempo no shelter: ${tenure}`}
                                  color="warning"
                                  sx={{ fontWeight: 500 }}
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
                            border: "1px solid",
                            borderColor: "divider",
                          }}
                        >
                          <Stack spacing={1}>
                            <Stack direction="row" spacing={0.75} alignItems="center">
                              <CakeOutlined fontSize="small" color="primary" />
                              <Typography variant="subtitle2" color="text.primary" sx={{ fontWeight: 600 }}>
                                Datas Importantes
                              </Typography>
                            </Stack>
                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap rowGap={1}>
                              <Chip
                                size="small"
                                variant="outlined"
                                label={`Nascimento: ${formatDate(c.birthDate)}`}
                                color="default"
                                sx={{ fontWeight: 500 }}
                              />
                              <Chip
                                size="small"
                                variant="outlined"
                                label={`No abrigo desde: ${formatDate(c.joinedAt)}`}
                                color="default"
                                sx={{ fontWeight: 500 }}
                              />
                            </Stack>
                          </Stack>
                        </Paper>

                        {c.address && (
                          <Paper
                            variant="outlined"
                            sx={{
                              p: 1.25,
                              borderRadius: 2,
                              bgcolor: "grey.50",
                              border: "1px solid",
                              borderColor: "grey.200",
                            }}
                          >
                            <Stack spacing={1}>
                              <Stack direction="row" spacing={0.75} alignItems="center">
                                <PlaceOutlined fontSize="small" color="primary" />
                                <Typography variant="subtitle2" color="text.primary" sx={{ fontWeight: 600 }}>
                                  Endereço
                                </Typography>
                              </Stack>
                              <Stack spacing={0.5}>
                                <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.4 }}>
                                  {c.address.street}{c.address.number ? `, ${c.address.number}` : ""}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                                  {c.address.district} • {c.address.city} / {c.address.state}
                                </Typography>
                                {c.address.postalCode && (
                                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                                    CEP: {c.address.postalCode}
                                  </Typography>
                                )}
                                {c.address.complement && (
                                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                                    Complemento: {c.address.complement}
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
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                    {c.name}
                  </Typography>

                  <Stack direction="row" spacing={0.5}>
                    <Tooltip title="Visualizar detalhes">
                      <IconButton
                        size="small"
                        onClick={() => onOpenView(c)}
                        sx={{
                          color: "primary.main",
                          "&:hover": { bgcolor: "primary.50" }
                        }}
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {wa && (
                      <Tooltip title="WhatsApp">
                        <IconButton
                          size="small"
                          color="success"
                          component="a"
                          href={wa}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="abrir WhatsApp"
                        >
                          <WhatsApp fontSize="medium" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Editar abrigado">
                      <IconButton
                        size="small"
                        onClick={() => onStartEdit(c)}
                        sx={{
                          color: "info.main",
                          "&:hover": { bgcolor: "info.50" }
                        }}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Excluir abrigado">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => onAskDelete(c)}
                        sx={{
                          "&:hover": { bgcolor: "error.50" }
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
        onPageChange={(_, p) => setPageIndex(p)}
        rowsPerPage={pageSize}
        onRowsPerPageChange={(e) => { setPageSize(parseInt(e.target.value, 10)); setPageIndex(0); }}
        rowsPerPageOptions={[6, 12, 24]}
        labelRowsPerPage="Linhas"
        sx={{ px: 0 }}
      />
    </Box>
  );
}
