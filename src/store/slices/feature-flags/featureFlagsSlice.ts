import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import apiAxios from '@/config/axiosConfig';
import { API_ERROR_MESSAGES } from '@/constants/errors';
import { DEFAULT_FEATURE_FLAGS_MAP } from '@/features/feature-flags/constants';
import type { FeatureFlagsMap } from '@/features/feature-flags/types';
import { extractErrorMessage } from '@/utils/errors/analyze';

interface FeatureFlagsState {
  flags: FeatureFlagsMap;
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
  /** Última requisição disparada: respostas de requisições antigas são ignoradas. */
  activeRequestId: string | null;
  /** `true` depois de uma resposta REAL do servidor (o que vem de `DEFAULT_FEATURE_FLAGS_MAP` não conta). */
  loadedFromServer: boolean;
}

const initialState: FeatureFlagsState = {
  flags: DEFAULT_FEATURE_FLAGS_MAP,
  loading: false,
  error: null,
  lastFetched: null,
  activeRequestId: null,
  loadedFromServer: false,
};

export const fetchFeatureFlags = createAsyncThunk<
  FeatureFlagsMap,
  void,
  { rejectValue: string }
>('featureFlags/fetchFeatureFlags', async (_, { rejectWithValue }) => {
  try {
    const response = await apiAxios.get<FeatureFlagsMap>('/feature-flags/map');
    return { ...DEFAULT_FEATURE_FLAGS_MAP, ...response.data };
  } catch (error: unknown) {
    return rejectWithValue(
      extractErrorMessage(error) || API_ERROR_MESSAGES.FETCH_FEATURE_FLAGS,
    );
  }
});

const featureFlagsSlice = createSlice({
  name: 'featureFlags',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetFeatureFlags: (state) => {
      state.flags = DEFAULT_FEATURE_FLAGS_MAP;
      state.error = null;
      state.lastFetched = null;
      state.loadedFromServer = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFeatureFlags.pending, (state, action) => {
        state.activeRequestId = action.meta.requestId;
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchFeatureFlags.fulfilled,
        (state, action) => {
          // Sessão trocada no meio da chamada: a resposta antiga (de outro
          // perfil) não pode sobrescrever a nova.
          if (action.meta.requestId !== state.activeRequestId) return;
          state.loading = false;
          state.flags = action.payload;
          state.error = null;
          state.lastFetched = Date.now();
          state.loadedFromServer = true;
        },
      )
      .addCase(fetchFeatureFlags.rejected, (state, action) => {
        if (action.meta.requestId !== state.activeRequestId) return;
        state.loading = false;
        // Falha de rede: mantém o que o servidor disse por último (não religa o que o admin desligou).
        // Sem resposta anterior, vale o padrão do catálogo — a API continua sendo a autoridade (403).
        if (!state.loadedFromServer) state.flags = DEFAULT_FEATURE_FLAGS_MAP;
        state.error = action.payload ?? API_ERROR_MESSAGES.FETCH_FEATURE_FLAGS;
        state.lastFetched = Date.now();
      });
  },
});

export const { clearError, resetFeatureFlags } = featureFlagsSlice.actions;
export default featureFlagsSlice.reducer;
