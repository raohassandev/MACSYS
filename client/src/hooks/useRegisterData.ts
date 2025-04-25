import { useQuery } from "@tanstack/react-query";
import { RealtimeData } from "@shared/schema";

export function useRegisterData(deviceId: number) {
  return useQuery<RealtimeData>({
    queryKey: [`/api/devices/${deviceId}/latest`],
    enabled: !!deviceId,
    refetchInterval: 5000, // Poll every 5 seconds for real-time data
  });
}
