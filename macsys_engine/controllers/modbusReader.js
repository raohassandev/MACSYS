import HistoricalData from '../models/HistoricalData.js';
import ModbusRTU from 'modbus-serial';
import RealtimeData from '../models/RealtimeData.js';

export async function readAndStore(devices, type = 'realtime') {
  for (const device of devices.filter((d) => d.enabled)) {
    const client = new ModbusRTU();
    try {
      await client.connectTCP(device.ip, { port: device.port });
      client.setID(device.slaveId);

      const data = {};
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
      console.error(`Error reading ${device.name}:`, err.message);
    } finally {
      try {
        await client.close();
      } catch {}
    }
  }
}
