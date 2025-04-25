import ModbusRTU from "modbus-serial";
import { Device } from "@shared/schema";
import { Float32toBytes } from "./float32Bytes";

/**
 * Writes a value to a register on a Modbus device
 * @param device The device to write to
 * @param registerName The name of the register
 * @param value The value to write
 * @returns true if successful, false otherwise
 */
export async function writeToRegister(device: Device, registerName: string, value: number | string): Promise<boolean> {
  if (!device.enabled) {
    console.log(`Device ${device.name} is not enabled.`);
    return false;
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
      return false;
    }

    if (!isConnected) {
      console.log(`Connection to the PLC failed.`);
      return false;
    }

    console.log(registerName);

    // Find the register by name
    const register = await findRegisterByAddress(registerName);
    
    if (!register) {
      console.error(`Register ${registerName} not found for device ${device.name}`);
      return false;
    }

    console.log(register);

    // Set the slave ID
    client.setID(device.slaveId);

    // For float values (assuming most values are floats)
    if (register.length === 2) {
      // Convert the float value to the correct format for Modbus
      const registers = Float32toBytes(value as number, "big");
      
      // Write the registers
      await client.writeRegisters(register.address, registers);
      
      console.log(`Successfully wrote value ${value} to ${registerName} on device ${device.name}`);
      return true;
    } 
    // For integer values (single register)
    else if (register.length === 1) {
      await client.writeRegister(register.address, parseInt(value as string, 10));
      
      console.log(`Successfully wrote value ${value} to ${registerName} on device ${device.name}`);
      return true;
    }
    else {
      console.error(`Unsupported register length: ${register.length}`);
      return false;
    }
  } catch (error) {
    console.error(`Error writing to ${registerName}`, error.message);
    return false;
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

// Mock function to find register by address since we don't have the full context
// In a real implementation, this would query the database
async function findRegisterByAddress(registerName: string): Promise<{ address: number; length: number } | null> {
  // This is a mock implementation
  const registerMap: Record<string, { address: number; length: number }> = {
    "Temperature": { address: 40001, length: 2 },
    "Pressure": { address: 40003, length: 2 },
    "Valve Position": { address: 40005, length: 1 },
    "Pump Status": { address: 1, length: 1 },
    "Flow Rate": { address: 40007, length: 2 },
    "Level": { address: 40009, length: 1 },
  };

  return registerMap[registerName] || null;
}

/**
 * Prepare a float value for Modbus by converting it to the right format
 * @param value The float value to convert
 * @returns The converted value as a buffer
 */
function prepareModbusFloat(value: number): Buffer {
  const buffer = Buffer.alloc(4);
  buffer.writeFloatBE(value, 0);
  return buffer;
}

/**
 * Converts a float value to a Modbus compatible format with registers
 * @param value The float value
 * @returns The converted value as array of registers (2 registers for float)
 */
export function convertFloat(value: number): number[] {
  const buffer = prepareModbusFloat(value);
  // Extract the two 16-bit registers from the buffer
  const reg1 = buffer.readUInt16BE(0);
  const reg2 = buffer.readUInt16BE(2);
  return [reg1, reg2];
}
