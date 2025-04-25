import ModbusRTU from "modbus-serial";
import { storage } from "../storage";

/**
 * Reads data from a Modbus device
 * @param device The device to read from
 * @returns Object containing the read values or error
 */
export async function readFromDevice(device: any): Promise<{ [key: string]: any } | null> {
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
async function readRegister(client: ModbusRTU, register: any): Promise<any> {
  // Default register type is 'holding' if not specified
  const registerType = register.type || 'holding';
  const registerLength = register.length || 1;
  const byteOrder = register.byteOrder || 'big';
  
  try {
    switch (registerType) {
      case 'coil':
        const coilResult = await client.readCoils(register.address, 1);
        return coilResult.data[0];
        
      case 'holding':
        if (register.dataType === 'float') {
          // Float values typically span two registers
          const holdingResult = await client.readHoldingRegisters(register.address, registerLength);
          return parseFloat32(holdingResult.data, byteOrder);
        } else if (register.dataType === 'integer' || register.dataType === 'int') {
          const holdingResult = await client.readHoldingRegisters(register.address, 1);
          return holdingResult.data[0];
        } else if (register.dataType === 'boolean' || register.dataType === 'bool') {
          const holdingResult = await client.readHoldingRegisters(register.address, 1);
          return Boolean(holdingResult.data[0]);
        } else {
          // If dataType is not specified, default to reading raw register value
          const holdingResult = await client.readHoldingRegisters(register.address, registerLength);
          
          // If length is 2, assume it might be a float
          if (registerLength === 2) {
            return parseFloat32(holdingResult.data, byteOrder);
          } else {
            return holdingResult.data[0];
          }
        }
        
      case 'input':
        const inputResult = await client.readInputRegisters(register.address, registerLength);
        if (registerLength === 2 && register.dataType === 'float') {
          return parseFloat32(inputResult.data, byteOrder);
        }
        return inputResult.data[0];
        
      case 'discrete':
        const discreteResult = await client.readDiscreteInputs(register.address, 1);
        return discreteResult.data[0];
        
      default:
        // If no specific type, default to reading holding registers
        const result = await client.readHoldingRegisters(register.address, registerLength);
        if (registerLength === 2 && (register.dataType === 'float' || !register.dataType)) {
          return parseFloat32(result.data, byteOrder);
        }
        return result.data[0];
    }
  } catch (error) {
    console.error(`Error reading register ${register.name} at address ${register.address}:`, error);
    throw error;
  }
}

/**
 * Parses a 32-bit float from two 16-bit registers
 * @param data Array of two 16-bit values
 * @param byteOrder Byte order format (default: "big", also supports "little" and "AB CD")
 * @returns The parsed float value
 */
function parseFloat32(data: number[], byteOrder: string = "big"): number {
  if (data.length !== 2) {
    throw new Error('Expected exactly 2 registers for float32 data');
  }
  
  const buffer = Buffer.alloc(4);
  
  if (byteOrder === "AB CD") {
    // AB CD format: First register contains the most significant word (bytes AB)
    // Second register contains the least significant word (bytes CD)
    buffer.writeUInt16BE(data[0], 0); // AB goes to positions 0,1
    buffer.writeUInt16BE(data[1], 2); // CD goes to positions 2,3
    return buffer.readFloatBE(0);
  } else if (byteOrder === "CD AB") {
    // CD AB format: First register contains the least significant word (bytes CD)
    // Second register contains the most significant word (bytes AB)
    buffer.writeUInt16BE(data[1], 0); // AB goes to positions 0,1
    buffer.writeUInt16BE(data[0], 2); // CD goes to positions 2,3
    return buffer.readFloatBE(0);
  } else if (byteOrder === "BA DC") {
    // BA DC format: First register contains the most significant word with bytes swapped
    // Second register contains the least significant word with bytes swapped
    const reg1 = ((data[0] & 0xFF) << 8) | ((data[0] & 0xFF00) >> 8);
    const reg2 = ((data[1] & 0xFF) << 8) | ((data[1] & 0xFF00) >> 8);
    buffer.writeUInt16BE(reg1, 0);
    buffer.writeUInt16BE(reg2, 2);
    return buffer.readFloatBE(0);
  } else if (byteOrder === "DC BA") {
    // DC BA format: First register contains the least significant word with bytes swapped
    // Second register contains the most significant word with bytes swapped
    const reg1 = ((data[1] & 0xFF) << 8) | ((data[1] & 0xFF00) >> 8);
    const reg2 = ((data[0] & 0xFF) << 8) | ((data[0] & 0xFF00) >> 8);
    buffer.writeUInt16BE(reg1, 0);
    buffer.writeUInt16BE(reg2, 2);
    return buffer.readFloatBE(0);
  } else if (byteOrder === "little") {
    // Little endian format (DCBA)
    buffer.writeUInt16LE(data[0], 0);
    buffer.writeUInt16LE(data[1], 2);
    return buffer.readFloatLE(0);
  } else {
    // Default: Big endian format (ABCD)
    buffer.writeUInt16BE(data[0], 0);
    buffer.writeUInt16BE(data[1], 2);
    return buffer.readFloatBE(0);
  }
}

/**
 * Float32 to bytes converter
 * @param value The float value to convert
 * @param byteOrder Byte order format (default: "big", also supports "little" and "AB CD")
 * @returns Array of two 16-bit integers (Modbus registers)
 */
export function Float32toBytes(value: number, byteOrder: string = "big"): number[] {
  const buffer = Buffer.alloc(4);
  
  if (byteOrder === "AB CD" || byteOrder === "big") {
    buffer.writeFloatBE(value, 0);
    return [buffer.readUInt16BE(0), buffer.readUInt16BE(2)];
  } else if (byteOrder === "CD AB") {
    buffer.writeFloatBE(value, 0);
    return [buffer.readUInt16BE(2), buffer.readUInt16BE(0)];
  } else if (byteOrder === "BA DC") {
    buffer.writeFloatBE(value, 0);
    const reg1 = buffer.readUInt16BE(0);
    const reg2 = buffer.readUInt16BE(2);
    return [
      ((reg1 & 0xFF) << 8) | ((reg1 & 0xFF00) >> 8),
      ((reg2 & 0xFF) << 8) | ((reg2 & 0xFF00) >> 8)
    ];
  } else if (byteOrder === "DC BA") {
    buffer.writeFloatBE(value, 0);
    const reg1 = buffer.readUInt16BE(0);
    const reg2 = buffer.readUInt16BE(2);
    return [
      ((reg2 & 0xFF) << 8) | ((reg2 & 0xFF00) >> 8),
      ((reg1 & 0xFF) << 8) | ((reg1 & 0xFF00) >> 8)
    ];
  } else if (byteOrder === "little") {
    buffer.writeFloatLE(value, 0);
    return [buffer.readUInt16LE(0), buffer.readUInt16LE(2)];
  } else {
    // Default to big endian
    buffer.writeFloatBE(value, 0);
    return [buffer.readUInt16BE(0), buffer.readUInt16BE(2)];
  }
}
