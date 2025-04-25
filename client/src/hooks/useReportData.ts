import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { HistoricalData } from './useHistoricalData';

// Transform MongoDB response to match our HistoricalData interface
const transformReportData = (data: any[]): HistoricalData[] => {
  return data.map(item => ({
    deviceId: item.deviceId || item.device, // MongoDB might use 'device' instead of 'deviceId'
    timestamp: item.timestamp,
    data: item.data || {}
  }));
};

export function useReportData(
  deviceId: string, 
  startDate?: Date, 
  endDate?: Date,
  reportType: "daily" | "weekly" | "monthly" | "yearly" = "daily"
) {
  return useQuery<HistoricalData[]>({
    queryKey: ['/api/reports', deviceId, startDate?.toISOString(), endDate?.toISOString(), reportType],
    queryFn: async () => {
      // Only fetch if deviceId and dates are provided
      if (!deviceId || !startDate || !endDate) return [];

      const params = new URLSearchParams({
        deviceId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        reportType
      });

      // First try the dedicated reports endpoint
      try {
        const data = await apiRequest<any[]>('GET', `/api/reports?${params.toString()}`);
        return transformReportData(data || []);
      } catch (error) {
        // Fall back to historical data endpoint if reports endpoint isn't available
        console.log("Reports endpoint not available, falling back to historical data");
        const data = await apiRequest<any[]>('GET', `/api/historical-data?${params.toString()}`);
        return transformReportData(data || []);
      }
    },
    enabled: Boolean(deviceId && startDate && endDate),
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
}