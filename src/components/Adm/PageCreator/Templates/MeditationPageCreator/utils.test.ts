import { describe, expect, it } from 'vitest';
import { MediaPlatform, MediaUploadType } from 'store/slices/types';
import { MEDITATION_MESSAGES } from './constants';
import { buildMeditationFormData, isFriday, isMonday, validateMeditation } from './utils';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => ({
  day,
  verse: ' v ',
  topic: ' t ',
})) as never[];

const draft = {
  topic: 'Tema',
  startDate: '2099-01-05',
  endDate: '2099-01-09',
  days,
  uploadType: MediaUploadType.LINK,
  url: 'https://x.com/a.pdf',
  file: null,
  platformType: MediaPlatform.ANY,
};

describe('meditation utils', () => {
  it('reconhece segunda e sexta', () => {
    expect(isMonday('2099-01-05')).toBe(true);
    expect(isMonday('2099-01-06')).toBe(false);
    expect(isFriday('2099-01-09')).toBe(true);
  });

  it('valida na mesma ordem de antes', () => {
    expect(validateMeditation({ ...draft, topic: '' })).toBe(MEDITATION_MESSAGES.MISSING_FIELDS);
    expect(validateMeditation({ ...draft, startDate: '2099-01-06' })).toBe(MEDITATION_MESSAGES.START_NOT_MONDAY);
    expect(validateMeditation({ ...draft, endDate: '2099-01-08' })).toBe(MEDITATION_MESSAGES.END_NOT_FRIDAY);
    expect(validateMeditation({ ...draft, days: days.slice(0, 4) })).toBe(MEDITATION_MESSAGES.DAYS_COUNT);
    expect(validateMeditation({ ...draft, url: ' ' })).toBe(MEDITATION_MESSAGES.MEDIA_REQUIRED);
    expect(validateMeditation({ ...draft, uploadType: MediaUploadType.UPLOAD })).toBe(
      MEDITATION_MESSAGES.MEDIA_REQUIRED,
    );
    expect(validateMeditation(draft)).toBeNull();
  });

  it('monta o payload com link, sem id na criação e dias aparados', () => {
    const form = buildMeditationFormData(draft, true, 'abc');
    const payload = JSON.parse(form.get('meditationData') as string);
    expect(payload.id).toBeUndefined();
    expect(payload.days[0]).toMatchObject({ verse: 'v', topic: 't' });
    expect(payload.media).toMatchObject({ uploadType: 'link', platformType: 'ANY', isLocalFile: false });
    expect(form.get('file')).toBeNull();
  });

  it('anexa o arquivo no upload e inclui o id na edição', () => {
    const file = new File(['x'], 'a.pdf', { type: 'application/pdf' });
    const form = buildMeditationFormData({ ...draft, uploadType: MediaUploadType.UPLOAD, file }, false, 'abc');
    const payload = JSON.parse(form.get('meditationData') as string);
    expect(form.get('file')).toBeInstanceOf(File);
    expect(payload).toMatchObject({ id: 'abc' });
    expect(payload.media).toMatchObject({ isLocalFile: true, originalName: 'a.pdf', url: '' });
  });
});
