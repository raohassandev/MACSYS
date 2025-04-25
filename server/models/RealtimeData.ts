import mongoose from 'mongoose';

const realtimeSchema = new mongoose.Schema({
  device: String,
  timestamp: Date,
  data: mongoose.Schema.Types.Mixed,
  status: Boolean,
  control: {
    type: String,
    enum: ['central', 'local'],
    default: 'central'
  }
});

export default mongoose.model('RealtimeData', realtimeSchema);