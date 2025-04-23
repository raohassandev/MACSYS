import mongoose, { Document, Schema } from 'mongoose';

export interface HistoricalDataDocument extends Document {
  device: string;
  timestamp: Date;
  data: Record<string, any>;
}

const historicalSchema = new Schema<HistoricalDataDocument>({
  device: String,
  timestamp: Date,
  data: Schema.Types.Mixed,
});

export default mongoose.model<HistoricalDataDocument>('HistoricalData', historicalSchema);