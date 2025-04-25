import { useQuery } from "@tanstack/react-query";
import { RealtimeData } from "../types";

export function useRegisterData(deviceId: string) {
  return useQuery<RealtimeData>({
    queryKey: [`/api/devices/${deviceId}/latest`],
    enabled: !!deviceId,
    refetchInterval: 5000, // Poll every 5 seconds for real-time data
  });
}
