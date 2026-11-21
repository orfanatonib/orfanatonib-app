import { useCallback, useEffect, useState } from 'react';
import { IdeasSection, IdeasPage } from './types';
import type { IdeasSection as DraftSection } from '@/store/slices/ideas/ideasSlice';
import { filterSections, toDraftSection } from './utils';
import { getIdeasSection, listIdeasSections, listIdeasPages } from './api';
import { ideasSectionErrorMessage } from './errors';
import { IDEAS_SECTION_MESSAGES } from './constants';

export function useIdeasSections() {
  const [sections, setSections] = useState<IdeasSection[]>([]);
  const [filteredSections, setFilteredSections] = useState<IdeasSection[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [error, setError] = useState('');

  const fetchSections = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listIdeasSections();
      setSections(data);
      setFilteredSections(data);
    } catch (e) {
      setError(ideasSectionErrorMessage(e, IDEAS_SECTION_MESSAGES.LOAD_FAILED));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setIsFiltering(true);
    const t = setTimeout(() => {
      setFilteredSections(filterSections(sections, searchTerm));
      setIsFiltering(false);
    }, 300);
    return () => clearTimeout(t);
  }, [searchTerm, sections]);

  return {
    sections,
    filteredSections,
    searchTerm,
    setSearchTerm,
    loading,
    isFiltering,
    error,
    setError,
    fetchSections,
  };
}

export function useIdeasPages() {
  const [pages, setPages] = useState<IdeasPage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchPages = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listIdeasPages();
      setPages(data);
    } catch (e) {
      setError(ideasSectionErrorMessage(e, IDEAS_SECTION_MESSAGES.LOAD_PAGES_FAILED));
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    pages,
    loading,
    error,
    setError,
    fetchPages,
  };
}

/** Carrega a ideia que o admin vai editar; sem id, não chama a API. */
export function useIdeasSectionToEdit(sectionId: string | null) {
  const [section, setSection] = useState<DraftSection | null>(null);
  const [loading, setLoading] = useState(Boolean(sectionId));
  const [error, setError] = useState('');

  useEffect(() => {
    if (!sectionId) {
      setSection(null);
      setLoading(false);
      setError('');
      return undefined;
    }
    let active = true;
    setLoading(true);
    setError('');
    getIdeasSection(sectionId)
      .then((data) => {
        if (active) setSection(toDraftSection(data));
      })
      .catch((e: unknown) => {
        if (active) setError(ideasSectionErrorMessage(e, IDEAS_SECTION_MESSAGES.LOAD_ONE_FAILED));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [sectionId]);

  return { section, loading, error };
}
