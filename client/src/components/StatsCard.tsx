import { Card, CardContent } from "@/components/ui/card";
import { ServerIcon, Ticket, AlertTriangle } from "lucide-react";
import { useDevices } from "@/hooks/useDevices";
import { Skeleton } from "@/components/ui/skeleton";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  bgColor: string;
  textColor: string;
}

function StatCard({ icon, label, value, bgColor, textColor }: StatCardProps) {
  return (
    <Card className="bg-card border-border shadow-lg">
      <CardContent className="p-4">
        <div className="flex items-center">
          <div className={`w-12 h-12 rounded-full ${bgColor} flex items-center justify-center ${textColor} mr-4`}>
            {icon}
          </div>
          <div>
            <h3 className="text-gray-400 text-sm">{label}</h3>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function StatsCards() {
  const { data: devices, isLoading } = useDevices();
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-card border-border shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center">
                <Skeleton className="w-12 h-12 rounded-full mr-4" />
                <div>
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  // Count connected devices (enabled = true)
  const connectedDevices = devices?.filter(d => d.enabled) || [];
  const totalDevices = devices?.length || 0;
  
  // For demo purposes, let's assume we have some data points and alerts
  const dataPoints = 1245;
  const activeAlerts = 2;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <StatCard
        icon={<ServerIcon className="h-6 w-6" />}
        label="Connected Devices"
        value={`${connectedDevices.length}/${totalDevices}`}
        bgColor="bg-blue-500 bg-opacity-20"
        textColor="text-primary"
      />
      
      <StatCard
        icon={<Ticket className="h-6 w-6" />}
        label="Data Points"
        value={dataPoints.toLocaleString()}
        bgColor="bg-green-500 bg-opacity-20"
        textColor="text-green-500"
      />
      
      <StatCard
        icon={<AlertTriangle className="h-6 w-6" />}
        label="Active Alerts"
        value={activeAlerts.toString()}
        bgColor="bg-yellow-500 bg-opacity-20"
        textColor="text-yellow-500"
      />
    </div>
  );
}
