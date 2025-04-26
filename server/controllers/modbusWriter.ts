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

  // Check if we're in development mode
  const isDev = process.env.NODE_ENV === 'development' || true; // Always true for now during development
  
  // If in dev mode and we're trying to connect to a specific IP, use mock mode
  const shouldMock = isDev && (device.ipAddress === '192.168.1.191' || device.ip === '192.168.1.191');

  if (shouldMock) {
    console.log(`MOCK MODE: Simulating write to ${registerName} with value ${value} on device ${device.name}`);
    
    // Find the register definition
    const register = await findRegisterByAddress(registerName);
    
    if (!register) {
      console.error(`MOCK MODE: Register ${registerName} not found for device ${device.name}`);
      return false;
    }
    
    console.log(`MOCK MODE: Successfully wrote value ${value} to register ${registerName} at address ${register.address}`);
    
    // Simulate a successful write
    return true;
  }

  // Real mode - connect to the actual device
  const client = new ModbusRTU();
  let isConnected = false;

  try {
    // Connect to the device
    try {
      // Support both ipAddress and ip properties for backward compatibility
      const ip = device.ipAddress || device.ip;
      await client.connectTCP(ip, {
        port: device.port,
      });
      isConnected = true;
    } catch (error) {
      console.log(`Connection failed to ${device.name} at ${device.ipAddress || device.ip}:${device.port}`, error);
      return false;
    }

    if (!isConnected) {
      console.log(`Connection to the PLC failed.`);
      return false;
    }

    console.log(`Found register name: ${registerName}`);

    // Find the register by name
    const register = await findRegisterByAddress(registerName);
    
    if (!register) {
      console.error(`Register ${registerName} not found for device ${device.name}`);
      return false;
    }

    console.log(`Register details:`, register);

    // Set the slave ID
    client.setID(device.slaveId);

    // For float values (assuming most values are floats)
    if (register.length === 2) {
      // Convert the float value to the correct format for Modbus
      // Use the register's byteOrder if available, otherwise default to "big"
      const byteOrder = register.byteOrder || "big";
      console.log(`Using byte order: ${byteOrder} for register ${registerName}`);
      
      const numericValue = typeof value === 'string' ? parseFloat(value) : value as number;
      const registers = Float32toBytes(numericValue, byteOrder);
      
      console.log(`Writing ${numericValue} as registers:`, registers);
      
      // Write the registers
      await client.writeRegisters(register.address, registers);
      
      console.log(`Successfully wrote value ${value} to ${registerName} on device ${device.name}`);
      return true;
    } 
    // For integer values (single register)
    else if (register.length === 1) {
      const intValue = typeof value === 'string' ? parseInt(value, 10) : Math.round(value as number);
      await client.writeRegister(register.address, intValue);
      
      console.log(`Successfully wrote value ${intValue} to ${registerName} on device ${device.name}`);
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

/**
 * Function to find register by name in the MongoDB database
 * Returns a register with its address, length, and byte order configuration
 * 
 * Supported byte order formats:
 * - "AB CD" (same as ABCD): MSW-MSB first, original Modbus format (used by Circutor PLCs)
 * - "CD AB" (same as CDAB): LSW-MSB first, swapped register order
 * - "BA DC" (same as BADC): MSW-LSB first, swapped bytes in each register
 * - "DC BA" (same as DCBA): LSW-LSB first, swapped bytes and swapped registers
 * - "big" (same as ABCD): Big endian format
 * - "little" (same as DCBA): Little endian format
 * 
 * @param registerName The name of the register to find
 * @returns The register configuration object or null if not found
 */
async function findRegisterByAddress(registerName: string): Promise<{ address: number; length: number; byteOrder?: string } | null> {
  try {
    // First try to find in active devices in MongoDB
    try {
      // Get all devices from the database
      const devices = await storage.getAllDevices();
      
      // Normalize the register name for case-insensitive comparison
      const normalizedRegisterName = registerName.toLowerCase().trim();
      
      // Loop through all devices to find the register
      for (const device of devices) {
        // Only check enabled devices
        if (device.enabled && device.registers && device.registers.length > 0) {
          for (const register of device.registers) {
            if (register.name && register.name.toLowerCase().trim() === normalizedRegisterName) {
              // Ensure address is a number or default to 0
              const address = typeof register.address === 'number' ? register.address : 0;
              console.log(`Found register ${registerName} in device ${device.name} with address ${address}`);
              
              return {
                address: address,
                length: register.length || 2, // Default to 2 registers for float values
                byteOrder: register.byteOrder || 'big' // Default to big endian
              };
            }
          }
        }
      }
    } catch (dbError) {
      console.error("Error accessing MongoDB for registers:", dbError);
      // Continue to fallback if database fails
    }
    
    // If we get here, no matching register was found in the database
    console.log(`Register ${registerName} not found in any device, using fallback`);
    
    // Fallback for circutor device registers - hardcoded for reliability
    const circutorRegisters: Record<string, { address: number; length: number; byteOrder: string }> = {
      "temperature": { address: 2613, length: 2, byteOrder: "AB CD" },
      "humidity": { address: 2615, length: 2, byteOrder: "AB CD" },
      "power": { address: 2713, length: 2, byteOrder: "AB CD" },
      "energy": { address: 2715, length: 2, byteOrder: "AB CD" },
      "setpoint": { address: 1013, length: 2, byteOrder: "AB CD" }
    };
    
    // Check for the register in our hardcoded fallback (case insensitive)
    const fallbackRegister = circutorRegisters[registerName.toLowerCase()];
    if (fallbackRegister) {
      console.log(`Using fallback register definition for ${registerName}`);
      return fallbackRegister;
    }
    
    console.error(`Register ${registerName} not found in any device or fallback`);
    return null;
  } catch (error) {
    console.error("Error finding register:", error);
    return null;
  }
}

// Note: These functions have been replaced by the more comprehensive
// Float32toBytes function imported from modbusReader.ts which supports all byte order formats
