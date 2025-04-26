import { useEffect, useState } from "react";
import { Device } from "@/types";
import { useRegisterData } from "@/hooks/useRegisterData";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Thermometer, Droplets, Zap, Activity, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ModernDeviceCardProps {
  device: Device;
  onSetpoint?: (deviceId: string, registerName: string, value: number) => Promise<boolean | void>;
}

export default function ModernDeviceCard({ device, onSetpoint }: ModernDeviceCardProps) {
  const { data: latestData, isLoading } = useRegisterData(device.id);
  const [temperatureValue, setTemperatureValue] = useState<number>(0);
  const [humidityValue, setHumidityValue] = useState<number>(0);
  const [powerValue, setPowerValue] = useState<number>(0);
  const [energyValue, setEnergyValue] = useState<number>(0);
  const [statusValue, setStatusValue] = useState<string>("Unknown");
  const [controlValue, setControlValue] = useState<string>("central");
  
  // Setpoint related states
  const [setpointValue, setSetpointValue] = useState<number>(22);
  const [sliderValue, setSliderValue] = useState<number[]>([22]);
  const [isPending, setIsPending] = useState(false);

  // Parse latest data
  useEffect(() => {
    if (latestData?.data) {
      const data = latestData.data;
      
      // Extract common values from data
      const temperature = findRegisterValue(data, ["temperature", "temp", "Temperature"]);
      const humidity = findRegisterValue(data, ["humidity", "hum", "Humidity"]);
      const power = findRegisterValue(data, ["power", "pwr", "Power"]);
      const energy = findRegisterValue(data, ["energy", "eng", "Energy"]);
      const setpoint = findRegisterValue(data, ["setpoint", "set", "Setpoint"]);
      const status = findRegisterValue(data, ["status", "state", "Status"]);
      const control = findRegisterValue(data, ["control", "ctrl", "Control"]);
      
      if (temperature !== null) setTemperatureValue(temperature);
      if (humidity !== null) setHumidityValue(humidity);
      if (power !== null) setPowerValue(power);
      if (energy !== null) setEnergyValue(energy);
      if (setpoint !== null) {
        setSetpointValue(setpoint);
        setSliderValue([setpoint]);
      }
      if (status !== null) {
        if (typeof status === 'boolean') {
          setStatusValue(status ? "Online" : "Offline");
        } else if (typeof status === 'string') {
          setStatusValue(status);
        } else if (typeof status === 'number') {
          setStatusValue(status === 1 ? "Online" : "Offline");
        }
      }
      if (control !== null && typeof control === 'string') {
        setControlValue(control);
      }
    }
  }, [latestData]);

  // Background color based on temperature
  const getBackgroundColor = () => {
    // Cool (green) to Hot (red)
    if (temperatureValue <= 20) return "from-emerald-500 to-emerald-400";
    if (temperatureValue <= 25) return "from-green-500 to-green-400";
    if (temperatureValue <= 30) return "from-yellow-500 to-yellow-400";
    if (temperatureValue <= 35) return "from-orange-500 to-orange-400";
    return "from-red-500 to-red-400";
  };

  // Function to find register value based on possible name variations
  const findRegisterValue = (data: Record<string, any>, possibleNames: string[]) => {
    for (const name of possibleNames) {
      for (const key of Object.keys(data)) {
        if (key.toLowerCase().includes(name.toLowerCase())) {
          return data[key];
        }
      }
    }
    return null;
  };

  // Handle setpoint change
  const handleSetpointChange = async () => {
    if (!onSetpoint) return;
    
    setIsPending(true);
    try {
      // Find the right register name for setpoint
      let setpointRegisterName = '';
      if (latestData?.data) {
        for (const key of Object.keys(latestData.data)) {
          if (key.toLowerCase().includes('setpoint') || key.toLowerCase().includes('set')) {
            setpointRegisterName = key;
            break;
          }
        }
      }
      
      if (setpointRegisterName) {
        await onSetpoint(device.id, setpointRegisterName, sliderValue[0]);
        setSetpointValue(sliderValue[0]);
      }
    } catch (error) {
      console.error("Failed to set setpoint:", error);
    } finally {
      setIsPending(false);
    }
  };

  // Time stamp from latest data
  const timeStamp = latestData ? new Date(latestData.timestamp).toLocaleTimeString() : "";

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "rounded-xl overflow-hidden shadow-xl",
        "bg-gradient-to-r p-[2px]",
        getBackgroundColor()
      )}
    >
      <div className="bg-card/10 backdrop-blur-sm rounded-lg p-5 h-full">
        {/* Device header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Thermometer className="h-5 w-5 mr-2 text-white" />
            <h3 className="font-medium text-white">{device.name}</h3>
          </div>
          <div className="text-white/80 text-sm">{timeStamp}</div>
        </div>
        
        {/* Temperature display */}
        <div className="flex justify-center mb-6">
          <div className="text-center">
            <span className="text-5xl font-bold text-white">
              {temperatureValue.toFixed(1)}
            </span>
            <span className="text-2xl font-medium text-white/90">°C</span>
          </div>
        </div>
        
        {/* Data tiles */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {/* Humidity */}
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-1">
              <Droplets className="h-4 w-4 text-white/70" />
              <span className="text-xs text-white/70">Humidity</span>
            </div>
            <div className="text-white font-medium">
              {humidityValue.toFixed(2)}%
            </div>
          </div>
          
          {/* Power */}
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-4 w-4 text-white/70" />
              <span className="text-xs text-white/70">Power</span>
            </div>
            <div className="text-white font-medium">
              {powerValue.toFixed(2)} kW
            </div>
          </div>
          
          {/* Energy */}
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-4 w-4 text-white/70" />
              <span className="text-xs text-white/70">Energy</span>
            </div>
            <div className="text-white font-medium">
              {energyValue.toFixed(2)} kWh
            </div>
          </div>
          
          {/* Status */}
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-4 w-4 text-white/70" />
              <span className="text-xs text-white/70">Status</span>
            </div>
            <div className="text-white font-medium">
              {statusValue}
            </div>
          </div>
          
          {/* Control */}
          <div className="col-span-2 bg-white/10 rounded-lg p-3 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-1">
              <RotateCcw className="h-4 w-4 text-white/70" />
              <span className="text-xs text-white/70">Control</span>
            </div>
            <div className="text-white font-medium">
              {controlValue}
            </div>
          </div>
        </div>
        
        {/* Setpoint slider */}
        <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-white/80">Setpoint:</span>
            <span className="text-sm font-medium text-white">{sliderValue[0].toFixed(2)}°C</span>
          </div>
          <div className="flex items-center gap-3">
            <Slider
              value={sliderValue}
              min={16}
              max={32}
              step={0.5}
              onValueChange={(value) => setSliderValue(value)}
              className="flex-1"
            />
            <Button 
              onClick={handleSetpointChange} 
              size="sm" 
              disabled={isPending || sliderValue[0] === setpointValue}
              className="bg-white text-primary hover:bg-white/90"
            >
              {isPending ? "..." : "Set"}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}