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
          // Professores agora são acessados via team
          const shelter = c.shelter || null;
          const teachers = shelter?.teachers || [];
          const totalTeachers = teachers.length;
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
                      {shelter && (
                        <Chip
                          size="small"
                          variant="filled"
                          icon={<SchoolOutlined sx={{ fontSize: 12 }} />}
                          label={shelter.name || "Sem abrigo"}
                          color="info"
                          sx={{ 
                            fontWeight: 600, 
                            fontSize: "0.7rem",
                            height: 20,
                            "& .MuiChip-label": { px: 0.5 }
                          }}
                        />
                      )}
                      {shelter?.team?.numberTeam !== undefined && (
                        <Chip
                          size="small"
                          variant="outlined"
                          label={`Equipe ${shelter.team.numberTeam}`}
                          color="info"
                          sx={{
                            fontWeight: 600,
                            fontSize: "0.7rem",
                            height: 20,
                            "& .MuiChip-label": { px: 0.5 }
                          }}
                        />
                      )}
                      {totalTeachers > 0 && (
                        <Chip
                          size="small"
                          variant="filled"
                          icon={<GroupOutlined sx={{ fontSize: 12 }} />}
                          label={`Profs.: ${totalTeachers}`}
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
                        {/* Datas */}
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

                        {shelter ? (
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
                              <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" rowGap={0.5}>
                                <Chip 
                                  size="small" 
                                  color="primary" 
                                  label={shelter.name}
                                  sx={{ fontWeight: 600, fontSize: "0.75rem" }}
                                />
                                {shelter.team?.numberTeam && (
                                  <Chip 
                                    size="small" 
                                    variant="outlined"
                                    label={`Equipe ${shelter.team.numberTeam}`}
                                    color="info"
                                    sx={{ fontWeight: 600, fontSize: "0.75rem" }}
                                  />
                                )}
                                {totalTeachers > 0 && (
                                  <Chip 
                                    size="small" 
                                    variant="filled"
                                    label={`${totalTeachers} prof(s)`}
                                    color="info"
                                    sx={{ fontWeight: 500, fontSize: "0.75rem" }}
                                  />
                                )}
                              </Stack>
                              
                              {teachers.length > 0 && (
                                <Box>
                                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5, display: "block" }}>
                                    Professores:
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
                                    {teachers.map((t) => {
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
                    <Tooltip title={c.shelter?.id ? "Gerenciar Equipes do Abrigo" : "Gerenciar Equipes"}>
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
