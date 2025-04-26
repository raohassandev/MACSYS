import { readFromDevice } from "../controllers/modbusReader";
import { storage } from "../storage";
import { getDeviceCache } from "./configCache";

// Polling interval in milliseconds (default: 5 seconds)
const DEFAULT_POLL_INTERVAL = 5000;

// Track if the polling service is running
let isPolling = false;

// Track interval IDs for each device to be able to stop specific device polling
const pollingIntervals: Record<string, NodeJS.Timeout> = {};

/**
 * Start polling data from all enabled devices
 */
export function startPollingService(): void {
  if (isPolling) {
    console.log("Polling service is already running");
    return;
  }

  console.log("Starting data polling service");
  isPolling = true;
  
  // Get the list of devices from the cache and start polling for each enabled device
  const devices = getDeviceCache();
  
  for (const device of devices) {
    if (device.enabled) {
      startDevicePolling(device);
    }
  }
  
  console.log(`Started polling for ${Object.keys(pollingIntervals).length} devices`);
}

/**
 * Start polling for a specific device
 * @param device The device to poll
 */
export function startDevicePolling(device: any): void {
  if (!device || !device.enabled) {
    return;
  }
  
  // Clear existing polling interval if any
  if (pollingIntervals[device.id]) {
    clearInterval(pollingIntervals[device.id]);
    delete pollingIntervals[device.id];
  }
  
  console.log(`Starting polling for device: ${device.name}`);
  
  // Get the polling interval from device config or use default
  const pollInterval = device.pollInterval || DEFAULT_POLL_INTERVAL;
  
  // Create a new polling interval
  pollingIntervals[device.id] = setInterval(async () => {
    try {
      // Read data from the device
      const data = await readFromDevice(device);
      
      // If we got data, save it to the database
      if (data) {
        // Data was successfully read, so device is online
        await storage.saveRealtimeData(device.id, data, true);
        
        // Also save to historical data for trending
        await storage.saveHistoricalData(device.id, data);
        
        console.log(`Data polled successfully from ${device.name}`);
      } else {
        // No data means device is offline
        await storage.saveRealtimeData(device.id, {}, false);
        console.log(`Failed to poll data from ${device.name}`);
      }
    } catch (error) {
      console.error(`Error polling device ${device.name}:`, error);
      
      // If there's an error, mark the device as offline
      try {
        await storage.saveRealtimeData(device.id, {}, false);
      } catch (dbError) {
        console.error(`Error saving offline status for ${device.name}:`, dbError);
      }
    }
  }, pollInterval);
  
  console.log(`Polling started for ${device.name} at interval ${pollInterval}ms`);
}

/**
 * Stop polling for a specific device
 * @param deviceId ID of the device to stop polling
 */
export function stopDevicePolling(deviceId: string): void {
  if (pollingIntervals[deviceId]) {
    clearInterval(pollingIntervals[deviceId]);
    delete pollingIntervals[deviceId];
    console.log(`Stopped polling for device ID: ${deviceId}`);
  }
}

/**
 * Restart polling for a specific device (useful after configuration changes)
 * @param device The device to restart polling for
 */
export function restartDevicePolling(device: any): void {
  // Stop current polling if active
  stopDevicePolling(device.id);
  
  // Start polling if device is enabled
  if (device.enabled) {
    startDevicePolling(device);
  }
}

/**
 * Stop all device polling
 */
export function stopPollingService(): void {
  if (!isPolling) {
    return;
  }
  
  console.log("Stopping data polling service");
  
  // Clear all polling intervals
  for (const deviceId in pollingIntervals) {
    clearInterval(pollingIntervals[deviceId]);
    delete pollingIntervals[deviceId];
  }
  
  isPolling = false;
  console.log("Data polling service stopped");
}

/**
 * Update polling configuration when device settings change
 * This should be called after device cache updates
 */
export function updatePollingConfig(): void {
  console.log("Updating polling configuration");
  
  const devices = getDeviceCache();
  const activeDeviceIds = new Set<string>();
  
  // Start/restart polling for enabled devices
  for (const device of devices) {
    activeDeviceIds.add(device.id);
    
    if (device.enabled) {
      // If already polling, restart it to pick up any config changes
      if (pollingIntervals[device.id]) {
        restartDevicePolling(device);
      } else {
        startDevicePolling(device);
      }
    } else {
      // Stop polling for disabled devices
      stopDevicePolling(device.id);
    }
  }
  
  // Clean up polling for any devices that no longer exist
  for (const deviceId in pollingIntervals) {
    if (!activeDeviceIds.has(deviceId)) {
      stopDevicePolling(deviceId);
    }
  }
  
  console.log(`Updated polling configuration. Active polling for ${Object.keys(pollingIntervals).length} devices`);
}