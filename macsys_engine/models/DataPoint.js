import mongoose from 'mongoose';

const DataPointSchema = new mongoose.Schema({
  device: String,
  timestamp: { type: Date, default: Date.now },
  data: mongoose.Schema.Types.Mixed,
});

const DataPoint = mongoose.model('DataPoint', DataPointSchema);
export default DataPoint;
