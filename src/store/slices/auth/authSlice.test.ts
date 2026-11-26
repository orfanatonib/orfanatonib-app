import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/config/axiosConfig', () => ({ default: { get: vi.fn() } }));

import apiAxios from '@/config/axiosConfig';
import reducer, {
  clearGoogleUser,
  fetchCurrentUser,
  initAuth,
  login,
  logout,
  setError,
  setGoogleUser,
  UserRole,
} from './authSlice';

type State = ReturnType<typeof reducer>;
const initial = (): State => reducer(undefined, { type: '@@init' });
const user = { id: 'u1', email: 'a@b.com', name: 'Ana', role: UserRole.MEMBER };

describe('authSlice reducers', () => {
  beforeEach(() => localStorage.clear());

  it('estado inicial: sem sessão e não inicializado', () => {
    expect(initial()).toMatchObject({
      isAuthenticated: false,
      accessToken: null,
      initialized: false,
      user: null,
    });
  });

  it('login limpa aspas, autentica e persiste os tokens', () => {
    const s = reducer(initial(), login({ accessToken: '"at"', refreshToken: '"rt"', user }));
    expect(s).toMatchObject({ accessToken: 'at', refreshToken: 'rt', isAuthenticated: true, user });
    expect(localStorage.getItem('accessToken')).toBe('at');
    expect(localStorage.getItem('refreshToken')).toBe('rt');
  });

  it('login guarda o alerta de verificação de e-mail e o zera no login seguinte', () => {
    const alert = { verificationEmailSent: true };
    let s = reducer(initial(), login({ accessToken: 'a', refreshToken: 'r', emailVerificationAlert: alert }));
    expect(s.emailVerificationAlert).toEqual(alert);
    s = reducer(s, login({ accessToken: 'a', refreshToken: 'r' }));
    expect(s.emailVerificationAlert).toBeNull();
  });

  it('logout limpa estado e storage e marca inicializado', () => {
    let s = reducer(initial(), login({ accessToken: 'a', refreshToken: 'r', user }));
    s = reducer(s, setGoogleUser({ name: 'G', email: 'g@g.com' }));
    s = reducer(s, logout());
    expect(s).toMatchObject({ isAuthenticated: false, user: null, accessToken: null, googleUser: null, initialized: true });
    expect(localStorage.getItem('accessToken')).toBeNull();
  });

  it('setError e clearGoogleUser', () => {
    expect(reducer(initial(), setError('x')).error).toBe('x');
    const s = reducer(reducer(initial(), setGoogleUser({ name: 'G', email: 'g@g.com' })), clearGoogleUser());
    expect(s.googleUser).toBeNull();
  });

  it('extraReducers: fetchCurrentUser fulfilled/rejected e initAuth', () => {
    const logged = reducer(initial(), login({ accessToken: 'a', refreshToken: 'r' }));
    const ok = reducer(logged, fetchCurrentUser.fulfilled(user, 'rid'));
    expect(ok).toMatchObject({ user, isAuthenticated: true, loadingUser: false });

    const bad = reducer(ok, fetchCurrentUser.rejected(null, 'rid', undefined, 'falhou'));
    expect(bad).toMatchObject({ user: null, isAuthenticated: false, accessToken: null, error: 'falhou' });
    expect(localStorage.getItem('accessToken')).toBeNull();

    expect(reducer(initial(), initAuth.pending('rid')).loadingUser).toBe(true);
    const rejected = reducer(initial(), initAuth.rejected(null, 'rid', undefined, 'boom'));
    expect(rejected).toMatchObject({ initialized: true, error: 'boom' });
  });
});

describe('thunks', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(apiAxios.get).mockReset();
  });

  const run = async (accessToken: string | null) => {
    const dispatch = vi.fn();
    const getState = () => ({ auth: { ...initial(), accessToken } });
    return fetchCurrentUser()(dispatch, getState, undefined);
  };

  it('fetchCurrentUser sem token rejeita sem chamar a API', async () => {
    const result = await run(null);
    expect(result.type).toBe('auth/fetchCurrentUser/rejected');
    expect(apiAxios.get).not.toHaveBeenCalled();
  });

  it('fetchCurrentUser usa a mensagem da API quando falha, e a de timeout em ECONNABORTED', async () => {
    vi.mocked(apiAxios.get).mockRejectedValueOnce({ response: { data: { message: 'Sessão inválida' } } });
    expect((await run('tok')).payload).toBe('Sessão inválida');
    vi.mocked(apiAxios.get).mockRejectedValueOnce({ code: 'ECONNABORTED' });
    expect((await run('tok')).payload).toBe('Timeout ao verificar autenticação');
  });

  it('fetchCurrentUser devolve o usuário', async () => {
    vi.mocked(apiAxios.get).mockResolvedValueOnce({ data: user });
    expect((await run('tok')).payload).toEqual(user);
  });

  it('initAuth com storage corrompido (só um token) não tenta sessão', async () => {
    localStorage.setItem('accessToken', 'a');
    const dispatch = vi.fn();
    await initAuth()(dispatch, () => ({}), undefined);
    expect(vi.mocked(apiAxios.get)).not.toHaveBeenCalled();
  });
});
