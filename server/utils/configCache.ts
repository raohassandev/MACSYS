import { IDevice } from "../models";
import { storage } from "../storage";

// Cache of device configurations
let deviceCache: IDevice[] = [];

/**
 * Updates the device cache with the current device configurations
 */
export async function updateDeviceCache(): Promise<void> {
  try {
    const devices = await storage.getAllDevices();
    // FIXME: DISABLE OR REMOVE THIS DEBUG CONSOLE LOG
    // console.log("Total enabled devices:", devices.filter(d => d.enabled).length);
    
    const changed = JSON.stringify(devices) !== JSON.stringify(deviceCache);
    if (changed) {
      deviceCache = devices;
      console.log(`[${new Date().toISOString()}] Device config updated.`);
    }
  } catch (error) {
    console.error("Error fetching device config:", error);
  }
}

/**
 * Returns the current device cache
 * @returns Array of devices
 */
export function getDeviceCache(): IDevice[] {
  return deviceCache;
}
