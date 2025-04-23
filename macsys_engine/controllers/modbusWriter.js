import ModbusRTU from 'modbus-serial';




// Function to prepare a float value for Modbus
function prepareModbusFloat(value) {
    const buffer = Buffer.alloc(4);
    buffer.writeFloatBE(value, 0);
    
    // Swap bytes to match device format: B, A, D, C
    const byteA = buffer[0];
    const byteB = buffer[1];
    const byteC = buffer[2];
    const byteD = buffer[3];
    
    const reg1 = (byteB << 8) | byteA;
    const reg2 = (byteD << 8) | byteC;
    
    return [reg1, reg2];
  }


//   Parameters:

// num (number): The JavaScript number to convert to IEEE 754 float32.

// endian ('little' | 'big' | 'swap', optional): The byte order:

// 'little': Little endian (least significant byte first). Default.

// 'big': Big endian (most significant byte first).

// 'swap': Byte-swapped ([byte2, byte3, byte0, byte1]).

// Returns: Buffer (length 4) containing the 32-bit float representation.

// Throws: Error if endian is not one of 'little', 'big', or 'swap'.
  function float32ToBytes(num, endian = 'little') {/// "little" | "bit"| "swap"
    // Create a 4-byte buffer
    const buf = Buffer.alloc(4);
  
    // Write float32 in little endian by default
    buf.writeFloatLE(num, 0);
  
    let result;
    switch (endian) {
      case 'little':
        result = buf;
        break;
      case 'big':
        // Reverse bytes for big endian
        result = Buffer.from(buf).reverse();
        break;
      case 'swap':
        // Byte-swapped: swap 16-bit words in little endian
        result = Buffer.from([buf[2], buf[3], buf[0], buf[1]]);
        break;
      default:
        throw new Error("Invalid endian type. Use 'little', 'big', or 'swap'.");
    }
  
    return result;
  }
/**
 * Writes a value to a specific register on a Modbus device
 * @param {Object} device - The device to write to
 * @param {string} registerName - The name of the register to write to
 * @param {number} value - The value to write
 * @returns {Promise<boolean>} - Success status of the write operation
 */
export async function writeToRegister(device, registerName, value) {
    if (!device.enabled) {
      console.log(`Device ${device.name} is not enabled.`);
      return false;
    }
  
    
    const client = new ModbusRTU();
    let isConnected = false;
    
    try {
      // Connect to the device
      try {
        await client.connectTCP(device.ip, {
          port: device.port,
        });
        isConnected = true;
      } catch (error) {
        console.log('Connection Failed', error);
        return false;
      }
      
      if (!isConnected) {
        console.log('Connection to the PLC failed.');
        return false;
      }
      
      // Find the register by name
      const register = device.registers.find(reg => reg.name === registerName);
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
        const registers = float32ToBytes(value, "big")
        // const registers = prepareModbusFloat(parseFloat(convertedValue));
        // const registers = value;
        console.log('Converter Value',registers)
        
        
        // Write the registers
        await client.writeRegisters(register.address, registers);
        console.log(`Successfully wrote value ${value} to ${registerName} on device ${device.name}`);
        return true;
      } 
      // For integer values (single register)
      else if (register.length === 1) {
        await client.writeRegister(register.address, parseInt(value, 10));
        console.log(`Successfully wrote value ${value} to ${registerName} on device ${device.name}`);
        return true;
      }
      else {
        console.error(`Unsupported register length: ${register.length}`);
        return false;
      }
      
    } catch (error) {
      console.error(`Error writing to ${device.name}:`, error.message);
      return false;
    } finally {
      try {
        await client.close();
      } catch {}
    }
  }
  