import { useQuery } from "@tanstack/react-query";
import { Device } from "../types";

export function useDevice(id: string) {
  return useQuery<Device>({
    queryKey: [`/api/devices/${id}`],
    enabled: !!id,
  });
}
