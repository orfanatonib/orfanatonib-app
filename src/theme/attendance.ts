export const attendanceColors = {
  ink: "#172b4d",
  muted: "#52647a",
  border: "#dce4ee",
  background: "#f5f7fb",
  surface: "#ffffff",
  accent: "#16605a",
  soft: "#e8f4f1",
};
export const attendanceCardSx = {
  border: "1px solid",
  borderColor: attendanceColors.border,
  borderRadius: 3,
  bgcolor: attendanceColors.surface,
  p: { xs: 2, md: 3 },
  minWidth: 0,
};
export const attendancePrimarySx = {
  minHeight: 48,
  textTransform: "none",
  fontWeight: 700,
  bgcolor: attendanceColors.accent,
  color: attendanceColors.surface,
  "&:hover": { bgcolor: "#104b47" },
  "&.Mui-disabled": { bgcolor: "#e2e8f0", color: "#64748b" },
};
