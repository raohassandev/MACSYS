import ModbusRTU from "modbus-serial";
import { Device, Register } from "@shared/schema";
import { storage } from "../storage";

/**
 * Reads data from a Modbus device
 * @param device The device to read from
 * @returns Object containing the read values or error
 */
export async function readFromDevice(device: Device): Promise<{ [key: string]: any } | null> {
  if (!device.enabled) {
    console.log(`Device ${device.name} is not enabled.`);
    return null;
  }

  const client = new ModbusRTU();
  let isConnected = false;
  
  try {
    // Connect to the device
    try {
      await client.connectTCP(device.ipAddress, {
        port: device.port,
      });
      isConnected = true;
    } catch (error) {
      console.log(`Connection failed`, error);
      return null;
    }

    if (!isConnected) {
      console.log(`Connection to the device failed.`);
      return null;
    }

    // Set the slave ID
    client.setID(device.slaveId);

    // Get registers for this device
    const registers = await storage.getRegistersForDevice(device.id);
    if (!registers || registers.length === 0) {
      console.log(`No registers defined for device ${device.name}`);
      return {};
    }

    // Read values for each register
    const data: { [key: string]: any } = {};
    
    for (const register of registers) {
      try {
        const value = await readRegister(client, register);
        data[register.name] = value;
      } catch (error) {
        console.error(`Error reading register ${register.name}:`, error);
        data[register.name] = null;
      }
    }

    return data;
  } catch (error) {
    console.error(`Error reading from device ${device.name}:`, error);
    return null;
  } finally {
    if (isConnected) {
      try {
        client.close();
      } catch (e) {
        console.error("Error closing Modbus connection", e);
      }
    }
  }
}

/**
 * Reads a value from a specific register
 * @param client The Modbus client
 * @param register The register to read
 * @returns The value read from the register
 */
async function readRegister(client: ModbusRTU, register: Register): Promise<any> {
  switch (register.type) {
    case 'coil':
      const coilResult = await client.readCoils(register.address, 1);
      return coilResult.data[0];
      
    case 'holding':
      if (register.dataType === 'float') {
        // Float values typically span two registers
        const holdingResult = await client.readHoldingRegisters(register.address, 2);
        return parseFloat32(holdingResult.data);
      } else if (register.dataType === 'integer') {
        const holdingResult = await client.readHoldingRegisters(register.address, 1);
        return holdingResult.data[0];
      } else if (register.dataType === 'boolean') {
        const holdingResult = await client.readHoldingRegisters(register.address, 1);
        return Boolean(holdingResult.data[0]);
      }
      break;
      
    case 'input':
      const inputResult = await client.readInputRegisters(register.address, 1);
      return inputResult.data[0];
      
    case 'discrete':
      const discreteResult = await client.readDiscreteInputs(register.address, 1);
      return discreteResult.data[0];
      
    default:
      throw new Error(`Unsupported register type: ${register.type}`);
  }
}

/**
 * Parses a 32-bit float from two 16-bit registers
 * @param data Array of two 16-bit values
 * @returns The parsed float value
 */
function parseFloat32(data: number[]): number {
  if (data.length !== 2) {
    throw new Error('Expected exactly 2 registers for float32 data');
  }
  
  const buffer = Buffer.alloc(4);
  buffer.writeUInt16BE(data[0], 0);
  buffer.writeUInt16BE(data[1], 2);
  
  return buffer.readFloatBE(0);
}

/**
 * Float32 to bytes converter
 */
export function Float32toBytes(value: number, endian: string = "big"): number[] {
  const buffer = Buffer.alloc(4);
  
  if (endian === "big") {
    buffer.writeFloatBE(value, 0);
  } else {
    buffer.writeFloatLE(value, 0);
  }
  
  // Convert buffer to array of 16-bit integers (Modbus registers)
  return [buffer.readUInt16BE(0), buffer.readUInt16BE(2)];
}
