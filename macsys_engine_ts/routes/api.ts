import express, { Request, Response } from 'express';
import DataPoint from '../models/DataPoint.js';
import Device from '../models/Device.js';

const router = express.Router();

router.get('/latest', async (_req: Request, res: Response) => {
  const data = await DataPoint.find().sort({ timestamp: -1 }).limit(10);
  res.json(data);
});

router.get('/history', async (_req: Request, res: Response) => {
  const data = await DataPoint.find({
    timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  });
  res.json(data);
});

// Add a new device
router.post('/addDevice', async (req: Request, res: Response) => {
  try {
    const newDevice = new Device(req.body);
    console.log(newDevice);
    const savedDevice = await newDevice.save();
    res.status(201).json(savedDevice);
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: (error as Error).message });
  }
});

// Get all devices
router.get('/getDevices', async (_req: Request, res: Response) => {
  try {
    const devices = await Device.find();
    res.json(devices);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
});

// Update a device
router.put('/updateDevice', async (req: Request, res: Response) => {
  try {
    console.log("UPDATE => ", req.body._id);
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
    res.status(400).json({ message: (error as Error).message });
  }
});

// Delete a device
router.delete('/delete:id', async (req: Request, res: Response) => {
  try {
    const deletedDevice = await Device.findByIdAndDelete(req.params.id);

    if (!deletedDevice) {
      return res.status(404).json({ message: 'Device not found' });
    }

    res.json({ message: 'Device deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
});

// Test Route
router.post('/test', async (req: Request, res: Response) => {
  try {
    console.log(req.body);
    res.json({ message: 'Data received' });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
});

export default router;