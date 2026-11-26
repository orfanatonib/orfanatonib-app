import { DayItem } from '@/store/slices/meditation/meditationSlice';
import { MediaItem, MediaPlatform, MediaType, MediaUploadType } from 'store/slices/types';
import { FRIDAY_INDEX, MEDITATION_DAYS_REQUIRED, MEDITATION_MESSAGES, MONDAY_INDEX } from './constants';

const weekdayOf = (dateStr: string): number => new Date(dateStr + 'T00:00:00').getDay();
export const isMonday = (dateStr: string): boolean => weekdayOf(dateStr) === MONDAY_INDEX;
export const isFriday = (dateStr: string): boolean => weekdayOf(dateStr) === FRIDAY_INDEX;

export interface MeditationDraft {
  topic: string;
  startDate: string;
  endDate: string;
  days: DayItem[];
  uploadType: MediaUploadType;
  url: string;
  file: File | null;
  platformType: MediaPlatform;
}

/** Primeira regra violada, ou `null` quando pode salvar (mesma ordem de antes). */
export function validateMeditation(draft: MeditationDraft): string | null {
  if (!draft.topic || !draft.startDate || !draft.endDate) return MEDITATION_MESSAGES.MISSING_FIELDS;
  if (!isMonday(draft.startDate)) return MEDITATION_MESSAGES.START_NOT_MONDAY;
  if (!isFriday(draft.endDate)) return MEDITATION_MESSAGES.END_NOT_FRIDAY;
  if (draft.days.length !== MEDITATION_DAYS_REQUIRED) return MEDITATION_MESSAGES.DAYS_COUNT;
  if (
    (draft.uploadType === MediaUploadType.LINK && !draft.url.trim()) ||
    (draft.uploadType === MediaUploadType.UPLOAD && !draft.file)
  ) {
    return MEDITATION_MESSAGES.MEDIA_REQUIRED;
  }
  return null;
}

/** Monta o `meditationData` e anexa o documento enviado ao `FormData`. */
export function buildMeditationFormData(
  draft: MeditationDraft,
  fromTemplatePage: boolean,
  existingId?: string,
): FormData {
  const { topic, startDate, endDate, days, uploadType, url, file, platformType } = draft;
  const formData = new FormData();
  if (uploadType === MediaUploadType.UPLOAD && file) formData.append('file', file);

  const media: MediaItem = {
    title: topic.trim(),
    description: `Meditação da semana de ${startDate} a ${endDate}`,
    mediaType: MediaType.DOCUMENT,
    uploadType,
    url: uploadType === MediaUploadType.LINK ? url.trim() : '',
    isLocalFile: uploadType === MediaUploadType.UPLOAD,
    ...(file ? { originalName: file.name, size: file.size } : {}),
    ...(uploadType === MediaUploadType.LINK ? { platformType } : {}),
  };

  formData.append(
    'meditationData',
    JSON.stringify({
      ...(fromTemplatePage ? {} : { id: existingId }),
      topic: topic.trim(),
      startDate,
      endDate,
      media,
      days: days.map((day) => ({ day: day.day, verse: day.verse.trim(), topic: day.topic.trim() })),
    }),
  );
  return formData;
}
