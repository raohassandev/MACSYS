import ModbusRTU from 'modbus-serial';
import { Device } from '../types/device.types.js';
import HistoricalData from '../models/HistoricalData.js';
import RealtimeData from '../models/RealtimeData.js';

type DataType = 'realtime' | 'historical';

export async function readAndStore(devices: Device[], type: DataType = 'realtime'): Promise<void> {
  for (const device of devices.filter((d) => d.enabled)) {
    // Create a new instance of ModbusRTU client
    const client = new ModbusRTU();
    
    try {
      await client.connectTCP(device.ip, { port: device.port });
      client.setID(device.slaveId);

      const data: Record<string, number> = {};
      for (const reg of device.registers) {
        const res = await client.readHoldingRegisters(reg.address, reg.length);
        data[reg.name] = res.data[0];
      }

      const payload = {
        device: device.name,
        timestamp: new Date(),
        data,
      };

      if (type === 'realtime') {
        await RealtimeData.findOneAndUpdate({ device: device.name }, payload, {
          upsert: true,
        });
      } else {
        await HistoricalData.create(payload);
      }
    } catch (err) {
      console.error(`Error reading ${device.name}:`, (err as Error).message);
    } finally {
      try {
        await client.close();
      } catch (error) {
        // Ignore close errors
      }
    }
  }
}