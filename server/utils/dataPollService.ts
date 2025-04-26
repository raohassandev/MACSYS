import { readFromDevice } from "../controllers/modbusReader";
import { storage } from "../storage";
import { getDeviceCache } from "./configCache";

// Polling interval in milliseconds (default: 5 seconds)
const DEFAULT_POLL_INTERVAL = 5000;

// Disable mock mode to show actual device status
const MOCK_MODE = false; // Set to false to show device as unreachable when it's offline

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
 * Generate mock data for a device based on its registers
 * @param device The device to generate mock data for
 * @returns Mock data for the device
 */
function generateMockData(device: any): Record<string, number> {
  const data: Record<string, number> = {};
  
  if (!device.registers || !Array.isArray(device.registers)) {
    return data;
  }
  
  for (const register of device.registers) {
    // Skip if register doesn't have a name
    if (!register.name) continue;
    
    // Generate different types of mock data based on register name
    if (register.name.toLowerCase().includes('temperature')) {
      // Random temperature between 18-26°C
      data[register.name] = 18 + Math.random() * 8;
    } 
    else if (register.name.toLowerCase().includes('humidity')) {
      // Random humidity between 30-60%
      data[register.name] = 30 + Math.random() * 30;
    }
    else if (register.name.toLowerCase().includes('setpoint')) {
      // Random setpoint for temperature 19-25°C
      data[register.name] = 19 + Math.random() * 6;
    }
    else if (register.name.toLowerCase().includes('power')) {
      // Random power usage 100-500W
      data[register.name] = 100 + Math.random() * 400;
    }
    else if (register.name.toLowerCase().includes('energy')) {
      // Random energy 1-100kWh
      data[register.name] = 1 + Math.random() * 99;
    }
    else if (register.name.toLowerCase().includes('pressure')) {
      // Random pressure 1000-1020 hPa
      data[register.name] = 1000 + Math.random() * 20;
    }
    else if (register.name.toLowerCase().includes('speed') || register.name.toLowerCase().includes('fan')) {
      // Random speed 0-100%
      data[register.name] = Math.random() * 100;
    }
    else {
      // Default random value between 0-100
      data[register.name] = Math.random() * 100;
    }
    
    // Apply any scale factors and decimal points
    if (register.scaleFactor) {
      data[register.name] *= register.scaleFactor;
    }
    
    // Round to specified decimal places
    if (register.decimalPoint !== undefined) {
      const multiplier = Math.pow(10, register.decimalPoint);
      data[register.name] = Math.round(data[register.name] * multiplier) / multiplier;
    } else {
      // Default to 2 decimal places
      data[register.name] = Math.round(data[register.name] * 100) / 100;
    }
  }
  
  return data;
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
      let data = await readFromDevice(device);
      
      // If in mock mode and no data was received, generate mock data
      if (!data && MOCK_MODE) {
        console.log(`Generating mock data for ${device.name} (device offline)`);
        data = generateMockData(device);
      }
      
      // If we have data (real or mock), save it to the database
      if (data && Object.keys(data).length > 0) {
        // Data is available, mark device as online
        const isReal = !MOCK_MODE || data._isMockData !== true; // Track if data is real or mock
        await storage.saveRealtimeData(device.id, data, isReal);
        
        // Also save to historical data for trending
        await storage.saveHistoricalData(device.id, data);
        
        if (MOCK_MODE && !isReal) {
          console.log(`Mock data generated for ${device.name}`);
        } else {
          console.log(`Data polled successfully from ${device.name}`);
        }
      } else {
        // No data means device is offline and no mock data was generated
        await storage.saveRealtimeData(device.id, {}, false);
        console.log(`Failed to poll data from ${device.name}`);
      }
    } catch (error) {
      console.error(`Error polling device ${device.name}:`, error);
      
      // If there's an error and we're in mock mode, generate mock data
      if (MOCK_MODE) {
        try {
          console.log(`Generating mock data after error for ${device.name}`);
          const mockData = generateMockData(device);
          await storage.saveRealtimeData(device.id, mockData, false);
          await storage.saveHistoricalData(device.id, mockData);
          console.log(`Mock data generated for ${device.name} after connection error`);
        } catch (mockError) {
          console.error(`Error generating mock data for ${device.name}:`, mockError);
          
          // Last resort - mark the device as offline
          try {
            await storage.saveRealtimeData(device.id, {}, false);
          } catch (dbError) {
            console.error(`Error saving offline status for ${device.name}:`, dbError);
          }
        }
      } else {
        // If not in mock mode, mark the device as offline
        try {
          await storage.saveRealtimeData(device.id, {}, false);
        } catch (dbError) {
          console.error(`Error saving offline status for ${device.name}:`, dbError);
        }
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