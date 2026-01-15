import { useCallback, useEffect, useRef, useState } from 'react';
import { useErrorHandler } from './useErrorHandler';
import type { ErrorHandlingOptions } from '@/utils/errorHandler';

export interface UseDataFetcherResult<T> {
  data: T | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: any;
  refetch: (options?: ErrorHandlingOptions) => Promise<T | undefined>;
  refresh: (options?: ErrorHandlingOptions) => Promise<T | undefined>;
  clearData: () => void;
  clearError: () => void;
  lastFetchTime: number | null;
  isStale: boolean;
}

export interface UseDataFetcherOptions {
  enabled?: boolean;
  refetchOnWindowFocus?: boolean;
  refetchInterval?: number;
  staleTime?: number;
  cacheTime?: number;
  retry?: boolean;
  retryCount?: number;
  context?: string;
}

export function useDataFetcher<T>(
  fetchFunction: () => Promise<T>,
  options: UseDataFetcherOptions = {}
): UseDataFetcherResult<T> {
  const {
    enabled = true,
    refetchOnWindowFocus = false,
    refetchInterval,
    staleTime = 5 * 60 * 1000,
    cacheTime = 10 * 60 * 1000,
    retry = true,
    retryCount = 3,
    context,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<number | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const cacheRef = useRef<Map<string, { data: T; timestamp: number }>>(new Map());

  const {
    error,
    isLoading,
    clearError,
    executeWithErrorHandling,
    executeWithRetry,
  } = useErrorHandler(context);

  const isStale = lastFetchTime ? Date.now() - lastFetchTime > staleTime : true;

  const fetchData = useCallback(async (
    showLoading = true,
    useRetry = retry,
    fetchOptions?: ErrorHandlingOptions
  ): Promise<T | undefined> => {
    if (!enabled) return;

    const cacheKey = context || 'default';
    const cached = cacheRef.current.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < cacheTime && !isStale) {
      setData(cached.data);
      setLastFetchTime(cached.timestamp);
      return cached.data;
    }

    try {
      let result: T | undefined;

      if (useRetry) {
        result = await executeWithRetry(fetchFunction, {
          maxRetries: retryCount,
          showNotification: false,
          ...fetchOptions,
        });
      } else {
        result = await executeWithErrorHandling(fetchFunction, {
          showNotification: false,
          ...fetchOptions,
        });
      }

      if (result !== undefined) {
        setData(result);
        setLastFetchTime(Date.now());

        cacheRef.current.set(cacheKey, {
          data: result,
          timestamp: Date.now(),
        });
      }

      return result;
    } catch (error) {
      return undefined;
    }
  }, [enabled, context, staleTime, cacheTime, isStale, retry, retryCount, executeWithErrorHandling, executeWithRetry, fetchFunction]);

  const refetch = useCallback((options?: ErrorHandlingOptions) => {
    return fetchData(true, retry, options);
  }, [fetchData, retry]);

  const refresh = useCallback(async (options?: ErrorHandlingOptions) => {
    setIsRefreshing(true);
    try {
      return await fetchData(false, false, options);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchData]);

  const clearData = useCallback(() => {
    setData(null);
    setLastFetchTime(null);
    if (context) {
      cacheRef.current.delete(context);
    }
  }, [context]);

  useEffect(() => {
    if (enabled) {
      fetchData();
    }
  }, [enabled, fetchData]);

  useEffect(() => {
    if (!refetchOnWindowFocus || !enabled) return;

    const handleFocus = () => {
      if (isStale) {
        fetchData(false);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refetchOnWindowFocus, enabled, isStale, fetchData]);

  useEffect(() => {
    if (!refetchInterval || !enabled) return;

    intervalRef.current = setInterval(() => {
      fetchData(false);
    }, refetchInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [refetchInterval, enabled, fetchData]);

  useEffect(() => {
    return () => {
      if (context) {
        cacheRef.current.delete(context);
      }
    };
  }, [context]);

  return {
    data,
    isLoading,
    isRefreshing,
    error,
    refetch,
    refresh,
    clearData,
    clearError,
    lastFetchTime,
    isStale,
  };
}
