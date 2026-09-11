import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

import apiAxios from '@/config/axiosConfig';
import { API_ERROR_MESSAGES } from '@/constants/errors';
import { DEFAULT_FEATURE_FLAGS_MAP } from '@/features/feature-flags/constants';
import type { FeatureFlagsMap } from '@/features/feature-flags/types';
import { extractErrorMessage } from '@/utils/errorHandler';

interface FeatureFlagsState {
  flags: FeatureFlagsMap;
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
}

const initialState: FeatureFlagsState = {
  flags: DEFAULT_FEATURE_FLAGS_MAP,
  loading: false,
  error: null,
  lastFetched: null,
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
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFeatureFlags.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchFeatureFlags.fulfilled,
        (state, action: PayloadAction<FeatureFlagsMap>) => {
          state.loading = false;
          state.flags = action.payload;
          state.error = null;
          state.lastFetched = Date.now();
        },
      )
      .addCase(fetchFeatureFlags.rejected, (state, action) => {
        state.loading = false;
        state.flags = DEFAULT_FEATURE_FLAGS_MAP;
        state.error = action.payload ?? API_ERROR_MESSAGES.FETCH_FEATURE_FLAGS;
        state.lastFetched = Date.now();
      });
  },
});

export const { clearError, resetFeatureFlags } = featureFlagsSlice.actions;
export default featureFlagsSlice.reducer;
