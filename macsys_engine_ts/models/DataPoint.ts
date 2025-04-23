import mongoose, { Document, Schema } from 'mongoose';

export interface DataPointDocument extends Document {
  device: string;
  timestamp: Date;
  data: Record<string, any>;
}

const DataPointSchema = new Schema<DataPointDocument>({
  device: String,
  timestamp: { type: Date, default: Date.now },
  data: Schema.Types.Mixed,
});

const DataPoint = mongoose.model<DataPointDocument>('DataPoint', DataPointSchema);
export default DataPoint;