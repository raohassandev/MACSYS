import { db } from "./index";
import * as schema from "@shared/schema";
import { eq } from "drizzle-orm";

async function seed() {
  try {
    console.log("Starting database seeding...");

    // Create devices
    const devices = [
      {
        name: "PLC-001",
        ipAddress: "192.168.1.100",
        port: 502,
        slaveId: 1,
        enabled: true,
        deviceType: "PLC",
        description: "Main production line PLC"
      },
      {
        name: "PLC-002",
        ipAddress: "192.168.1.101",
        port: 502,
        slaveId: 1,
        enabled: false,
        deviceType: "PLC",
        description: "Secondary production line PLC"
      },
      {
        name: "RTU-001",
        ipAddress: "192.168.1.102",
        port: 502,
        slaveId: 1,
        enabled: true,
        deviceType: "RTU",
        description: "Remote terminal unit 1"
      }
    ];

    // Check if devices already exist
    const existingDevices = await db.query.devices.findMany();
    const existingDeviceNames = existingDevices.map(d => d.name);

    // Insert devices that don't already exist
    for (const device of devices) {
      if (!existingDeviceNames.includes(device.name)) {
        console.log(`Adding device: ${device.name}`);
        const [newDevice] = await db.insert(schema.devices).values(device).returning();
        
        // Create registers for this device
        await createRegistersForDevice(newDevice.id, device.name);
        
        // Create some sample data for enabled devices
        if (device.enabled) {
          await createSampleData(newDevice.id);
        }
      } else {
        console.log(`Device ${device.name} already exists, skipping...`);
      }
    }

    console.log("Database seeding completed!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

async function createRegistersForDevice(deviceId: number, deviceName: string) {
  let registers: any[] = [];

  // Define registers based on device name
  if (deviceName === "PLC-001") {
    registers = [
      {
        deviceId,
        name: "Temperature",
        address: 40001,
        type: "holding",
        dataType: "float",
        unit: "°C",
        readOnly: false
      },
      {
        deviceId,
        name: "Pressure",
        address: 40003,
        type: "holding",
        dataType: "float",
        unit: "bar",
        readOnly: false
      },
      {
        deviceId,
        name: "Valve Position",
        address: 40005,
        type: "holding",
        dataType: "integer",
        unit: "%",
        readOnly: false
      },
      {
        deviceId,
        name: "Pump Status",
        address: 1,
        type: "coil",
        dataType: "boolean",
        unit: "",
        readOnly: false
      },
      {
        deviceId,
        name: "Alarm Status",
        address: 10001,
        type: "discrete",
        dataType: "boolean",
        unit: "",
        readOnly: true
      }
    ];
  } else if (deviceName === "RTU-001") {
    registers = [
      {
        deviceId,
        name: "Flow Rate",
        address: 40001,
        type: "holding",
        dataType: "float",
        unit: "L/m",
        readOnly: false
      },
      {
        deviceId,
        name: "Level",
        address: 40003,
        type: "holding",
        dataType: "integer",
        unit: "%",
        readOnly: false
      },
      {
        deviceId,
        name: "Pump Speed",
        address: 40005,
        type: "holding",
        dataType: "integer",
        unit: "RPM",
        readOnly: false
      },
      {
        deviceId,
        name: "Valve Position",
        address: 40007,
        type: "holding",
        dataType: "integer",
        unit: "%",
        readOnly: false
      }
    ];
  } else if (deviceName === "PLC-002") {
    registers = [
      {
        deviceId,
        name: "Temperature",
        address: 40001,
        type: "holding",
        dataType: "float",
        unit: "°C",
        readOnly: false
      },
      {
        deviceId,
        name: "Humidity",
        address: 40003,
        type: "holding",
        dataType: "float",
        unit: "%",
        readOnly: false
      },
      {
        deviceId,
        name: "Motor Speed",
        address: 40005,
        type: "holding",
        dataType: "integer",
        unit: "RPM",
        readOnly: false
      }
    ];
  }

  // Insert registers
  console.log(`Adding ${registers.length} registers for device ${deviceName}`);
  for (const register of registers) {
    await db.insert(schema.registers).values(register);
  }
}

async function createSampleData(deviceId: number) {
  // Get the device
  const device = await db.query.devices.findFirst({
    where: eq(schema.devices.id, deviceId),
    with: { registers: true }
  });

  if (!device) return;

  // Create realtime data based on the device registers
  const realtimeData: Record<string, any> = {};
  
  for (const register of device.registers) {
    if (register.dataType === "float") {
      if (register.name === "Temperature") {
        realtimeData[register.name] = "24.5" + (register.unit || "");
      } else if (register.name === "Pressure") {
        realtimeData[register.name] = "3.2" + (register.unit || "");
      } else if (register.name === "Flow Rate") {
        realtimeData[register.name] = "12.3" + (register.unit || "");
      } else if (register.name === "Humidity") {
        realtimeData[register.name] = "45.7" + (register.unit || "");
      } else {
        realtimeData[register.name] = (Math.random() * 100).toFixed(1) + (register.unit || "");
      }
    } else if (register.dataType === "integer") {
      if (register.name === "Valve Position") {
        realtimeData[register.name] = "75" + (register.unit || "");
      } else if (register.name === "Level") {
        realtimeData[register.name] = "78" + (register.unit || "");
      } else if (register.name === "Motor Speed") {
        realtimeData[register.name] = "1200" + (register.unit || "");
      } else {
        realtimeData[register.name] = Math.floor(Math.random() * 100) + (register.unit || "");
      }
    } else if (register.dataType === "boolean") {
      if (register.name === "Pump Status") {
        realtimeData[register.name] = "ON";
      } else if (register.name === "Alarm Status") {
        realtimeData[register.name] = "OFF";
      } else {
        realtimeData[register.name] = Math.random() > 0.5 ? "ON" : "OFF";
      }
    }
  }

  // Insert realtime data
  console.log(`Adding realtime data for device ${device.name}`);
  await db.insert(schema.realtimeData).values({
    deviceId,
    timestamp: new Date(),
    data: realtimeData,
    status: true,
    control: { type: "local", source: "local" }
  });

  // Create historical data (last 24 hours, one entry per hour)
  console.log(`Adding historical data for device ${device.name}`);
  const now = new Date();
  
  for (let i = 0; i < 24; i++) {
    const timestamp = new Date(now.getTime() - (i * 60 * 60 * 1000));
    const histData: Record<string, any> = {};
    
    for (const register of device.registers) {
      if (register.dataType === "float") {
        if (register.name === "Temperature") {
          // Simulate a daily temperature curve
          const hourOfDay = timestamp.getHours();
          const baseTemp = 20;
          const amplitude = 6;
          const tempValue = baseTemp + amplitude * Math.sin((hourOfDay - 6) * Math.PI / 12);
          histData[register.name] = tempValue.toFixed(1) + (register.unit || "");
        } else if (register.name === "Pressure") {
          histData[register.name] = (3.0 + (Math.random() * 0.5)).toFixed(1) + (register.unit || "");
        } else if (register.name === "Flow Rate") {
          histData[register.name] = (10.0 + (Math.random() * 5.0)).toFixed(1) + (register.unit || "");
        } else if (register.name === "Humidity") {
          histData[register.name] = (40.0 + (Math.random() * 10.0)).toFixed(1) + (register.unit || "");
        } else {
          histData[register.name] = (Math.random() * 100).toFixed(1) + (register.unit || "");
        }
      } else if (register.dataType === "integer") {
        if (register.name === "Valve Position") {
          histData[register.name] = (70 + Math.floor(Math.random() * 10)) + (register.unit || "");
        } else if (register.name === "Level") {
          histData[register.name] = (75 + Math.floor(Math.random() * 10)) + (register.unit || "");
        } else if (register.name === "Motor Speed") {
          histData[register.name] = (1150 + Math.floor(Math.random() * 100)) + (register.unit || "");
        } else {
          histData[register.name] = Math.floor(Math.random() * 100) + (register.unit || "");
        }
      } else if (register.dataType === "boolean") {
        if (register.name === "Pump Status") {
          histData[register.name] = Math.random() > 0.2 ? "ON" : "OFF";
        } else if (register.name === "Alarm Status") {
          histData[register.name] = Math.random() > 0.9 ? "ON" : "OFF";
        } else {
          histData[register.name] = Math.random() > 0.5 ? "ON" : "OFF";
        }
      }
    }
    
    await db.insert(schema.historicalData).values({
      deviceId,
      timestamp,
      data: histData
    });
  }
}

seed();
