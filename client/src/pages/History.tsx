import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { useDevices } from "@/hooks/useDevices";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Button } from "@/components/ui/button";

// Mock historical data
const mockHistoricalData = [
  { time: '00:00', Temperature: 21.5, Pressure: 2.8 },
  { time: '02:00', Temperature: 21.2, Pressure: 2.7 },
  { time: '04:00', Temperature: 20.8, Pressure: 2.7 },
  { time: '06:00', Temperature: 20.5, Pressure: 2.6 },
  { time: '08:00', Temperature: 21.0, Pressure: 2.7 },
  { time: '10:00', Temperature: 22.5, Pressure: 2.9 },
  { time: '12:00', Temperature: 24.0, Pressure: 3.0 },
  { time: '14:00', Temperature: 25.5, Pressure: 3.2 },
  { time: '16:00', Temperature: 26.0, Pressure: 3.3 },
  { time: '18:00', Temperature: 25.5, Pressure: 3.2 },
  { time: '20:00', Temperature: 24.0, Pressure: 3.0 },
  { time: '22:00', Temperature: 22.5, Pressure: 2.9 },
  { time: '24:00', Temperature: 21.5, Pressure: 2.8 },
];

export default function History() {
  const { data: devices } = useDevices();
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(Date.now() - 24 * 60 * 60 * 1000)
  );
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  
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
                  {devices?.map((device) => (
                    <SelectItem key={device.id} value={device.id.toString()}>
                      {device.name}
                    </SelectItem>
                  ))}
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
              <Button className="w-full">Query Data</Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Historical Trend</CardTitle>
        </CardHeader>
        <CardContent>
          {selectedDevice ? (
            <div className="w-full h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={mockHistoricalData}
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
                  <Line
                    type="monotone"
                    dataKey="Temperature"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                    name="Temperature (°C)"
                  />
                  <Line
                    type="monotone"
                    dataKey="Pressure"
                    stroke="hsl(var(--chart-3))"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                    name="Pressure (bar)"
                  />
                </LineChart>
              </ResponsiveContainer>
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
