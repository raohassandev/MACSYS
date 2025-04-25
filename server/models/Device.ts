import mongoose from 'mongoose';

// Define the Register Schema
const registerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  address: Number,
  length: Number,
  dataType: String,
  byteOrder: String
});

// Define the Device Schema
const deviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  ip: {
    type: String,
    required: true
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
  registers: {
    type: [registerSchema],
    validate: {
      validator: function(registers: any[]) {
        // Check if there's at least one register with name "Setpoint" (case-insensitive)
        return registers.some(register => 
          register.name && register.name.toLowerCase() === 'setpoint'
        );
      },
      message: 'At least one register with the name "Setpoint" is required'
    }
  },
  enabled: {
    type: Boolean,
    default: true
  },
  control: {
    type: String,
    enum: ['central', 'local'],
    default: 'central'
  },
  status: {
    type: Boolean,
    default: false
  }
});

// Pre-save hook to ensure register names are properly formatted
deviceSchema.pre('save', function(next) {
  if (this.registers && this.registers.length > 0) {
    // Make sure register names are properly cased (first letter capital)
    this.registers.forEach(register => {
      if (register.name) {
        register.name = register.name.trim();
        // Special case for Setpoint
        if (register.name.toLowerCase() === 'setpoint') {
          register.name = 'Setpoint'; // ensure consistent capitalization for Setpoint
        }
      }
    });
  }
  next();
});

// Create and export the Device model
export default mongoose.model('Device', deviceSchema);