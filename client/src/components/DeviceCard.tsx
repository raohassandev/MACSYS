import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Edit, Settings, Clock } from "lucide-react";
import { Device } from "@shared/schema";
import { cn } from "@/lib/utils";
import { useRegisterData } from "@/hooks/useRegisterData";

interface DeviceCardProps {
  device: Device;
}

export default function DeviceCard({ device }: DeviceCardProps) {
  const { data: latestData } = useRegisterData(device.id);
  
  // Determine if device is online (for demo, just use enabled flag)
  const isOnline = device.enabled;
  
  // Extract latest values if available
  const data = latestData?.data || {};
  const lastUpdateTime = latestData ? new Date(latestData.timestamp).toLocaleTimeString() : "N/A";
  
  // Get first two register values for display
  const registerNames = Object.keys(data);
  const registersToShow = registerNames.slice(0, 2);
  
  return (
    <Card className="bg-card border-gray-700 shadow-lg">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center">
            <div className={cn(
              "w-2 h-2 rounded-full mr-2",
              isOnline ? "bg-green-500" : "bg-red-500"
            )} />
            <h4 className="font-bold text-lg">{device.name}</h4>
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
              <Clock className="h-3 w-3 mr-1" />
              <p>{lastUpdateTime !== "N/A" ? `${lastUpdateTime}` : "Never"}</p>
            </div>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-1">Status</p>
            <p className={isOnline ? "text-green-500" : "text-red-500"}>
              {isOnline ? "Connected" : "Disconnected"}
            </p>
          </div>
        </div>
        
        <div className="border-t border-gray-700 pt-3">
          <h5 className="text-sm text-gray-400 mb-2">Latest Values</h5>
          <div className="grid grid-cols-2 gap-2">
            {registersToShow.length > 0 ? (
              registersToShow.map((regName) => (
                <div key={regName} className="bg-secondary rounded p-2">
                  <p className="text-xs text-gray-500">{regName}</p>
                  <p className="text-xl font-bold">
                    {data[regName] !== undefined ? data[regName] : 'N/A'}
                  </p>
                </div>
              ))
            ) : (
              <div className="col-span-2 bg-secondary rounded p-2 text-center">
                <p className="text-xs text-gray-500">No register data available</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-4">
          <Link href={`/devices/${device.id}`}>
            <a className="w-full">
              <Button variant="secondary" className="w-full">
                View Details
              </Button>
            </a>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
