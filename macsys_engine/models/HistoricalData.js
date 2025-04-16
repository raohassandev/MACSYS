import mongoose from 'mongoose';

const historicalSchema = new mongoose.Schema({
  device: String,
  timestamp: Date,
  data: mongoose.Schema.Types.Mixed,
});

export default mongoose.model('HistoricalData', historicalSchema);
