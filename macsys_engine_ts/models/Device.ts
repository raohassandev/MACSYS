import mongoose, { Document, Schema } from 'mongoose';
import { Device, Register } from '../types/device.types.js';

export interface DeviceDocument extends Device, Document {}

const registerSchema = new Schema<Register>({
  name: String,
  address: Number,
  length: Number,
});

const deviceSchema = new Schema<DeviceDocument>({
  name: String,
  ip: String,
  port: Number,
  slaveId: Number,
  registers: [registerSchema],
  enabled: Boolean,
});

export default mongoose.model<DeviceDocument>('Device', deviceSchema);