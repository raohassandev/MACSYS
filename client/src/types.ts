// Define types for client components to use

export interface Register {
  id?: string;
  name: string;
  address: number;
  length?: number;
  dataType?: string;
  unit?: string;
  readOnly?: boolean;
  byteOrder?: string;
}

export interface Device {
  id: string;
  name: string;
  ipAddress: string;
  port: number;
  slaveId: number;
  enabled: boolean;
  deviceType: string;
  description?: string;
  registers?: Register[];
  status?: boolean;
  control?: 'central' | 'local';
}

export interface RealtimeData {
  id?: string;
  deviceId: string;
  timestamp: string;
  data: Record<string, any>;
  status: boolean;
  control?: {
    type: string;
    source: string;
  };
}

export interface HistoricalData {
  id?: string;
  deviceId: string;
  timestamp: string;
  data: Record<string, any>;
}

export enum DeviceStatus {
  ONLINE = "online",
  OFFLINE = "offline",
  ERROR = "error",
}