import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import apiAxios from '@/config/axiosConfig';
import { MediaItem } from '@/store/slices/types';

export enum UserRole {
  ADMIN = 'admin',
  LEADER = 'leader',
  MEMBER = 'member',
}

interface ShelterLite {
  id: string;
  name: string;
  number?: number;
}

interface TeamLite {
  id: string;
  numberTeam?: number;
  description?: string | null;
  shelter?: ShelterLite | null;
  createdAt?: string;
  updatedAt?: string;
}

interface MemberProfileLite {
  id: string;
  active: boolean;
  shelter?: ShelterLite | null;
  team?: TeamLite | null;
  createdAt?: string;
  updatedAt?: string;
}

interface LeaderProfileLite {
  id: string;
  active: boolean;
  shelters?: ShelterLite[];
  team?: TeamLite | null;
  teams?: TeamLite[] | null;
  createdAt?: string;
  updatedAt?: string;
}

interface PersonalData {
  birthDate?: string | null;
  gender?: string | null;
  gaLeaderName?: string | null;
  gaLeaderContact?: string | null;
}

interface Preferences {
  loveLanguages?: string | null;
  temperaments?: string | null;
  favoriteColor?: string | null;
  favoriteFood?: string | null;
  favoriteMusic?: string | null;
  whatMakesYouSmile?: string | null;
  skillsAndTalents?: string | null;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  active?: boolean;
  commonUser?: boolean;
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
  completed?: boolean;
  memberProfile?: MemberProfileLite | null;
  leaderProfile?: LeaderProfileLite | null;
  image?: MediaItem | null;
  personalData?: PersonalData | null;
  preferences?: Preferences | null;
}

interface GoogleUser {
  name: string;
  email: string;
}

export interface LoginResponse {
  message: string;
  user: User;
  accessToken: string;
  refreshToken: string;
  emailVerification?: {
    verificationEmailSent: boolean;
    message?: string;
  };
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  user: User | null;
  loadingUser: boolean;
  initialized: boolean;
  error: string | null;
  googleUser: GoogleUser | null;
  emailVerificationAlert?: { verificationEmailSent: boolean; message?: string } | null;
}

const initialState: AuthState = {
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  user: null,
  loadingUser: false,
  initialized: false,
  error: null,
  googleUser: null,
  emailVerificationAlert: null,
};

const IS_DEV = import.meta.env.DEV === true;
const DEBUG_AUTH = import.meta.env.VITE_DEBUG_AUTH === 'true';

const log = (message: string, ...args: any[]) => {
  if (IS_DEV || DEBUG_AUTH) console.debug(message, ...args);
};

const clean = (s: string) => s.replace(/^"|"$/g, '');

export const fetchCurrentUser = createAsyncThunk<User, void, { rejectValue: string }>(
  'auth/fetchCurrentUser',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as { auth: AuthState };
    const token = state.auth.accessToken;

    if (!token || typeof token !== 'string' || token.trim() === '') {
      log('[Auth] No valid token found.');
      return rejectWithValue('No valid access token found');
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await apiAxios.get<User>('/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.data;
    } catch (error: any) {
      if (error.name === 'AbortError' || error.code === 'ECONNABORTED') {
        log('[Auth] Request timeout');
        return rejectWithValue('Timeout ao verificar autenticação');
      }
      const errorMessage = error?.response?.data?.message || 'Erro ao buscar usuário';
      log('[Auth] Error fetching user:', errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

export const initAuth = createAsyncThunk<void, void, { rejectValue: string }>(
  'auth/initAuth',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const rawAccess = localStorage.getItem('accessToken');
      const rawRefresh = localStorage.getItem('refreshToken');

      if (rawAccess && rawRefresh) {
        const accessToken = clean(rawAccess);
        const refreshToken = clean(rawRefresh);
        dispatch(login({ accessToken, refreshToken }));

        try {
          const fetchPromise = dispatch(fetchCurrentUser()).unwrap();
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Init timeout')), 12000)
          );

          await Promise.race([fetchPromise, timeoutPromise]);
        } catch (e) {
          log('[Auth] Init failed, logging out:', e);
          dispatch(logout());
        }
      }
    } catch (e: any) {
      log('[Auth] Init error:', e);
      return rejectWithValue('Falha ao inicializar auth');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (
      state,
      action: PayloadAction<{ accessToken: string; refreshToken: string; user?: User; emailVerificationAlert?: { verificationEmailSent: boolean; message?: string } | null }>
    ) => {
      const { accessToken, refreshToken, user, emailVerificationAlert } = action.payload;
      state.accessToken = clean(accessToken);
      state.refreshToken = clean(refreshToken);
      state.isAuthenticated = true;
      if (user) state.user = user;
      state.error = null;
      if (emailVerificationAlert) {
        state.emailVerificationAlert = emailVerificationAlert;
      } else {
        state.emailVerificationAlert = null;
      }
      try {
        localStorage.setItem('accessToken', state.accessToken!);
        localStorage.setItem('refreshToken', state.refreshToken!);
      } catch { }
    },
    logout: (state) => {
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.user = null;
      state.googleUser = null;
      state.error = null;
      state.initialized = true;
      state.emailVerificationAlert = null;
      try {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      } catch { }
    },
    setEmailVerificationAlert: (state, action: PayloadAction<{ verificationEmailSent: boolean; message?: string } | null>) => {
      state.emailVerificationAlert = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    setGoogleUser: (state, action: PayloadAction<GoogleUser>) => {
      state.googleUser = action.payload;
    },
    clearGoogleUser: (state) => {
      state.googleUser = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initAuth.pending, (state) => {
        state.loadingUser = true;
        state.initialized = false;
      })
      .addCase(initAuth.fulfilled, (state) => {
        state.loadingUser = false;
        state.initialized = true;
      })
      .addCase(initAuth.rejected, (state, action) => {
        state.loadingUser = false;
        state.initialized = true;
        state.error = (action.payload as string) || 'Falha ao inicializar auth';
      })

      .addCase(fetchCurrentUser.pending, (state) => {
        state.loadingUser = true;
        state.error = null;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.loadingUser = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.loadingUser = false;
        state.user = null;
        state.isAuthenticated = false;
        state.accessToken = null;
        state.refreshToken = null;
        state.error = (action.payload as string) || 'Erro desconhecido';
        try {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        } catch { }
      });
  },
});

export const { login, logout, setError, setGoogleUser, clearGoogleUser, setEmailVerificationAlert } = authSlice.actions;
export default authSlice.reducer;
