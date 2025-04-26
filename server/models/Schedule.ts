import mongoose, { Document, Schema } from 'mongoose';

// Create the schedule schema
const ScheduleSchema = new Schema({
  deviceId: {
    type: String,
    required: true,
    ref: 'Device'
  },
  registerName: {
    type: String, 
    required: true
  },
  value: {
    type: Number,
    required: true
  },
  time: {
    type: String,
    required: true,
    validate: {
      validator: function(v: string) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: (props: any) => `${props.value} is not a valid time format! Use HH:MM format.`
    }
  },
  days: {
    type: [String],
    required: true,
    validate: {
      validator: function(v: string[]) {
        const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        return v.every(day => validDays.includes(day));
      },
      message: (props: any) => `${props.value} contains invalid day names!`
    }
  },
  enabled: {
    type: Boolean,
    default: true
  },
  description: {
    type: String
  }
}, { 
  timestamps: true 
});

// Create and export the Schedule model
const Schedule = mongoose.model('Schedule', ScheduleSchema);

export default Schedule;