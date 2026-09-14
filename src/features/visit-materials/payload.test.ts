import { describe, expect, it } from 'vitest';
import { MediaPlatform, MediaType, MediaUploadType } from '@/store/slices/types';
import { VISIT_MATERIAL_PAYLOAD_FIELD } from './constants';
import { buildVisitMaterialFormData } from './payload';
import { TestamentType, UpdateVisitMaterialPageRequestDto } from './types';

const formValues = () => ({
  id: 'page-id',
  pageTitle: '  Gênesis  ',
  pageSubtitle: '  A criação  ',
  pageDescription: '  Material da visita  ',
  testament: TestamentType.OLD_TESTAMENT,
  currentWeek: true,
  videos: [],
  documents: [],
  images: [],
  audios: [],
});

const payloadOf = (formData: FormData): UpdateVisitMaterialPageRequestDto => {
  const raw = formData.get(VISIT_MATERIAL_PAYLOAD_FIELD);
  if (typeof raw !== 'string') throw new Error('Payload multipart ausente');
  return JSON.parse(raw) as UpdateVisitMaterialPageRequestDto;
};

describe('buildVisitMaterialFormData', () => {
  it('normalizes page text and keeps the update contract explicit', () => {
    const payload = payloadOf(
      buildVisitMaterialFormData(formValues(), 'update'),
    );

    expect(payload).toMatchObject({
      id: 'page-id',
      pageTitle: 'Gênesis',
      pageSubtitle: 'A criação',
      pageDescription: 'Material da visita',
      testament: TestamentType.OLD_TESTAMENT,
      currentWeek: true,
    });
  });

  it('attaches a new upload and references it by fieldKey', () => {
    const file = new File(['pdf'], 'material.pdf', {
      type: 'application/pdf',
    });
    const formData = buildVisitMaterialFormData(
      {
        ...formValues(),
        documents: [
          {
            title: 'Documento',
            description: 'Descrição',
            mediaType: MediaType.DOCUMENT,
            uploadType: MediaUploadType.UPLOAD,
            url: 'blob:preview-only',
            file,
          },
        ],
      },
      'update',
    );
    const document = payloadOf(formData).documents[0];

    expect(document.fieldKey).toBe('document_0.pdf');
    expect(document.url).toBeUndefined();
    const attached = formData.get(document.fieldKey ?? '');
    expect(attached).toBeInstanceOf(File);
    if (!(attached instanceof File)) throw new Error('Arquivo não anexado');
    expect(attached.name).toBe('material.pdf');
  });

  it('identifies an existing upload without resending its trusted URL', () => {
    const payload = payloadOf(
      buildVisitMaterialFormData(
        {
          ...formValues(),
          documents: [
            {
              id: 'document-id',
              title: 'Documento',
              description: 'Descrição',
              mediaType: MediaType.DOCUMENT,
              uploadType: MediaUploadType.UPLOAD,
              isLocalFile: true,
              url: 'https://bucket.test/material.pdf',
              originalName: 'material.pdf',
              size: 123,
            },
          ],
        },
        'update',
      ),
    );

    expect(payload.documents[0]).toEqual({
      id: 'document-id',
      title: 'Documento',
      description: 'Descrição',
      mediaType: MediaType.DOCUMENT,
      uploadType: MediaUploadType.UPLOAD,
      isLocalFile: true,
      originalName: 'material.pdf',
      size: 123,
    });
  });

  it('keeps a link URL and platform in the JSON payload', () => {
    const payload = payloadOf(
      buildVisitMaterialFormData(
        {
          ...formValues(),
          videos: [
            {
              title: 'Vídeo',
              description: 'Descrição',
              mediaType: MediaType.VIDEO,
              uploadType: MediaUploadType.LINK,
              url: ' https://youtube.test/watch ',
              platformType: MediaPlatform.YOUTUBE,
            },
          ],
        },
        'update',
      ),
    );

    expect(payload.videos[0]).toMatchObject({
      url: 'https://youtube.test/watch',
      platformType: MediaPlatform.YOUTUBE,
      isLocalFile: false,
    });
  });
});
