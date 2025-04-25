import mongoose from 'mongoose';

const registerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['coil', 'holding', 'input', 'discrete']
  },
  dataType: {
    type: String,
    required: true,
    enum: ['float', 'integer', 'boolean']
  },
  unit: {
    type: String,
    default: ''
  },
  readOnly: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const deviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  ipAddress: {
    type: String,
    required: true,
    trim: true
  },
  port: {
    type: Number,
    required: true,
    default: 502
  },
  slaveId: {
    type: Number,
    required: true,
    default: 1
  },
  enabled: {
    type: Boolean,
    default: true
  },
  deviceType: {
    type: String,
    default: 'PLC'
  },
  description: {
    type: String,
    trim: true
  },
  registers: [registerSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save middleware to update the updatedAt field
deviceSchema.pre('findOneAndUpdate', function() {
  this.set({ updatedAt: new Date() });
});

export const Device = mongoose.model('Device', deviceSchema);