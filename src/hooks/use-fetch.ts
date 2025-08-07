/**
 * Custom hook for data fetching operations with proper error handling and performance optimization
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger, logError, logApiCall } from '@/lib/logger';
import type { ApiResponse, AsyncState } from '@/types';

export interface UseFetchOptions<T> {
  initialData?: T;
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
  enabled?: boolean;
  refetchInterval?: number;
}

export function useFetch<T>(
  queryFn: () => Promise<T>,
  dependencies: unknown[] = [],
  options: UseFetchOptions<T> = {}
) {
  const { 
    initialData = null, 
    onSuccess, 
    onError, 
    enabled = true,
    refetchInterval 
  } = options;
  
  const [state, setState] = useState<AsyncState<T>>({
    data: initialData,
    loading: false,
    error: null
  });

  const isMountedRef = useRef(true);
  const intervalRef = useRef<NodeJS.Timeout>();

  const fetchData = useCallback(async () => {
    if (!enabled || !isMountedRef.current) return;

    setState(prev => ({ ...prev, loading: true, error: null }));
    const startTime = Date.now();

    try {
      logger.debug('Starting data fetch', 'useFetch');
      const result = await queryFn();
      const duration = Date.now() - startTime;
      
      if (isMountedRef.current) {
        setState({
          data: result,
          loading: false,
          error: null
        });

        logger.debug(`Fetch completed in ${duration}ms`, 'useFetch');
        onSuccess?.(result);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      logError(error, 'useFetch');
      
      if (isMountedRef.current) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        setState({
          data: initialData,
          loading: false,
          error: errorMessage
        });

        logger.warn(`Fetch failed after ${duration}ms: ${errorMessage}`, 'useFetch');
        onError?.(errorMessage);
      }
    }
  }, [queryFn, enabled, initialData, onSuccess, onError]);

  // Initial fetch and dependency-based refetch
  useEffect(() => {
    fetchData();
  }, [fetchData, ...dependencies]);

  // Auto-refetch interval
  useEffect(() => {
    if (refetchInterval && enabled) {
      intervalRef.current = setInterval(fetchData, refetchInterval);
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [fetchData, refetchInterval, enabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    ...state,
    refetch
  };
}

// Specialized hook for Supabase queries
export function useSupabaseQuery<T>(
  table: string,
  query?: (builder: any) => any,
  dependencies: unknown[] = [],
  options: UseFetchOptions<T[]> = {}
) {
  const queryFn = useCallback(async () => {
    const startTime = Date.now();
    let builder = supabase.from(table).select();
    
    if (query) {
      builder = query(builder);
    }

    const { data, error } = await builder;
    const duration = Date.now() - startTime;
    
    logApiCall(`supabase:${table}`, 'SELECT', error ? 500 : 200, duration);
    
    if (error) {
      throw new Error(error.message);
    }

    return data as T[];
  }, [table, query]);

  return useFetch(queryFn, dependencies, options);
}

// Hook for companies data
export function useCompanies(enabled = true) {
  return useSupabaseQuery(
    'empresas',
    (builder) => builder.order('creado_en', { ascending: false }),
    [],
    { enabled }
  );
}

// Hook for users data
export function useUsers(enabled = true) {
  return useSupabaseQuery(
    'profiles',
    (builder) => builder.order('created_at', { ascending: false }),
    [],
    { enabled }
  );
}

// Hook for import jobs
export function useImportJobs(companyId?: string, enabled = true) {
  return useSupabaseQuery(
    'trabajos_importacion',
    (builder) => {
      let query = builder
        .select('*, companies:empresas(name)')
        .order('creado_en', { ascending: false });
      
      if (companyId) {
        query = query.eq('company_id', companyId);
      }
      
      return query;
    },
    [companyId],
    { enabled }
  );
}