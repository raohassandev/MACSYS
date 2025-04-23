import ModbusRTU from 'modbus-serial';
import { Device } from '../types/device.types.js';

// Define endian type
type EndianType = 'little' | 'big' | 'swap';

/**
 * Prepares a floating point value for Modbus transfer
 */
function prepareModbusFloat(value: number): number[] {
  // Convert to IEEE 754 float and return as array of two 16-bit values
  return float32ToBytes(value);
}

/**
 * Converts a float to bytes depending on endianness
 */
function float32ToBytes(num: number, endian: EndianType = 'little'): number[] {
  // Create a buffer
  const buffer = new ArrayBuffer(4);
  const view = new DataView(buffer);

  // Write the float
  view.setFloat32(0, num, endian === 'little');

  const bytes = new Uint8Array(buffer);

  // Convert to array of values
  if (endian === 'little') {
    // Little endian: LSB first
    return [
      (bytes[0] << 8) | bytes[1],
      (bytes[2] << 8) | bytes[3],
    ];
  } else if (endian === 'big') {
    // Big endian: MSB first
    return [
      (bytes[3] << 8) | bytes[2],
      (bytes[1] << 8) | bytes[0],
    ];
  } else if (endian === 'swap') {
    // Word swap
    return [
      (bytes[2] << 8) | bytes[3],
      (bytes[0] << 8) | bytes[1],
    ];
  }

  // Default to little endian
  return [
    (bytes[0] << 8) | bytes[1],
    (bytes[2] << 8) | bytes[3],
  ];
}

/**
 * Writes a value to a specific register of a Modbus device
 */
export async function writeToRegister(
  device: Device, 
  registerName: string, 
  value: number | number[]
): Promise<boolean> {
  if (!device || !registerName) {
    throw new Error('Device and register name must be provided');
  }

  // Create a new instance of ModbusRTU client
  const client = new ModbusRTU();
  
  try {
    // Connect to the device
    await client.connectTCP(device.ip, { port: device.port });
    client.setID(device.slaveId);

    // Find the register
    const register = device.registers.find((reg) => reg.name === registerName);
    
    if (!register) {
      throw new Error(`Register ${registerName} not found in device ${device.name}`);
    }

    // Write the value to the register
    if (Array.isArray(value)) {
      // If value is already an array of registers, write directly
      if (value.length !== register.length) {
        throw new Error(`Value array length (${value.length}) does not match register length (${register.length})`);
      }
      await client.writeRegisters(register.address, value);
    } else if (typeof value === 'number') {
      // If it's a single value
      if (register.length === 1) {
        // Single register
        await client.writeRegister(register.address, value);
      } else if (register.length === 2) {
        // Float value (2 registers)
        const floatValues = prepareModbusFloat(value);
        await client.writeRegisters(register.address, floatValues);
      } else {
        throw new Error(`Unsupported register length: ${register.length}`);
      }
    } else {
      throw new Error('Value must be a number or an array of numbers');
    }

    return true;
  } catch (error) {
    console.error(`Error writing to ${device.name}:`, (error as Error).message);
    return false;
  } finally {
    try {
      await client.close();
    } catch {
      // Ignore close errors
    }
  }
}