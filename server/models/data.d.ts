import { Model } from 'mongoose';

interface IRealtimeData {
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

interface IHistoricalData {
  deviceId: string;
  timestamp: Date;
  data: Record<string, any>;
  [key: string]: any;
}

export const RealtimeData: Model<IRealtimeData>;
export const HistoricalData: Model<IHistoricalData>;