import React, { useState } from 'react';

type Register = {
  address: number;
  dataType: string;
  scaleFactor: number;
  decimalPoint: number;
};

type Device = {
  name: string;
  ip: string;
  port: number;
  slaveId: number;
  setpoint: number;
  control: 'Remote' | 'Local';
  enabled: boolean;
  registers: Register[];
  status: boolean;
};

const defaultRegister: Register = {
  address: 0,
  dataType: 'int16',
  scaleFactor: 1,
  decimalPoint: 0,
};

const RegisterForm: React.FC<{
  register: Register;
  index: number;
  onChange: (index: number, field: keyof Register, value: any) => void;
  onRemove: (index: number) => void;
}> = ({ register, index, onChange, onRemove }) => (
  <div className="mb-4 bg-white rounded-lg shadow p-6">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
        <input
          type="number"
          value={register.address}
          onChange={(e) => onChange(index, 'address', Number(e.target.value))}
          className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Data Type</label>
        <select
          value={register.dataType}
          onChange={(e) => onChange(index, 'dataType', e.target.value)}
          className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="int16">int16</option>
          <option value="int32">int32</option>
          <option value="float">float</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Scale Factor</label>
        <input
          type="number"
          value={register.scaleFactor || 1}
          onChange={(e) => onChange(index, 'scaleFactor', Number(e.target.value))}
          className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Decimal Point</label>
        <input
          type="number"
          value={register.decimalPoint || 0}
          onChange={(e) => onChange(index, 'decimalPoint', Number(e.target.value))}
          className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>
    <div className="mt-4 flex justify-end">
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
      >
        Remove
      </button>
    </div>
  </div>
);

const DeviceForm: React.FC = () => {
  const [device, setDevice] = useState<Device>({
    name: '',
    ip: '192.168.1.111',
    port: 502,
    slaveId: 1,
    setpoint: 26,
    control: 'Remote',
    enabled: true,
    registers: [defaultRegister],
    status: true,
  });

  const handleChange = (field: keyof Device, value: any) => {
    setDevice({ ...device, [field]: value });
  };

  const handleRegisterChange = (index: number, field: keyof Register, value: any) => {
    const updated = [...device.registers];
    updated[index][field] = value;
    setDevice({ ...device, registers: updated });
  };

  const addRegister = () => {
    setDevice({ ...device, registers: [...device.registers, defaultRegister] });
  };

  const removeRegister = (index: number) => {
    const updated = [...device.registers];
    updated.splice(index, 1);
    setDevice({ ...device, registers: updated });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitted device config:', device);
    alert('Device configuration logged to console!');
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Device Name</label>
            <input
              type="text"
              value={device.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">IP Address</label>
            <input
              type="text"
              value={device.ip}
              onChange={(e) => handleChange('ip', e.target.value)}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Port</label>
            <input
              type="number"
              value={device.port}
              onChange={(e) => handleChange('port', Number(e.target.value))}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Set Point</label>
            <input
              type="number"
              value={device.setpoint}
              onChange={(e) => handleChange('setpoint', Number(e.target.value))}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <div className="mt-1">
              <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                device.status ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {device.status ? 'Running' : 'Not Running'}
              </span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slave ID</label>
            <input
              type="number"
              value={device.slaveId}
              onChange={(e) => handleChange('slaveId', Number(e.target.value))}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Control</label>
            <select
              value={device.control}
              onChange={(e) => handleChange('control', e.target.value as 'Remote' | 'Local')}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Remote">Remote</option>
              <option value="Local">Local</option>
            </select>
          </div>
          <div className="flex items-center mt-6">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={device.enabled}
                onChange={(e) => handleChange('enabled', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">Enabled</span>
            </label>
          </div>
        </div>
      </div>

      <h3 className="text-lg font-medium text-gray-900 mb-4">Registers</h3>
      {device.registers.map((reg, idx) => (
        <RegisterForm
          key={idx}
          register={reg}
          index={idx}
          onChange={handleRegisterChange}
          onRemove={removeRegister}
        />
      ))}

      <button
        type="button"
        onClick={addRegister}
        className="mb-6 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Add Register
      </button>

      <div className="flex justify-end">
        <button
          type="submit"
          className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Save Device
        </button>
      </div>
    </form>
  );
};

export default DeviceForm;