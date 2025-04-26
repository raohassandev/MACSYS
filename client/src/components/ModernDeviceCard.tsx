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
    if (!onSetpoint) {
      console.error("onSetpoint function not provided");
      return;
    }
    
    setIsPending(true);
    console.log("Setting setpoint...");
    
    try {
      // Find the right register name for setpoint
      let setpointRegisterName = '';
      
      // First check if we have a register specifically named "setpoint"
      if (latestData?.data) {
        console.log("Available registers:", Object.keys(latestData.data));
        
        // First try to find a register with "setpoint" in the name
        for (const key of Object.keys(latestData.data)) {
          if (key.toLowerCase().includes('setpoint')) {
            setpointRegisterName = key;
            break;
          }
        }
        
        // If not found, try with "set" in the name
        if (!setpointRegisterName) {
          for (const key of Object.keys(latestData.data)) {
            if (key.toLowerCase().includes('set')) {
              setpointRegisterName = key;
              break;
            }
          }
        }
        
        // If not found, try with "temperature" as many devices use temp as setpoint
        if (!setpointRegisterName) {
          for (const key of Object.keys(latestData.data)) {
            if (key.toLowerCase().includes('temperature') || key.toLowerCase().includes('temp')) {
              setpointRegisterName = key;
              break;
            }
          }
        }
        
        // If still not found, use the first register as a fallback
        if (!setpointRegisterName && Object.keys(latestData.data).length > 0) {
          setpointRegisterName = Object.keys(latestData.data)[0];
        }
      }
      
      // If we still don't have a register name, use a hardcoded fallback
      if (!setpointRegisterName) {
        setpointRegisterName = "setpoint";
        console.log("Using hardcoded fallback register name: 'setpoint'");
      }
      
      console.log("Selected register:", setpointRegisterName);
      
      // Always attempt to call onSetpoint, even if we're using a fallback
      console.log(`Calling onSetpoint with deviceId: ${device.id}, registerName: ${setpointRegisterName}, value: ${sliderValue[0]}`);
      const result = await onSetpoint(device.id, setpointRegisterName, sliderValue[0]);
      console.log("Setpoint result:", result);
      
      // If the result is true or undefined (void), consider it a success
      if (result !== false) {
        setSetpointValue(sliderValue[0]);
        console.log("Setpoint updated successfully");
      } else {
        console.error("Failed to set setpoint");
      }
    } catch (error) {
      console.error("Exception when setting setpoint:", error);
    } finally {
      setIsPending(false);
    }
  };

  // Time stamp from latest data
  const timeStamp = latestData ? new Date(latestData.timestamp).toLocaleTimeString() : "";

  // Define animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut",
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3 }
    }
  };
  
  const pulseVariants = {
    pulse: {
      scale: [1, 1.02, 1],
      transition: { 
        duration: 2,
        repeat: Infinity,
        repeatType: "mirror" as const
      }
    }
  };
  
  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        "rounded-xl overflow-hidden shadow-xl",
        "bg-gradient-to-r p-[2px]",
        getBackgroundColor()
      )}
    >
      <div className="bg-card/10 backdrop-blur-sm rounded-lg p-5 h-full relative">
        {/* Animated background glow */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-lg"
          animate={{
            opacity: [0.3, 0.15, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatType: "mirror"
          }}
        />
        
        {/* Device header */}
        <motion.div 
          variants={itemVariants}
          className="flex justify-between items-center mb-6 relative z-10"
        >
          <div className="flex items-center">
            <motion.div
              animate={{
                rotate: [0, 5, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "mirror"
              }}
            >
              <Thermometer className="h-5 w-5 mr-2 text-white" />
            </motion.div>
            <h3 className="font-medium text-white">{device.name}</h3>
          </div>
          <div className="text-white/80 text-sm bg-white/10 px-2 py-1 rounded-md backdrop-blur-sm">
            {timeStamp}
          </div>
        </motion.div>
        
        {/* Temperature display */}
        <motion.div 
          variants={pulseVariants}
          animate="pulse"
          className="flex justify-center mb-6 relative z-10"
        >
          <div className="text-center bg-white/10 backdrop-blur-sm py-3 px-8 rounded-full">
            <motion.span 
              className="text-5xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent"
              animate={{ 
                textShadow: ['0 0 5px rgba(255,255,255,0.3)', '0 0 15px rgba(255,255,255,0.5)', '0 0 5px rgba(255,255,255,0.3)'] 
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatType: "mirror"
              }}
            >
              {temperatureValue.toFixed(1)}
            </motion.span>
            <span className="text-2xl font-medium text-white/90">°C</span>
          </div>
        </motion.div>
        
        {/* Data tiles */}
        <div className="grid grid-cols-2 gap-3 mb-6 relative z-10">
          {/* Humidity */}
          <motion.div 
            variants={itemVariants}
            whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
            className="bg-white/10 rounded-lg p-3 backdrop-blur-sm shadow-md"
          >
            <div className="flex items-center gap-2 mb-1">
              <Droplets className="h-4 w-4 text-white/70" />
              <span className="text-xs text-white/70">Humidity</span>
            </div>
            <div className="text-white font-medium">
              {humidityValue.toFixed(2)}%
            </div>
          </motion.div>
          
          {/* Power */}
          <motion.div 
            variants={itemVariants}
            whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
            className="bg-white/10 rounded-lg p-3 backdrop-blur-sm shadow-md"
          >
            <div className="flex items-center gap-2 mb-1">
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  repeatType: "mirror"
                }}
              >
                <Zap className="h-4 w-4 text-white/70" />
              </motion.div>
              <span className="text-xs text-white/70">Power</span>
            </div>
            <div className="text-white font-medium">
              {powerValue.toFixed(2)} kW
            </div>
          </motion.div>
          
          {/* Energy */}
          <motion.div 
            variants={itemVariants}
            whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
            className="bg-white/10 rounded-lg p-3 backdrop-blur-sm shadow-md"
          >
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-4 w-4 text-white/70" />
              <span className="text-xs text-white/70">Energy</span>
            </div>
            <div className="text-white font-medium">
              {energyValue.toFixed(2)} kWh
            </div>
          </motion.div>
          
          {/* Status */}
          <motion.div 
            variants={itemVariants}
            whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
            className="bg-white/10 rounded-lg p-3 backdrop-blur-sm shadow-md"
          >
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-4 w-4 text-white/70" />
              <span className="text-xs text-white/70">Status</span>
            </div>
            <div className="text-white font-medium flex items-center">
              <motion.span 
                className={cn(
                  "inline-block w-2 h-2 rounded-full mr-2",
                  statusValue === "Online" ? "bg-green-400" : "bg-red-400"
                )}
                animate={statusValue === "Online" 
                  ? { 
                      opacity: [1, 0.5, 1],
                      scale: [1, 1.2, 1]
                    } 
                  : {}
                }
                transition={{
                  duration: 2,
                  repeat: Infinity
                }}
              />
              {statusValue}
            </div>
          </motion.div>
        </div>
        
        {/* Setpoint slider */}
        <motion.div 
          variants={itemVariants}
          className="bg-white/10 rounded-lg p-4 backdrop-blur-sm shadow-md relative z-10"
        >
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center">
              <motion.div
                animate={{
                  rotate: [0, 10, 0, -10, 0],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  repeatType: "mirror"
                }}
              >
                <Thermometer className="h-4 w-4 mr-2 text-white/80" />
              </motion.div>
              <span className="text-sm text-white/80">Setpoint Control:</span>
            </div>
            <span className="text-sm font-medium text-white bg-white/10 px-2 py-1 rounded-md">
              {sliderValue[0].toFixed(1)}°C
            </span>
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
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button 
                onClick={handleSetpointChange} 
                size="sm" 
                disabled={isPending || sliderValue[0] === setpointValue}
                className="bg-white text-primary hover:bg-white/90 shadow-md"
              >
                {isPending ? "..." : "Set"}
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}