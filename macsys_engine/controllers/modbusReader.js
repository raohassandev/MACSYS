import HistoricalData from '../models/HistoricalData.js';
import ModbusRTU from 'modbus-serial';
import RealtimeData from '../models/RealtimeData.js';

//for swapping bytes
function parseModbusFloat(data) {
  if (!Array.isArray(data) || data.length < 2) {
    throw new Error('Need at least 2 registers for float');
  }

  const reg1 = data[0];
  const reg2 = data[1];

  const byteA = (reg1 >> 8) & 0xFF;
  const byteB = reg1 & 0xFF;
  const byteC = (reg2 >> 8) & 0xFF;
  const byteD = reg2 & 0xFF;

  // Byte-swapped float: B, A, D, C
  const buffer = Buffer.from([byteB, byteA, byteD, byteC]);

  return buffer.readFloatBE(); // or readFloatLE() depending on device
}



export async function readAndStore(devices, type = 'realtime') {
  const enabledDevices = devices.filter((d) => d.enabled);

  // console.log(devices[0]);

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
      isConnected = false;
      console.log('Connection Failed', error);
    }
    if (!isConnected) {
      console.log('Connection to the PLC failed.');
      return;
    }
    for (const device of enabledDevices) {
      // console.log(device.registers);
      try {
        client.setID(device.slaveId); // even if same, safe to repeat

        const data = {};
        for (const reg of device.registers) {
          const res = await client.readHoldingRegisters(
            reg.address,
            reg.length
          );
          const decimalPoint = reg.decimalPoint
          data[reg.name] = (res.buffer.readFloatBE()).toFixed(decimalPoint); // Assuming the data is in float format
         
        }
        const payload = {
          device: device.name,
          timestamp: new Date(),
          data: data,
          status: device.status,
          control: device.control,
        };
        // console.log("payload is", payload);
       

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

        console.log(payload.device, 'Temp->', payload.data.temperature);
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
    } catch { }
  }
}
