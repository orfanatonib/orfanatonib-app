import { Box, Button, Typography } from "@mui/material";
import { ChevronRight } from "@mui/icons-material";
import { Link } from "react-router-dom";
import { useIsFeatureEnabled, FeatureFlagKeys } from "@/features/feature-flags";
import { memberAreaColors as colors } from "@/theme/memberArea";
import { memberActionMap } from "./memberActions";
import type { MemberQuickActionsProps } from "../../types";

const MemberQuickActions = ({ references }: MemberQuickActionsProps) => {
  const shelteredEnabled = useIsFeatureEnabled(FeatureFlagKeys.SHELTERED_AREA);
  const actions = references.filter(
    (key) =>
      memberActionMap[key] &&
      (memberActionMap[key].to !== "/area-dos-acolhidos" || shelteredEnabled),
  );
  if (!actions.length) return null;
  return (
    <Box data-testid="member-area-quick-actions" component="section">
      <Typography
        component="h2"
        variant="overline"
        sx={{
          display: "block",
          mb: 1.5,
          color: colors.muted,
          fontWeight: 800,
          letterSpacing: 1,
        }}
      >
        Acesso Rápido do Membro
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            sm: "repeat(2, minmax(0, 1fr))",
            lg: "repeat(3, minmax(0, 1fr))",
          },
          gap: 1.5,
        }}
      >
        {actions.map((key) => {
          const action = memberActionMap[key];
          const Icon = action.icon;
          return (
            <Button
              key={key}
              data-testid={`member-area-action-${key}`}
              component={Link}
              to={action.to}
              sx={{
                p: 1.75,
                minHeight: 76,
                borderRadius: 3,
                bgcolor: colors.surface,
                border: `1px solid ${colors.border}`,
                borderLeft: `4px solid ${colors.blue}`,
                color: colors.ink,
                justifyContent: "space-between",
                textAlign: "left",
                gap: 1.5,
                "&:hover": {
                  bgcolor: colors.blueSoft,
                  borderColor: colors.blue,
                },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box
                  sx={{
                    display: "grid",
                    placeItems: "center",
                    width: 42,
                    height: 42,
                    flexShrink: 0,
                    borderRadius: 2,
                    bgcolor: colors.blueSoft,
                    color: colors.blue,
                  }}
                >
                  <Icon />
                </Box>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 800, color: colors.ink }}
                >
                  {action.label}
                </Typography>
              </Box>
              <ChevronRight sx={{ color: colors.muted, flexShrink: 0 }} />
            </Button>
          );
        })}
      </Box>
    </Box>
  );
};
export default MemberQuickActions;
