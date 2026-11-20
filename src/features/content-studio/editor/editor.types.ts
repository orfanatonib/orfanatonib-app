import type { Editor } from '@tiptap/core';
import type { TiptapDocument } from '../types';

export interface StudioDocEditorProps {
  initialJson: TiptapDocument;
  onChange?: (json: TiptapDocument) => void;
  editable?: boolean;
  /** Categoria do material (etiqueta do cabeçalho da folha): Baby, Crianças… */
  audienceName?: string;
}

export interface StudioEditorAdvancedToolsProps {
  editor: Editor;
  fullscreen: boolean;
  onToggleFullscreen: () => void;
  onOpenTool?: () => void;
}

export enum StudioEditorDialog {
  FORMAT = 'format',
  LINK = 'link',
  FIND = 'find',
}

export interface EditorTextMatch {
  from: number;
  to: number;
}

export enum StudioEditorColorMode {
  TEXT = 'color',
  HIGHLIGHT = 'highlight',
}

export interface StudioEditorColorToolsProps {
  mode?: StudioEditorColorMode;
  editor: Editor;
  onOpenTool?: () => void;
}
