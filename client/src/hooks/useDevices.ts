import { useQuery } from "@tanstack/react-query";
import { Device } from "../types";

// Transform MongoDB response to match our Device interface
const transformDevices = (data: any[]): Device[] => {
  return data.map(device => ({
    id: device._id, // MongoDB uses _id instead of id
    name: device.name,
    ipAddress: device.ip || device.ipAddress, // Support both property names
    port: device.port,
    slaveId: device.slaveId,
    enabled: device.enabled,
    deviceType: device.deviceType || "unknown",
    description: device.description || "",
    registers: device.registers?.map((reg: any) => ({
      id: reg._id,
      name: reg.name,
      address: reg.address,
      length: reg.length,
      dataType: reg.dataType,
      byteOrder: reg.byteOrder
    })) || [],
    status: device.status,
    control: device.control
  }));
};

export function useDevices() {
  return useQuery<Device[]>({
    queryKey: ['/api/devices'],
    select: (data: any) => transformDevices(data)
  });
}
