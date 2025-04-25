import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useDevices } from "@/hooks/useDevices";
import DeviceCard from "@/components/DeviceCard";
import AddDeviceModal from "@/components/AddDeviceModal";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, RefreshCw } from "lucide-react";

export default function Devices() {
  const [isAddDeviceModalOpen, setIsAddDeviceModalOpen] = useState(false);
  const { data: devices, isLoading, refetch } = useDevices();
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Devices</h2>
        <div className="flex">
          <Button 
            variant="outline" 
            className="mr-2"
            onClick={() => refetch()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setIsAddDeviceModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Device
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      ) : devices && devices.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.map((device) => (
            <DeviceCard key={device.id} device={device} />
          ))}
        </div>
      ) : (
        <div className="bg-card border-border rounded-lg p-8 text-center">
          <h4 className="text-lg font-medium mb-2">No Devices Found</h4>
          <p className="text-gray-400 mb-4">Add your first device to start monitoring</p>
          <Button onClick={() => setIsAddDeviceModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Device
          </Button>
        </div>
      )}
      
      {/* Add Device Modal */}
      <AddDeviceModal 
        open={isAddDeviceModalOpen} 
        onClose={() => setIsAddDeviceModalOpen(false)} 
      />
    </div>
  );
}
