import { Button, Card, Col, Form, Row } from 'react-bootstrap';
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
  <Card className='mb-3'>
    <Card.Body>
      <Row>
        <Col md={3}>
          <Form.Group controlId={`address-${index}`}>
            <Form.Label>Address</Form.Label>
            <Form.Control
              type='number'
              value={register.address}
              onChange={(e) =>
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
              onChange={(e) => onChange(index, 'dataType', e.target.value)}
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
              value={register.scaleFactor || 1}
              onChange={(e) =>
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
              value={register.decimalPoint || 0.1}
              onChange={(e) =>
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
    sf: 1,
    decimal: 1,
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
    <Form onSubmit={handleSubmit}>
      <Card className='mb-4'>
        <Card.Body>
          <Row>
            <Col md={4}>
              <Form.Group controlId='deviceName'>
                <Form.Label>Device Name</Form.Label>
                <Form.Control
                  type='text'
                  value={device.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId='ip'>
                <Form.Label>IP Address</Form.Label>
                <Form.Control
                  type='text'
                  value={device.ip}
                  onChange={(e) => handleChange('ip', e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId='port'>
                <Form.Label>Port</Form.Label>
                <Form.Control
                  type='number'
                  value={device.port}
                  onChange={(e) => handleChange('port', Number(e.target.value))}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId='setpoint'>
                <Form.Label>Set Point</Form.Label>
                <Form.Control
                  type='number'
                  value={device.setpoint}
                  onChange={(e) =>
                    handleChange('setpoint', Number(e.target.value))
                  }
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId='status'>
                <Form.Label>Status</Form.Label>
                <div>
                  <span
                    className={`badge ${
                      device.status ? 'bg-success' : 'bg-secondary'
                    }`}
                  >
                    {device.status ? 'Running' : 'Not Running'}
                  </span>
                </div>
              </Form.Group>
            </Col>
          </Row>
          <Row className='mt-3'>
            <Col md={3}>
              <Form.Group controlId='slaveId'>
                <Form.Label>Slave ID</Form.Label>
                <Form.Control
                  type='number'
                  value={device.slaveId}
                  onChange={(e) =>
                    handleChange('slaveId', Number(e.target.value))
                  }
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group controlId='setpoint'>
                <Form.Label>Setpoint</Form.Label>
                <Form.Control
                  type='number'
                  value={device.setpoint}
                  onChange={(e) =>
                    handleChange('setpoint', Number(e.target.value))
                  }
                />
              </Form.Group>
            </Col>
            {/* <Col md={3}>
              <Form.Group controlId='sf'>
                <Form.Label>Scale Factor (sf)</Form.Label>
                <Form.Control
                  type='number'
                  value={device.scalefactor}
                  onChange={(e) => handleChange('sf', Number(e.target.value))}
                />
              </Form.Group>
            </Col> */}
            {/* <Col md={3}>
              <Form.Group controlId='decimal'>
                <Form.Label>Decimal Point</Form.Label>
                <Form.Control
                  type='number'
                  value={device.decimal}
                  onChange={(e) =>
                    handleChange('decimal', Number(e.target.value))
                  }
                />
              </Form.Group>
            </Col> */}
          </Row>

          <Row className='mt-3'>
            <Col md={4}>
              <Form.Group controlId='control'>
                <Form.Label>Control</Form.Label>
                <Form.Select
                  value={device.control}
                  onChange={(e) =>
                    handleChange(
                      'control',
                      e.target.value as 'Remote' | 'Local'
                    )
                  }
                >
                  <option value='Remote'>Remote</option>
                  <option value='Local'>Local</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId='enabled' className='mt-4'>
                <Form.Check
                  type='checkbox'
                  label='Enabled'
                  checked={device.enabled}
                  onChange={(e) => handleChange('enabled', e.target.checked)}
                />
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <h5>Registers</h5>
      {device.registers.map((reg, idx) => (
        <RegisterForm
          key={idx}
          register={reg}
          index={idx}
          onChange={handleRegisterChange}
          onRemove={removeRegister}
        />
      ))}

      <Button variant='secondary' onClick={addRegister} className='mb-3'>
        Add Register
      </Button>

      <div className='text-end'>
        <Button variant='primary' type='submit'>
          Save Device
        </Button>
      </div>
    </Form>
  );
};

export default DeviceForm;
