export const LIVE_PASSWORD = "E2e@12345";

export const LIVE_ACCOUNTS = {
  admin: { email: "e2e.admin@orfanatonib.test", password: LIVE_PASSWORD },
  leader: { email: "e2e.leader@orfanatonib.test", password: LIVE_PASSWORD },
  member: { email: "e2e.member@orfanatonib.test", password: LIVE_PASSWORD },
} as const;

export type LiveRole = keyof typeof LIVE_ACCOUNTS;
