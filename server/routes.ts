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
      console.error("Error getting devices:", error instanceof Error ? error.message : "Unknown error");
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
      console.error("Error creating device:", error instanceof Error ? error.message : "Unknown error");
      if (error instanceof Error && error.name === 'ValidationError') {
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
      console.error("Error updating device:", error instanceof Error ? error.message : "Unknown error");
      if (error instanceof Error && error.name === 'ValidationError') {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to update device" });
    }
  });

  // Delete device
  app.delete(`${apiPrefix}/devices/:id`, async (req, res) => {
    try {
      const id = req.params.id;
      if (!id) {
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
      console.error("Error deleting device:", error instanceof Error ? error.message : "Unknown error");
      res.status(500).json({ message: "Failed to delete device" });
    }
  });

  // Get registers for a device
  app.get(`${apiPrefix}/devices/:id/registers`, async (req, res) => {
    try {
      const id = req.params.id;
      if (!id) {
        return res.status(400).json({ message: "Invalid device ID" });
      }
      
      const device = await storage.getDeviceById(id);
      if (!device) {
        return res.status(404).json({ message: "Device not found" });
      }
      
      const registers = await storage.getRegistersForDevice(id);
      res.json(registers);
    } catch (error) {
      console.error("Error getting registers:", error instanceof Error ? error.message : "Unknown error");
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
      console.error("Error creating register:", error instanceof Error ? error.message : "Unknown error");
      if (error instanceof Error && error.name === 'ValidationError') {
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
      
      // Last resort - try to find by ID directly
      if (!device && typeof deviceName === 'string') {
        try {
          // In MongoDB, we can just use the string ID directly
          device = await storage.getDeviceById(deviceName);
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
      console.error("Error getting latest data:", error instanceof Error ? error.message : "Unknown error");
      res.status(500).json({ message: "Failed to get latest data" });
    }
  });
  
  // Alias for latest data (matches frontend expectations)
  app.get(`${apiPrefix}/devices/:id/data`, async (req, res) => {
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
      console.error("Error getting data:", error instanceof Error ? error.message : "Unknown error");
      res.status(500).json({ message: "Failed to get data" });
    }
  });

  // Get historical data for a device - device ID in path parameter
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
      console.error("Error getting historical data:", error instanceof Error ? error.message : "Unknown error");
      res.status(500).json({ message: "Failed to get historical data" });
    }
  });
  
  // Get historical data - device ID in query parameter (for the History page)
  app.get(`${apiPrefix}/historical-data`, async (req, res) => {
    try {
      const { deviceId, startDate, endDate } = req.query;
      
      if (!deviceId) {
        return res.status(400).json({ message: "Device ID is required" });
      }
      
      const device = await storage.getDeviceById(deviceId as string);
      if (!device) {
        return res.status(404).json({ message: "Device not found" });
      }
      
      // Parse date range from query parameters with defaults
      const parsedEndDate = endDate ? new Date(endDate as string) : new Date();
      
      // Default to 24 hours if start date not specified
      const parsedStartDate = startDate 
        ? new Date(startDate as string) 
        : new Date(parsedEndDate.getTime() - 24 * 60 * 60 * 1000);
      
      const historicalData = await storage.getHistoricalData(
        deviceId as string, 
        parsedStartDate, 
        parsedEndDate
      );
      
      res.json(historicalData);
    } catch (error) {
      console.error("Error getting historical data:", error instanceof Error ? error.message : "Unknown error");
      res.status(500).json({ message: "Failed to get historical data" });
    }
  });
  
  // Get report data - aggregated historical data for reports
  app.get(`${apiPrefix}/reports`, async (req, res) => {
    try {
      const { deviceId, startDate, endDate, reportType } = req.query;
      
      if (!deviceId) {
        return res.status(400).json({ message: "Device ID is required" });
      }
      
      const device = await storage.getDeviceById(deviceId as string);
      if (!device) {
        return res.status(404).json({ message: "Device not found" });
      }
      
      // Parse date range from query parameters with defaults
      const parsedEndDate = endDate ? new Date(endDate as string) : new Date();
      let parsedStartDate;
      
      if (startDate) {
        parsedStartDate = new Date(startDate as string);
      } else {
        // Default date range based on report type
        switch(reportType) {
          case 'daily':
            parsedStartDate = new Date(parsedEndDate);
            parsedStartDate.setHours(0, 0, 0, 0);
            break;
          case 'weekly':
            parsedStartDate = new Date(parsedEndDate);
            parsedStartDate.setDate(parsedStartDate.getDate() - 7);
            break;
          case 'monthly':
            parsedStartDate = new Date(parsedEndDate);
            parsedStartDate.setMonth(parsedStartDate.getMonth() - 1);
            break;
          case 'yearly':
            parsedStartDate = new Date(parsedEndDate);
            parsedStartDate.setFullYear(parsedStartDate.getFullYear() - 1);
            break;
          default:
            // Default to 24 hours
            parsedStartDate = new Date(parsedEndDate.getTime() - 24 * 60 * 60 * 1000);
        }
      }
      
      // Get the historical data
      const historicalData = await storage.getHistoricalData(
        deviceId as string, 
        parsedStartDate, 
        parsedEndDate
      );
      
      // For now, just return the raw data - in the future we could aggregate here
      res.json(historicalData);
    } catch (error) {
      console.error("Error generating report:", error instanceof Error ? error.message : "Unknown error");
      res.status(500).json({ message: "Failed to generate report" });
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
