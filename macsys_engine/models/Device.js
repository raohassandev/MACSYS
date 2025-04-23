// import mongoose from 'mongoose';

// const registerSchema = new mongoose.Schema({
//   name: String,
//   address: Number,
//   length: Number,
//   scaleFactor: Number,
//   decimalPoint: Number,
// });

// const deviceSchema = new mongoose.Schema({
//   name: String,
//   ip: String,
//   port: Number,
//   slaveId: Number,
//   registers: [registerSchema],
//   enabled: Boolean,// For developers or configurators to enable or disable the device
//   control: {type: String,enum: ['central', 'local'], default: 'central'}, // To show the control type of the device either the AC should be follow the central provided setpoint or locally provided by remote control
//   status: {type: Boolean, default: false}// To show the current status of the device (on/off)
// });

// export default mongoose.model('Device', deviceSchema);



import mongoose from 'mongoose';

const registerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  address: Number,
  length: Number,
  scaleFactor: Number,
  decimalPoint: Number,
  byteOrder: String
});

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
      validator: function(registers) {
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
        if (register.name.toLowerCase() === 'setpoint') {
          register.name = 'Setpoint'; // Ensure consistent capitalization for Setpoint
        }
      }
    });
  }
  next();
});

const Device = mongoose.model('Device', deviceSchema);

export default Device;