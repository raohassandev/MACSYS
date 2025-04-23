import mongoose, { Document, Schema } from 'mongoose';

export interface RealtimeDataDocument extends Document {
  device: string;
  timestamp: Date;
  data: Record<string, any>;
}

const realtimeSchema = new Schema<RealtimeDataDocument>({
  device: String,
  timestamp: Date,
  data: Schema.Types.Mixed,
});

export default mongoose.model<RealtimeDataDocument>('RealtimeData', realtimeSchema);