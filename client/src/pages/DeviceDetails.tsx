import React, { useState } from 'react';
import { useRoute } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { format } from 'date-fns';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useHistoricalData, type TimeRange } from '../hooks/useHistoricalData';
import { ArrowLeft, Clock, Info, Settings, Thermometer, RefreshCw, BarChart3 } from 'lucide-react';
import { Link } from 'wouter';
import { useDevice } from '../hooks/useDevice';
import { useSetpoint } from '../hooks/useSetpoint';
import { useDeviceSchedules } from '../hooks/useSchedules';

export default function DeviceDetails() {
  const [, params] = useRoute('/devices/:id');
  const deviceId = params?.id || '';

  // Tabs state
  const [activeTab, setActiveTab] = useState('overview');
  
  // Chart state
  const [selectedRegister, setSelectedRegister] = useState<string>('temperature');

  // Fetch device data
  const { device, isLoading: deviceLoading, error: deviceError, refetch } = useDevice(deviceId);
  
  // Fetch historical data
  const { 
    data: historicalData, 
    isLoading: dataLoading, 
    error: dataError,
    timeRange,
    setTimeRange,
    getChartData
  } = useHistoricalData(deviceId);
  
  // Get schedules for this device
  const { schedules, isLoading: schedulesLoading } = useDeviceSchedules(deviceId);
  
  // Get latest data
  const { data: latestData, isLoading: latestLoading } = useQuery({
    queryKey: ['deviceLatest', deviceId],
    queryFn: async () => {
      const response = await fetch(`/api/devices/${deviceId}/latest`);
      if (!response.ok) throw new Error('Failed to fetch latest data');
      return response.json();
    },
    enabled: !!deviceId,
    refetchInterval: 10000, // Refresh every 10 seconds
  });
  
  // Setup setpoint handling
  const { 
    setValue, 
    sending, 
    success, 
    error: setpointError 
  } = useSetpoint();
  
  const handleSetpointChange = (registerName: string, value: number) => {
    setValue(deviceId, registerName, value);
  };
  
  // Helper to format timestamp in tooltip
  const formatXAxis = (tickItem: Date) => {
    return format(new Date(tickItem), 'HH:mm');
  };
  
  const formatTooltipTime = (value: Date) => {
    return format(new Date(value), 'MMM dd, yyyy HH:mm:ss');
  };
  
  const getRegisterColor = (registerName: string) => {
    const colors: Record<string, string> = {
      temperature: '#ff5722',
      humidity: '#2196f3',
      pressure: '#4caf50',
      setpoint: '#9c27b0',
      power: '#f44336',
      energy: '#ffc107',
      current: '#3f51b5',
      voltage: '#009688',
      default: '#757575'
    };
    
    return colors[registerName] || colors.default;
  };
  
  // Get all available registers
  const getAvailableRegisters = () => {
    if (!device?.registers) return [];
    return device.registers.map(register => register.name);
  };
  
  const getRegisterUnit = (registerName: string) => {
    if (!device?.registers) return '';
    const register = device.registers.find(r => r.name === registerName);
    return register?.unit || '';
  };
  
  const getLatestValue = (registerName: string) => {
    if (!latestData?.data) return 'N/A';
    return latestData.data[registerName] !== undefined 
      ? latestData.data[registerName] 
      : 'N/A';
  };
  
  // Loading states
  if (deviceLoading) {
    return (
      <div className="container py-8 max-w-6xl">
        <Skeleton className="h-10 w-1/2 mb-4" />
        <Skeleton className="h-6 w-1/3 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
        <Skeleton className="h-72 mt-8" />
      </div>
    );
  }
  
  // Error state
  if (deviceError) {
    return (
      <div className="container py-8 text-center">
        <h2 className="text-2xl font-bold text-destructive mb-4">Error Loading Device</h2>
        <p className="mb-4">There was a problem fetching the device details.</p>
        <Button onClick={() => refetch()}>Try Again</Button>
      </div>
    );
  }
  
  // If no device found
  if (!device) {
    return (
      <div className="container py-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Device Not Found</h2>
        <p className="mb-4">The requested device could not be found.</p>
        <Link href="/devices">
          <Button>Back to Devices</Button>
        </Link>
      </div>
    );
  }
  
  return (
    <div className="container py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <Link href="/devices">
            <Button variant="ghost" className="pl-0 mb-2">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Devices
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">{device.name}</h1>
          <p className="text-muted-foreground">{device.description || device.ipAddress}:{device.port}</p>
        </div>
        <div className="flex items-center mt-4 md:mt-0">
          <div className={`px-3 py-1.5 rounded-full text-sm font-medium mr-4 ${
            latestData?.status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {latestData?.status ? 'Online' : 'Offline'}
          </div>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="schedules">Schedules</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Latest Values */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Info className="mr-2 h-5 w-5" />
                  Current Values
                </CardTitle>
                <CardDescription>Latest readings from the device</CardDescription>
              </CardHeader>
              <CardContent>
                {latestLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-full" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {device.registers?.slice(0, 5).map(register => (
                      <div key={register.name} className="flex justify-between items-center">
                        <span className="font-medium">{register.name}:</span>
                        <span>{getLatestValue(register.name)} {register.unit}</span>
                      </div>
                    ))}
                    <div className="text-xs text-muted-foreground mt-2">
                      Last updated: {latestData?.timestamp ? 
                        format(new Date(latestData.timestamp), 'MMM dd, HH:mm:ss') : 
                        'Never'}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Device Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="mr-2 h-5 w-5" />
                  Device Information
                </CardTitle>
                <CardDescription>Configuration and status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">IP Address:</span>
                    <span>{device.ipAddress}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Port:</span>
                    <span>{device.port}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Slave ID:</span>
                    <span>{device.slaveId}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Type:</span>
                    <span>{device.deviceType}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Control:</span>
                    <span className="capitalize">{device.control || 'central'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Setpoints */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Thermometer className="mr-2 h-5 w-5" />
                  Setpoint Controls
                </CardTitle>
                <CardDescription>Adjust device setpoints</CardDescription>
              </CardHeader>
              <CardContent>
                {device.registers?.filter(r => !r.readOnly).slice(0, 3).map(register => (
                  <div key={register.name} className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{register.name}:</span>
                      <span>{getLatestValue(register.name)} {register.unit}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={0}
                        max={50}
                        step={0.5}
                        defaultValue={latestData?.data?.[register.name] || 22}
                        onChange={(e) => handleSetpointChange(register.name, parseFloat(e.target.value))}
                        className="flex-1"
                      />
                      <Button 
                        size="sm" 
                        disabled={sending} 
                        onClick={() => 
                          handleSetpointChange(register.name, latestData?.data?.[register.name] || 22)
                        }
                      >
                        Set
                      </Button>
                    </div>
                  </div>
                ))}
                {device.registers?.filter(r => !r.readOnly).length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    This device has no writable registers.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Quick trend chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="mr-2 h-5 w-5" />
                Recent Trends
              </CardTitle>
              <CardDescription>Data from the last 24 hours</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                {dataLoading ? (
                  <div className="h-full w-full flex items-center justify-center">
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : historicalData && historicalData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={getChartData(['temperature', 'humidity', 'setpoint'].filter(
                        register => device.registers?.some(r => r.name === register)
                      ))}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ff5722" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#ff5722" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorHum" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2196f3" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#2196f3" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorSet" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#9c27b0" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#9c27b0" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="timestamp" 
                        tickFormatter={formatXAxis} 
                        type="number"
                        domain={['dataMin', 'dataMax']}
                        scale="time"
                        tickCount={6}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={formatTooltipTime}
                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px' }}
                      />
                      <Legend />
                      {device.registers?.some(r => r.name === 'temperature') && (
                        <Area 
                          type="monotone" 
                          dataKey="temperature" 
                          stroke="#ff5722" 
                          fillOpacity={1}
                          fill="url(#colorTemp)"
                          connectNulls
                        />
                      )}
                      {device.registers?.some(r => r.name === 'humidity') && (
                        <Area 
                          type="monotone" 
                          dataKey="humidity" 
                          stroke="#2196f3" 
                          fillOpacity={1}
                          fill="url(#colorHum)"
                          connectNulls
                        />
                      )}
                      {device.registers?.some(r => r.name === 'setpoint') && (
                        <Area 
                          type="monotone" 
                          dataKey="setpoint" 
                          stroke="#9c27b0" 
                          fillOpacity={1}
                          fill="url(#colorSet)"
                          connectNulls
                        />
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <p className="text-center text-muted-foreground">
                      No historical data available for this device.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                  <CardTitle>Historical Data Trends</CardTitle>
                  <CardDescription>Analyze device performance over time</CardDescription>
                </div>
                <div className="flex flex-col md:flex-row gap-4 mt-4 md:mt-0">
                  <Select value={selectedRegister} onValueChange={setSelectedRegister}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select register" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableRegisters().map(register => (
                        <SelectItem key={register} value={register}>{register}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Time range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1h">Last hour</SelectItem>
                      <SelectItem value="6h">Last 6 hours</SelectItem>
                      <SelectItem value="12h">Last 12 hours</SelectItem>
                      <SelectItem value="24h">Last 24 hours</SelectItem>
                      <SelectItem value="7d">Last 7 days</SelectItem>
                      <SelectItem value="30d">Last 30 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[500px]">
                {dataLoading ? (
                  <div className="h-full w-full flex items-center justify-center">
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : historicalData && historicalData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={getChartData([selectedRegister])}
                      margin={{ top: 10, right: 30, left: 10, bottom: 30 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="timestamp"
                        tickFormatter={formatXAxis}
                        type="number"
                        domain={['dataMin', 'dataMax']}
                        scale="time"
                        tickCount={6}
                        angle={-45}
                        textAnchor="end"
                        height={50}
                      />
                      <YAxis 
                        label={{ 
                          value: getRegisterUnit(selectedRegister), 
                          angle: -90, 
                          position: 'insideLeft',
                          style: { textAnchor: 'middle' }
                        }} 
                      />
                      <Tooltip 
                        labelFormatter={formatTooltipTime}
                        formatter={(value) => [`${value} ${getRegisterUnit(selectedRegister)}`, selectedRegister]}
                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px' }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey={selectedRegister} 
                        stroke={getRegisterColor(selectedRegister)}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 6 }}
                        connectNulls
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <p className="text-center text-muted-foreground">
                      No historical data available for this device in the selected time range.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                {historicalData && (
                  <div className="flex items-center">
                    <Clock className="mr-1 h-4 w-4" />
                    {historicalData.length} data points available
                  </div>
                )}
              </div>
              <Button variant="outline" onClick={() => refetch()}>Refresh Data</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Device Configuration</CardTitle>
              <CardDescription>View and modify device settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Device Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Device Name</p>
                    <p>{device.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Device Type</p>
                    <p>{device.deviceType}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">IP Address</p>
                    <p>{device.ipAddress}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Port</p>
                    <p>{device.port}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Slave ID</p>
                    <p>{device.slaveId}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Status</p>
                    <p className={latestData?.status ? 'text-green-600' : 'text-red-600'}>
                      {latestData?.status ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3">Registers</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Address
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Data Type
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Unit
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Access
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y">
                      {device.registers?.map((register, index) => (
                        <tr key={register.name} className={index % 2 === 0 ? 'bg-background' : 'bg-card'}>
                          <td className="px-4 py-3 text-sm whitespace-nowrap">
                            {register.name}
                          </td>
                          <td className="px-4 py-3 text-sm whitespace-nowrap">
                            {register.address}
                          </td>
                          <td className="px-4 py-3 text-sm whitespace-nowrap">
                            {register.dataType || 'float'}
                          </td>
                          <td className="px-4 py-3 text-sm whitespace-nowrap">
                            {register.unit || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm whitespace-nowrap">
                            {register.readOnly ? 'Read-only' : 'Read/Write'}
                          </td>
                        </tr>
                      ))}
                      {!device.registers || device.registers.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-4 text-center text-sm text-muted-foreground">
                            No registers configured for this device.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="schedules">
          <Card>
            <CardHeader>
              <CardTitle>Device Schedules</CardTitle>
              <CardDescription>Automatic controls for this device</CardDescription>
            </CardHeader>
            <CardContent>
              {schedulesLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : schedules && schedules.length > 0 ? (
                <div className="space-y-4">
                  {schedules.map(schedule => (
                    <div 
                      key={schedule._id} 
                      className={`p-4 border rounded-lg ${
                        schedule.enabled ? 'border-primary/30' : 'border-muted opacity-70'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{schedule.registerName}: {schedule.value}</h3>
                          <p className="text-sm text-muted-foreground">
                            {schedule.time} - {
                              schedule.days.length === 7 
                                ? 'Every day' 
                                : schedule.days.map(day => day.substring(0, 3)).join(', ')
                            }
                          </p>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs ${
                          schedule.enabled ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {schedule.enabled ? 'Active' : 'Disabled'}
                        </div>
                      </div>
                      {schedule.description && (
                        <p className="mt-2 text-sm text-muted-foreground italic">
                          {schedule.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    No schedules have been created for this device yet.
                  </p>
                  <Link href="/schedules">
                    <Button>Create a Schedule</Button>
                  </Link>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Link href="/schedules">
                <Button variant="outline">Manage Schedules</Button>
              </Link>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}