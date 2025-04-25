import { Document } from 'mongoose';

export interface IRegister {
  name: string;
  address: number;
  length?: number;
  dataType?: string;
  byteOrder?: string;
}

export interface IDevice extends Document {
  name: string;
  ip: string;
  port: number;
  slaveId: number;
  registers: IRegister[];
  enabled: boolean;
  control: 'central' | 'local';
  status: boolean;
}

export interface IRealtimeData extends Document {
  device: string;
  timestamp: Date;
  data: Record<string, any>;
  status: boolean;
  control?: 'central' | 'local';
}

export interface IHistoricalData extends Document {
  device: string;
  timestamp: Date;
  data: Record<string, any>;
}