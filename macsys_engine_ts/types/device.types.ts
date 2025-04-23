export interface Register {
    name: string;
    address: number;
    length: number;
  }
  
  export interface Device {
    name: string;
    ip: string;
    port: number;
    slaveId: number;
    registers: Register[];
    enabled?: boolean;
  }