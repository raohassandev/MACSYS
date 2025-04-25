import { useQuery } from "@tanstack/react-query";
import { HistoricalData } from "../types";

interface UseHistoricalDataParams {
  deviceId: string;
  timeRange: "1h" | "24h" | "7d";
}

export function useHistoricalData({ deviceId, timeRange }: UseHistoricalDataParams) {
  // Calculate the start date based on the time range
  const getStartDate = () => {
    const now = new Date();
    
    switch (timeRange) {
      case "1h":
        return new Date(now.getTime() - 60 * 60 * 1000);
      case "24h":
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case "7d":
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
  };
  
  const startDate = getStartDate();
  const endDate = new Date();
  
  return useQuery<HistoricalData[]>({
    queryKey: [`/api/devices/${deviceId}/historical`, timeRange],
    queryFn: () => 
      fetch(`/api/devices/${deviceId}/historical?start=${startDate.toISOString()}&end=${endDate.toISOString()}`)
        .then(res => res.json()),
    enabled: !!deviceId,
  });
}