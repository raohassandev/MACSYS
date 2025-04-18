import { useEffect, useState } from 'react';

import API from '../services/api';
import { TemperatureGauge } from './TemperatureGauge';

interface DeviceData {
  _id: string;
  device: string;
  data: {
    temperature: number;
    setpoint?: number;
    status?: string;
    control?: string;
  };
  timestamp: string;
}

function RealtimeData() {
  const [deviceList, setDeviceList] = useState<DeviceData[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchRealtimeData();
    }, 1000);
    fetchRealtimeData();
    return () => clearInterval(interval);
  }, []);

  const fetchRealtimeData = async () => {
    try {
      const res = await API.get('/latest');
      setDeviceList(res.data);
      console.log(res.data);
    } catch (error) {
      console.log('Error fetching realtime data:', error);
    }
  };

  return (
    <div className='p-6'>
      <h2 className='text-2xl font-bold mb-6'>Realtime Device Data</h2>
      <div
        style={{
          width: 300,
          display: 'flex',
          direction: 'ltr',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
          padding: '1rem',
          borderRadius: '8px',
          backgroundColor: '#fff',
        }}
      >
        {deviceList.map((device) => (
          <div
            key={device._id}
            className='bg-white shadow-md rounded-2xl p-4 max-w-sm w-full flex flex-col items-center'
          >
            <h3 className='text-lg font-semibold mb-2'>{device.device}</h3>
            <TemperatureGauge temperature={device.data.temperature} />
            <div className='mt-4 w-full text-sm text-gray-700 space-y-1'>
              <p>
                <strong>Setpoint:</strong> {device.data.setpoint ?? '--'}°C
              </p>
              <p>
                <strong>Status:</strong> {device.data.status ?? 'Unknown'}
              </p>
              <p>
                <strong>Control:</strong> {device.data.control ?? 'Local'}
              </p>
              <p className='text-gray-400 text-xs'>
                Last updated: {new Date(device.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RealtimeData;
