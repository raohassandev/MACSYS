/**
 * Converts a 32-bit floating point value to an array of 16-bit integers
 * for use with Modbus communication
 * 
 * @param value The float value to convert
 * @param endian The endianness to use (big or little)
 * @returns Array of two 16-bit integers representing the float value
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

/**
 * Converts an array of 16-bit integers to a 32-bit floating point value
 * 
 * @param bytes Array of two 16-bit integers
 * @param endian The endianness to use (big or little)
 * @returns The floating point value
 */
export function BytesToFloat32(bytes: number[], endian: string = "big"): number {
  if (bytes.length !== 2) {
    throw new Error("Expected exactly 2 bytes for Float32 conversion");
  }
  
  const buffer = Buffer.alloc(4);
  buffer.writeUInt16BE(bytes[0], 0);
  buffer.writeUInt16BE(bytes[1], 2);
  
  if (endian === "big") {
    return buffer.readFloatBE(0);
  } else {
    return buffer.readFloatLE(0);
  }
}
