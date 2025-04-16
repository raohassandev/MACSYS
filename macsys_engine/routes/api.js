import DataPoint from '../models/DataPoint.js';
import Device from '../models/Device.js';
import express from 'express';

const router = express.Router();

router.get('/latest', async (req, res) => {
  const data = await DataPoint.find().sort({ timestamp: -1 }).limit(10);
  res.json(data);
});

router.get('/history', async (req, res) => {
  const data = await DataPoint.find({
    timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  });
  res.json(data);
});

// Add a new device
router.post('/addDevice', async (req, res) => {
  try {
    const newDevice = new Device(req.body);
    console.log(newDevice)
    const savedDevice = await newDevice.save();
    res.status(201).json(savedDevice);
  } catch (error) {
    console.log(error)
    res.status(400).json({ message: error.message });
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
    console.log("UPDATE => ",req.body._id)
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
router.delete('/delete:id', async (req, res) => {
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
