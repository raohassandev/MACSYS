import { connectToDatabase } from './db.js';
import { Device } from './models/device.js';
import { RealtimeData, HistoricalData } from './models/data.js';

async function seed() {
  try {
    console.log('Starting database seeding...');
    
    // Connect to MongoDB
    await connectToDatabase();
    
    // Clear existing data (optional)
    // await Device.deleteMany({});
    // await RealtimeData.deleteMany({});
    // await HistoricalData.deleteMany({});
    
    // Create devices
    const devices = [
      {
        name: 'PLC-001',
        ipAddress: '192.168.1.100',
        port: 502,
        slaveId: 1,
        enabled: true,
        deviceType: 'PLC',
        description: 'Main production line PLC',
        registers: [
          {
            name: 'Temperature',
            address: 40001,
            type: 'holding',
            dataType: 'float',
            unit: '°C',
            readOnly: false
          },
          {
            name: 'Pressure',
            address: 40003,
            type: 'holding',
            dataType: 'float',
            unit: 'bar',
            readOnly: false
          },
          {
            name: 'Valve Position',
            address: 40005,
            type: 'holding',
            dataType: 'integer',
            unit: '%',
            readOnly: false
          },
          {
            name: 'Pump Status',
            address: 1,
            type: 'coil',
            dataType: 'boolean',
            unit: '',
            readOnly: false
          },
          {
            name: 'Alarm Status',
            address: 10001,
            type: 'discrete',
            dataType: 'boolean',
            unit: '',
            readOnly: true
          }
        ]
      },
      {
        name: 'PLC-002',
        ipAddress: '192.168.1.101',
        port: 502,
        slaveId: 1,
        enabled: false,
        deviceType: 'PLC',
        description: 'Secondary production line PLC',
        registers: [
          {
            name: 'Temperature',
            address: 40001,
            type: 'holding',
            dataType: 'float',
            unit: '°C',
            readOnly: false
          },
          {
            name: 'Humidity',
            address: 40003,
            type: 'holding',
            dataType: 'float',
            unit: '%',
            readOnly: false
          },
          {
            name: 'Motor Speed',
            address: 40005,
            type: 'holding',
            dataType: 'integer',
            unit: 'RPM',
            readOnly: false
          }
        ]
      },
      {
        name: 'RTU-001',
        ipAddress: '192.168.1.102',
        port: 502,
        slaveId: 1,
        enabled: true,
        deviceType: 'RTU',
        description: 'Remote terminal unit 1',
        registers: [
          {
            name: 'Flow Rate',
            address: 40001,
            type: 'holding',
            dataType: 'float',
            unit: 'L/m',
            readOnly: false
          },
          {
            name: 'Level',
            address: 40003,
            type: 'holding',
            dataType: 'integer',
            unit: '%',
            readOnly: false
          },
          {
            name: 'Pump Speed',
            address: 40005,
            type: 'holding',
            dataType: 'integer',
            unit: 'RPM',
            readOnly: false
          },
          {
            name: 'Valve Position',
            address: 40007,
            type: 'holding',
            dataType: 'integer',
            unit: '%',
            readOnly: false
          }
        ]
      }
    ];
    
    // Check if devices already exist
    for (const deviceData of devices) {
      const existingDevice = await Device.findOne({ name: deviceData.name });
      
      if (!existingDevice) {
        console.log(`Adding device: ${deviceData.name}`);
        
        // Create the device
        const device = new Device(deviceData);
        await device.save();
        
        // Create sample data for enabled devices
        if (deviceData.enabled) {
          await createSampleData(device._id, deviceData);
        }
      } else {
        console.log(`Device ${deviceData.name} already exists, skipping...`);
      }
    }
    
    console.log('Database seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

async function createSampleData(deviceId, deviceData) {
  // Create realtime data
  const realtimeData = {};
  
  for (const register of deviceData.registers) {
    if (register.dataType === 'float') {
      if (register.name === 'Temperature') {
        realtimeData[register.name] = '24.5' + (register.unit || '');
      } else if (register.name === 'Pressure') {
        realtimeData[register.name] = '3.2' + (register.unit || '');
      } else if (register.name === 'Flow Rate') {
        realtimeData[register.name] = '12.3' + (register.unit || '');
      } else if (register.name === 'Humidity') {
        realtimeData[register.name] = '45.7' + (register.unit || '');
      } else {
        realtimeData[register.name] = (Math.random() * 100).toFixed(1) + (register.unit || '');
      }
    } else if (register.dataType === 'integer') {
      if (register.name === 'Valve Position') {
        realtimeData[register.name] = '75' + (register.unit || '');
      } else if (register.name === 'Level') {
        realtimeData[register.name] = '78' + (register.unit || '');
      } else if (register.name === 'Motor Speed') {
        realtimeData[register.name] = '1200' + (register.unit || '');
      } else {
        realtimeData[register.name] = Math.floor(Math.random() * 100) + (register.unit || '');
      }
    } else if (register.dataType === 'boolean') {
      if (register.name === 'Pump Status') {
        realtimeData[register.name] = 'ON';
      } else if (register.name === 'Alarm Status') {
        realtimeData[register.name] = 'OFF';
      } else {
        realtimeData[register.name] = Math.random() > 0.5 ? 'ON' : 'OFF';
      }
    }
  }
  
  // Insert realtime data
  console.log(`Adding realtime data for device ${deviceData.name}`);
  const newRealtimeData = new RealtimeData({
    deviceId,
    timestamp: new Date(),
    data: realtimeData,
    status: true,
    control: { type: 'local', source: 'local' }
  });
  await newRealtimeData.save();
  
  // Create historical data (last 24 hours, one entry per hour)
  console.log(`Adding historical data for device ${deviceData.name}`);
  const now = new Date();
  
  for (let i = 0; i < 24; i++) {
    const timestamp = new Date(now.getTime() - (i * 60 * 60 * 1000));
    const histData = {};
    
    for (const register of deviceData.registers) {
      if (register.dataType === 'float') {
        if (register.name === 'Temperature') {
          // Simulate a daily temperature curve
          const hourOfDay = timestamp.getHours();
          const baseTemp = 20;
          const amplitude = 6;
          const tempValue = baseTemp + amplitude * Math.sin((hourOfDay - 6) * Math.PI / 12);
          histData[register.name] = tempValue.toFixed(1) + (register.unit || '');
        } else if (register.name === 'Pressure') {
          histData[register.name] = (3.0 + (Math.random() * 0.5)).toFixed(1) + (register.unit || '');
        } else if (register.name === 'Flow Rate') {
          histData[register.name] = (10.0 + (Math.random() * 5.0)).toFixed(1) + (register.unit || '');
        } else if (register.name === 'Humidity') {
          histData[register.name] = (40.0 + (Math.random() * 10.0)).toFixed(1) + (register.unit || '');
        } else {
          histData[register.name] = (Math.random() * 100).toFixed(1) + (register.unit || '');
        }
      } else if (register.dataType === 'integer') {
        if (register.name === 'Valve Position') {
          histData[register.name] = (70 + Math.floor(Math.random() * 10)) + (register.unit || '');
        } else if (register.name === 'Level') {
          histData[register.name] = (75 + Math.floor(Math.random() * 10)) + (register.unit || '');
        } else if (register.name === 'Motor Speed') {
          histData[register.name] = (1150 + Math.floor(Math.random() * 100)) + (register.unit || '');
        } else {
          histData[register.name] = Math.floor(Math.random() * 100) + (register.unit || '');
        }
      } else if (register.dataType === 'boolean') {
        if (register.name === 'Pump Status') {
          histData[register.name] = Math.random() > 0.2 ? 'ON' : 'OFF';
        } else if (register.name === 'Alarm Status') {
          histData[register.name] = Math.random() > 0.9 ? 'ON' : 'OFF';
        } else {
          histData[register.name] = Math.random() > 0.5 ? 'ON' : 'OFF';
        }
      }
    }
    
    const newHistoricalData = new HistoricalData({
      deviceId,
      timestamp,
      data: histData
    });
    await newHistoricalData.save();
  }
}

// Run the seed function
seed();