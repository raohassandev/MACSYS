import Device from '../models/Device.js';
import HistoricalData from "../models/HistoricalData.js"
import RealtimeData from '../models/RealtimeData.js';
import express from 'express';
import { writeToRegister } from '../controllers/modbusWriter.js';

const router = express.Router();

router.get('/latest', async (req, res) => {
  const data = await RealtimeData.find().sort({ timestamp: -1 }).limit(10);
  res.json(data);
});

router.get('/history', async (req, res) => {
  const data = await HistoricalData.find({
    timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  });
  res.json(data);
});

// Add a new device
router.post('/addDevice', async (req, res) => {
  try {
    const newDevice = new Device(req.body);
    const savedDevice = await newDevice.save();
    res.status(201).json(savedDevice);
  } catch (error) {
    console.log(error)
    res.status(400).json({ message: error.message });
  }
});


//write to register (DB only - deprecated)
router.post('/writeToRegister', async (req, res) => {
  
  const { deviceId, registerName, value } = req.body;
  const updatedDevice = await Device.findByIdAndUpdate(deviceId, { $set: { [registerName]: value } }, { new: true });
res.json(updatedDevice);
});

// Write to device register via Modbus
router.post('/device/write', async (req, res) => {
  console.log(req.body)
  try {
    const { device: deviceName, register, value } = req.body;
    
    if (!deviceName || !register || value === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: device, register, or value' 
      });
    }
    
    console.log("Received write request:", { deviceName, register, value });
    
    // Find the device in the database - try both by name and direct ID
    let device;
    
    // First check if deviceName is a string (device name)
    if (typeof deviceName === 'string') {
      device = await Device.findOne({ name: deviceName });
    }
    
    // If not found and deviceName might be an object with a device property
    if (!device && typeof deviceName === 'object' && deviceName.device) {
      device = await Device.findOne({ name: deviceName.device });
    }
    
    // Last resort - try to find by ID
    if (!device && typeof deviceName === 'string') {
      try {
        device = await Device.findById(deviceName);
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
        message: `Failed to write to register` 
      });
    }
  } catch (error) {
    console.error('Error writing to register:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Get all devices
router.get('/getDevices', async (req, res) => {
  try {
    const devices = await Device.find();
    res.json(devices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a device
router.put('/updateDevice', async (req, res) => {
  try {
    console.log("UPDATE => ",req.body)
    const updatedDevice = await Device.findByIdAndUpdate(
      req.body._id,
      req.body,
      { new: true } // Returns the updated document
    );

    if (!updatedDevice) {
      return res.status(404).json({ message: 'Device not found' });
    }

    res.json(updatedDevice);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a device
router.delete('/delete/:id', async (req, res) => {
  console.log('delete request ', req.body);
  try {
    const deletedDevice = await Device.findByIdAndDelete(req.params.id);

    if (!deletedDevice) {
      return res.status(404).json({ message: 'Device not found' });
    }

    res.json({ message: 'Device deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Test Route
router.post('/test', async (req, res) => {
  try {
    console.log(req.body)
    res.json({ message: 'Data received' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
export default router;
