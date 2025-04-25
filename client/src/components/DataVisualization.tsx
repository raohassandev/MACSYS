import { useState } from "react";
import { useDevice } from "@/hooks/useDevice";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

// Mock data for chart visualization
const mockChartData = [
  { time: '10:00', Temperature: 24.1, Pressure: 3.0 },
  { time: '10:05', Temperature: 24.3, Pressure: 3.1 },
  { time: '10:10', Temperature: 24.5, Pressure: 3.2 },
  { time: '10:15', Temperature: 24.8, Pressure: 3.2 },
  { time: '10:20', Temperature: 25.0, Pressure: 3.3 },
  { time: '10:25', Temperature: 25.3, Pressure: 3.3 },
  { time: '10:30', Temperature: 25.5, Pressure: 3.4 },
  { time: '10:35', Temperature: 25.8, Pressure: 3.5 },
  { time: '10:40', Temperature: 26.0, Pressure: 3.5 },
  { time: '10:45', Temperature: 26.3, Pressure: 3.4 },
  { time: '10:50', Temperature: 26.5, Pressure: 3.3 },
  { time: '10:55', Temperature: 26.2, Pressure: 3.2 },
  { time: '11:00', Temperature: 25.8, Pressure: 3.1 },
];

interface DataVisualizationProps {
  deviceId: number;
}

export default function DataVisualization({ deviceId }: DataVisualizationProps) {
  const { data: device, isLoading } = useDevice(deviceId);
  const [timeRange, setTimeRange] = useState<"1h" | "24h" | "7d">("24h");
  
  if (isLoading) {
    return <DataVisualizationSkeleton />;
  }
  
  return (
    <div className="space-y-6">
      <h4 className="text-lg font-bold mb-3">Data Visualization</h4>
      
      <Card className="bg-secondary">
        <CardContent className="p-4">
          <div className="mb-4 flex justify-between items-center">
            <h5 className="font-bold">Temperature History</h5>
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant={timeRange === "1h" ? "default" : "outline"}
                onClick={() => setTimeRange("1h")}
              >
                1h
              </Button>
              <Button
                size="sm"
                variant={timeRange === "24h" ? "default" : "outline"}
                onClick={() => setTimeRange("24h")}
              >
                24h
              </Button>
              <Button
                size="sm"
                variant={timeRange === "7d" ? "default" : "outline"}
                onClick={() => setTimeRange("7d")}
              >
                7d
              </Button>
            </div>
          </div>
          
          <div className="w-full h-64 bg-card rounded-lg border border-border">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={mockChartData}
                margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="time" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.5rem",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="Temperature"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-secondary">
        <CardContent className="p-4">
          <div className="mb-4 flex justify-between items-center">
            <h5 className="font-bold">Pressure History</h5>
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant={timeRange === "1h" ? "default" : "outline"}
                onClick={() => setTimeRange("1h")}
              >
                1h
              </Button>
              <Button
                size="sm"
                variant={timeRange === "24h" ? "default" : "outline"}
                onClick={() => setTimeRange("24h")}
              >
                24h
              </Button>
              <Button
                size="sm"
                variant={timeRange === "7d" ? "default" : "outline"}
                onClick={() => setTimeRange("7d")}
              >
                7d
              </Button>
            </div>
          </div>
          
          <div className="w-full h-64 bg-card rounded-lg border border-border">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={mockChartData}
                margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="time" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.5rem",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="Pressure"
                  stroke="hsl(var(--chart-3))"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DataVisualizationSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-7 w-40 mb-3" />
      
      <Card className="bg-secondary">
        <CardContent className="p-4">
          <div className="mb-4 flex justify-between items-center">
            <Skeleton className="h-5 w-40" />
            <div className="flex space-x-2">
              <Skeleton className="h-9 w-12" />
              <Skeleton className="h-9 w-12" />
              <Skeleton className="h-9 w-12" />
            </div>
          </div>
          
          <Skeleton className="w-full h-64 rounded-lg" />
        </CardContent>
      </Card>
      
      <Card className="bg-secondary">
        <CardContent className="p-4">
          <div className="mb-4 flex justify-between items-center">
            <Skeleton className="h-5 w-40" />
            <div className="flex space-x-2">
              <Skeleton className="h-9 w-12" />
              <Skeleton className="h-9 w-12" />
              <Skeleton className="h-9 w-12" />
            </div>
          </div>
          
          <Skeleton className="w-full h-64 rounded-lg" />
        </CardContent>
      </Card>
    </div>
  );
}
