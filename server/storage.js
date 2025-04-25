import { Device } from './models/device.js';
import { RealtimeData, HistoricalData } from './models/data.js';

export const storage = {
  // Device operations
  async getAllDevices() {
    try {
      return await Device.find().sort({ name: 1 });
    } catch (error) {
      console.error('Error getting all devices:', error);
      throw error;
    }
  },

  async getDeviceById(id) {
    try {
      return await Device.findById(id);
    } catch (error) {
      console.error(`Error getting device by ID ${id}:`, error);
      throw error;
    }
  },

  async getDeviceByName(name) {
    try {
      return await Device.findOne({ name });
    } catch (error) {
      console.error(`Error getting device by name ${name}:`, error);
      throw error;
    }
  },

  async createDevice(device) {
    try {
      const newDevice = new Device(device);
      return await newDevice.save();
    } catch (error) {
      console.error('Error creating device:', error);
      throw error;
    }
  },

  async updateDevice(id, data) {
    try {
      return await Device.findByIdAndUpdate(
        id,
        { ...data, updatedAt: new Date() },
        { new: true }
      );
    } catch (error) {
      console.error(`Error updating device ${id}:`, error);
      throw error;
    }
  },

  async deleteDevice(id) {
    try {
      // Delete the device
      const deletedDevice = await Device.findByIdAndDelete(id);
      
      // If device was deleted, also delete related data
      if (deletedDevice) {
        await RealtimeData.deleteMany({ deviceId: id });
        await HistoricalData.deleteMany({ deviceId: id });
      }
      
      return deletedDevice;
    } catch (error) {
      console.error(`Error deleting device ${id}:`, error);
      throw error;
    }
  },

  // Register operations
  async getRegistersForDevice(deviceId) {
    try {
      const device = await Device.findById(deviceId);
      return device ? device.registers : [];
    } catch (error) {
      console.error(`Error getting registers for device ${deviceId}:`, error);
      throw error;
    }
  },

  async createRegister(register) {
    try {
      const { deviceId } = register;
      const device = await Device.findById(deviceId);
      
      if (!device) {
        throw new Error(`Device with ID ${deviceId} not found`);
      }
      
      device.registers.push(register);
      await device.save();
      
      // Return the newly added register
      return device.registers[device.registers.length - 1];
    } catch (error) {
      console.error('Error creating register:', error);
      throw error;
    }
  },

  async updateRegister(deviceId, registerId, data) {
    try {
      // Find the device that has the register
      const device = await Device.findById(deviceId);
      
      if (!device) {
        throw new Error(`Device with ID ${deviceId} not found`);
      }
      
      // Find the register index
      const registerIndex = device.registers.findIndex(r => 
        r._id.toString() === registerId.toString()
      );
      
      if (registerIndex === -1) {
        throw new Error(`Register with ID ${registerId} not found`);
      }
      
      // Update the register
      Object.assign(device.registers[registerIndex], {
        ...data,
        updatedAt: new Date()
      });
      
      await device.save();
      
      return device.registers[registerIndex];
    } catch (error) {
      console.error(`Error updating register ${registerId}:`, error);
      throw error;
    }
  },

  async deleteRegister(deviceId, registerId) {
    try {
      // Find the device
      const device = await Device.findById(deviceId);
      
      if (!device) {
        throw new Error(`Device with ID ${deviceId} not found`);
      }
      
      // Find and remove the register
      const registerIndex = device.registers.findIndex(r => 
        r._id.toString() === registerId.toString()
      );
      
      if (registerIndex === -1) {
        throw new Error(`Register with ID ${registerId} not found`);
      }
      
      const deletedRegister = device.registers[registerIndex];
      device.registers.splice(registerIndex, 1);
      
      await device.save();
      
      return deletedRegister;
    } catch (error) {
      console.error(`Error deleting register ${registerId}:`, error);
      throw error;
    }
  },

  // Data operations
  async saveRealtimeData(deviceId, data, status = true) {
    try {
      const realtimeData = new RealtimeData({
        deviceId,
        timestamp: new Date(),
        data,
        status,
        control: { type: 'local', source: 'local' }
      });
      
      return await realtimeData.save();
    } catch (error) {
      console.error(`Error saving realtime data for device ${deviceId}:`, error);
      throw error;
    }
  },

  async getLatestRealtimeData(deviceId) {
    try {
      return await RealtimeData.findOne({ deviceId })
        .sort({ timestamp: -1 });
    } catch (error) {
      console.error(`Error getting latest realtime data for device ${deviceId}:`, error);
      throw error;
    }
  },

  async saveHistoricalData(deviceId, data) {
    try {
      const historicalData = new HistoricalData({
        deviceId,
        timestamp: new Date(),
        data
      });
      
      return await historicalData.save();
    } catch (error) {
      console.error(`Error saving historical data for device ${deviceId}:`, error);
      throw error;
    }
  },

  async getHistoricalData(deviceId, startTime, endTime) {
    try {
      return await HistoricalData.find({
        deviceId,
        timestamp: { $gte: startTime, $lte: endTime }
      }).sort({ timestamp: -1 });
    } catch (error) {
      console.error(`Error getting historical data for device ${deviceId}:`, error);
      throw error;
    }
  },
  
  async findByIdAndUpdate(deviceId, updateData) {
    try {
      return await Device.findByIdAndUpdate(
        deviceId,
        { ...updateData, updatedAt: new Date() },
        { new: true }
      );
    } catch (error) {
      console.error(`Error updating device ${deviceId}:`, error);
      throw error;
    }
  }
};