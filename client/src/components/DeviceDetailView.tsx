import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useParams } from "wouter";
import { useDevice } from "@/hooks/useDevice";
import { useRegisterData } from "@/hooks/useRegisterData";
import { Settings, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import RegisterTable from "./RegisterTable";
import RegistersPanel from "./RegistersPanel";
import DataVisualization from "./DataVisualization";
import { Device } from "@/types";

export default function DeviceDetailView() {
  const { id } = useParams<{ id: string }>();
  
  const { data: device, isLoading: isDeviceLoading, error } = useDevice(id);
  const { data: latestData, isLoading: isDataLoading } = useRegisterData(id);
  
  const [activeTab, setActiveTab] = useState("overview");
  
  // Handle error case
  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-red-500 mb-2">Error</h2>
              <p>Failed to load device information. Please try again later.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (isDeviceLoading) {
    return <DeviceDetailSkeleton />;
  }
  
  if (!device) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Device Not Found</h2>
              <p>The requested device does not exist or has been removed.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <Card className="bg-card border-border shadow-lg mb-6">
        <CardHeader className="border-b border-border p-4 flex flex-row justify-between items-center">
          <h3 className="text-xl font-bold">Device Details - {device.name}</h3>
          <div className="flex items-center">
            <span 
              className={`text-xs ${device.enabled ? 'bg-green-500' : 'bg-red-500'} text-white px-2 py-1 rounded mr-2`}
            >
              {device.enabled ? 'Online' : 'Offline'}
            </span>
            <div className="flex space-x-2">
              <Button variant="secondary" size="icon">
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button variant="secondary" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="registers">Registers</TabsTrigger>
              <TabsTrigger value="visualization">Visualization</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <DeviceInfoCard device={device} />
                <PollingConfigCard />
                <StatusHistoryCard />
              </div>
            </TabsContent>
            
            <TabsContent value="registers">
              {device && <RegistersPanel device={device} />}
            </TabsContent>
            
            <TabsContent value="visualization">
              <DataVisualization deviceId={id} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

interface DeviceInfoCardProps {
  device: Device;
}

function DeviceInfoCard({ device }: DeviceInfoCardProps) {
  return (
    <div className="bg-secondary p-3 rounded">
      <h4 className="text-sm text-gray-400 mb-2">Device Information</h4>
      <table className="w-full text-sm">
        <tbody>
          <tr>
            <td className="text-gray-400 py-1">IP Address:</td>
            <td className="font-mono">{device.ipAddress}</td>
          </tr>
          <tr>
            <td className="text-gray-400 py-1">Port:</td>
            <td className="font-mono">{device.port}</td>
          </tr>
          <tr>
            <td className="text-gray-400 py-1">Slave ID:</td>
            <td className="font-mono">{device.slaveId}</td>
          </tr>
          <tr>
            <td className="text-gray-400 py-1">Device Type:</td>
            <td>{device.deviceType}</td>
          </tr>
          <tr>
            <td className="text-gray-400 py-1">Status:</td>
            <td>{device.status ? "Connected" : "Disconnected"}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function PollingConfigCard() {
  return (
    <div className="bg-secondary p-3 rounded">
      <h4 className="text-sm text-gray-400 mb-2">Polling Configuration</h4>
      <table className="w-full text-sm">
        <tbody>
          <tr>
            <td className="text-gray-400 py-1">Real-time Interval:</td>
            <td>5 seconds</td>
          </tr>
          <tr>
            <td className="text-gray-400 py-1">Historical Interval:</td>
            <td>1 minute</td>
          </tr>
          <tr>
            <td className="text-gray-400 py-1">Timeout:</td>
            <td>1000ms</td>
          </tr>
          <tr>
            <td className="text-gray-400 py-1">Retry Count:</td>
            <td>3</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function StatusHistoryCard() {
  return (
    <div className="bg-secondary p-3 rounded">
      <h4 className="text-sm text-gray-400 mb-2">Status History</h4>
      <div className="flex items-center mb-2">
        <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
        <p className="text-xs">Connected at 14:23:45</p>
      </div>
      <div className="flex items-center mb-2">
        <div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div>
        <p className="text-xs">Disconnected at 14:15:22</p>
      </div>
      <div className="flex items-center mb-2">
        <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
        <p className="text-xs">Connected at 14:12:05</p>
      </div>
    </div>
  );
}

function DeviceDetailSkeleton() {
  return (
    <div className="p-6">
      <Card className="bg-card border-border shadow-lg mb-6">
        <CardHeader className="border-b border-border p-4 flex flex-row justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <div className="flex items-center">
            <Skeleton className="h-6 w-20 mr-2" />
            <div className="flex space-x-2">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-4">
          <div className="mb-4 flex">
            <Skeleton className="h-10 w-24 mr-2" />
            <Skeleton className="h-10 w-24 mr-2" />
            <Skeleton className="h-10 w-24" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-secondary p-3 rounded">
                <Skeleton className="h-4 w-40 mb-4" />
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="flex justify-between mb-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
