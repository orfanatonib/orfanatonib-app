import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RouteData } from '@/store/slices/route/routeSlice';
import { MediaItem } from '@/store/slices/types';

export interface VisitMaterialPageData {
  id: string;
  title: string;
  subtitle: string;
  testament?: 'OLD_TESTAMENT' | 'NEW_TESTAMENT';
  currentWeek: boolean;
  description: string;
  createdAt: string;
  updatedAt: string;
  videos: MediaItem[];
  documents: MediaItem[];
  images: MediaItem[];
  audios: MediaItem[];
  route: RouteData;
}

interface VisitMaterialState {
  visitMaterialSData: VisitMaterialPageData | null;
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
    setVisitMaterialData: (state, action: PayloadAction<VisitMaterialPageData>) => {
      state.visitMaterialSData = action.payload;
    },
    clearVisitMaterialData: (state) => {
      state.visitMaterialSData = null;
    },
  },
});

export const { setVisitMaterialData, clearVisitMaterialData } = visitMaterialSlice.actions;
export default visitMaterialSlice.reducer;

