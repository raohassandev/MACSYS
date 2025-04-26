import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

interface HistoricalDataPoint {
  timestamp: string;
  data: Record<string, any>;
}

type TimeRange = '1h' | '6h' | '12h' | '24h' | '7d' | '30d';

async function fetchHistoricalData(deviceId: string, startTime: Date, endTime: Date) {
  const response = await fetch(
    `/api/devices/${deviceId}/history?startTime=${startTime.toISOString()}&endTime=${endTime.toISOString()}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch historical data');
  }

  return response.json();
}

export function useHistoricalData(deviceId: string) {
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');

  // Calculate start time based on the selected time range
  const calculateTimeRange = () => {
    const now = new Date();
    const startTime = new Date(now);

    switch (timeRange) {
      case '1h':
        startTime.setHours(now.getHours() - 1);
        break;
      case '6h':
        startTime.setHours(now.getHours() - 6);
        break;
      case '12h':
        startTime.setHours(now.getHours() - 12);
        break;
      case '24h':
        startTime.setHours(now.getHours() - 24);
        break;
      case '7d':
        startTime.setDate(now.getDate() - 7);
        break;
      case '30d':
        startTime.setDate(now.getDate() - 30);
        break;
      default:
        startTime.setHours(now.getHours() - 24);
    }

    return { startTime, endTime: now };
  };

  const { startTime, endTime } = calculateTimeRange();

  const { data, isLoading, error } = useQuery({
    queryKey: ['historicalData', deviceId, timeRange],
    queryFn: () => fetchHistoricalData(deviceId, startTime, endTime),
    enabled: !!deviceId,
    refetchInterval: 1000 * 60 * 5, // Refresh every 5 minutes
  });

  // Function to get data for a specific register
  const getRegisterData = (registerName: string) => {
    if (!data) return [];

    return data.map((point: HistoricalDataPoint) => ({
      timestamp: new Date(point.timestamp),
      value: point.data[registerName] !== undefined ? point.data[registerName] : null,
    }));
  };

  // Transform data for recharts
  const getChartData = (registerNames: string[]) => {
    if (!data) return [];

    return data.map((point: HistoricalDataPoint) => {
      const result: any = {
        timestamp: new Date(point.timestamp),
      };

      registerNames.forEach((name) => {
        if (point.data[name] !== undefined) {
          result[name] = point.data[name];
        } else {
          result[name] = null;
        }
      });

      return result;
    });
  };

  return {
    data,
    isLoading,
    error,
    timeRange,
    setTimeRange,
    getRegisterData,
    getChartData,
  };
}

export type { TimeRange };