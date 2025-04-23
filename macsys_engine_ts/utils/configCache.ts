import Device, { DeviceDocument } from '../models/Device.js';

let deviceCache: DeviceDocument[] = [];

export async function updateDeviceCache(): Promise<void> {
  try {
    const devices = await Device.find({ enabled: true });
    const changed = JSON.stringify(devices) !== JSON.stringify(deviceCache);
    if (changed) {
      deviceCache = devices;
      console.log(`[${new Date().toISOString()}] Device config updated.`);
    }
  } catch (error) {
    console.error('Error fetching device config:', (error as Error).message);
  }
}

export function getDeviceCache(): DeviceDocument[] {
  return deviceCache;
}