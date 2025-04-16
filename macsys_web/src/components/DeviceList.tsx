import { useEffect, useState } from 'react';

import API from '../services/api';

type Device = {
  _id: string;
  name: string;
  ip: string;
  port: number;
  enabled?: boolean;
  status?: 'online' | 'offline' | 'error';
};

const DeviceList = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDevices = async () => {
    try {
      setIsLoading(true);
      const res = await API.get('/getDevices');
      setDevices(res.data);
    } catch (error) {
      console.error('Failed to fetch devices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteDevice = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this device?')) return;
    
    try {
      await API.delete(`/devices/${id}`);
      fetchDevices();
    } catch (error) {
      console.error('Failed to delete device:', error);
    }
  };

  useEffect(() => {
    fetchDevices();
    // Auto refresh every 30 seconds
    const interval = setInterval(fetchDevices, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Device List</h2>
        <button 
          onClick={() => fetchDevices()} 
          className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors duration-200 flex items-center gap-2 shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {devices.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-100">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 13h.01M12 21a9 9 0 110-18 9 9 0 010 18z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No devices found</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by adding a new device.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {devices.map((device) => (
            <div 
              key={device._id} 
              className="relative bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="absolute top-4 right-4">
                <div className={`h-3 w-3 rounded-full ${
                  device.status === 'online' ? 'bg-emerald-500' :
                  device.status === 'error' ? 'bg-rose-500' :
                  'bg-gray-400'
                }`}></div>
              </div>
              
              <div className="p-5">
                <div className="flex flex-col gap-2">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {device.name}
                  </h3>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    {device.ip}:{device.port}
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {device.enabled ? 'Enabled' : 'Disabled'}
                  </div>
                </div>

                <div className="mt-4 flex justify-end gap-2 border-t pt-4">
                  <button 
                    className="px-4 py-2 text-sm font-medium bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100 transition-colors duration-200"
                    onClick={() => {/* Add edit functionality */}}
                  >
                    Edit
                  </button>
                  <button 
                    className="px-4 py-2 text-sm font-medium bg-rose-50 text-rose-700 rounded-md hover:bg-rose-100 transition-colors duration-200"
                    onClick={() => deleteDevice(device._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DeviceList;
