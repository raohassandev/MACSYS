import Device from '../models/Device.js';

let deviceCache = [];

export async function updateDeviceCache() {
  try {
    const devices = await Device.find({ enabled: true });
    //FIXME: DISABLE OR REMOVE THIS DEBUG CONSOLE LOG
    console.log('Total enabled devices', devices.length);
    const changed = JSON.stringify(devices) !== JSON.stringify(deviceCache);
    if (changed) {
      deviceCache = devices;
      console.log(`[${new Date().toISOString()}] Device config updated.`);
    }
  } catch (error) {
    console.error('Error fetching device config:', error);
  }
}

export function getDeviceCache() {
  return deviceCache;
}
