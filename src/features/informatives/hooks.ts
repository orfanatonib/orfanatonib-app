import { useCallback, useEffect, useRef, useState } from 'react';
import type { InformativeBannerData } from 'store/slices/informative/informativeBannerSlice';
import { fetchBannersApi } from './api';

export function useInformativeBanners() {
  const [banners, setBanners] = useState<InformativeBannerData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFiltering, setIsFiltering] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBanners = useCallback(async (querySearch?: string) => {
    setLoading(true);
    setIsFiltering(true);
    setError(null);
    try {
      const data = await fetchBannersApi(querySearch);
      setBanners(data);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? `Erro ao buscar banners: ${err.message}`
          : 'Erro desconhecido ao buscar banners.'
      );
    } finally {
      setLoading(false);
      setIsFiltering(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBanners(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, fetchBanners]);

  return {
    banners,
    filtered: banners,
    searchTerm,
    setSearchTerm,
    isFiltering,
    loading,
    error,
    setError,
    fetchBanners,
  };
}
