export interface Register {
  name: string;
  address: number;
  length: number;
  scaleFactor: number;
  decimalPoint: number;
  byteOrder: string;
}

export interface Device {
  _id: string;
  name: string;
  ip: string;
  port: number | string;
  slaveId: number;
  enabled: boolean;
  registers: Register[];
  setpoint: number;
  control: string
}

export interface DeviceData {
  _id: string;
  device: string; // This is the device name like "AC Room 1"
  timestamp: string; // ISO timestamp
  data: {
    [key: string]: number; // e.g., temperature, humidity, etc.
  };
  __v?: number;
}
