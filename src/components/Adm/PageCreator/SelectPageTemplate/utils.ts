import { PageTemplateOption, PageTemplateType } from './types';
import { PAGE_TEMPLATE_OPTIONS } from './constants';

export const getTemplateOptionByKey = (
  key: PageTemplateType | ''
): PageTemplateOption | null => {
  if (!key) return null;
  return PAGE_TEMPLATE_OPTIONS.find((opt) => opt.key === key) || null;
};
