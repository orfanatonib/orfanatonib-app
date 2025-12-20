import * as React from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  FormControlLabel,
  IconButton,
  Stack,
  Switch,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Close, Save } from "@mui/icons-material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import FavoriteIcon from "@mui/icons-material/Favorite";
import { useSelector } from "react-redux";
import type { CreatePagelaPayload, Pagela, UpdatePagelaPayload } from "../types";
import { todayISO } from "../utils";

type Props = {
  initial?: Pagela | null;
  shelteredId: string;
  shelteredName: string;
  shelteredGender: string;
  defaultYear: number;
  defaultVisit: number;
  teacherProfileId?: string | null;

  findPagela: (year: number, visit: number) => Pagela | null;

  onCreate: (payload: CreatePagelaPayload) => Promise<void>;
  onUpdate: (id: string, payload: UpdatePagelaPayload) => Promise<void>;
  onClose?: () => void;
};

export default function PagelaQuickForm({
  initial,
  shelteredId,
  shelteredName,
  shelteredGender,
  defaultYear,
  defaultVisit,
  teacherProfileId,
  findPagela,
  onCreate,
  onUpdate,
  onClose,
}: Props) {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("sm"));

  const teacherProfileIdFromRedux = useSelector(
    (s: any) => s?.auth?.user?.teacherProfile?.id ?? null
  ) as string | null;

  const effectiveTeacherProfileId = teacherProfileIdFromRedux ?? teacherProfileId ?? null;

  const [yearText, setYearText] = React.useState<string>("");
  const [visitText, setVisitText] = React.useState<string>("");

  const [editing, setEditing] = React.useState<boolean>(!!initial?.id);
  const [currentId, setCurrentId] = React.useState<string | null>(initial?.id ?? null);

  const [present, setPresent] = React.useState<boolean>(initial?.present ?? false);
  const [notes, setNotes] = React.useState<string>(initial?.notes ?? "");

  React.useEffect(() => {
    if (initial?.id) {
      setEditing(true);
      setCurrentId(initial.id);
      setYearText(String(initial.year ?? ""));
      setVisitText(String(initial.visit ?? ""));
      setPresent(!!initial.present);
      setNotes(initial.notes ?? "");
    } else {
      setEditing(false);
      setCurrentId(null);
      setYearText("");
      setVisitText("");
    }
  }, [initial]);

  const parsedYear = React.useMemo(() => {
    if (!yearText.trim()) return undefined;
    const n = Number(yearText);
    if (!Number.isFinite(n)) return undefined;
    if (n < 2000 || n > 9999) return undefined;
    return Math.floor(n);
  }, [yearText]);

  const parsedVisit = React.useMemo(() => {
    if (!visitText.trim()) return undefined;
    const n = Number(visitText);
    if (!Number.isFinite(n)) return undefined;
    if (n < 1 || n > 53) return undefined;
    return Math.floor(n);
  }, [visitText]);

  React.useEffect(() => {
    if (parsedYear && parsedVisit) {
      const found = findPagela(parsedYear, parsedVisit);
      if (found) {
        setEditing(true);
        setCurrentId(found.id);
        setYearText(String(found.year));
        setVisitText(String(found.visit));
        setPresent(!!found.present);
        setNotes(found.notes ?? "");
      } else {
        setEditing(false);
        setCurrentId(null);
      }
    } else {
      setEditing(false);
      setCurrentId(null);
    }
  }, [parsedYear, parsedVisit, findPagela]);

  const canSave = !!shelteredId && parsedYear !== undefined && parsedVisit !== undefined;

  const handleSave = async () => {
    if (!canSave) return;

    const payloadCommon = {
      referenceDate: todayISO(),
      year: parsedYear!,
      visit: parsedVisit!,
      present,
      notes,
      teacherProfileId: effectiveTeacherProfileId,
    };

    if (editing && currentId) {
      await onUpdate(currentId, payloadCommon);
    } else {
      await onCreate({
        shelteredId,
        ...payloadCommon,
      });
    }

    if (isXs && onClose) onClose();
  };

  const headerBg = editing
    ? "linear-gradient(135deg, #FFE8B3 0%, #FFD480 50%, #FFC266 100%)"
    : "linear-gradient(135deg, #b8f1d7 0%, #b8d6ff 50%, #ffc7ec 100%)";

  const headerTitle = editing ? "Editando" : "Criando";
  const footerMsg = editing
    ? "ao salvar, você ATUALIZA o registro existente"
    : "ao salvar, você CRIA um novo registro";

  const yearWeekLabel = `Ano: ${parsedYear ?? "--"} • Visita: ${parsedVisit ?? "--"}`;

  const article = shelteredGender === "F" ? "a" : "o";

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: { xs: "24px 24px 0 0", sm: 4 },
        overflow: "hidden",
        borderColor: "divider",
        transition: "box-shadow .12s ease, transform .12s ease",
        "&:hover": { boxShadow: 4, transform: { sm: "translateY(-1px)" } },
      }}
    >
      <Box
        sx={{
          position: "relative",
          height: { xs: 64, sm: 84 },
          background: headerBg,
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: -10,
            left: -18,
            width: 90,
            height: 90,
            borderRadius: "50%",
            opacity: 0.15,
            bgcolor: "#000",
            filter: "blur(2px)",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            bottom: -16,
            right: -12,
            width: 80,
            height: 80,
            borderRadius: "50%",
            opacity: 0.12,
            bgcolor: "#000",
            filter: "blur(1px)",
          }}
        />
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ height: "100%", px: { xs: 1.25, sm: 2 } }}
        >
          <Stack spacing={0}>
            <Typography variant="subtitle2" sx={{ color: "text.primary", opacity: 0.9, fontWeight: 800 }}>
              {headerTitle} para {article} <strong>{shelteredName || "—"}</strong>
            </Typography>

            <Stack direction="row" spacing={0.75} alignItems="center">
              <CalendarMonthIcon fontSize="small" sx={{ opacity: 0.9 }} />
              <Typography variant="caption" sx={{ fontWeight: 700 }}>
                {yearWeekLabel}
              </Typography>
            </Stack>
          </Stack>

          {isXs && (
            <IconButton
              size="small"
              onClick={onClose}
              aria-label="Fechar"
              sx={{ bgcolor: "rgba(255,255,255,.85)", "&:hover": { bgcolor: "rgba(255,255,255,.95)" } }}
            >
              <Close fontSize="small" />
            </IconButton>
          )}
        </Stack>
      </Box>

      <CardContent sx={{ p: { xs: 1.5, md: 2.25 } }}>
        <Stack spacing={1.25}>
          <Stack direction="row" spacing={1}>
            <TextField
              label="Ano"
              size="small"
              type="text"
              value={yearText}
              onChange={(e) => setYearText(e.target.value.replace(/\D+/g, "").slice(0, 4))}
              sx={{ width: 120 }}
              inputProps={{ inputMode: "numeric", pattern: "[0-9]*", maxLength: 4 }}
            />
            <TextField
              label="Semana"
              size="small"
              type="text"
              value={visitText}
              onChange={(e) => setVisitText(e.target.value.replace(/\D+/g, "").slice(0, 2))}
              sx={{ width: 140 }}
              inputProps={{ inputMode: "numeric", pattern: "[0-9]*", maxLength: 2 }}
            />
          </Stack>

          <RowSwitch icon={<CheckCircleIcon />} label="Presença" checked={present} onChange={setPresent} />

          <Divider sx={{ my: 0.5 }} />

          <TextField
            label="Observações"
            size="small"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            multiline
            minRows={2}
            fullWidth
          />

          <Box sx={{ display: "flex", justifyContent: { xs: "stretch", sm: "flex-end" }, mt: 0.5 }}>
            <Button
              onClick={handleSave}
              disabled={!canSave}
              variant="contained"
              startIcon={<Save />}
              sx={{ borderRadius: 999, px: 2.25, py: 0.75, fontWeight: 800, width: { xs: "100%", sm: "auto" } }}
            >
              Salvar
            </Button>
          </Box>

          <Stack
            direction="row"
            spacing={0.5}
            alignItems="center"
            justifyContent="center"
            sx={{ color: "text.secondary", mt: 0.25 }}
          >
            <Typography variant="caption" sx={{ fontWeight: 700 }}>
              {footerMsg}
            </Typography>
            <FavoriteIcon fontSize="inherit" sx={{ opacity: 0.6 }} />
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

function RowSwitch({
  icon,
  label,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <FormControlLabel
      control={<Switch checked={checked} onChange={(_, v) => onChange(v)} />}
      label={
        <Stack direction="row" spacing={0.75} alignItems="center">
          <Box sx={{ "& svg": { fontSize: 18, opacity: 0.75 } }}>{icon}</Box>
          <Typography fontWeight={800}>{label}</Typography>
        </Stack>
      }
      labelPlacement="start"
      sx={{
        m: 0,
        px: 1,
        py: 0.5,
        borderRadius: 2,
        justifyContent: "space-between",
        bgcolor: "action.hover",
      }}
    />
  );
}
