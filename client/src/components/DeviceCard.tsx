import { useState, useEffect } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { 
  Edit, 
  Settings, 
  Clock, 
  Activity, 
  Thermometer, 
  Trash2,
  AlertTriangle
} from "lucide-react";
import { Device } from "../types";
import { cn } from "@/lib/utils";
import { useRegisterData } from "@/hooks/useRegisterData";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Slider } from "@/components/ui/slider";
import { useSetpoint } from "@/hooks/useSetpoint";
import { useDeleteDevice } from "@/hooks/useDeleteDevice";
import { useUpdateDevice } from "@/hooks/useUpdateDevice";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";
import EditDeviceModal from "./EditDeviceModal";

interface DeviceCardProps {
  device: Device;
}

export default function DeviceCard({ device }: DeviceCardProps) {
  const { data: latestData } = useRegisterData(device.id);
  const { setDeviceSetpoint, isPending } = useSetpoint();
  const { deleteDevice, isDeleting } = useDeleteDevice();
  const { updateDevice, isUpdating } = useUpdateDevice();
  
  // Modal states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Debug modal state changes
  useEffect(() => {
    console.log("DeviceCard: showEditModal state changed to:", showEditModal);
  }, [showEditModal]);
  
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

  // Find temperature value if exists
  const temperatureRegisterName = registerNames.find(name => 
    name.toLowerCase().includes('temperature') || 
    name.toLowerCase().includes('temp')
  );
  const temperatureValue = temperatureRegisterName && data[temperatureRegisterName] !== undefined 
    ? parseFloat(data[temperatureRegisterName]) 
    : 22; // Default temperature if not found

  // Background color based on temperature
  const getBackgroundColor = () => {
    // Cool (green) to Hot (red)
    if (temperatureValue <= 20) return "from-emerald-500 to-emerald-400";
    if (temperatureValue <= 25) return "from-green-500 to-green-400";
    if (temperatureValue <= 30) return "from-yellow-500 to-yellow-400";
    if (temperatureValue <= 35) return "from-orange-500 to-orange-400";
    return "from-red-500 to-red-400";
  };
  
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

  // Handle device deletion
  const handleDeleteDevice = () => {
    deleteDevice(device.id);
    setShowDeleteConfirm(false);
  };
  
  // Handle device update
  const handleUpdateDevice = async (updatedDevice: Device) => {
    return await updateDevice(device.id, updatedDevice);
  };
  
  // Handle opening edit modal
  const handleOpenEditModal = () => {
    console.log("Opening edit modal");
    setShowEditModal(true);
  };
  
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
      <div className="bg-card/80 backdrop-blur-sm rounded-lg h-full">
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
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={handleOpenEditModal} 
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit device</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete device</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
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
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-destructive mr-2" />
              Delete Device
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-semibold">{device.name}</span>? 
              This action cannot be undone. All associated data including historical readings
              and schedules will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex space-x-2 justify-end">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteDevice}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Device"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit device modal */}
      <EditDeviceModal 
        device={device}
        open={showEditModal}
        onOpenChange={setShowEditModal}
        onSave={handleUpdateDevice}
      />
    </motion.div>
  );
}