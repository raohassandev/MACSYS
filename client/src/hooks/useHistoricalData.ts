import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export interface HistoricalData {
  deviceId: string;
  timestamp: string;
  data: Record<string, any>;
}

// Transform MongoDB response to match our HistoricalData interface
const transformHistoricalData = (data: any[]): HistoricalData[] => {
  return data.map(item => ({
    deviceId: item.deviceId || item.device, // MongoDB might use 'device' instead of 'deviceId'
    timestamp: item.timestamp,
    data: item.data || {}
  }));
};

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

      // Fetch data and transform it to match our interface
      const data = await apiRequest<any[]>('GET', `/api/historical-data?${params.toString()}`);
      return transformHistoricalData(data || []);
    },
    enabled: Boolean(deviceId && startDate && endDate),
    refetchOnWindowFocus: false
  });
}