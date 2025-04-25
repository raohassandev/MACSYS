import { useQuery } from "@tanstack/react-query";
import { Device } from "../types";

export function useDevices() {
  return useQuery<Device[]>({
    queryKey: ['/api/devices'],
  });
}
