/**
 * Storage interface for MongoDB with string IDs for documents
 */

interface DeviceData {
  name: string;
  ipAddress: string;
  port: number;
  slaveId: number;
  enabled: boolean;
  deviceType: string;
  description: string;
  registers?: RegisterData[];
  [key: string]: any;
}

interface RegisterData {
  name: string;
  address: number;
  type: string;
  dataType: string;
  unit: string;
  readOnly: boolean;
  [key: string]: any;
}

interface RealtimeDataEntry {
  deviceId: string;
  timestamp: Date;
  data: Record<string, any>;
  status: boolean;
  control?: {
    type: string;
    source: string;
  };
  [key: string]: any;
}

interface HistoricalDataEntry {
  deviceId: string;
  timestamp: Date;
  data: Record<string, any>;
  [key: string]: any;
}

export interface Storage {
  getAllDevices(): Promise<DeviceData[]>;
  getDeviceById(id: string): Promise<DeviceData | null>;
  getDeviceByName(name: string): Promise<DeviceData | null>;
  createDevice(device: DeviceData): Promise<DeviceData>;
  updateDevice(id: string, data: Partial<DeviceData>): Promise<DeviceData | null>;
  deleteDevice(id: string): Promise<DeviceData | null>;
  getRegistersForDevice(deviceId: string): Promise<RegisterData[]>;
  createRegister(register: RegisterData): Promise<RegisterData>;
  updateRegister(id: string, data: Partial<RegisterData>): Promise<RegisterData | null>;
  deleteRegister(id: string): Promise<RegisterData | null>;
  saveRealtimeData(deviceId: string, data: any, status?: boolean): Promise<RealtimeDataEntry>;
  getLatestRealtimeData(deviceId: string): Promise<RealtimeDataEntry | null>;
  saveHistoricalData(deviceId: string, data: any): Promise<HistoricalDataEntry>;
  getHistoricalData(deviceId: string, startTime: Date, endTime: Date): Promise<HistoricalDataEntry[]>;
  findByIdAndUpdate(deviceId: string, updateData: any): Promise<DeviceData | null>;
}

export const storage: Storage;