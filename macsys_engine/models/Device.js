import mongoose from 'mongoose';

const registerSchema = new mongoose.Schema({
  name: String,
  address: Number,
  length: Number,
});

const deviceSchema = new mongoose.Schema({
  name: String,
  ip: String,
  port: Number,
  slaveId: Number,
  registers: [registerSchema],
  enabled: Boolean,
});

export default mongoose.model('Device', deviceSchema);
