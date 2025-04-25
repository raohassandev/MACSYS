import { connectToDatabase } from "../server/db";
import { Device, RealtimeData, HistoricalData } from "../server/models";

async function seed() {
  try {
    console.log("Starting database seeding...");

    // Connect to MongoDB
    await connectToDatabase();

    // Create devices
    const devices = [
      {
        name: "PLC-001",
        ip: "192.168.1.100",
        port: 502,
        slaveId: 1,
        enabled: true,
        deviceType: "PLC",
        description: "Main production line PLC"
      },
      {
        name: "PLC-002",
        ip: "192.168.1.101",
        port: 502,
        slaveId: 1,
        enabled: false,
        deviceType: "PLC",
        description: "Secondary production line PLC"
      },
      {
        name: "RTU-001",
        ip: "192.168.1.102",
        port: 502,
        slaveId: 1,
        enabled: true,
        deviceType: "RTU",
        description: "Remote terminal unit 1"
      }
    ];

    // Check if devices already exist in MongoDB
    for (const deviceData of devices) {
      const existingDevice = await Device.findOne({ name: deviceData.name });
      
      if (!existingDevice) {
        console.log(`Adding device: ${deviceData.name}`);
        
        // Create a new device
        const device = new Device(deviceData);
        
        // Add registers for the device
        const registers = getRegistersForDevice(deviceData.name);
        if (registers.length > 0) {
          device.registers = registers;
        }
        
        // Save the device
        const savedDevice = await device.save();
        
        // If device is enabled, create sample data
        if (deviceData.enabled) {
          await createSampleData(savedDevice._id.toString(), savedDevice);
        }
      } else {
        console.log(`Device ${deviceData.name} already exists, skipping...`);
      }
    }

    console.log("Database seeding completed!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

function getRegistersForDevice(deviceName: string): any[] {
  let registers: any[] = [];

  // Define registers based on device name
  if (deviceName === "PLC-001") {
    registers = [
      {
        name: "Temperature",
        address: 40001,
        dataType: "float",
        byteOrder: "big",
        length: 2
      },
      {
        name: "Pressure",
        address: 40003,
        dataType: "float",
        byteOrder: "big",
        length: 2
      },
      {
        name: "Valve Position",
        address: 40005,
        dataType: "int",
        byteOrder: "big",
        length: 1
      },
      {
        name: "Pump Status",
        address: 1,
        dataType: "boolean",
        byteOrder: "big",
        length: 1
      },
      {
        name: "Alarm Status",
        address: 10001,
        dataType: "boolean",
        byteOrder: "big",
        length: 1
      }
    ];
  } else if (deviceName === "RTU-001") {
    registers = [
      {
        name: "Flow Rate",
        address: 40001,
        dataType: "float",
        byteOrder: "big",
        length: 2
      },
      {
        name: "Level",
        address: 40003,
        dataType: "int",
        byteOrder: "big",
        length: 1
      },
      {
        name: "Pump Speed",
        address: 40005,
        dataType: "int",
        byteOrder: "big",
        length: 1
      },
      {
        name: "Valve Position",
        address: 40007,
        dataType: "int",
        byteOrder: "big",
        length: 1
      }
    ];
  } else if (deviceName === "PLC-002") {
    registers = [
      {
        name: "Temperature",
        address: 40001,
        dataType: "float",
        byteOrder: "big",
        length: 2
      },
      {
        name: "Humidity",
        address: 40003,
        dataType: "float",
        byteOrder: "big",
        length: 2
      },
      {
        name: "Motor Speed",
        address: 40005,
        dataType: "int",
        byteOrder: "big",
        length: 1
      }
    ];
  }

  return registers;
}

async function createSampleData(deviceId: string, device: any) {
  // Create realtime data based on the device registers
  const realtimeData: Record<string, any> = {};
  
  if (device.registers && Array.isArray(device.registers)) {
    for (const register of device.registers) {
      if (register.dataType === "float") {
        if (register.name === "Temperature") {
          realtimeData[register.name] = 24.5;
        } else if (register.name === "Pressure") {
          realtimeData[register.name] = 3.2;
        } else if (register.name === "Flow Rate") {
          realtimeData[register.name] = 12.3;
        } else if (register.name === "Humidity") {
          realtimeData[register.name] = 45.7;
        } else {
          realtimeData[register.name] = parseFloat((Math.random() * 100).toFixed(1));
        }
      } else if (register.dataType === "int") {
        if (register.name === "Valve Position") {
          realtimeData[register.name] = 75;
        } else if (register.name === "Level") {
          realtimeData[register.name] = 78;
        } else if (register.name === "Motor Speed") {
          realtimeData[register.name] = 1200;
        } else {
          realtimeData[register.name] = Math.floor(Math.random() * 100);
        }
      } else if (register.dataType === "boolean") {
        if (register.name === "Pump Status") {
          realtimeData[register.name] = true;
        } else if (register.name === "Alarm Status") {
          realtimeData[register.name] = false;
        } else {
          realtimeData[register.name] = Math.random() > 0.5;
        }
      }
    }
  }

  // Insert realtime data
  console.log(`Adding realtime data for device ${device.name}`);
  const realtime = new RealtimeData({
    device: deviceId,
    timestamp: new Date(),
    data: realtimeData,
    status: true,
    control: 'central'
  });
  await realtime.save();

  // Create historical data (last 24 hours, one entry per hour)
  console.log(`Adding historical data for device ${device.name}`);
  const now = new Date();
  
  for (let i = 0; i < 24; i++) {
    const timestamp = new Date(now.getTime() - (i * 60 * 60 * 1000));
    const histData: Record<string, any> = {};
    
    if (device.registers && Array.isArray(device.registers)) {
      for (const register of device.registers) {
        if (register.dataType === "float") {
          if (register.name === "Temperature") {
            // Simulate a daily temperature curve
            const hourOfDay = timestamp.getHours();
            const baseTemp = 20;
            const amplitude = 6;
            const tempValue = baseTemp + amplitude * Math.sin((hourOfDay - 6) * Math.PI / 12);
            histData[register.name] = parseFloat(tempValue.toFixed(1));
          } else if (register.name === "Pressure") {
            histData[register.name] = parseFloat((3.0 + (Math.random() * 0.5)).toFixed(1));
          } else if (register.name === "Flow Rate") {
            histData[register.name] = parseFloat((10.0 + (Math.random() * 5.0)).toFixed(1));
          } else if (register.name === "Humidity") {
            histData[register.name] = parseFloat((40.0 + (Math.random() * 10.0)).toFixed(1));
          } else {
            histData[register.name] = parseFloat((Math.random() * 100).toFixed(1));
          }
        } else if (register.dataType === "int") {
          if (register.name === "Valve Position") {
            histData[register.name] = 70 + Math.floor(Math.random() * 10);
          } else if (register.name === "Level") {
            histData[register.name] = 75 + Math.floor(Math.random() * 10);
          } else if (register.name === "Motor Speed") {
            histData[register.name] = 1150 + Math.floor(Math.random() * 100);
          } else {
            histData[register.name] = Math.floor(Math.random() * 100);
          }
        } else if (register.dataType === "boolean") {
          if (register.name === "Pump Status") {
            histData[register.name] = Math.random() > 0.2;
          } else if (register.name === "Alarm Status") {
            histData[register.name] = Math.random() > 0.9;
          } else {
            histData[register.name] = Math.random() > 0.5;
          }
        }
      }
    }
    
    const historical = new HistoricalData({
      device: deviceId,
      timestamp: timestamp,
      data: histData
    });
    
    await historical.save();
  }
}

// Execute the seed function
seed().then(() => {
  console.log("Seed process completed");
}).catch(err => {
  console.error("Seed process error:", err);
});
