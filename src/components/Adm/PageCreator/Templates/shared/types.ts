import type { ReactNode } from 'react';

/** Tipos de mídia que o seletor de arquivos aceita. */
export enum MediaFileKind {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document',
}

/** Motivos pelos quais um arquivo é recusado. */
export enum MediaFileErrorCode {
  INVALID_TYPE = 'INVALID_TYPE',
  TOO_LARGE = 'TOO_LARGE',
}

export interface MediaFileValidationOptions {
  kind: MediaFileKind;
  /** Quando definido, recusa arquivos maiores que este limite. */
  maxFileSizeBytes?: number;
  /** Quando verdadeiro, recusa arquivos cujo tipo não combina com `kind`. */
  strictType?: boolean;
}

export interface MediaFileValidationResult {
  valid: boolean;
  code?: MediaFileErrorCode;
  message?: string;
}

export interface MediaSelection {
  file: File;
  previewUrl: string;
}

export interface UseMediaUploadOptions extends MediaFileValidationOptions {
  /** Aceita vários arquivos (acumula) ou apenas um (substitui). */
  multiple?: boolean;
}

export interface UseMediaUploadResult {
  selections: MediaSelection[];
  error: string | null;
  /** Valor do atributo `accept` do `<input type="file">`. */
  accept: string;
  selectFiles: (files: FileList | File[] | null | undefined) => MediaSelection[];
  removeAt: (index: number) => void;
  clear: () => void;
}

export interface PageFormBaseProps {
  /** Título do cabeçalho (já com emoji, como hoje). */
  heading: string;
  onBack: () => void;
  testId: string;
  /** Mantém o container fluido de 98%/95% (galerias) ou o `lg` fixo. */
  fluid?: boolean;
  /** Anuncia o formulário sujo ao registro de alterações não salvas. */
  warnOnUnsavedChanges?: boolean;
  isDirty?: boolean;
  children: ReactNode;
}

export interface PageFormActionsProps {
  testId: string;
  cancelLabel?: string;
  saveLabel: string;
  savingLabel: string;
  isSaving: boolean;
  saveDisabled?: boolean;
  saveColor?: 'primary' | 'success';
  showSaveIcon?: boolean;
  savingSpinner?: boolean;
  onCancel: () => void;
  onSave: () => void;
  /** Botões extras entre "Cancelar" e "Salvar" (ex.: "+ Nova Seção"). */
  children?: ReactNode;
}

export interface PageBasicInfoTouched {
  title: boolean;
  description: boolean;
}

export interface PageBasicInfoSectionProps {
  testId: string;
  titleLabel: string;
  descriptionLabel: string;
  publicLabel?: string;
  title: string;
  description: string;
  isPublic: boolean;
  touched: PageBasicInfoTouched;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onPublicChange: (value: boolean) => void;
  onTouchedChange: (field: keyof PageBasicInfoTouched, touched: boolean) => void;
}

export type FeedbackSeverity = 'success' | 'error' | 'info' | 'warning';

export interface PageFeedbackSnackbarProps {
  open: boolean;
  message: string;
  severity: FeedbackSeverity;
  onClose: () => void;
  testId: string;
  /** Alerta preenchido e centralizado embaixo (galeria de fotos). */
  filled?: boolean;
}
