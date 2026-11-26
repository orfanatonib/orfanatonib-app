import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { MediaItem } from '@/store/slices/types';
import type { ImageSectionReviewStatus } from '@/features/image-sections/types';

export interface SectionData {
  id?: string;
  public: boolean;
  caption: string;
  description: string;
  mediaItems: MediaItem[];
  /** Quem enviou (só a moderação recebe); `null` = autoria desconhecida. */
  author?: { displayName: string } | null;
  reviewStatus?: ImageSectionReviewStatus;
  /** Motivo dado pelo admin quando reprovou. */
  rejectionReason?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

interface ImageSectionState {
  data: SectionData | null;
}

const initialState: ImageSectionState = {
  data: null,
};

const imageSectionSlice = createSlice({
  name: 'imageSection',
  initialState,
  reducers: {
    setData: (state, action: PayloadAction<SectionData>) => {
      state.data = action.payload;
    },
    clearData: (state) => {
      state.data = null;
    },
  },
});

export const { setData, clearData } = imageSectionSlice.actions;
export default imageSectionSlice.reducer;
