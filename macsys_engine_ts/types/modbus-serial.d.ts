declare module 'modbus-serial' {
    interface ModbusRTUOptions {
      port?: number;
      host?: string;
      timeout?: number;
      autoOpen?: boolean;
      [key: string]: any;
    }
  
    interface ModbusResponse {
      data: number[];
      buffer?: Buffer;
    }
  
    class ModbusRTU {
      constructor();
      
      // Connection methods
      connectTCP(ip: string, options?: ModbusRTUOptions): Promise<void>;
      connectRTU(port: string, options?: ModbusRTUOptions): Promise<void>;
      connectRTUBuffered(port: string, options?: ModbusRTUOptions): Promise<void>;
      connectAsciiSerial(port: string, options?: ModbusRTUOptions): Promise<void>;
      connectTelnet(ip: string, options?: ModbusRTUOptions): Promise<void>;
      close(): Promise<void>;
      
      // Configuration methods
      setTimeout(timeout: number): void;
      setID(id: number): void;
      
      // Read methods
      readCoils(dataAddress: number, length: number): Promise<ModbusResponse>;
      readDiscreteInputs(dataAddress: number, length: number): Promise<ModbusResponse>;
      readHoldingRegisters(dataAddress: number, length: number): Promise<ModbusResponse>;
      readInputRegisters(dataAddress: number, length: number): Promise<ModbusResponse>;
      
      // Write methods
      writeCoil(dataAddress: number, state: boolean): Promise<ModbusResponse>;
      writeCoils(dataAddress: number, states: boolean[]): Promise<ModbusResponse>;
      writeRegister(dataAddress: number, value: number): Promise<ModbusResponse>;
      writeRegisters(dataAddress: number, values: number[]): Promise<ModbusResponse>;
    }
  
    export default ModbusRTU;
  }