import { Button, Card, Col, Form, Row } from 'react-bootstrap';
// DeviceForm.tsx (Updated with setpoint, control, and reusable components)
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
  <Card className='mb-3'>
    <Card.Body>
      <Row>
        <Col md={3}>
          <Form.Group controlId={`address-${index}`}>
            <Form.Label>Address</Form.Label>
            <Form.Control
              type='number'
              value={register.address}
              onChange={(e: { target: { value: any; }; }) =>
                onChange(index, 'address', Number(e.target.value))
              }
            />
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Group controlId={`dataType-${index}`}>
            <Form.Label>Data Type</Form.Label>
            <Form.Select
              value={register.dataType}
              onChange={(e: { target: { value: any; }; }) => onChange(index, 'dataType', e.target.value)}
            >
              <option value='int16'>int16</option>
              <option value='int32'>int32</option>
              <option value='float'>float</option>
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Group controlId={`scaleFactor-${index}`}>
            <Form.Label>Scale Factor</Form.Label>
            <Form.Control
              type='number'
              value={register.scaleFactor}
              onChange={(e: { target: { value: any; }; }) =>
                onChange(index, 'scaleFactor', Number(e.target.value))
              }
            />
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Group controlId={`decimalPoint-${index}`}>
            <Form.Label>Decimal Point</Form.Label>
            <Form.Control
              type='number'
              value={register.decimalPoint}
              onChange={(e: { target: { value: any; }; }) =>
                onChange(index, 'decimalPoint', Number(e.target.value))
              }
            />
          </Form.Group>
        </Col>
      </Row>
      <div className='text-end mt-2'>
        <Button variant='danger' size='sm' onClick={() => onRemove(index)}>
          Remove
        </Button>
      </div>
    </Card.Body>
  </Card>
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
  });

  const handleChange = (field: keyof Device, value: any) => {
    setDevice({ ...device, [field]: value });
  };

  const handleRegisterChange = (
    index: number,
    field: keyof Register,
    value: any
  ) => {
    const updated = [...device.registers];
    updated[index][field] = value;
    setDevice({ ...device, registers: updated });
  };

  const addRegister = () => {
    setDevice({ ...device, registers: [...device.registers, defaultRegister] });
  };

  const removeRegister = (index: number) => {
    const updated = device.registers.filter((_, i) => i !== index);
    setDevice({ ...device, registers: updated });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(device);
    // Handle submit logic here
  };

  return (
    <div className='container mt-4'>
      <h2 className='mb-4'>Device Manager</h2>
      <Form onSubmit={handleSubmit}>
        <Row className='mb-3'>
          <Col md={6}>
            <Form.Group controlId='deviceName'>
              <Form.Label>Device Name</Form.Label>
              <Form.Control
                type='text'
                value={device.name}
                onChange={(e: { target: { value: any; }; }) => handleChange('name', e.target.value)}
              />
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group controlId='slaveId'>
              <Form.Label>Slave ID</Form.Label>
              <Form.Control
                type='number'
                value={device.slaveId}
                onChange={(e: { target: { value: any; }; }) =>
                  handleChange('slaveId', Number(e.target.value))
                }
              />
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group controlId='ip'>
              <Form.Label>IP Address</Form.Label>
              <Form.Control
                type='text'
                value={device.ip}
                onChange={(e: { target: { value: any; } }) => handleChange('ip', e.target.value)}
              />
            </Form.Group>
          </Col>
        </Row>

        <Row className='mb-3'>
          <Col md={3}>
            <Form.Group controlId='port'>
              <Form.Label>Port</Form.Label>
              <Form.Control
                type='number'
                value={device.port}
                onChange={(e: { target: { value: any; }; }) => handleChange('port', Number(e.target.value))}
              />
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group controlId='setpoint'>
              <Form.Label>Setpoint (°C)</Form.Label>
              <Form.Control
                type='number'
                value={device.setpoint}
                onChange={(e: { target: { value: any; }; }) =>
                  handleChange('setpoint', Number(e.target.value))
                }
              />
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group controlId='control'>
              <Form.Label>Control Mode</Form.Label>
              <Form.Select
                value={device.control}
                onChange={(e: { target: { value: string; }; }) =>
                  handleChange('control', e.target.value as 'Remote' | 'Local')
                }
              >
                <option value='Remote'>Remote</option>
                <option value='Local'>Local</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={3} className='d-flex align-items-end'>
            <Form.Check
              type='checkbox'
              label='Enable Device'
              checked={device.enabled}
              onChange={(e: { target: { checked: boolean; }; }) => handleChange('enabled', e.target.checked)}
            />
          </Col>
        </Row>

        <h5 className='mt-4'>Registers</h5>
        {device.registers.map((reg, i) => (
          <RegisterForm
            key={i}
            index={i}
            register={reg}
            onChange={handleRegisterChange}
            onRemove={removeRegister}
          />
        ))}
        <div className='mb-4'>
          <Button variant='outline-primary' onClick={addRegister}>
            + Add Register
          </Button>
        </div>

        <div className='d-flex gap-3'>
          <Button variant='secondary'>Cancel</Button>
          <Button type='submit' variant='primary'>
            Save Device
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default DeviceForm;
