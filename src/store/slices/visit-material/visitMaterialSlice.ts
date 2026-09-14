import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { VisitMaterialPageResponseDto } from '@/features/visit-materials/types';

interface VisitMaterialState {
  visitMaterialSData: VisitMaterialPageResponseDto | null;
  loading: boolean;
  error: string | null;
}

const initialState: VisitMaterialState = {
  visitMaterialSData: null,
  loading: false,
  error: null,
};

const visitMaterialSlice = createSlice({
  name: 'visitMaterial',
  initialState,
  reducers: {
    setVisitMaterialData: (
      state,
      action: PayloadAction<VisitMaterialPageResponseDto>,
    ) => {
      state.visitMaterialSData = action.payload;
    },
    clearVisitMaterialData: (state) => {
      state.visitMaterialSData = null;
    },
  },
});

export const { setVisitMaterialData, clearVisitMaterialData } = visitMaterialSlice.actions;
export default visitMaterialSlice.reducer;
