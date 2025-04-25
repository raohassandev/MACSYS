import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { useDevices } from "@/hooks/useDevices";
import { useHistoricalData } from "@/hooks/useHistoricalData";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Device } from "@/types";

// Helper functions for formatting data
const formatHistoricalData = (data: any[]) => {
  // Map the historical data to a format suitable for the chart
  return data.map(item => {
    // Format the timestamp to a readable format
    const date = new Date(item.timestamp);
    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Start with the time key
    const result: any = { time };
    
    // Add all data properties as separate keys
    if (item.data) {
      Object.keys(item.data).forEach(key => {
        result[key] = item.data[key];
      });
    }
    
    return result;
  });
};

// Generate Line components for each data property
const getChartLines = (data: any[]) => {
  if (!data || data.length === 0 || !data[0].data) return null;
  
  // Get unique data keys from all data points
  const dataKeys = new Set<string>();
  data.forEach(item => {
    if (item.data) {
      Object.keys(item.data).forEach(key => dataKeys.add(key));
    }
  });
  
  // Define a set of colors for different lines
  const colors = [
    "hsl(var(--chart-1))", // Blue
    "hsl(var(--chart-2))", // Green
    "hsl(var(--chart-3))", // Yellow
    "hsl(var(--chart-4))", // Red
    "hsl(var(--chart-5))", // Purple
    "hsl(var(--chart-6))"  // Cyan
  ];
  
  // Generate a Line component for each data key
  return Array.from(dataKeys).map((key, index) => (
    <Line
      key={key}
      type="monotone"
      dataKey={key}
      stroke={colors[index % colors.length]}
      strokeWidth={2}
      dot={{ r: 3 }}
      activeDot={{ r: 5 }}
      name={`${key}`}
    />
  ));
};

export default function History() {
  const { data: devices, isLoading: isLoadingDevices } = useDevices();
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [selectedDeviceObj, setSelectedDeviceObj] = useState<Device | null>(null);
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(Date.now() - 24 * 60 * 60 * 1000)
  );
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [isQuerying, setIsQuerying] = useState(false);
  
  const { data: historicalData, isLoading: isLoadingHistoricalData, refetch } = useHistoricalData(
    selectedDevice,
    startDate,
    endDate
  );
  
  // Update the selected device object when the device ID changes
  useEffect(() => {
    if (selectedDevice && devices) {
      const device = devices.find(d => d.id === selectedDevice);
      setSelectedDeviceObj(device || null);
    } else {
      setSelectedDeviceObj(null);
    }
  }, [selectedDevice, devices]);
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Historical Data</h2>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Data Query</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select Device</label>
              <Select
                value={selectedDevice}
                onValueChange={setSelectedDevice}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a device" />
                </SelectTrigger>
                <SelectContent>
                  {devices && devices.length > 0 ? devices.map((device) => (
                    <SelectItem key={device.id} value={device.id}>
                      {device.name}
                    </SelectItem>
                  )) : (
                    <SelectItem value="no-devices" disabled>No devices available</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Start Date</label>
              <DatePicker
                date={startDate}
                setDate={setStartDate}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">End Date</label>
              <DatePicker
                date={endDate}
                setDate={setEndDate}
              />
            </div>
            
            <div className="flex items-end">
              <Button 
                className="w-full" 
                onClick={() => {
                  setIsQuerying(true);
                  refetch().finally(() => setIsQuerying(false));
                }}
                disabled={!selectedDevice || isLoadingHistoricalData || isQuerying}
              >
                {isQuerying || isLoadingHistoricalData ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Query Data'
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Historical Trend</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingHistoricalData || isQuerying ? (
            <div className="flex justify-center items-center h-96">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <span className="ml-2 text-lg">Loading historical data...</span>
            </div>
          ) : selectedDevice && historicalData && historicalData.length > 0 ? (
            <div className="w-full h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={formatHistoricalData(historicalData)}
                  margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis 
                    dataKey="time" 
                    stroke="rgba(255,255,255,0.5)"
                    label={{ value: 'Time', position: 'insideBottomRight', offset: -10 }}
                  />
                  <YAxis 
                    stroke="rgba(255,255,255,0.5)"
                    label={{ value: 'Value', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.5rem",
                      color: "hsl(var(--foreground))",
                    }}
                  />
                  <Legend />
                  {getChartLines(historicalData)}
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : selectedDevice ? (
            <div className="text-center py-12 text-gray-400">
              <p>No historical data available for the selected time range.</p>
              <p className="mt-2">Try adjusting the date range or selecting a different device.</p>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <p>Please select a device to view historical data</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
