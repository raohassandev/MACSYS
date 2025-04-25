import ModbusRTU from "modbus-serial";
import { Float32toBytes } from "./modbusReader";
import { storage } from "../storage";

/**
 * Writes a value to a register on a Modbus device
 * @param device The device to write to
 * @param registerName The name of the register
 * @param value The value to write
 * @returns true if successful, false otherwise
 */
export async function writeToRegister(device: any, registerName: string, value: number | string): Promise<boolean> {
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
      // Use the register's byteOrder if available, otherwise default to "big"
      const byteOrder = register.byteOrder || "big";
      console.log(`Using byte order: ${byteOrder} for register ${registerName}`);
      
      const registers = Float32toBytes(value as number, byteOrder);
      
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
  } catch (error: any) {
    console.error(`Error writing to ${registerName}`, error?.message || String(error));
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

// Function to find register by name in the MongoDB database
async function findRegisterByAddress(registerName: string): Promise<{ address: number; length: number; byteOrder?: string } | null> {
  try {
    // Get the device ID from the request
    const devices = await storage.getAllDevices();
    
    // Loop through all devices to find the register
    for (const device of devices) {
      if (device.registers && device.registers.length > 0) {
        for (const register of device.registers) {
          if (register.name.toLowerCase() === registerName.toLowerCase()) {
            // Ensure address is a number or default to 0
            const address = typeof register.address === 'number' ? register.address : 0;
            return {
              address: address,
              length: register.length || 2,
              byteOrder: register.byteOrder || 'big'
            };
          }
        }
      }
    }
    
    // If we get here, no matching register was found
    console.error(`Register ${registerName} not found in any device`);
    
    // Fallback for circutor device registers
    const circutorRegisters: Record<string, { address: number; length: number; byteOrder: string }> = {
      "temperature": { address: 2613, length: 2, byteOrder: "AB CD" },
      "humidity": { address: 2615, length: 2, byteOrder: "AB CD" },
      "power": { address: 2713, length: 2, byteOrder: "AB CD" },
      "energy": { address: 2715, length: 2, byteOrder: "AB CD" },
      "setpoint": { address: 1013, length: 2, byteOrder: "AB CD" }
    };
    
    return circutorRegisters[registerName.toLowerCase()] || null;
  } catch (error) {
    console.error("Error finding register:", error);
    return null;
  }
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
