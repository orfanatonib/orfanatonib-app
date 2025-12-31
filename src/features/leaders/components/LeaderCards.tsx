import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  Box, Card, CardContent, Chip, Grid, IconButton, Stack,
  Typography, Divider, TablePagination, Tooltip, Collapse, Select, MenuItem, FormControl, InputLabel,
  Paper, Avatar, Slide, ButtonBase, Link
} from "@mui/material";
import { 
  Visibility, Edit as EditIcon, ExpandMore as ExpandMoreIcon, SwapVert, Phone as PhoneIcon, SupervisorAccount, GroupOutlined, SchoolOutlined, WhatsApp
} from "@mui/icons-material";
import type { SortingState } from "@tanstack/react-table";
import type { LeaderProfile } from "../types";
import { fmtDate } from "@/utils/dates";
import { RootState } from "@/store/slices";
import { buildWhatsappLink } from "@/utils/whatsapp";
import { CopyButton, initials } from "@/utils/components";


type Props = {
  rows: LeaderProfile[];
  total: number;
  pageIndex: number;
  pageSize: number;
  setPageIndex: (n: number) => void;
  setPageSize: (n: number) => void;
  sorting: SortingState;
  setSorting: (s: SortingState) => void;
  onView: (row: LeaderProfile) => void;
  onEdit: (row: LeaderProfile) => void;
};

export default function LeaderCards(props: Props) {
  const {
    rows, total, pageIndex, pageSize, setPageIndex, setPageSize,
    sorting, setSorting, onView, onEdit
  } = props;

  const [open, setOpen] = useState<Set<string>>(new Set());
  const { user: loggedUser } = useSelector((state: RootState) => state.auth);
  
  const toggle = (id: string) =>
    setOpen((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const currentSort = sorting?.[0] ?? { id: "updatedAt", desc: true };
  const sortField = String(currentSort.id ?? "updatedAt");
  const sortDesc = !!currentSort.desc;

  const sortOptions = useMemo(() => ([
    { id: "user", label: "Nome" },
    { id: "updatedAt", label: "Atualizado em" },
    { id: "createdAt", label: "Criado em" },
  ]), []);

  const handleSortField = (field: string) => setSorting([{ id: field, desc: sortDesc }]);
  const toggleSortDir = () => setSorting([{ id: sortField, desc: !sortDesc }]);

  return (
    <Box sx={{ px: 0, py: 0 }}>
      <Stack direction="row" spacing={0.75} sx={{ mb: 1 }} alignItems="center" justifyContent="flex-end">
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Ordenar por</InputLabel>
          <Select
            label="Ordenar por"
            value={sortField}
            onChange={(e) => handleSortField(String(e.target.value))}
            sx={{ ".MuiSelect-select": { py: .75 } }}
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
          const shelters = c.shelters || [];
          const totalShelters = shelters.length;
          const totalTeams = shelters.reduce((total, shelter) => total + shelter.teams.length, 0);
          const allTeachers = shelters.flatMap(shelter => shelter.teachers || []);
          const totalTeachers = allTeachers.length;
          const wa = buildWhatsappLink({ id: c.id, name: c.user?.name, phone: c.user?.phone } as any, loggedUser?.name);

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
                    "& .leader-avatar": {
                      transform: "scale(1.05)",
                    }
                  },
                  bgcolor: "background.paper",
                  position: "relative",
                  maxHeight: !expanded ? { xs: 200, sm: 150 } : "none",
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
                    className="leader-avatar"
                    sx={{
                      width: { xs: 40, sm: 48 },
                      height: { xs: 40, sm: 48 },
                      bgcolor: c.active ? "primary.main" : "grey.500",
                      color: "white",
                      fontWeight: 700,
                      fontSize: { xs: 14, sm: 16 },
                      boxShadow: 2,
                      transition: "transform 0.2s ease",
                      flexShrink: 0,
                    }}
                    aria-label={`Avatar do líder ${c.user?.name}`}
                  >
                    {initials(c.user?.name)}
                  </Avatar>

                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography 
                      variant="subtitle1" 
                      fontWeight={700} 
                      noWrap 
                      title={c.user?.name}
                      sx={{ fontSize: { xs: "0.9rem", sm: "1rem" } }}
                    >
                      {c.user?.name || "—"}
                    </Typography>
                    <Chip
                      size="small"
                      color={c.active ? "success" : "default"}
                      label={c.active ? "Ativo" : "Inativo"}
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
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    <SupervisorAccount sx={{ fontSize: 18, color: "primary.main", flexShrink: 0 }} />
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
                        title={c.user?.email}
                      >
                        {c.user?.email}
                      </Typography>
                    </Box>
                    <CopyButton value={c.user?.email} title="Copiar e-mail" />
                  </Stack>
                </Box>

                {c.user?.phone && (
                  <Box sx={{ 
                    px: { xs: 1, sm: 1.25 }, 
                    pb: 0.75,
                    borderRadius: 2,
                    bgcolor: "background.default",
                    border: "1px solid",
                    borderColor: "divider",
                    mt: 0.5,
                  }}>
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      <PhoneIcon sx={{ fontSize: 18, color: "primary.main", flexShrink: 0 }} />
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
                          title={c.user.phone}
                        >
                          {c.user.phone}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={0.5}>
                        <CopyButton value={c.user.phone} title="Copiar telefone" />
                        {wa && (
                          <Tooltip title="WhatsApp">
                            <IconButton
                              size="small"
                              component="a"
                              href={wa}
                              target="_blank"
                              rel="noopener noreferrer"
                              sx={{ color: "success.main" }}
                            >
                              <WhatsApp fontSize="inherit" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </Stack>
                  </Box>
                )}

                {!expanded && (
                  <Box sx={{ px: { xs: 1, sm: 1.25 }, pb: 0.75 }}>
                    <Stack
                      direction="row"
                      spacing={0.5}
                      alignItems="center"
                      flexWrap="wrap"
                      rowGap={0.25}
                    >
                      {totalShelters > 0 && (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                          {totalShelters === 1 ? (
                            <>
                              <Chip
                                size="small"
                                variant="filled"
                                icon={<SchoolOutlined sx={{ fontSize: 12 }} />}
                                label={shelters[0].name}
                                color="info"
                                sx={{
                                  fontWeight: 600,
                                  fontSize: "0.7rem",
                                  height: 20,
                                  "& .MuiChip-label": { px: 0.5 }
                                }}
                              />
                              {shelters[0].teams.length > 0 && (
                                <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                                  {shelters[0].teams.slice(0, 3).map((team) => (
                                    <Chip
                                      key={team.id}
                                      size="small"
                                      variant="outlined"
                                      label={`E${team.numberTeam}`}
                                      color="info"
                                      sx={{
                                        fontWeight: 600,
                                        fontSize: "0.7rem",
                                        height: 20,
                                        "& .MuiChip-label": { px: 0.5 }
                                      }}
                                    />
                                  ))}
                                  {shelters[0].teams.length > 3 && (
                                    <Typography variant="caption" color="text.secondary">
                                      +{shelters[0].teams.length - 3}
                                    </Typography>
                                  )}
                                </Box>
                              )}
                            </>
                          ) : (
                            <>
                              <Typography variant="caption" sx={{ fontWeight: 600, color: "info.main" }}>
                                {totalShelters} abrigo{totalShelters > 1 ? 's' : ''}, {totalTeams} equipe{totalTeams > 1 ? 's' : ''}
                              </Typography>
                              <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                                {shelters.slice(0, 2).map((shelter) => (
                                  <Chip
                                    key={shelter.id}
                                    size="small"
                                    variant="filled"
                                    label={shelter.name}
                                    color="info"
                                    sx={{
                                      fontWeight: 600,
                                      fontSize: "0.65rem",
                                      height: 18,
                                      "& .MuiChip-label": { px: 0.5 }
                                    }}
                                  />
                                ))}
                                {totalShelters > 2 && (
                                  <Typography variant="caption" color="text.secondary">
                                    +{totalShelters - 2}
                                  </Typography>
                                )}
                              </Box>
                            </>
                          )}
                        </Box>
                      )}
                      {totalTeachers > 0 && (
                        <Chip
                          size="small"
                          variant="filled"
                          icon={<GroupOutlined sx={{ fontSize: 12 }} />}
                          label={`Membros: ${totalTeachers}`}
                          color="success"
                          sx={{ 
                            fontWeight: 600, 
                            fontSize: "0.7rem",
                            height: 20,
                            "& .MuiChip-label": { px: 0.5 }
                          }}
                        />
                      )}
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
                          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap rowGap={1}>
                            <Chip 
                              size="small" 
                              variant="outlined" 
                              label={`Criado: ${fmtDate(c.createdAt)}`}
                              color="default"
                              sx={{ fontWeight: 500 }}
                            />
                            <Chip 
                              size="small" 
                              variant="outlined" 
                              label={`Atualizado: ${fmtDate(c.updatedAt)}`}
                              color="default"
                              sx={{ fontWeight: 500 }}
                            />
                          </Stack>
                        </Paper>

                        {totalShelters > 0 ? (
                          <Stack spacing={1.5}>
                            {shelters.map((shelter) => (
                              <Paper
                                key={shelter.id}
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
                                  <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" rowGap={0.5}>
                                    <Chip
                                      size="small"
                                      color="primary"
                                      label={shelter.name}
                                      sx={{ fontWeight: 600, fontSize: "0.75rem" }}
                                    />
                                    {shelter.teams.length > 0 && (
                                      <Chip
                                        size="small"
                                        variant="filled"
                                        label={`${shelter.teams.length} equipe${shelter.teams.length > 1 ? 's' : ''}`}
                                        color="info"
                                        sx={{ fontWeight: 500, fontSize: "0.75rem" }}
                                      />
                                    )}
                                    {shelter.teachers && shelter.teachers.length > 0 && (
                                      <Chip
                                        size="small"
                                        variant="outlined"
                                        label={`${shelter.teachers.length} membro(s)`}
                                        color="success"
                                        sx={{ fontWeight: 500, fontSize: "0.75rem" }}
                                      />
                                    )}
                                  </Stack>

                                  {shelter.teams.length > 0 && (
                                    <Box>
                                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5, display: "block" }}>
                                        Equipes:
                                      </Typography>
                                      <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                                        {shelter.teams.map((team) => (
                                          <Chip
                                            key={team.id}
                                            size="small"
                                            variant="outlined"
                                            label={`Equipe ${team.numberTeam}`}
                                            color="info"
                                            sx={{ fontSize: "0.7rem", height: 24 }}
                                          />
                                        ))}
                                      </Box>
                                    </Box>
                                  )}

                                  {shelter.teachers && shelter.teachers.length > 0 && (
                                    <Box>
                                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5, display: "block" }}>
                                        Membros:
                                      </Typography>
                                      <Box
                                        sx={{
                                          display: "flex",
                                          gap: 0.5,
                                          flexWrap: "wrap",
                                          maxHeight: 120,
                                          overflowY: "auto",
                                          "&::-webkit-scrollbar": {
                                            width: "4px",
                                          },
                                          "&::-webkit-scrollbar-track": {
                                            background: "transparent",
                                          },
                                          "&::-webkit-scrollbar-thumb": {
                                            background: "rgba(0,0,0,0.2)",
                                            borderRadius: "2px",
                                          },
                                        }}
                                      >
                                        {shelter.teachers.map((t) => {
                                          const teacherName = t.user?.name || t.user?.email || "Sem nome";
                                          return (
                                            <Chip
                                              key={t.id}
                                              size="small"
                                              variant="outlined"
                                              label={teacherName}
                                              sx={{
                                                fontWeight: 500,
                                                fontSize: "0.7rem",
                                                maxWidth: "100%",
                                                "& .MuiChip-label": {
                                                  overflow: "hidden",
                                                  textOverflow: "ellipsis",
                                                  whiteSpace: "nowrap",
                                                }
                                              }}
                                              title={teacherName}
                                            />
                                          );
                                        })}
                                      </Box>
                                    </Box>
                                  )}
                                </Stack>
                              </Paper>
                            ))}
                          </Stack>
                        ) : (
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
                            <Typography variant="body2" color="text.secondary">
                              Nenhum abrigo vinculado.
                            </Typography>
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
                    {c.user?.name}
                  </Typography>
                  
                  <Stack direction="row" spacing={0.5}>
                    <Tooltip title="Visualizar detalhes">
                      <IconButton 
                        size="small" 
                        onClick={() => onView(c)}
                        sx={{ 
                          color: "primary.main",
                          "&:hover": { bgcolor: "primary.50" }
                        }}
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Gerenciar Associações">
                      <IconButton 
                        size="small" 
                        onClick={() => onEdit(c)}
                        sx={{ 
                          color: "primary.main",
                          "&:hover": { bgcolor: "primary.50" }
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Box>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Divider sx={{ mt: 1 }} />
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
