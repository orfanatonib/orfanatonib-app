/**
 * Apaga, pela API, SÓ a massa da Área dos Acolhidos (prefixo "MASSA E2E"): acolhidos (as pagelas e decisões
 * caem em cascata), o abrigo da massa e as contas fixas do líder e do membro. `npm run seed:acolhidos:clean`.
 */
const API = process.env.E2E_API_URL ?? "http://localhost:3000";
const PREFIX = "MASSA E2E";
const SHELTER = `${PREFIX} Abrigo Acolhidos`;
const EMAILS = ["massa.e2e.lider.acolhidos@orfanatonib.test", "massa.e2e.membro.acolhidos@orfanatonib.test"];

const login = await fetch(`${API}/auth/login`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ email: "e2e.admin@orfanatonib.test", password: "E2e@12345" }),
});
if (!login.ok) throw new Error(`login do admin semeado falhou (${login.status}); rode: (cd ../orfanatonib-api && npm run seed:local)`);
const headers = { authorization: `Bearer ${(await login.json()).accessToken}` };
const get = async (path) => (await fetch(`${API}${path}`, { headers })).json();

let removed = 0;
for (;;) {
  const page = await get(`/sheltered?searchString=${encodeURIComponent(PREFIX)}&limit=100`);
  const items = (page.data ?? page.items ?? []).filter((s) => s.name.startsWith(PREFIX));
  if (items.length === 0) break;
  for (const item of items) {
    const res = await fetch(`${API}/sheltered/${item.id}`, { method: "DELETE", headers });
    if (!res.ok) throw new Error(`DELETE /sheltered/${item.id} -> ${res.status}`);
    removed += 1;
  }
}

const shelters = await get(`/shelters/simple`);
const list = Array.isArray(shelters) ? shelters : (shelters.data ?? []);
let shelterRemoved = 0;
for (const shelter of list.filter((s) => s.name === SHELTER)) {
  const res = await fetch(`${API}/shelters/${shelter.id}`, { method: "DELETE", headers });
  if (res.ok) shelterRemoved += 1;
}

let usersRemoved = 0;
for (const email of EMAILS) {
  const found = await get(`/users?q=${encodeURIComponent(email)}&limit=5`);
  for (const user of (found.items ?? found.data ?? []).filter((u) => u.email === email)) {
    const res = await fetch(`${API}/users/${user.id}`, { method: "DELETE", headers });
    if (res.ok) usersRemoved += 1;
  }
}
console.log(`Massa removida: ${removed} acolhidos, ${shelterRemoved} abrigo(s), ${usersRemoved} conta(s).`);
