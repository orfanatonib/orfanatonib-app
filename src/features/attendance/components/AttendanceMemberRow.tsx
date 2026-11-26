import { useState } from "react";
import {
  Box,
  Button,
  Collapse,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import CheckOutlined from "@mui/icons-material/CheckOutlined";
import CloseOutlined from "@mui/icons-material/CloseOutlined";
import { AttendanceType } from "../types";
import type { AttendanceMemberRowProps } from "../workspace.types";
import { ATTENDANCE_COMMENT_LIMIT } from "../constants";
import { attendanceCardSx, attendanceColors } from "@/theme/attendance";

export default function AttendanceMemberRow({
  row,
  disabled,
  onTypeChange,
  onCommentChange,
}: AttendanceMemberRowProps) {
  const [showComment, setShowComment] = useState(Boolean(row.comment));
  return (
    <Box
      data-testid={`team-attendance-member-${row.member.id}`}
      sx={{ ...attendanceCardSx, p: 2 }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        gap={1.5}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            fontWeight={700}
            sx={{ overflowWrap: "anywhere", color: attendanceColors.ink }}
          >
            {row.member.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {row.type === null
              ? "Aguardando marcação"
              : row.type === AttendanceType.PRESENT
                ? "Presença confirmada"
                : "Falta registrada"}
          </Typography>
        </Box>
        <ToggleButtonGroup
          value={row.type}
          exclusive
          disabled={disabled}
          aria-label={`Presença de ${row.member.name}`}
          onChange={(_, value: AttendanceType | null) =>
            value && onTypeChange(value)
          }
          sx={{
            flexShrink: 0,
            "& .MuiToggleButton-root": {
              flex: { xs: 1, sm: "initial" },
              minHeight: 48,
              minWidth: 110,
              textTransform: "none",
              gap: 0.75,
            },
          }}
        >
          <ToggleButton value={AttendanceType.PRESENT} color="success">
            <CheckOutlined fontSize="small" />
            Presente
          </ToggleButton>
          <ToggleButton value={AttendanceType.ABSENT} color="error">
            <CloseOutlined fontSize="small" />
            Faltou
          </ToggleButton>
        </ToggleButtonGroup>
      </Stack>
      <Button
        disabled={disabled}
        onClick={() => setShowComment((value) => !value)}
        aria-expanded={showComment}
        sx={{ minHeight: 44, color: attendanceColors.muted, px: 0 }}
      >
        {showComment
          ? "Ocultar observação"
          : row.comment
            ? "Editar observação"
            : "Adicionar observação"}
      </Button>
      <Collapse in={showComment}>
        <TextField
          label={`Observação sobre ${row.member.name}`}
          value={row.comment}
          disabled={disabled}
          multiline
          minRows={2}
          fullWidth
          onChange={(event) => onCommentChange(event.target.value)}
          inputProps={{ maxLength: ATTENDANCE_COMMENT_LIMIT }}
          helperText={`${row.comment.length}/${ATTENDANCE_COMMENT_LIMIT} · Opcional`}
        />
      </Collapse>
    </Box>
  );
}
