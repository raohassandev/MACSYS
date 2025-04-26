import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

type SetpointStatus = 'idle' | 'pending' | 'success' | 'error';

export function useSetpoint() {
  const [status, setStatus] = useState<SetpointStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const setDeviceSetpoint = async (deviceId: string, registerName: string, value: number) => {
    console.log(`Setting setpoint: deviceId=${deviceId}, registerName=${registerName}, value=${value}`);
    setStatus('pending');
    setError(null);
    
    try {
      // Check inputs
      if (!deviceId) {
        throw new Error('Device ID is required');
      }
      
      if (!registerName) {
        throw new Error('Register name is required');
      }
      
      if (value === undefined || value === null) {
        throw new Error('Setpoint value is required');
      }
      
      const payload = { registerName, value };
      console.log(`Sending payload:`, payload);
      
      const response = await fetch(`/api/devices/${deviceId}/setpoint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      console.log(`Response status:`, response.status);
      
      // Try to parse the JSON response, but handle cases where it might fail
      let data;
      try {
        data = await response.json();
        console.log(`Response data:`, data);
      } catch (jsonError) {
        console.error('Error parsing response JSON:', jsonError);
        data = { success: false, message: 'Invalid response from server' };
      }
      
      // Check response status
      if (!response.ok) {
        console.error(`Error response:`, data);
        throw new Error(data?.message || `Failed to set setpoint (Status: ${response.status})`);
      }
      
      // Check success flag in response data
      if (data && data.success === false) {
        console.error(`Operation failed:`, data);
        throw new Error(data.message || 'Failed to set setpoint');
      }
      
      // Success
      console.log(`Setpoint updated successfully`);
      setStatus('success');
      toast({
        title: "Setpoint updated",
        description: `Successfully set ${registerName} to ${value}`,
        variant: "default",
      });
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error(`Setpoint error:`, errorMessage);
      setError(errorMessage);
      setStatus('error');
      toast({
        title: "Failed to update setpoint",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    setDeviceSetpoint,
    status,
    error,
    isPending: status === 'pending',
    isSuccess: status === 'success',
    isError: status === 'error',
  };
}