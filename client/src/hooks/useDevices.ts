import { useQuery } from "@tanstack/react-query";
import { Device } from "@shared/schema";

export function useDevices() {
  return useQuery<Device[]>({
    queryKey: ['/api/devices'],
  });
}
