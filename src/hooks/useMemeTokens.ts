import { useQuery } from '@tanstack/react-query';
import { fetchMemeTokens, fetchTokenDetail } from '../services/coingeckoService';
import { API_CONFIG } from '../utils/constants';

// Hook to fetch meme tokens list
export const useMemeTokens = (page: number = 1, perPage: number = 100) => {
  return useQuery({
    queryKey: ['memeTokens', page, perPage],
    queryFn: () => fetchMemeTokens(page, perPage),
    refetchInterval: API_CONFIG.refetchInterval,
    staleTime: API_CONFIG.staleTime,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

// Hook to fetch single token detail
export const useTokenDetail = (id: string | null) => {
  return useQuery({
    queryKey: ['tokenDetail', id],
    queryFn: () => fetchTokenDetail(id!),
    enabled: !!id,
    staleTime: 60000,
  });
};
