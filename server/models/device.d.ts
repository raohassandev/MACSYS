import { Model } from 'mongoose';

interface IRegister {
  name: string;
  address: number;
  type: string;
  dataType: string;
  unit: string;
  readOnly: boolean;
  [key: string]: any;
}

interface IDevice {
  name: string;
  ipAddress: string;
  port: number;
  slaveId: number;
  enabled: boolean;
  deviceType: string;
  description: string;
  registers: IRegister[];
  [key: string]: any;
}

export const Device: Model<IDevice>;