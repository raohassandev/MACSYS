import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export interface HistoricalData {
  deviceId: string;
  timestamp: string;
  data: Record<string, any>;
}

export function useHistoricalData(deviceId: string, startDate?: Date, endDate?: Date) {
  return useQuery<HistoricalData[]>({
    queryKey: ['/api/historical-data', deviceId, startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      // Only fetch if deviceId and dates are provided
      if (!deviceId || !startDate || !endDate) return [];

      const params = new URLSearchParams({
        deviceId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      // Use the generic parameter to specify the expected return type
      return apiRequest<HistoricalData[]>('GET', `/api/historical-data?${params.toString()}`);
    },
    enabled: Boolean(deviceId && startDate && endDate),
    refetchOnWindowFocus: false
  });
}