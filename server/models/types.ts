import { Document } from 'mongoose';

export interface IRegister {
  name: string;
  address: number;
  length?: number;
  scaleFactor?: number;
  decimalPoint?: number;
  dataType?: string;
  byteOrder?: string;
}

// MongoDB flexible register type to handle what comes from the database
export interface MongoRegister {
  name: string;
  address?: number | null | undefined;
  length?: number | null | undefined;
  scaleFactor?: number | null | undefined;
  decimalPoint?: number | null | undefined;
  dataType?: string | null | undefined;
  byteOrder?: string | null | undefined;
  _id?: string | any; // Allow ObjectId or string
}

export interface IDevice extends Document {
  name: string;
  ip: string;
  ipAddress?: string; // Allow both ip and ipAddress for backwards compatibility
  port: number;
  slaveId: number;
  registers: IRegister[] | MongoRegister[];
  enabled: boolean;
  control: 'central' | 'local';
  status: boolean;
}

export interface IRealtimeData extends Document {
  device?: string | null | undefined;
  timestamp?: Date | null | undefined;
  data: Record<string, any>;
  status?: boolean | null | undefined;
  control?: 'central' | 'local';
}

export interface IHistoricalData extends Document {
  device?: string | null | undefined;
  timestamp?: Date | null | undefined;
  data: Record<string, any>;
}