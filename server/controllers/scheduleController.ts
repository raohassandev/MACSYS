import { Request, Response } from 'express';
import Schedule from '../models/Schedule';
import mongoose from 'mongoose';

// Get all schedules
export const getAllSchedules = async (req: Request, res: Response) => {
  try {
    const schedules = await Schedule.find().sort({ createdAt: -1 });
    return res.status(200).json(schedules);
  } catch (error) {
    console.error('Error getting schedules:', error);
    return res.status(500).json({ error: 'Failed to fetch schedules' });
  }
};

// Get schedules for a specific device
export const getDeviceSchedules = async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(deviceId)) {
      return res.status(400).json({ error: 'Invalid device ID format' });
    }
    
    const schedules = await Schedule.find({ deviceId }).sort({ createdAt: -1 });
    return res.status(200).json(schedules);
  } catch (error) {
    console.error(`Error getting schedules for device ${req.params.deviceId}:`, error);
    return res.status(500).json({ error: 'Failed to fetch device schedules' });
  }
};

// Create a new schedule
export const createSchedule = async (req: Request, res: Response) => {
  try {
    const { deviceId, registerName, value, time, days, enabled, description } = req.body;
    
    if (!deviceId || !registerName || value === undefined || !time || !days) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (!mongoose.Types.ObjectId.isValid(deviceId)) {
      return res.status(400).json({ error: 'Invalid device ID format' });
    }
    
    const newSchedule = new Schedule({
      deviceId,
      registerName,
      value,
      time,
      days,
      enabled: enabled !== undefined ? enabled : true,
      description
    });
    
    const savedSchedule = await newSchedule.save();
    
    return res.status(201).json(savedSchedule);
  } catch (error) {
    console.error('Error creating schedule:', error);
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Failed to create schedule' });
  }
};

// Update a schedule
export const updateSchedule = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { deviceId, registerName, value, time, days, enabled, description } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid schedule ID format' });
    }
    
    // Only update fields that are provided
    const updateData: any = {};
    if (deviceId !== undefined) updateData.deviceId = deviceId;
    if (registerName !== undefined) updateData.registerName = registerName;
    if (value !== undefined) updateData.value = value;
    if (time !== undefined) updateData.time = time;
    if (days !== undefined) updateData.days = days;
    if (enabled !== undefined) updateData.enabled = enabled;
    if (description !== undefined) updateData.description = description;
    
    const updatedSchedule = await Schedule.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!updatedSchedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    
    return res.status(200).json(updatedSchedule);
  } catch (error) {
    console.error(`Error updating schedule ${req.params.id}:`, error);
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Failed to update schedule' });
  }
};

// Delete a schedule
export const deleteSchedule = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid schedule ID format' });
    }
    
    const deletedSchedule = await Schedule.findByIdAndDelete(id);
    
    if (!deletedSchedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    
    return res.status(200).json({ message: 'Schedule deleted successfully', id });
  } catch (error) {
    console.error(`Error deleting schedule ${req.params.id}:`, error);
    return res.status(500).json({ error: 'Failed to delete schedule' });
  }
};

// Toggle schedule enabled status
export const toggleSchedule = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid schedule ID format' });
    }
    
    const schedule = await Schedule.findById(id);
    
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    
    schedule.enabled = !schedule.enabled;
    await schedule.save();
    
    return res.status(200).json(schedule);
  } catch (error) {
    console.error(`Error toggling schedule ${req.params.id}:`, error);
    return res.status(500).json({ error: 'Failed to toggle schedule status' });
  }
};