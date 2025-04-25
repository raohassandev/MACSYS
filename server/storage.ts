import { db } from "@db";
import { 
  devices, 
  registers,
  realtimeData,
  historicalData,
  DeviceInsert,
  RegisterInsert
} from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";

export const storage = {
  // Device operations
  async getAllDevices() {
    return db.query.devices.findMany({
      with: { registers: true }
    });
  },

  async getDeviceById(id: number) {
    return db.query.devices.findFirst({
      where: eq(devices.id, id),
      with: { registers: true }
    });
  },

  async getDeviceByName(name: string) {
    return db.query.devices.findFirst({
      where: eq(devices.name, name),
      with: { registers: true }
    });
  },

  async createDevice(device: DeviceInsert) {
    try {
      const [newDevice] = await db.insert(devices).values(device).returning();
      return newDevice;
    } catch (error) {
      console.error("Error creating device:", error);
      throw error;
    }
  },

  async updateDevice(id: number, data: Partial<DeviceInsert>) {
    try {
      const [updatedDevice] = await db.update(devices)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(devices.id, id))
        .returning();
      return updatedDevice;
    } catch (error) {
      console.error("Error updating device:", error);
      throw error;
    }
  },

  async deleteDevice(id: number) {
    try {
      const [deletedDevice] = await db.delete(devices)
        .where(eq(devices.id, id))
        .returning();
      return deletedDevice;
    } catch (error) {
      console.error("Error deleting device:", error);
      throw error;
    }
  },

  // Register operations
  async getRegistersForDevice(deviceId: number) {
    return db.query.registers.findMany({
      where: eq(registers.deviceId, deviceId)
    });
  },

  async createRegister(register: RegisterInsert) {
    try {
      const [newRegister] = await db.insert(registers).values(register).returning();
      return newRegister;
    } catch (error) {
      console.error("Error creating register:", error);
      throw error;
    }
  },

  async updateRegister(id: number, data: Partial<RegisterInsert>) {
    try {
      const [updatedRegister] = await db.update(registers)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(registers.id, id))
        .returning();
      return updatedRegister;
    } catch (error) {
      console.error("Error updating register:", error);
      throw error;
    }
  },

  async deleteRegister(id: number) {
    try {
      const [deletedRegister] = await db.delete(registers)
        .where(eq(registers.id, id))
        .returning();
      return deletedRegister;
    } catch (error) {
      console.error("Error deleting register:", error);
      throw error;
    }
  },

  // Data operations
  async saveRealtimeData(deviceId: number, data: any, status: boolean = true) {
    try {
      const [newData] = await db.insert(realtimeData)
        .values({
          deviceId,
          timestamp: new Date(),
          data,
          status,
          control: { type: "local", source: "local" }
        })
        .returning();
      return newData;
    } catch (error) {
      console.error("Error saving realtime data:", error);
      throw error;
    }
  },

  async getLatestRealtimeData(deviceId: number) {
    try {
      const data = await db.query.realtimeData.findFirst({
        where: eq(realtimeData.deviceId, deviceId),
        orderBy: desc(realtimeData.timestamp)
      });
      return data;
    } catch (error) {
      console.error("Error getting latest realtime data:", error);
      throw error;
    }
  },

  async saveHistoricalData(deviceId: number, data: any) {
    try {
      const [newData] = await db.insert(historicalData)
        .values({
          deviceId,
          timestamp: new Date(),
          data
        })
        .returning();
      return newData;
    } catch (error) {
      console.error("Error saving historical data:", error);
      throw error;
    }
  },

  async getHistoricalData(deviceId: number, startTime: Date, endTime: Date) {
    try {
      return db.query.historicalData.findMany({
        where: and(
          eq(historicalData.deviceId, deviceId),
          ({ timestamp }) => timestamp >= startTime,
          ({ timestamp }) => timestamp <= endTime
        ),
        orderBy: desc(historicalData.timestamp)
      });
    } catch (error) {
      console.error("Error getting historical data:", error);
      throw error;
    }
  },
  
  async findByIdAndUpdate(deviceId: number, updateData: any) {
    try {
      const [updatedDevice] = await db.update(devices)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(devices.id, deviceId))
        .returning();
      return updatedDevice;
    } catch (error) {
      console.error("Error updating device:", error);
      throw error;
    }
  }
};
