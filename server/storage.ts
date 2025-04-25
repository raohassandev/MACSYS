import { 
  Device,  
  RealtimeData, 
  HistoricalData,
  IDevice,
  IRealtimeData,
  IHistoricalData
} from './models';

export const storage = {
  // Device operations
  async getAllDevices(): Promise<IDevice[]> {
    try {
      return await Device.find().exec();
    } catch (error) {
      console.error("Error getting all devices:", error);
      throw error;
    }
  },

  async getDeviceById(id: string): Promise<IDevice | null> {
    try {
      return await Device.findById(id).exec();
    } catch (error) {
      console.error(`Error getting device by ID ${id}:`, error);
      throw error;
    }
  },

  async getDeviceByName(name: string): Promise<IDevice | null> {
    try {
      return await Device.findOne({ name }).exec();
    } catch (error) {
      console.error(`Error getting device by name ${name}:`, error);
      throw error;
    }
  },

  async createDevice(deviceData: any): Promise<IDevice> {
    try {
      const device = new Device(deviceData);
      return await device.save();
    } catch (error) {
      console.error("Error creating device:", error);
      throw error;
    }
  },

  async updateDevice(id: string, data: any): Promise<IDevice | null> {
    try {
      return await Device.findByIdAndUpdate(id, data, { new: true }).exec();
    } catch (error) {
      console.error(`Error updating device ${id}:`, error);
      throw error;
    }
  },

  async deleteDevice(id: string): Promise<IDevice | null> {
    try {
      return await Device.findByIdAndDelete(id).exec();
    } catch (error) {
      console.error(`Error deleting device ${id}:`, error);
      throw error;
    }
  },

  // Register operations
  async getRegistersForDevice(deviceId: string): Promise<any[]> {
    try {
      const device = await Device.findById(deviceId).exec();
      return device?.registers || [];
    } catch (error) {
      console.error(`Error getting registers for device ${deviceId}:`, error);
      throw error;
    }
  },

  async createRegister(registerData: any): Promise<IDevice | null> {
    try {
      const { deviceId, ...registerInfo } = registerData;
      return await Device.findByIdAndUpdate(
        deviceId,
        { $push: { registers: registerInfo } },
        { new: true }
      ).exec();
    } catch (error) {
      console.error("Error creating register:", error);
      throw error;
    }
  },

  async updateRegister(id: string, data: any): Promise<IDevice | null> {
    try {
      const { deviceId, registerId, ...updateData } = data;
      return await Device.findOneAndUpdate(
        { _id: deviceId, "registers._id": registerId },
        { $set: { "registers.$": updateData } },
        { new: true }
      ).exec();
    } catch (error) {
      console.error(`Error updating register ${id}:`, error);
      throw error;
    }
  },

  async deleteRegister(id: string): Promise<IDevice | null> {
    try {
      const { deviceId, registerId } = JSON.parse(id);
      return await Device.findByIdAndUpdate(
        deviceId,
        { $pull: { registers: { _id: registerId } } },
        { new: true }
      ).exec();
    } catch (error) {
      console.error(`Error deleting register ${id}:`, error);
      throw error;
    }
  },

  // Data operations
  async saveRealtimeData(deviceId: string, data: any, status: boolean = true): Promise<IRealtimeData> {
    try {
      const realtimeData = new RealtimeData({
        device: deviceId,
        timestamp: new Date(),
        data,
        status,
        control: 'central'
      });
      return await realtimeData.save();
    } catch (error) {
      console.error("Error saving realtime data:", error);
      throw error;
    }
  },

  async getLatestRealtimeData(deviceId: string): Promise<IRealtimeData | null> {
    try {
      return await RealtimeData.findOne({ device: deviceId })
        .sort({ timestamp: -1 })
        .exec();
    } catch (error) {
      console.error(`Error getting latest realtime data for device ${deviceId}:`, error);
      throw error;
    }
  },

  async saveHistoricalData(deviceId: string, data: any): Promise<IHistoricalData> {
    try {
      const historicalData = new HistoricalData({
        device: deviceId,
        timestamp: new Date(),
        data
      });
      return await historicalData.save();
    } catch (error) {
      console.error("Error saving historical data:", error);
      throw error;
    }
  },

  async getHistoricalData(deviceId: string, startTime: Date, endTime: Date): Promise<IHistoricalData[]> {
    try {
      return await HistoricalData.find({
        device: deviceId,
        timestamp: { $gte: startTime, $lte: endTime }
      })
        .sort({ timestamp: -1 })
        .exec();
    } catch (error) {
      console.error(`Error getting historical data for device ${deviceId}:`, error);
      throw error;
    }
  },
  
  async findByIdAndUpdate(deviceId: string, updateData: any): Promise<IDevice | null> {
    try {
      return await Device.findByIdAndUpdate(deviceId, updateData, { new: true }).exec();
    } catch (error) {
      console.error(`Error updating device ${deviceId}:`, error);
      throw error;
    }
  }
};