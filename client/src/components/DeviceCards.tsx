import { useState } from "react";
import { useDevices } from "@/hooks/useDevices";
import { useSetpoint } from "@/hooks/useSetpoint";
import ModernDeviceCard from "./ModernDeviceCard";
import { toast } from "@/hooks/use-toast";

export default function DeviceCards() {
  const { data: devices, isLoading, error } = useDevices();
  const { setDeviceSetpoint } = useSetpoint();
  
  // Handle setting a setpoint value
  const handleSetpoint = async (deviceId: string, registerName: string, value: number) => {
    try {
      const success = await setDeviceSetpoint(deviceId, registerName, value);
      
      if (success) {
        toast({
          title: "Setpoint updated",
          description: `Successfully set ${registerName} to ${value}`,
          variant: "default",
        });
        return true;
      } else {
        toast({
          title: "Failed to update setpoint",
          description: "Please try again later",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error("Error setting setpoint:", error);
      toast({
        title: "Error",
        description: "Something went wrong while updating the setpoint",
        variant: "destructive",
      });
      return false;
    }
  };
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div 
            key={i} 
            className="bg-secondary/50 rounded-xl h-96 animate-pulse"
          />
        ))}
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive rounded-md p-4">
        <p className="text-destructive">Error loading devices: {error.message}</p>
      </div>
    );
  }
  
  if (!devices || devices.length === 0) {
    return (
      <div className="bg-secondary/50 rounded-md p-8 text-center">
        <h3 className="text-lg font-medium mb-2">No devices found</h3>
        <p className="text-muted-foreground">Add a device to get started with monitoring</p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {devices.map((device) => (
        <ModernDeviceCard
          key={device.id}
          device={device}
          onSetpoint={handleSetpoint}
        />
      ))}
    </div>
  );
}