import mongoose from 'mongoose';

const realtimeSchema = new mongoose.Schema({
  device: String,
  timestamp: Date,
  data: mongoose.Schema.Types.Mixed,
});

export default mongoose.model('RealtimeData', realtimeSchema);
