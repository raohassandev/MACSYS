import { useQuery } from "@tanstack/react-query";
import { Device } from "@shared/schema";

export function useDevice(id: number) {
  return useQuery<Device>({
    queryKey: [`/api/devices/${id}`],
    enabled: !!id,
  });
}
