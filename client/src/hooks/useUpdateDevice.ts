import { useState } from 'react';
import { Device } from '../types';
import { toast } from '@/hooks/use-toast';

export function useUpdateDevice() {
  const [isUpdating, setIsUpdating] = useState(false);

  const updateDevice = async (id: string, deviceData: Partial<Device>): Promise<boolean> => {
    setIsUpdating(true);
    
    try {
      const response = await fetch(`/api/devices/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(deviceData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update device');
      }

      // Invalidate the device cache to force a refetch
      // This is a simple way to ensure the UI updates with the latest data
      await fetch('/api/devices/cache/refresh', {
        method: 'POST',
      });

      return true;
    } catch (error) {
      console.error('Error updating device:', error);
      toast({
        title: 'Failed to update device',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  return { updateDevice, isUpdating };
}