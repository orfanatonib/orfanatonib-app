import { AdminNavigationRole } from "./types";

export const ADMIN_ONLY_ROLES = [AdminNavigationRole.ADMIN] as const;
export const ADMIN_AND_LEADER_ROLES = [
  AdminNavigationRole.ADMIN,
  AdminNavigationRole.LEADER,
] as const;
