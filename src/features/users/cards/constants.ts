import { UserRole } from "@/store/slices/auth/authSlice";

export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.ADMIN]: "Administrador",
  [UserRole.LEADER]: "Líder",
  [UserRole.MEMBER]: "Membro",
};

export const DEFAULT_ROLE_LABEL = "Usuário";

export const DEFAULT_SORT_FIELD = "updatedAt";

export const SORT_OPTIONS: ReadonlyArray<{ id: string; label: string }> = [
  { id: "name", label: "Nome" },
  { id: "role", label: "Papel" },
  { id: "updatedAt", label: "Atualizado em" },
  { id: "createdAt", label: "Criado em" },
];

export const CARDS_PAGE_SIZE_OPTIONS = [6, 12, 24];

export const CARD_PANEL_SX = {
  borderRadius: 2,
  bgcolor: "background.default",
  border: "1px solid",
  borderColor: "divider",
} as const;

export const CARD_STATUS_CHIP_SX = {
  fontWeight: 600,
  fontSize: "0.7rem",
  height: 20,
  "& .MuiChip-label": { px: 0.5 },
} as const;
