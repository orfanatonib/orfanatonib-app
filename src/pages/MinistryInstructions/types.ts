import type { ComponentType } from 'react';

export enum ManualSectionVariant {
  /** Cartão com fundo em gradiente e texto claro (o conteúdo foi desenhado para fundo escuro). */
  Gradient = 'gradient',
  /** Cartão branco com título escuro. */
  Light = 'light',
}

export interface ManualSectionDefinition {
  id: string;
  title: string;
  subtitle?: string;
  variant: ManualSectionVariant;
  /** Obrigatório quando `variant` é `Gradient`. */
  gradient?: string;
  Content: ComponentType;
}

export interface ManualSectionProps {
  id: string;
  title: string;
  subtitle?: string;
  variant: ManualSectionVariant;
  gradient?: string;
  children: React.ReactNode;
}
