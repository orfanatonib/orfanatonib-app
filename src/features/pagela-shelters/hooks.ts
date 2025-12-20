import { useState, useEffect, useCallback, useRef } from 'react';
import { PagelaSheltersApi } from './api';
import type {
  SheltersResponse,
  ShelteredResponse,
  PagelasResponse,
  SheltersFilters,
  ShelteredFilters,
  PagelasFilters,
  ShelterDto,
  ShelteredDto,
  PagelaDto,
} from './types';

export const useShelters = (filters: SheltersFilters = {}) => {
  const [data, setData] = useState<SheltersResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastFiltersRef = useRef<string>('');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchShelters = useCallback(async (newFilters?: SheltersFilters, page: number = 1) => {
    const currentFilters = newFilters || filters;
    
    const filtersKey = JSON.stringify({ ...currentFilters, page });
    if (filtersKey === lastFiltersRef.current) return;
    
    lastFiltersRef.current = filtersKey;
    setLoading(true);
    setError(null);
    
    try {
      const result = await PagelaSheltersApi.getShelters({
        ...currentFilters,
        page,
        limit: 6,
      });
      setData(result);
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar shelters');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const filtersKey = JSON.stringify({ ...filters, page: filters.page || 1 });
    if (filtersKey !== lastFiltersRef.current) {
      fetchShelters(filters, filters.page || 1);
    }
  }, [filters, fetchShelters]);

  const handlePageChange = (page: number) => {
    fetchShelters(filters, page);
  };

  return {
    data,
    loading,
    error,
    currentPage,
    totalPages: Math.ceil((data?.total || 0) / 6),
    refetch: fetchShelters,
    handlePageChange,
  };
};

export const useSheltered = (filters: ShelteredFilters | undefined = undefined, enabled: boolean = true) => {
  const [data, setData] = useState<ShelteredResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFilters, setLastFilters] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchSheltered = useCallback(async (newFilters?: ShelteredFilters, page: number = 1) => {
    const currentFilters = newFilters || filters;
    if (!enabled || !currentFilters) return;
    
    const filtersKey = JSON.stringify({ ...currentFilters, page });
    if (filtersKey === lastFilters) return;
    
    setLastFilters(filtersKey);
    setLoading(true);
    setError(null);
    
    try {
      const result = await PagelaSheltersApi.getSheltered({
        ...currentFilters,
        page,
        limit: 6,
      });
      setData(result);
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar sheltered');
    } finally {
      setLoading(false);
    }
  }, [enabled, lastFilters, filters]);

  useEffect(() => {
    if (enabled && filters) {
      fetchSheltered(filters);
    } else {
      setData(null);
      setError(null);
      setLoading(false);
      setLastFilters('');
      setCurrentPage(1);
    }
  }, [enabled, filters, fetchSheltered]);

  const handlePageChange = (page: number) => {
    fetchSheltered(filters, page);
  };

  return {
    data,
    loading,
    error,
    currentPage,
    totalPages: data?.meta?.totalPages || 0,
    refetch: fetchSheltered,
    handlePageChange,
  };
};

export const usePagelas = (filters: PagelasFilters | undefined = undefined, enabled: boolean = true) => {
  const [data, setData] = useState<PagelasResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFilters, setLastFilters] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchPagelas = useCallback(async (newFilters?: PagelasFilters, page: number = 1) => {
    const currentFilters = newFilters || filters;
    if (!enabled || !currentFilters) return;
    
    const filtersKey = JSON.stringify({ ...currentFilters, page });
    if (filtersKey === lastFilters) return;
    
    setLastFilters(filtersKey);
    setLoading(true);
    setError(null);
    
    try {
      const result = await PagelaSheltersApi.getPagelas({
        ...currentFilters,
        page,
        limit: 6, // Padrão: 6 itens
      });
      setData(result);
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar pagelas');
    } finally {
      setLoading(false);
    }
  }, [enabled, filters, lastFilters]);

  useEffect(() => {
    if (enabled && filters) {
      const filtersKey = JSON.stringify({ ...filters, page: filters.page || 1 });
      if (filtersKey !== lastFilters) {
        fetchPagelas(filters, filters.page || 1);
      }
    } else {
      setData(null);
      setError(null);
      setLoading(false);
      setLastFilters('');
      setCurrentPage(1);
    }
  }, [enabled, filters, lastFilters, fetchPagelas]);

  const handlePageChange = (page: number) => {
    fetchPagelas(filters, page);
  };

  return {
    data,
    loading,
    error,
    currentPage,
    totalPages: Math.ceil((data?.total || 0) / (data?.limit || 6)),
    refetch: fetchPagelas,
    handlePageChange,
  };
};

export const usePagelaSheltersManager = () => {
  const [selectedShelter, setSelectedShelter] = useState<ShelterDto | null>(null);
  const [selectedSheltered, setSelectedSheltered] = useState<ShelteredDto | null>(null);
  const [sheltersFilters, setSheltersFilters] = useState<SheltersFilters>({});
  const [shelteredFilters, setShelteredFilters] = useState<ShelteredFilters>({});
  const [pagelasFilters, setPagelasFilters] = useState<PagelasFilters>({});

  // Shelters
  const shelters = useShelters(sheltersFilters);

  const shelteredFiltersWithShelter = selectedShelter 
    ? { ...shelteredFilters, shelterId: selectedShelter.id }
    : undefined;
  
  
  const sheltered = useSheltered(shelteredFiltersWithShelter, !!selectedShelter);

  const pagelasFiltersWithSheltered = selectedSheltered
    ? { 
        ...pagelasFilters, 
        shelteredId: selectedSheltered.id,
      }
    : undefined;
  
  
  const pagelas = usePagelas(pagelasFiltersWithSheltered, !!selectedSheltered);

  const handleShelterSelect = (shelter: ShelterDto | null) => {
    setSelectedShelter(shelter);
    setSelectedSheltered(null);
    setShelteredFilters({});
    setPagelasFilters({});
  };

  const handleShelteredSelect = (sheltered: ShelteredDto | null) => {
    setSelectedSheltered(sheltered);
    setPagelasFilters({});
  };

  const handleBack = () => {
    if (selectedSheltered) {
      setSelectedSheltered(null);
    } else if (selectedShelter) {
      setSelectedShelter(null);
    }
  };

  const handleSheltersSearchChange = (searchString: string) => {
    setSheltersFilters(prev => ({
      ...prev,
      searchString: searchString,
      page: 1,
    }));
  };

  const handleShelteredSearchChange = (searchString: string) => {
    setShelteredFilters(prev => ({
      ...prev,
      searchString: searchString,
      page: 1,
    }));
  };

  const handlePagelasSearchChange = useCallback((searchString: string) => {
    setPagelasFilters(prev => ({
      ...prev,
      searchString: searchString,
      page: 1,
    }));
  }, []);

  return {
    selectedShelter,
    selectedSheltered,
    
    shelters,
    sheltered,
    pagelas,
    
    sheltersFilters,
    shelteredFilters,
    pagelasFilters,
    
    // Ações
    handleShelterSelect,
    handleShelteredSelect,
    handleBack,
    setSheltersFilters,
    setShelteredFilters,
    setPagelasFilters,
    handleSheltersSearchChange,
    handleShelteredSearchChange,
    handlePagelasSearchChange,
  };
};

export const usePagelaSheltersManagerForLeader = (selectedShelterId: string | null) => {
  const [selectedSheltered, setSelectedSheltered] = useState<ShelteredDto | null>(null);
  const [shelteredFilters, setShelteredFilters] = useState<ShelteredFilters>({});
  const [pagelasFilters, setPagelasFilters] = useState<PagelasFilters>({});

  const shelteredFiltersWithShelter = selectedShelterId 
    ? { ...shelteredFilters, shelterId: selectedShelterId }
    : undefined;
  
  const sheltered = useSheltered(shelteredFiltersWithShelter, !!selectedShelterId);

  const pagelasFiltersWithSheltered = selectedSheltered
    ? { 
        ...pagelasFilters, 
        shelteredId: selectedSheltered.id,
      }
    : undefined;
  
  const pagelas = usePagelas(pagelasFiltersWithSheltered, !!selectedSheltered);

  const handleShelteredSelect = (sheltered: ShelteredDto | null) => {
    setSelectedSheltered(sheltered);
    setPagelasFilters({});
  };

  const handleShelteredSearchChange = (searchString: string) => {
    setShelteredFilters(prev => ({
      ...prev,
      searchString: searchString,
      page: 1,
    }));
  };

  const handlePagelasSearchChange = useCallback((searchString: string) => {
    setPagelasFilters(prev => ({
      ...prev,
      searchString: searchString,
      page: 1,
    }));
  }, []);

  useEffect(() => {
    setSelectedSheltered(null);
    setShelteredFilters({});
    setPagelasFilters({});
  }, [selectedShelterId]);

  return {
    selectedSheltered,
    sheltered,
    pagelas,
    handleShelteredSelect,
    handleShelteredSearchChange,
    handlePagelasSearchChange,
  };
};
