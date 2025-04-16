import { useEffect, useState } from 'react';

import API from '../services/api';

type Device = {
  _id: string;
  name: string;
  ip: string;
  port: number;
};

const DeviceList = () => {
  const [devices, setDevices] = useState<Device[]>([]);

  const fetchDevices = async () => {
    const res = await API.get('/devices');
    setDevices(res.data);
  };

  const deleteDevice = async (id: string) => {
    await API.delete(`/devices/${id}`);
    fetchDevices();
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  return (
    <div>
      <h2 className='text-xl font-semibold mb-2'>Device List</h2>
      {devices.map((device) => (
        <div key={device._id} className='flex justify-between border p-2 mb-2'>
          <div>
            <p>
              <strong>{device.name}</strong>
            </p>
            <p>
              {device.ip}:{device.port}
            </p>
          </div>
          <button
            onClick={() => deleteDevice(device._id)}
            className='text-red-500'
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
};

export default DeviceList;
