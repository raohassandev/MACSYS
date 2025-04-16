import { ChangeEvent, FormEvent, useEffect, useState } from 'react';

import API from '../services/api';

// export default DeviceForm;

// Define TypeScript interfaces
interface Register {
  name: string;
  address: number;
  length: number;
  scaleFactor: number;
  decimalPoint: number;
  byteOrder: string;
}

interface Device {
  _id?: string;
  name: string;
  ip: string;
  port: number | string;
  slaveId: number;
  enabled: boolean;
  registers: Register[];
}

export default function DeviceForm() {
  const [deviceType, setDeviceType] = useState<'TCP' | 'RTU'>('TCP');
  const [editMode, setEditMode] = useState<boolean>(false);
  const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Sample existing devices
  // const [devices, setDevices] = useState<Device[]>([
  //   {
  //     id: '1',
  //     name: 'Temperature Controller',
  //     ip: '192.168.1.100',
  //     port: 502,
  //     slaveId: 1,
  //     enabled: true,
  //     registers: [
  //       {
  //         name: 'Temperature',
  //         address: 100,
  //         length: 1,
  //         scaleFactor: 0.1,
  //         decimalPoint: 1,
  //         byteOrder: 'AB CD',
  //       },
  //       {
  //         name: 'Humidity',
  //         address: 102,
  //         length: 1,
  //         scaleFactor: 0.1,
  //         decimalPoint: 1,
  //         byteOrder: 'AB CD',
  //       },
  //     ],
  //   },
  //   {
  //     id: '2',
  //     name: 'Flow Meter',
  //     ip: '192.168.1.101',
  //     port: 502,
  //     slaveId: 2,
  //     enabled: true,
  //     registers: [
  //       {
  //         name: 'Flow Rate',
  //         address: 200,
  //         length: 2,
  //         scaleFactor: 0.01,
  //         decimalPoint: 2,
  //         byteOrder: 'CD AB',
  //       },
  //     ],
  //   },
  // ]);
  const [devices, setDevices] = useState<Device[]>([]);

  const [registers, setRegisters] = useState<Register[]>([
    {
      name: '',
      address: 0,
      length: 1,
      scaleFactor: 1,
      decimalPoint: 2,
      byteOrder: 'AB CD',
    },
  ]);

  const [device, setDevice] = useState<Omit<Device, 'id' | 'registers'>>({
    name: '',
    ip: '192.168.1.100',
    port: 502,
    slaveId: 1,
    enabled: true,
  });

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 10000); // refresh every 10 sec
    return () => clearInterval(interval);
  }, []);

  const fetchDevices = async () => {
    try {
      const res = await API.get('/getDevices');
      setDevices(res.data);
    } catch (err) {
      console.error('Failed to fetch devices', err);
    }
  };

  const validateIpAddress = (ip: string): boolean => {
    const ipRegex =
      /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(ip);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Validate device name
    if (!device.name.trim()) {
      errors.name = 'Device name is required';
    }

    // Validate IP address for TCP
    if (deviceType === 'TCP' && !validateIpAddress(device.ip)) {
      errors.ip = 'Valid IP address is required';
    }

    // Validate port
    if (
      typeof device.port === 'number' &&
      (device.port < 1 || device.port > 65535)
    ) {
      errors.port = 'Port must be between 1 and 65535';
    }

    // Validate slave ID
    if (device.slaveId < 1 || device.slaveId > 255) {
      errors.slaveId = 'Slave ID must be between 1 and 255';
    }

    // Validate registers
    const registerErrors: Record<string, Record<string, string>> = {};

    registers.forEach((register, index) => {
      const regErrors: Record<string, string> = {};

      if (!register.name.trim()) {
        regErrors.name = 'Register name is required';
      }

      if (register.address < 0) {
        regErrors.address = 'Address must be positive';
      }

      if (register.length < 1 || register.length > 125) {
        regErrors.length = 'Length must be between 1 and 125';
      }

      if (register.decimalPoint < 0 || register.decimalPoint > 10) {
        regErrors.decimalPoint = 'Decimal point must be between 0 and 10';
      }

      if (Object.keys(regErrors).length > 0) {
        registerErrors[`register-${index}`] = regErrors;
      }
    });

    if (Object.keys(registerErrors).length > 0) {
      errors.registers = JSON.stringify(registerErrors);
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleDeviceChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setDevice({
      ...device,
      [name]:
        type === 'checkbox'
          ? checked
          : name === 'port' || name === 'slaveId'
          ? Number(value)
          : value,
    });

    // Clear error for this field when user changes it
    if (formErrors[name]) {
      const updatedErrors = { ...formErrors };
      delete updatedErrors[name];
      setFormErrors(updatedErrors);
    }
  };

  const handleRegisterChange = (
    index: number,
    field: keyof Register,
    value: string | number
  ) => {
    const updatedRegisters = [...registers];

    if (field === 'name' || field === 'byteOrder') {
      updatedRegisters[index] = {
        ...updatedRegisters[index],
        [field]: value as string,
      };
    } else {
      updatedRegisters[index] = {
        ...updatedRegisters[index],
        [field]: Number(value),
      };
    }

    setRegisters(updatedRegisters);

    // Clear register error when changed
    if (formErrors.registers) {
      const registerErrors = JSON.parse(formErrors.registers);
      if (registerErrors[`register-${index}`]?.[field]) {
        delete registerErrors[`register-${index}`][field];

        if (Object.keys(registerErrors[`register-${index}`]).length === 0) {
          delete registerErrors[`register-${index}`];
        }

        if (Object.keys(registerErrors).length === 0) {
          const updatedErrors = { ...formErrors };
          delete updatedErrors.registers;
          setFormErrors(updatedErrors);
        } else {
          setFormErrors({
            ...formErrors,
            registers: JSON.stringify(registerErrors),
          });
        }
      }
    }
  };

  const addRegister = () => {
    setRegisters([
      ...registers,
      {
        name: '',
        address: 0,
        length: 1,
        scaleFactor: 1,
        decimalPoint: 2,
        byteOrder: 'AB CD',
      },
    ]);
  };

  const removeRegister = (index: number) => {
    const updatedRegisters = registers.filter((_, i) => i !== index);
    setRegisters(updatedRegisters);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const deviceData: Device = {
      ...device,
      registers,
    };
    if (editMode && currentDeviceId) {
      deviceData._id = currentDeviceId;
      try {
        const res = await API.put(`/updateDevice`, deviceData);
        // setName('');
        // setIp('');
        // setPort('');
        console.log(res.data);
        fetchDevices();
      } catch (error) {
        console.log(error);
      }
    } else {
      try {
        const res = await API.post('/addDevice', deviceData);
        console.log(res.data);
        // setName('');
        // setIp('');
        // setPort('');
        fetchDevices();
      } catch (error) {
        console.log(error);
      }
    }
    resetForm();
  };

  const resetForm = () => {
    setDevice({
      name: '',
      ip: '192.168.1.100',
      port: 502,
      slaveId: 1,
      enabled: true,
    });
    setRegisters([
      {
        name: '',
        address: 0,
        length: 1,
        scaleFactor: 1,
        decimalPoint: 2,
        byteOrder: 'AB CD',
      },
    ]);
    setEditMode(false);
    setCurrentDeviceId(null);
    setShowForm(false);
    setFormErrors({});
  };

  const editDevice = (id: string) => {
    const deviceToEdit = devices.find((d) => d._id === id);
    if (deviceToEdit) {
      const { registers: deviceRegisters, ...deviceInfo } = deviceToEdit;

      setDevice(deviceInfo);
      setRegisters(deviceRegisters);
      setEditMode(true);
      setCurrentDeviceId(id);
      setShowForm(true);
      setFormErrors({});

      // Set correct device type based on IP existence
      if (deviceToEdit.ip) {
        setDeviceType('TCP');
      } else {
        setDeviceType('RTU');
      }
    }
  };

  const deleteDevice = (id: string) => {
    if (window.confirm('Are you sure you want to delete this device?')) {
      setDevices(devices.filter((d) => d._id !== id));
    }
  };

  const getRegisterErrorMessage = (index: number, field: string): string => {
    if (!formErrors.registers) return '';

    try {
      const registerErrors = JSON.parse(formErrors.registers);
      return registerErrors[`register-${index}`]?.[field] || '';
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      return '';
    }
  };

  return (
    <div style={{ margin: 16 }}>
      <div className='max-w-6xl mx-auto p-4 bg-white rounded-lg shadow-lg '>
        <div className='flex justify-between items-center mb-4'>
          <h1 className='text-xl font-bold text-gray-800'>
            Modbus Devices Management
          </h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className='px-4 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
          >
            {showForm ? 'Close Form' : 'Add New Device'}
          </button>
        </div>

        {/* Device List */}
        <div className='mb-6'>
          <h2 className='text-lg font-semibold mb-2 text-gray-700'>
            Existing Devices
          </h2>
          <div className='overflow-x-auto bg-gray-50 rounded-lg'>
            <table className='min-w-full text-sm'>
              <thead>
                <tr className='bg-gray-100'>
                  <th className='text-left p-2'>Name</th>
                  <th className='text-left p-2'>Connection</th>
                  <th className='text-left p-2'>Slave ID</th>
                  <th className='text-left p-2'>Registers</th>
                  <th className='text-left p-2'>Status</th>
                  <th className='text-right p-2'>Actions</th>
                </tr>
              </thead>
              <tbody>
                {devices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className='p-2 text-center text-gray-500'>
                      No devices configured
                    </td>
                  </tr>
                ) : (
                  devices.map((device) => (
                    <tr
                      key={device._id}
                      className='border-t border-gray-200 hover:bg-gray-100'
                    >
                      <td className='p-2'>{device.name}</td>
                      <td className='p-2'>
                        {device.ip ? `${device.ip}:${device.port}` : 'RTU Port'}
                      </td>
                      <td className='p-2'>{device.slaveId}</td>
                      <td className='p-2'>{device.registers.length}</td>
                      <td className='p-2'>
                        <span
                          className={`inline-block w-2 h-2 rounded-full ${
                            device.enabled ? 'bg-green-500' : 'bg-red-500'
                          }`}
                        ></span>
                        <span className='ml-1'>
                          {device.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </td>
                      <td className='p-2 text-right space-x-2'>
                        <button
                          onClick={() => editDevice(device._id || '')}
                          className='text-blue-500 hover:text-blue-700'
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteDevice(device._id || '')}
                          className='text-red-500 hover:text-red-700'
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='bg-gray-50 p-3 rounded-lg'>
              <div className='flex items-center justify-between mb-2'>
                <h2 className='text-lg font-semibold text-gray-700'>
                  {editMode ? 'Edit Device' : 'Add New Device'}
                </h2>
                <div className='flex space-x-3'>
                  <label className='inline-flex items-center'>
                    <input
                      type='radio'
                      className='form-radio h-4 w-4 text-blue-600'
                      checked={deviceType === 'TCP'}
                      onChange={() => setDeviceType('TCP')}
                    />
                    <span className='ml-1 text-sm text-gray-700'>
                      Modbus TCP
                    </span>
                  </label>
                  <label className='inline-flex items-center'>
                    <input
                      type='radio'
                      className='form-radio h-4 w-4 text-blue-600'
                      checked={deviceType === 'RTU'}
                      onChange={() => setDeviceType('RTU')}
                    />
                    <span className='ml-1 text-sm text-gray-700'>
                      Modbus RTU
                    </span>
                  </label>
                </div>
              </div>

              {/* Basic Device Information - Compact Layout */}
              <div className='grid grid-cols-2 md:grid-cols-4 gap-3 mb-3'>
                <div>
                  <label className='block text-xs text-gray-700 font-medium mb-1'>
                    Device Name
                  </label>
                  <input
                    type='text'
                    name='name'
                    value={device.name}
                    onChange={handleDeviceChange}
                    className={`w-full px-2 py-1 text-sm border ${
                      formErrors.name ? 'border-red-500' : 'border-gray-300'
                    } rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500`}
                    placeholder='Enter device name'
                  />
                  {formErrors.name && (
                    <p className='text-red-500 text-xs mt-1'>
                      {formErrors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className='block text-xs text-gray-700 font-medium mb-1'>
                    Slave ID
                  </label>
                  <input
                    type='number'
                    name='slaveId'
                    value={device.slaveId}
                    onChange={handleDeviceChange}
                    className={`w-full px-2 py-1 text-sm border ${
                      formErrors.slaveId ? 'border-red-500' : 'border-gray-300'
                    } rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500`}
                    min='1'
                    max='255'
                  />
                  {formErrors.slaveId && (
                    <p className='text-red-500 text-xs mt-1'>
                      {formErrors.slaveId}
                    </p>
                  )}
                </div>

                {deviceType === 'TCP' ? (
                  <>
                    <div>
                      <label className='block text-xs text-gray-700 font-medium mb-1'>
                        IP Address
                      </label>
                      <input
                        type='text'
                        name='ip'
                        value={device.ip}
                        onChange={handleDeviceChange}
                        className={`w-full px-2 py-1 text-sm border ${
                          formErrors.ip ? 'border-red-500' : 'border-gray-300'
                        } rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500`}
                        placeholder='192.168.1.100'
                      />
                      {formErrors.ip && (
                        <p className='text-red-500 text-xs mt-1'>
                          {formErrors.ip}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className='block text-xs text-gray-700 font-medium mb-1'>
                        Port
                      </label>
                      <input
                        type='number'
                        name='port'
                        value={device.port}
                        onChange={handleDeviceChange}
                        className={`w-full px-2 py-1 text-sm border ${
                          formErrors.port ? 'border-red-500' : 'border-gray-300'
                        } rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500`}
                        min='1'
                        max='65535'
                      />
                      {formErrors.port && (
                        <p className='text-red-500 text-xs mt-1'>
                          {formErrors.port}
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className='block text-xs text-gray-700 font-medium mb-1'>
                        Serial Port
                      </label>
                      <select
                        name='port'
                        value={device.port as string}
                        onChange={handleDeviceChange}
                        className='w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500'
                      >
                        <option value='COM1'>COM1</option>
                        <option value='COM2'>COM2</option>
                        <option value='COM3'>COM3</option>
                        <option value='/dev/ttyS0'>/dev/ttyS0</option>
                        <option value='/dev/ttyS1'>/dev/ttyS1</option>
                        <option value='/dev/ttyUSB0'>/dev/ttyUSB0</option>
                      </select>
                    </div>
                    <div className='grid grid-cols-2 gap-2'>
                      <div>
                        <label className='block text-xs text-gray-700 font-medium mb-1'>
                          Baud Rate
                        </label>
                        <select
                          name='baudRate'
                          className='w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500'
                        >
                          <option value='9600'>9600</option>
                          <option value='19200'>19200</option>
                          <option value='38400'>38400</option>
                          <option value='57600'>57600</option>
                          <option value='115200'>115200</option>
                        </select>
                      </div>
                      <div>
                        <label className='block text-xs text-gray-700 font-medium mb-1'>
                          Parity
                        </label>
                        <select
                          name='parity'
                          className='w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500'
                        >
                          <option value='none'>None</option>
                          <option value='even'>Even</option>
                          <option value='odd'>Odd</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Register Settings - More compact */}
            <div className='bg-gray-50 p-3 rounded-lg'>
              <div className='flex justify-between items-center mb-3'>
                <h2 className='text-lg font-semibold text-gray-700'>
                  Register Settings
                </h2>
                <button
                  type='button'
                  onClick={addRegister}
                  className='px-3 py-1 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-1 focus:ring-blue-500'
                >
                  Add Register
                </button>
              </div>

              <div className='overflow-x-auto'>
                <table className='min-w-full text-sm'>
                  <thead>
                    <tr className='bg-gray-100'>
                      <th className='p-1 text-left'>Name</th>
                      <th className='p-1 text-left'>Address</th>
                      <th className='p-1 text-left'>Length</th>
                      <th className='p-1 text-left'>Scale Factor</th>
                      <th className='p-1 text-left'>Decimal Point</th>
                      <th className='p-1 text-left'>Byte Order</th>
                      <th className='p-1 text-left'>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registers.map((register, index) => (
                      <tr key={index} className='border-t border-gray-200'>
                        <td className='p-1'>
                          <input
                            type='text'
                            value={register.name}
                            onChange={(e) =>
                              handleRegisterChange(
                                index,
                                'name',
                                e.target.value
                              )
                            }
                            className={`w-full px-2 py-1 text-sm border ${
                              getRegisterErrorMessage(index, 'name')
                                ? 'border-red-500'
                                : 'border-gray-300'
                            } rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500`}
                            placeholder='Temperature'
                          />
                          {getRegisterErrorMessage(index, 'name') && (
                            <p className='text-red-500 text-xs mt-1'>
                              {getRegisterErrorMessage(index, 'name')}
                            </p>
                          )}
                        </td>
                        <td className='p-1'>
                          <input
                            type='number'
                            value={register.address}
                            onChange={(e) =>
                              handleRegisterChange(
                                index,
                                'address',
                                e.target.value
                              )
                            }
                            className={`w-full px-2 py-1 text-sm border ${
                              getRegisterErrorMessage(index, 'address')
                                ? 'border-red-500'
                                : 'border-gray-300'
                            } rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500`}
                            min='0'
                          />
                          {getRegisterErrorMessage(index, 'address') && (
                            <p className='text-red-500 text-xs mt-1'>
                              {getRegisterErrorMessage(index, 'address')}
                            </p>
                          )}
                        </td>
                        <td className='p-1'>
                          <input
                            type='number'
                            value={register.length}
                            onChange={(e) =>
                              handleRegisterChange(
                                index,
                                'length',
                                e.target.value
                              )
                            }
                            className={`w-20 px-2 py-1 text-sm border ${
                              getRegisterErrorMessage(index, 'length')
                                ? 'border-red-500'
                                : 'border-gray-300'
                            } rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500`}
                            min='1'
                            max='125'
                          />
                          {getRegisterErrorMessage(index, 'length') && (
                            <p className='text-red-500 text-xs mt-1'>
                              {getRegisterErrorMessage(index, 'length')}
                            </p>
                          )}
                        </td>
                        <td className='p-1'>
                          <input
                            type='number'
                            value={register.scaleFactor}
                            onChange={(e) =>
                              handleRegisterChange(
                                index,
                                'scaleFactor',
                                e.target.value
                              )
                            }
                            className={`w-20 px-2 py-1 text-sm border ${
                              getRegisterErrorMessage(index, 'scaleFactor')
                                ? 'border-red-500'
                                : 'border-gray-300'
                            } rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500`}
                            step='0.001'
                          />
                          {getRegisterErrorMessage(index, 'scaleFactor') && (
                            <p className='text-red-500 text-xs mt-1'>
                              {getRegisterErrorMessage(index, 'scaleFactor')}
                            </p>
                          )}
                        </td>
                        <td className='p-1'>
                          <input
                            type='number'
                            value={register.decimalPoint}
                            onChange={(e) =>
                              handleRegisterChange(
                                index,
                                'decimalPoint',
                                e.target.value
                              )
                            }
                            className={`w-16 px-2 py-1 text-sm border ${
                              getRegisterErrorMessage(index, 'decimalPoint')
                                ? 'border-red-500'
                                : 'border-gray-300'
                            } rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500`}
                            min='0'
                            max='10'
                          />
                          {getRegisterErrorMessage(index, 'decimalPoint') && (
                            <p className='text-red-500 text-xs mt-1'>
                              {getRegisterErrorMessage(index, 'decimalPoint')}
                            </p>
                          )}
                        </td>
                        <td className='p-1'>
                          <select
                            value={register.byteOrder}
                            onChange={(e) =>
                              handleRegisterChange(
                                index,
                                'byteOrder',
                                e.target.value
                              )
                            }
                            className='w-24 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500'
                          >
                            <option value='AB CD'>AB CD</option>
                            <option value='CD AB'>CD AB</option>
                            <option value='BA DC'>BA DC</option>
                            <option value='DC BA'>DC BA</option>
                          </select>
                        </td>
                        <td className='p-1'>
                          <button
                            type='button'
                            onClick={() => removeRegister(index)}
                            className='text-xs text-red-500 hover:text-red-700'
                            disabled={registers.length === 1}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Device Status */}
            <div className='flex items-center'>
              <input
                type='checkbox'
                name='enabled'
                id='enabled'
                checked={device.enabled}
                onChange={handleDeviceChange}
                className='h-4 w-4 text-blue-600 rounded focus:ring-blue-500'
              />
              <label htmlFor='enabled' className='ml-2 text-sm text-gray-700'>
                Enable device
              </label>
            </div>

            {/* Form Controls */}
            <div className='flex justify-end space-x-3'>
              <button
                type='button'
                onClick={resetForm}
                className='px-4 py-1 text-sm border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500'
              >
                Cancel
              </button>
              <button
                type='submit'
                className='px-4 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500'
              >
                {editMode ? 'Update Device' : 'Save Device'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
