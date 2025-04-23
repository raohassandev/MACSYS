import { useEffect, useState } from 'react';
import API from '../services/api';
import { motion } from 'framer-motion';
import { Thermometer, Droplet, Zap, BatteryFull, Gauge, Power } from "lucide-react";

interface DeviceData {
  _id: string;
  device: string;
  data: {
    temperature: number;
    humidity?: number;
    power?: number;
    energy?: number;
    setpoint?: number;
    status?: string;
    control?: string;
  };
  control? : string;
  status?: string;
  timestamp: string;
}

function RealtimeData() {
  const [deviceList, setDeviceList] = useState<DeviceData[]>([]);
  const [newSetpoint, setNewSetpoint] = useState<Record<string, number>>({});

  useEffect(() => {
    const interval = setInterval(() => {
      fetchRealtimeData();
    }, 5000);
    fetchRealtimeData();
    return () => clearInterval(interval);
  }, []);

  const fetchRealtimeData = async () => {
    try {
      const res = await API.get('/latest');
      setDeviceList(res.data);
      
      // Initialize setpoints based on current data
      const setpoints: Record<string, number> = {};
      res.data.forEach((device: DeviceData) => {
        if (device.data.setpoint) {
          setpoints[device.device] = device.data.setpoint;
        } else {
          setpoints[device.device] = device.data.temperature;
        }
      });
      
      setNewSetpoint(prev => ({...prev, ...setpoints}));
    } catch (error) {
      console.log('Error fetching realtime data:', error);
    }
  };

  const handleSetpointChange = (deviceName: string, value: number) => {
    setNewSetpoint(prev => ({
      ...prev,
      [deviceName]: value
    }));
  };

  const writeSetpoint = async (device: DeviceData) => {
    try {
      // Using the device name string directly
      const value = newSetpoint[device.device];
      
      if (!device.device || value === undefined) {
        console.error('Missing device name or setpoint value');
        return;
      }
      
      console.log(`Writing setpoint: ${device.device}, value: ${value}`);
      
      // Make the API call with the correct payload
      const response = await API.post('/device/write', {
        device: device.device, // Just sending the device name string
        register: 'setpoint',
        value: value
      });
      
      console.log('Write response:', response.data);
      
      // Refresh data to confirm the change
      fetchRealtimeData();
    } catch (error) {
      console.error('Error writing setpoint:', error);
    }
  };

  const getTemperatureGradient = (temp: number) => {
    if (temp < 18) return 'from-blue-500 to-blue-300'; // Very cold
    if (temp < 22) return 'from-blue-400 to-cyan-300'; // Cold
    if (temp < 24) return 'from-green-500 to-emerald-300'; // Comfortable
    if (temp < 27) return 'from-yellow-500 to-amber-300'; // Warm
    if (temp < 30) return 'from-orange-500 to-amber-400'; // Hot
    return 'from-red-600 to-rose-400'; // Very hot
  };

  const formatPower = (power?: number) => {
    if (power === undefined) return '--';
    return power >= 1000 ? `${(power / 1000).toFixed(2)} MW` : `${power} kW`;
  };

  const formatEnergy = (energy?: number) => {
    if (energy === undefined) return '--';
    return energy >= 1000 ? `${(energy / 1000).toFixed(2)} MWh` : `${energy} kWh`;
  };

  return (
    <div className="p-6">
      <motion.h1 
        className="text-3xl font-bold mb-8 text-gray-800"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Device Monitoring Dashboard
      </motion.h1>
      
      <div className="flex overflow-x-auto pb-4 gap-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {deviceList.map((device) => {
          const tempGradient = getTemperatureGradient(device.data.temperature);
          
          return (
            <motion.div
              key={device._id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              whileHover={{ scale: 1.02 }}
              className={`relative min-w-[320px] max-w-[400px] flex-shrink-0 rounded-2xl shadow-xl overflow-hidden bg-gradient-to-br ${tempGradient}`}
            >
              <div className="absolute inset-0 backdrop-blur-sm bg-white/10" />
              
              <div className="relative p-4 h-full flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <Thermometer className="w-5 h-5 text-white/90" />
                    <h3 className="text-lg font-bold text-white truncate">{device.device}</h3>
                  </div>
                  <span className="text-xs text-white/80">
                    {new Date(device.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                {/* Main Temperature */}
                <motion.div
                  key={device.data.temperature}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex flex-col items-center mb-4"
                >
                  <div className="text-4xl font-bold text-white drop-shadow-lg">
                    {device.data.temperature}
                    <span className="text-lg ml-1">°C</span>
                  </div>
                </motion.div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <StatItem
                    icon={<Droplet className="w-4 h-4" />}
                    label="Humidity"
                    value={`${device.data.humidity || '--'}%`}
                    compact
                  />
                  <StatItem
                    icon={<Zap className="w-4 h-4" />}
                    label="Power"
                    value={formatPower(device.data.power)}
                    compact
                  />
                  <StatItem
                    icon={<BatteryFull className="w-4 h-4" />}
                    label="Energy"
                    value={formatEnergy(device.data.energy)}
                    compact
                  />
                  <StatItem
                    icon={<Gauge className="w-4 h-4" />}
                    label="Status"
                    value={device.status || 'Unknown'}
                    compact
                  />
                  <StatItem
                    icon={<Gauge className="w-4 h-4" />}
                    label="Control"
                    value={device.control || 'Unknown'}
                    compact
                  />
                </div>

                {/* Setpoint Control */}
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  className="bg-white/20 rounded-lg p-3 backdrop-blur-sm mt-auto"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white">Setpoint:</span>
                    <span className="text-md font-bold text-white">
                      {newSetpoint[device.device]}°C
                    </span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <input
                      type="range"
                      min="16"
                      max="32"
                      step="0.5"
                      value={newSetpoint[device.device]}
                      onChange={(e) => handleSetpointChange(device.device, parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-white/30 rounded-full cursor-pointer"
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => writeSetpoint(device)}
                      className="bg-white text-gray-800 px-3 py-1.5 text-sm rounded-md font-medium shadow-sm"
                    >
                      Set
                    </motion.button>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default RealtimeData;
// Compact StatItem component
const StatItem = ({ icon, label, value, compact }: { icon: React.ReactNode; label: string; value: string; compact?: boolean }) => (
  <motion.div
    whileHover={{ scale: 1.03 }}
    className={`flex items-center gap-2 bg-white/20 ${compact ? 'p-2' : 'p-3'} rounded-lg backdrop-blur-sm`}
  >
    <div className="bg-white/20 p-1.5 rounded-md">{icon}</div>
    <div>
      <p className={`${compact ? 'text-[0.7rem]' : 'text-xs'} text-white/70`}>{label}</p>
      <p className={`${compact ? 'text-sm' : 'text-lg'} font-semibold text-white`}>{value}</p>
    </div>
  </motion.div>
);
