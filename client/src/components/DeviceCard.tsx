import { useState, useEffect } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Edit, Settings, Clock, Activity, Thermometer } from "lucide-react";
import { Device } from "../types";
import { cn } from "@/lib/utils";
import { useRegisterData } from "@/hooks/useRegisterData";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Slider } from "@/components/ui/slider";
import { useSetpoint } from "@/hooks/useSetpoint";
import { toast } from "@/hooks/use-toast";

interface DeviceCardProps {
  device: Device;
}

export default function DeviceCard({ device }: DeviceCardProps) {
  const { data: latestData } = useRegisterData(device.id);
  const { setDeviceSetpoint, isPending } = useSetpoint();
  
  // Find setpoint register if available
  const [setpointValue, setSetpointValue] = useState<number>(22);
  const [sliderValue, setSliderValue] = useState<number[]>([22]);
  const [showSetpoint, setShowSetpoint] = useState<boolean>(false);
  
  // Determine if device is online (for demo, just use enabled flag)
  const isOnline = device.enabled;
  
  // Extract latest values if available
  const data: Record<string, any> = latestData?.data || {};
  const lastUpdateTime = latestData ? new Date(latestData.timestamp).toLocaleTimeString() : "N/A";
  
  // Get first two register values for display
  const registerNames = Object.keys(data);
  const registersToShow = registerNames.slice(0, 2);
  
  // Find setpoint register if exists
  let setpointRegisterName = registerNames.find(name => 
    name.toLowerCase().includes('setpoint') || 
    name.toLowerCase().includes('set') || 
    name.toLowerCase().includes('target')
  );
  
  // If no setpoint register found, try with temperature
  if (!setpointRegisterName) {
    setpointRegisterName = registerNames.find(name =>
      name.toLowerCase().includes('temperature') || 
      name.toLowerCase().includes('temp')
    );
  }
  
  // If still not found and we have registers, use the first one
  if (!setpointRegisterName && registerNames.length > 0) {
    setpointRegisterName = registerNames[0];
    console.log("No specific setpoint register found, using first available register:", setpointRegisterName);
  }
  
  // If no registers at all, use a fallback name
  if (!setpointRegisterName) {
    setpointRegisterName = "setpoint";
    console.log("Using hardcoded fallback register name: 'setpoint'");
  }
  
  // Initialize slider with current setpoint value if found
  useEffect(() => {
    if (setpointRegisterName && data[setpointRegisterName] !== undefined) {
      const value = parseFloat(data[setpointRegisterName]);
      if (!isNaN(value)) {
        setSetpointValue(value);
        setSliderValue([value]);
      }
    }
  }, [data, setpointRegisterName]);
  
  // Handle setpoint change
  const handleSetpointChange = async () => {
    if (!setpointRegisterName) {
      console.error("No setpoint register name available");
      return;
    }
    
    console.log(`DeviceCard.handleSetpointChange: Attempting to set ${setpointRegisterName} to ${sliderValue[0]} for device ${device.id}`);
    
    try {
      // The setDeviceSetpoint hook already handles toasts and logging
      const success = await setDeviceSetpoint(device.id, setpointRegisterName, sliderValue[0]);
      
      if (success) {
        console.log(`Setpoint ${setpointRegisterName} successfully updated to ${sliderValue[0]}`);
        setSetpointValue(sliderValue[0]);
        
        // Update the visual value in data for immediate feedback
        // This will be overwritten on the next data poll, but gives immediate user feedback
        if (data) {
          data[setpointRegisterName] = sliderValue[0];
        }
      } else {
        console.error(`Failed to update setpoint ${setpointRegisterName}`);
      }
    } catch (error) {
      console.error("Error in handleSetpointChange:", error);
    }
  };
  
  return (
    <Card className="bg-card border-gray-700 shadow-lg hover:border-primary transition-all duration-300">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative mr-3">
                    <div className={cn(
                      "w-3 h-3 rounded-full",
                      isOnline ? "bg-green-500" : "bg-red-500"
                    )}>
                      {isOnline && (
                        <span className="absolute inset-0 rounded-full animate-ping bg-green-400 opacity-75"></span>
                      )}
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isOnline ? "Device online" : "Device offline"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <h4 className="font-bold text-lg">{device.name}</h4>
            <Badge variant="outline" className="ml-2 bg-secondary">
              {device.deviceType}
            </Badge>
          </div>
          <div className="flex space-x-2">
            <Button variant="ghost" size="icon">
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-gray-400 text-sm mb-1">IP Address</p>
            <p className="font-mono">{device.ipAddress}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-1">Port</p>
            <p className="font-mono">{device.port}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-1">Last Update</p>
            <div className="flex items-center">
              <Clock className="h-3 w-3 mr-1 text-primary" />
              <p>{lastUpdateTime !== "N/A" ? `${lastUpdateTime}` : "Never"}</p>
            </div>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-1">Status</p>
            <Badge variant={isOnline ? "default" : "destructive"} className="flex items-center space-x-1">
              <Activity className="h-3 w-3" />
              <span>{isOnline ? "Connected" : "Disconnected"}</span>
            </Badge>
          </div>
        </div>
        
        <div className="border-t border-gray-700 pt-3">
          <div className="flex justify-between items-center mb-2">
            <h5 className="text-sm text-gray-400">Latest Values</h5>
            <Badge variant="outline" className="text-xs">
              {registerNames.length} register{registerNames.length !== 1 ? 's' : ''}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {registersToShow.length > 0 ? (
              registersToShow.map((regName) => (
                <TooltipProvider key={regName}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="bg-secondary rounded p-2 hover:bg-secondary/80 transition-colors cursor-pointer">
                        <p className="text-xs text-gray-500">{regName}</p>
                        <p className="text-xl font-bold">
                          {data[regName] !== undefined ? data[regName] : 'N/A'}
                        </p>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Last value for {regName}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))
            ) : (
              <div className="col-span-2 bg-secondary rounded p-2 text-center">
                <p className="text-xs text-gray-500">No register data available</p>
              </div>
            )}
          </div>
          
          {/* Setpoint Control - only show if a setpoint register exists */}
          {setpointRegisterName && (
            <div className="mt-4 bg-secondary/50 rounded-lg p-4 border border-gray-700">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <Thermometer className="h-4 w-4 mr-2 text-primary" />
                  <h5 className="text-sm font-medium">{setpointRegisterName}</h5>
                </div>
                <Badge 
                  variant="outline" 
                  className="text-xs cursor-pointer transition-all" 
                  onClick={() => setShowSetpoint(!showSetpoint)}
                >
                  {showSetpoint ? "Hide" : "Adjust"} Setpoint
                </Badge>
              </div>
              
              {/* Current Setpoint Value */}
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-400">Current Value:</span>
                <span className="text-sm font-medium">
                  {data[setpointRegisterName] !== undefined ? data[setpointRegisterName] : 'N/A'}
                </span>
              </div>
              
              {/* Setpoint Slider - only visible when expanded */}
              {showSetpoint && (
                <div className="mt-3 animate-in fade-in slide-in-from-top duration-300">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-400">New Setpoint:</span>
                    <span className="text-sm font-medium">{sliderValue[0].toFixed(1)}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={sliderValue}
                      min={16}
                      max={32}
                      step={0.5}
                      onValueChange={(value) => setSliderValue(value)}
                      className="flex-1"
                    />
                    <Button 
                      size="sm"
                      onClick={handleSetpointChange}
                      disabled={isPending || sliderValue[0] === setpointValue}
                    >
                      {isPending ? "..." : "Set"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="bg-card px-4 py-3 border-t border-gray-700">
        <Link href={`/devices/${device.id}`} className="w-full">
          <Button variant="default" className="w-full">
            View Details
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
