import HistoricalData from '../models/HistoricalData.js';
import ModbusRTU from 'modbus-serial';
import RealtimeData from '../models/RealtimeData.js';

export async function readAndStore(devices, type = 'realtime') {
  const enabledDevices = devices.filter((d) => d.enabled);

  const client = new ModbusRTU();
  let isConnected = false;
  try {
    // Connect only once (assuming all devices are on the same PLC)
    try {
      const res = await client.connectTCP(enabledDevices[0].ip, {
        port: enabledDevices[0].port,
      });
      isConnected = true;
    } catch (error) {
      console.log('Connection Failed', error);
    }
    if (!isConnected) {
      console.log('Connection to the PLC failed.');
      return;
    }
    for (const device of enabledDevices) {
      try {
        client.setID(device.slaveId); // even if same, safe to repeat

        const data = {};
        for (const reg of device.registers) {
          const res = await client.readHoldingRegisters(
            reg.address,
            reg.length
          );
          data[reg.name] = res.data[0];
        }

        const payload = {
          device: device.name,
          timestamp: new Date(),
          data: data, //{ ...data, setpoint: device.setpoint, control: device.control },
        };

        if (type === 'realtime') {
          await RealtimeData.findOneAndUpdate(
            { device: device.name },
            payload,
            {
              upsert: true,
            }
          );
        } else {
          await HistoricalData.create(payload);
        }

        console.log(payload.device, 'Temp->',payload.data.temperature);
      } catch (err) {
        //FIXME: uncomment the modbus errors
        console.error(`Error reading ${device.name}:`, err.message);
      }
    }
  } catch (connectErr) {
    console.error('PLC connection failed:', connectErr.message);
  } finally {
    try {
      await client.close();
    } catch {}
  }
}
