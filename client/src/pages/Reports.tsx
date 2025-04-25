import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { useDevices } from "@/hooks/useDevices";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from "recharts";
import { Button } from "@/components/ui/button";
import { Loader2, Download, BarChart2, LineChart as LineChartIcon, Calendar } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Device } from "@/types";
import { format, subDays, subMonths, subYears, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { useHistoricalData } from "@/hooks/useHistoricalData";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";

export default function Reports() {
  const { data: devices, isLoading: isLoadingDevices } = useDevices();
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [selectedDeviceObj, setSelectedDeviceObj] = useState<Device | null>(null);
  const [reportType, setReportType] = useState<"daily" | "weekly" | "monthly" | "yearly">("daily");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isGenerating, setIsGenerating] = useState(false);
  const [chartType, setChartType] = useState<"line" | "bar">("line");
  
  // Calculate date range based on report type
  const dateRange = calculateDateRange(reportType, selectedDate);
  
  const { data: reportData, isLoading: isLoadingReportData, refetch } = useHistoricalData(
    selectedDevice,
    dateRange.startDate,
    dateRange.endDate
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
  
  // Format data for the chart based on report type
  const formattedData = formatReportData(reportData || [], reportType);
  
  // Get unique data keys from the report
  const dataKeys = getDataKeys(formattedData);
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Report Generator</h2>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Report Configuration</CardTitle>
          <CardDescription>Configure your report parameters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <label className="block text-sm font-medium mb-2">Report Type</label>
              <Select
                value={reportType}
                onValueChange={(value: "daily" | "weekly" | "monthly" | "yearly") => setReportType(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily Report</SelectItem>
                  <SelectItem value="weekly">Weekly Report</SelectItem>
                  <SelectItem value="monthly">Monthly Report</SelectItem>
                  <SelectItem value="yearly">Yearly Report</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                {reportType === "daily" ? "Select Day" : 
                 reportType === "weekly" ? "Select Week" : 
                 reportType === "monthly" ? "Select Month" : "Select Year"}
              </label>
              <DatePicker
                date={selectedDate}
                setDate={(date) => date && setSelectedDate(date)}
              />
            </div>
            
            <div className="flex items-end">
              <Button 
                className="w-full" 
                onClick={() => {
                  setIsGenerating(true);
                  refetch().finally(() => setIsGenerating(false));
                }}
                disabled={!selectedDevice || isLoadingReportData || isGenerating}
              >
                {isGenerating || isLoadingReportData ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>Generate Report</>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {isLoadingReportData || isGenerating ? (
        <Card>
          <CardContent className="flex justify-center items-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
            <p className="text-lg">Generating report...</p>
          </CardContent>
        </Card>
      ) : selectedDevice && reportData && formattedData.length > 0 ? (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>
                  {reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report: {getReportTitle(reportType, selectedDate)}
                </CardTitle>
                <CardDescription>
                  {selectedDeviceObj?.name} - {dateRange.startDate.toLocaleDateString()} to {dateRange.endDate.toLocaleDateString()}
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={() => setChartType("line")}>
                  <LineChartIcon className={`h-4 w-4 ${chartType === 'line' ? 'text-primary' : ''}`} />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setChartType("bar")}>
                  <BarChart2 className={`h-4 w-4 ${chartType === 'bar' ? 'text-primary' : ''}`} />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-1" /> Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => exportReportAsCsv(formattedData, dataKeys, reportType, selectedDate, selectedDeviceObj?.name || 'device')}>
                      CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportReportAsPdf(formattedData, dataKeys, reportType, selectedDate, selectedDeviceObj?.name || 'device')}>
                      PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportReportAsExcel(formattedData, dataKeys, reportType, selectedDate, selectedDeviceObj?.name || 'device')}>
                      Excel
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="w-full h-96 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === "line" ? (
                    <LineChart
                      data={formattedData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis 
                        dataKey="label" 
                        stroke="rgba(255,255,255,0.5)"
                      />
                      <YAxis 
                        stroke="rgba(255,255,255,0.5)"
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
                      {generateChartLines(dataKeys)}
                    </LineChart>
                  ) : (
                    <BarChart
                      data={formattedData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis 
                        dataKey="label" 
                        stroke="rgba(255,255,255,0.5)"
                      />
                      <YAxis 
                        stroke="rgba(255,255,255,0.5)"
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
                      {generateChartBars(dataKeys)}
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Report Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dataKeys.map(key => {
                  const values = formattedData.map(item => item[key] || 0).filter(val => !isNaN(val));
                  const avg = values.length ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
                  const min = values.length ? Math.min(...values) : 0;
                  const max = values.length ? Math.max(...values) : 0;
                  const current = values.length ? values[values.length - 1] : 0;
                  
                  return (
                    <Card key={key} className="bg-secondary">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">{key}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Current:</span>
                            <span className="font-medium">{formatNumber(current)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Average:</span>
                            <span className="font-medium">{formatNumber(avg)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Minimum:</span>
                            <span className="font-medium">{formatNumber(min)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Maximum:</span>
                            <span className="font-medium">{formatNumber(max)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : selectedDevice ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg text-center">No data available for the selected time period.</p>
            <p className="text-muted-foreground text-center mt-2">Try selecting a different time period or device.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg text-center">Select a device to generate a report.</p>
            <p className="text-muted-foreground text-center mt-2">Reports will help you analyze historical data patterns.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Helper function to calculate date range based on report type
function calculateDateRange(reportType: "daily" | "weekly" | "monthly" | "yearly", selectedDate: Date) {
  let startDate, endDate;
  
  switch (reportType) {
    case "daily":
      startDate = startOfDay(selectedDate);
      endDate = endOfDay(selectedDate);
      break;
    case "weekly":
      startDate = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Week starts on Monday
      endDate = endOfWeek(selectedDate, { weekStartsOn: 1 });
      break;
    case "monthly":
      startDate = startOfMonth(selectedDate);
      endDate = endOfMonth(selectedDate);
      break;
    case "yearly":
      startDate = startOfYear(selectedDate);
      endDate = endOfYear(selectedDate);
      break;
  }
  
  return { startDate, endDate };
}

// Helper function to format report data for charts
function formatReportData(data: any[], reportType: "daily" | "weekly" | "monthly" | "yearly") {
  if (!data || data.length === 0) return [];
  
  // Group data based on report type
  const groupedData: Record<string, any[]> = {};
  
  data.forEach(item => {
    const date = new Date(item.timestamp);
    let key = '';
    
    switch (reportType) {
      case "daily":
        // Group by hour
        key = format(date, 'HH:00');
        break;
      case "weekly":
        // Group by day of week
        key = format(date, 'EEEE'); // Monday, Tuesday, etc.
        break;
      case "monthly":
        // Group by day of month
        key = format(date, 'dd'); // 01, 02, etc.
        break;
      case "yearly":
        // Group by month
        key = format(date, 'MMMM'); // January, February, etc.
        break;
    }
    
    if (!groupedData[key]) {
      groupedData[key] = [];
    }
    
    groupedData[key].push(item);
  });
  
  // Calculate averages for each group
  const result = Object.entries(groupedData).map(([label, items]) => {
    const result: Record<string, any> = { label };
    
    // Calculate average value for each data point
    items.forEach(item => {
      if (item.data) {
        Object.entries(item.data).forEach(([key, value]) => {
          if (typeof value === 'number') {
            if (!result[key]) {
              result[key] = 0;
              result[`${key}_count`] = 0;
            }
            result[key] += value;
            result[`${key}_count`] += 1;
          }
        });
      }
    });
    
    // Convert sums to averages
    Object.keys(result).forEach(key => {
      if (key.endsWith('_count')) {
        const baseKey = key.replace('_count', '');
        result[baseKey] = result[baseKey] / result[key];
        delete result[key];
      }
    });
    
    return result;
  });
  
  // Sort data points chronologically
  return sortChronologically(result, reportType);
}

// Helper function to sort the data chronologically based on report type
function sortChronologically(data: any[], reportType: "daily" | "weekly" | "monthly" | "yearly") {
  const sortOrder: Record<string, number> = {};
  
  switch (reportType) {
    case "daily":
      // Sort by hour (00:00 to 23:00)
      for (let i = 0; i < 24; i++) {
        const hour = i.toString().padStart(2, '0');
        sortOrder[`${hour}:00`] = i;
      }
      break;
    case "weekly":
      // Sort by day of week (Monday to Sunday)
      const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      daysOfWeek.forEach((day, index) => {
        sortOrder[day] = index;
      });
      break;
    case "monthly":
      // Sort by day of month (01 to 31)
      for (let i = 1; i <= 31; i++) {
        const day = i.toString().padStart(2, '0');
        sortOrder[day] = i;
      }
      break;
    case "yearly":
      // Sort by month (January to December)
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                     'July', 'August', 'September', 'October', 'November', 'December'];
      months.forEach((month, index) => {
        sortOrder[month] = index;
      });
      break;
  }
  
  return data.sort((a, b) => sortOrder[a.label] - sortOrder[b.label]);
}

// Helper function to get report title
function getReportTitle(reportType: "daily" | "weekly" | "monthly" | "yearly", selectedDate: Date) {
  switch (reportType) {
    case "daily":
      return format(selectedDate, 'MMMM d, yyyy');
    case "weekly":
      const startOfWeekDate = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const endOfWeekDate = endOfWeek(selectedDate, { weekStartsOn: 1 });
      return `${format(startOfWeekDate, 'MMM d')} - ${format(endOfWeekDate, 'MMM d, yyyy')}`;
    case "monthly":
      return format(selectedDate, 'MMMM yyyy');
    case "yearly":
      return format(selectedDate, 'yyyy');
  }
}

// Helper function to get data keys from report data
function getDataKeys(data: any[]) {
  if (!data || data.length === 0) return [];
  
  const allKeys = new Set<string>();
  data.forEach(item => {
    Object.keys(item).forEach(key => {
      if (key !== 'label' && !key.endsWith('_count')) {
        allKeys.add(key);
      }
    });
  });
  
  return Array.from(allKeys);
}

// Helper function to generate Line components for the chart
function generateChartLines(dataKeys: string[]) {
  // Define a set of colors for different lines
  const colors = [
    "hsl(var(--chart-1))", // Blue
    "hsl(var(--chart-2))", // Green
    "hsl(var(--chart-3))", // Yellow
    "hsl(var(--chart-4))", // Red
    "hsl(var(--chart-5))", // Purple
    "hsl(var(--chart-6))"  // Cyan
  ];
  
  return dataKeys.map((key, index) => (
    <Line
      key={key}
      type="monotone"
      dataKey={key}
      stroke={colors[index % colors.length]}
      strokeWidth={2}
      dot={{ r: 3 }}
      activeDot={{ r: 5 }}
    />
  ));
}

// Helper function to generate Bar components for the chart
function generateChartBars(dataKeys: string[]) {
  // Define a set of colors for different bars
  const colors = [
    "hsl(var(--chart-1))", // Blue
    "hsl(var(--chart-2))", // Green
    "hsl(var(--chart-3))", // Yellow
    "hsl(var(--chart-4))", // Red
    "hsl(var(--chart-5))", // Purple
    "hsl(var(--chart-6))"  // Cyan
  ];
  
  return dataKeys.map((key, index) => (
    <Bar
      key={key}
      dataKey={key}
      fill={colors[index % colors.length]}
      radius={[4, 4, 0, 0]}
    />
  ));
}

// Helper function to format numbers
function formatNumber(value: number) {
  return Number.isInteger(value) ? value.toString() : value.toFixed(2);
}

// Helper function to export data as CSV
function exportReportAsCsv(data: any[], dataKeys: string[], reportType: string, selectedDate: Date, deviceName: string) {
  // Create CSV header
  const headers = ['Timestamp', ...dataKeys];
  const csvContent = [headers.join(',')];
  
  // Add rows
  data.forEach(row => {
    const values = [row.label];
    dataKeys.forEach(key => {
      values.push(row[key] !== undefined ? formatNumber(row[key]) : '');
    });
    csvContent.push(values.join(','));
  });
  
  // Create blob and download
  const blob = new Blob([csvContent.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${reportType}_report_${deviceName}_${format(selectedDate, 'yyyy-MM-dd')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}