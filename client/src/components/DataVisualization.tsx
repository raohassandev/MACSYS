import { useState } from "react";
import { useDevice } from "@/hooks/useDevice";
import { useHistoricalData } from "@/hooks/useHistoricalData";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

interface DataVisualizationProps {
  deviceId: string;
}

export default function DataVisualization({ deviceId }: DataVisualizationProps) {
  const { data: device, isLoading: isDeviceLoading } = useDevice(deviceId);
  const [timeRange, setTimeRange] = useState<"1h" | "24h" | "7d">("24h");
  const { data: historicalData, isLoading: isHistoricalLoading } = useHistoricalData({
    deviceId,
    timeRange
  });
  
  if (isDeviceLoading || isHistoricalLoading) {
    return <DataVisualizationSkeleton />;
  }
  
  // Format the historical data for the charts
  const chartData = historicalData?.map(item => {
    // Parse the timestamp
    const date = new Date(item.timestamp);
    const formattedTime = format(date, "HH:mm");
    
    // Create a data point with all register values
    const dataPoint: any = { time: formattedTime };
    
    if (item.data) {
      // Add all register values to the data point
      Object.entries(item.data).forEach(([key, value]) => {
        dataPoint[key] = value;
      });
    }
    
    return dataPoint;
  }) || [];
  
  // Extract available register names from the data
  const availableRegisters = chartData.length > 0 
    ? Object.keys(chartData[0]).filter(key => key !== 'time') 
    : [];
    
  // If no data is available, show a message
  if (chartData.length === 0 || availableRegisters.length === 0) {
    return (
      <div className="space-y-6">
        <h4 className="text-lg font-bold mb-3">Data Visualization</h4>
        <Card className="bg-secondary">
          <CardContent className="p-4 flex items-center justify-center h-64">
            <p className="text-muted-foreground text-center">
              No historical data available for the selected time range.<br />
              Data will appear here as it's collected from the device.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h4 className="text-lg font-bold mb-3">Data Visualization</h4>
      
      {/* Time range selector */}
      <div className="flex justify-end mb-4">
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
      
      {/* Generate a visualization card for each register */}
      {availableRegisters.map(registerName => (
        <Card key={registerName} className="bg-secondary">
          <CardContent className="p-4">
            <div className="mb-4 flex justify-between items-center">
              <h5 className="font-bold">{registerName} History</h5>
            </div>
            
            <div className="w-full h-64 bg-card rounded-lg border border-border">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
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
                    dataKey={registerName}
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
      ))}
    </div>
  );
}

function DataVisualizationSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-7 w-40 mb-3" />
      
      {/* Time range selector skeleton */}
      <div className="flex justify-end mb-4">
        <div className="flex space-x-2">
          <Skeleton className="h-9 w-12" />
          <Skeleton className="h-9 w-12" />
          <Skeleton className="h-9 w-12" />
        </div>
      </div>
      
      {/* Visualization card skeletons */}
      {[1, 2].map((index) => (
        <Card key={index} className="bg-secondary">
          <CardContent className="p-4">
            <div className="mb-4 flex justify-between items-center">
              <Skeleton className="h-5 w-40" />
            </div>
            <Skeleton className="w-full h-64 rounded-lg" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
