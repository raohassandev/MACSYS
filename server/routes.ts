import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import { writeToRegister } from "./controllers/modbusWriter.js";
import { updateDeviceCache } from "./utils/configCache.js";

// Update device cache every minute
const CACHE_UPDATE_INTERVAL = 60 * 1000;

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // API prefix
  const apiPrefix = "/api";

  // Get all devices
  app.get(`${apiPrefix}/devices`, async (req, res) => {
    try {
      const devices = await storage.getAllDevices();
      res.json(devices);
    } catch (error) {
      console.error("Error getting devices:", error);
      res.status(500).json({ message: "Failed to get devices" });
    }
  });

  // Get device by ID
  app.get(`${apiPrefix}/devices/:id`, async (req, res) => {
    try {
      const id = req.params.id;
      if (!id) {
        return res.status(400).json({ message: "Invalid device ID" });
      }
      
      const device = await storage.getDeviceById(id);
      if (!device) {
        return res.status(404).json({ message: "Device not found" });
      }
      
      res.json(device);
    } catch (error) {
      console.error("Error getting device:", error instanceof Error ? error.message : "Unknown error");
      res.status(500).json({ message: "Failed to get device" });
    }
  });

  // Add new device
  app.post(`${apiPrefix}/devices`, async (req, res) => {
    try {
      const deviceData = req.body;
      const newDevice = await storage.createDevice(deviceData);
      
      // Update the device cache after adding a new device
      await updateDeviceCache();
      
      res.status(201).json(newDevice);
    } catch (error) {
      console.error("Error creating device:", error);
      if (error.name === 'ValidationError') {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to create device" });
    }
  });

  // Update device
  app.put(`${apiPrefix}/devices/:id`, async (req, res) => {
    try {
      const id = req.params.id;
      if (!id) {
        return res.status(400).json({ message: "Invalid device ID" });
      }
      
      const updateData = req.body;
      const updatedDevice = await storage.updateDevice(id, updateData);
      
      if (!updatedDevice) {
        return res.status(404).json({ message: "Device not found" });
      }
      
      // Update the device cache after updating a device
      await updateDeviceCache();
      
      res.json(updatedDevice);
    } catch (error) {
      console.error("Error updating device:", error);
      if (error.name === 'ValidationError') {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to update device" });
    }
  });

  // Delete device
  app.delete(`${apiPrefix}/devices/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid device ID" });
      }
      
      const deletedDevice = await storage.deleteDevice(id);
      
      if (!deletedDevice) {
        return res.status(404).json({ message: "Device not found" });
      }
      
      // Update the device cache after deleting a device
      await updateDeviceCache();
      
      res.json({ message: "Device deleted successfully" });
    } catch (error) {
      console.error("Error deleting device:", error);
      res.status(500).json({ message: "Failed to delete device" });
    }
  });

  // Get registers for a device
  app.get(`${apiPrefix}/devices/:id/registers`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid device ID" });
      }
      
      const device = await storage.getDeviceById(id);
      if (!device) {
        return res.status(404).json({ message: "Device not found" });
      }
      
      const registers = await storage.getRegistersForDevice(id);
      res.json(registers);
    } catch (error) {
      console.error("Error getting registers:", error);
      res.status(500).json({ message: "Failed to get registers" });
    }
  });

  // Add register to device
  app.post(`${apiPrefix}/devices/:id/registers`, async (req, res) => {
    try {
      const deviceId = req.params.id;
      if (!deviceId) {
        return res.status(400).json({ message: "Invalid device ID" });
      }
      
      const device = await storage.getDeviceById(deviceId);
      if (!device) {
        return res.status(404).json({ message: "Device not found" });
      }
      
      const registerData = { ...req.body, deviceId };
      const newRegister = await storage.createRegister(registerData);
      
      // Update the device cache after adding a register
      await updateDeviceCache();
      
      res.status(201).json(newRegister);
    } catch (error) {
      console.error("Error creating register:", error);
      if (error.name === 'ValidationError') {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to create register" });
    }
  });

  // Write to device register
  app.post(`${apiPrefix}/devices/write`, async (req, res) => {
    console.log(req.body);
    try {
      const { device: deviceName, register, value } = req.body;
      
      if (!deviceName || !register || value === undefined) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: device, register, or value"
        });
      }
      
      console.log(`Received write request:`, { deviceName, register, value });
      
      // Find the device in the database - try both by name and direct ID
      let device;
      
      // First check if deviceName is a string (device name)
      if (typeof deviceName === 'string') {
        device = await storage.getDeviceByName(deviceName);
      }
      
      // If not found and deviceName might be an object with a device property
      if (!device && typeof deviceName === 'object' && deviceName.device) {
        device = await storage.getDeviceByName(deviceName.device);
      }
      
      // Last resort - try to find by ID
      if (!device && typeof deviceName === 'string') {
        try {
          const deviceId = parseInt(deviceName);
          if (!isNaN(deviceId)) {
            device = await storage.getDeviceById(deviceId);
          }
        } catch (err) {
          // Ignore this error as it's just a fallback
        }
      }
      
      // If still not found, return error
      if (!device) {
        return res.status(404).json({
          success: false,
          message: `Device "${deviceName}" not found`
        });
      }
      
      console.log("Found device:", device.name);
      
      // Write the value to the device
      const success = await writeToRegister(device, register, value);
      
      if (success) {
        return res.json({
          success: true,
          message: `Successfully wrote ${value} to ${register} on device ${device.name}`
        });
      } else {
        return res.status(500).json({
          success: false,
          message: "Failed to write to register"
        });
      }
    } catch (error) {
      console.error("Error writing to register:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get latest real-time data for a device
  app.get(`${apiPrefix}/devices/:id/latest`, async (req, res) => {
    try {
      const id = req.params.id;
      if (!id) {
        return res.status(400).json({ message: "Invalid device ID" });
      }
      
      const device = await storage.getDeviceById(id);
      if (!device) {
        return res.status(404).json({ message: "Device not found" });
      }
      
      const data = await storage.getLatestRealtimeData(id);
      res.json(data);
    } catch (error) {
      console.error("Error getting latest data:", error);
      res.status(500).json({ message: "Failed to get latest data" });
    }
  });

  // Get historical data for a device
  app.get(`${apiPrefix}/devices/:id/history`, async (req, res) => {
    try {
      const id = req.params.id;
      if (!id) {
        return res.status(400).json({ message: "Invalid device ID" });
      }
      
      const device = await storage.getDeviceById(id);
      if (!device) {
        return res.status(404).json({ message: "Device not found" });
      }
      
      // Parse date range from query parameters with defaults
      const endTime = req.query.end ? new Date(req.query.end as string) : new Date();
      
      // Default to 24 hours if not specified
      const startTime = req.query.start 
        ? new Date(req.query.start as string) 
        : new Date(endTime.getTime() - 24 * 60 * 60 * 1000);
      
      const data = await storage.getHistoricalData(id, startTime, endTime);
      res.json(data);
    } catch (error) {
      console.error("Error getting historical data:", error);
      res.status(500).json({ message: "Failed to get historical data" });
    }
  });

  // Test endpoint
  app.post(`${apiPrefix}/test`, async (req, res) => {
    try {
      console.log(req.body);
      res.json({ message: "Data received" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Initialize device cache
  await updateDeviceCache();
  
  // Set up periodic cache update
  setInterval(async () => {
    await updateDeviceCache();
  }, CACHE_UPDATE_INTERVAL);

  return httpServer;
}
