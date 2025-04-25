import mongoose from 'mongoose';

// Schema for realtime data
const realtimeDataSchema = new mongoose.Schema({
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  data: {
    type: Object,
    required: true
  },
  status: {
    type: Boolean,
    default: true
  },
  control: {
    type: Object,
    default: {
      type: 'local',
      source: 'local'
    }
  }
});

// Schema for historical data
const historicalDataSchema = new mongoose.Schema({
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  data: {
    type: Object,
    required: true
  }
});

// Index for timestamp to improve query performance
realtimeDataSchema.index({ timestamp: -1 });
historicalDataSchema.index({ timestamp: -1 });
historicalDataSchema.index({ deviceId: 1, timestamp: -1 });

export const RealtimeData = mongoose.model('RealtimeData', realtimeDataSchema);
export const HistoricalData = mongoose.model('HistoricalData', historicalDataSchema);