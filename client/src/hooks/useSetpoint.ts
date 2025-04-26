import { useState } from 'react';

type SetpointStatus = 'idle' | 'pending' | 'success' | 'error';

export function useSetpoint() {
  const [status, setStatus] = useState<SetpointStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const setDeviceSetpoint = async (deviceId: string, registerName: string, value: number) => {
    setStatus('pending');
    setError(null);
    
    try {
      const response = await fetch(`/api/devices/${deviceId}/setpoint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ registerName, value }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to set setpoint');
      }
      
      setStatus('success');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setStatus('error');
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