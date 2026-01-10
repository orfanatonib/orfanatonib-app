import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import apiAxios from '@/config/axiosConfig';

// TypeScript interfaces
export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  environment: string;
  metadata: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

interface FeatureFlagsState {
  flags: FeatureFlag[];
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
}

const initialState: FeatureFlagsState = {
  flags: [],
  loading: false,
  error: null,
  lastFetched: null,
};

// Async thunk to fetch feature flags from API
export const fetchFeatureFlags = createAsyncThunk<
  FeatureFlag[],
  void,
  { rejectValue: string }
>(
  'featureFlags/fetchFeatureFlags',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiAxios.get<FeatureFlag[]>('/feature-flags');
      return response.data;
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Failed to load feature flags';
      return rejectWithValue(errorMessage);
    }
  }
);

const featureFlagsSlice = createSlice({
  name: 'featureFlags',
  initialState,
  reducers: {
    // Clear error state
    clearError: (state) => {
      state.error = null;
    },
    // Reset feature flags state
    resetFeatureFlags: (state) => {
      state.flags = [];
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
      .addCase(fetchFeatureFlags.fulfilled, (state, action: PayloadAction<FeatureFlag[]>) => {
        state.loading = false;
        state.flags = action.payload;
        state.error = null;
        state.lastFetched = Date.now();
      })
      .addCase(fetchFeatureFlags.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Unknown error';
      });
  },
});

export const { clearError, resetFeatureFlags } = featureFlagsSlice.actions;
export default featureFlagsSlice.reducer;
