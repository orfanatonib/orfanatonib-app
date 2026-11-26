import { Node } from '@tiptap/core';

import foiPorVoce from '../assets-foi-por-voce.png';
import setePassos from '../assets-sete-passos.png';

/** Artes fixas do ministério pelo nome (iguais às do DOCX/PDF). */
const BRAND_IMAGES: Record<string, { src: string; alt: string; style: string }> = {
  'foi-por-voce': { src: foiPorVoce, alt: 'Foi por você', style: 'width:170px;max-width:60%;height:auto' },
  'sete-passos': { src: setePassos, alt: 'Os 7 passos da salvação', style: 'width:100%;max-width:640px;height:auto' },
};

/** Cores da faixa do título da meditação (iguais às do DOCX/PDF). */
export const COLOR_BARS = ['#000000', '#FF3B30', '#FFFFFF', '#FFD400', '#00B050'] as const;

/** Logo "Foi por você" que abre o fecho da lição (o DOCX embute a mesma imagem). */
export const BrandLogo = Node.create({
  name: 'brandLogo',
  group: 'block',
  atom: true,
  selectable: true,
  addAttributes() {
    return { name: { default: 'foi-por-voce' } };
  },
  parseHTML() {
    return [
      {
        tag: 'div[data-brand-logo]',
        getAttrs: (element) => ({ name: (element as HTMLElement).getAttribute('data-brand-logo') ?? 'foi-por-voce' }),
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    const name = typeof HTMLAttributes.name === 'string' ? HTMLAttributes.name : 'foi-por-voce';
    const image = BRAND_IMAGES[name] ?? BRAND_IMAGES['foi-por-voce'];
    return [
      'div',
      { 'data-brand-logo': name, style: 'text-align:center;margin:16px 0' },
      ['img', { src: image.src, alt: image.alt, style: image.style }],
    ];
  },
});

/** Quebra de página: o que vem depois começa em uma página nova no DOCX/PDF. */
export const PageBreak = Node.create({
  name: 'pageBreak',
  group: 'block',
  atom: true,
  selectable: true,
  parseHTML() {
    return [{ tag: 'div[data-page-break]' }];
  },
  renderHTML() {
    return [
      'div',
      {
        'data-page-break': 'true',
        style: 'border-top:2px dashed #9AA4B2;margin:28px 0 20px;text-align:center;font-size:11px;color:#6B7684;padding-top:4px',
      },
      'nova página',
    ];
  },
});

/** Faixa de cinco cores acima e abaixo do título "Meditando e organizando". */
export const ColorBars = Node.create({
  name: 'colorBars',
  group: 'block',
  atom: true,
  selectable: true,
  parseHTML() {
    return [{ tag: 'div[data-color-bars]' }];
  },
  renderHTML() {
    return [
      'div',
      { 'data-color-bars': 'true', style: 'display:flex;height:20px;margin:18px 0 10px;border:1px solid #e5e7eb' },
      ...COLOR_BARS.map((color) => ['span', { style: `flex:1;background:${color}` }]),
    ];
  },
});
