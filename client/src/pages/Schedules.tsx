import React, { useState } from "react";
import { useDevices } from "../hooks/useDevices";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, Clock, Plus, Save, Trash2, AlertCircle, Calendar as CalendarIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { TimePicker } from "@/components/TimePicker";

// Interface for the Schedule object
interface Schedule {
  id: string;
  deviceId: string;
  registerName: string;
  value: number;
  time: string;
  days: string[];
  enabled: boolean;
  description?: string;
}

// Component for creating a new schedule
function NewScheduleForm() {
  const { data: devices, isLoading } = useDevices();
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [selectedRegister, setSelectedRegister] = useState<string | null>(null);
  const [scheduleValue, setScheduleValue] = useState<string>("22");
  const [scheduleTime, setScheduleTime] = useState<string>("08:00");
  const [scheduleDays, setScheduleDays] = useState<string[]>(["monday", "tuesday", "wednesday", "thursday", "friday"]);
  const [scheduleEnabled, setScheduleEnabled] = useState<boolean>(true);
  const [scheduleDescription, setScheduleDescription] = useState<string>("");
  
  // Mock function to get registers for selected device
  const getRegistersForDevice = (deviceId: string) => {
    // In a real app, this would fetch from the API
    return ["temperature", "setpoint", "humidity", "power"];
  };
  
  const handleSaveSchedule = () => {
    if (!selectedDevice) {
      toast({
        title: "Device Required",
        description: "Please select a device for this schedule",
        variant: "destructive"
      });
      return;
    }
    
    if (!selectedRegister) {
      toast({
        title: "Register Required",
        description: "Please select a register to control",
        variant: "destructive"
      });
      return;
    }
    
    // In a real app, this would send to the API
    const newSchedule: Omit<Schedule, "id"> = {
      deviceId: selectedDevice,
      registerName: selectedRegister,
      value: parseFloat(scheduleValue),
      time: scheduleTime,
      days: scheduleDays,
      enabled: scheduleEnabled,
      description: scheduleDescription || undefined
    };
    
    console.log("New schedule:", newSchedule);
    
    toast({
      title: "Schedule Created",
      description: `Schedule for ${selectedRegister} has been created`,
    });
    
    // Reset form
    setSelectedDevice(null);
    setSelectedRegister(null);
    setScheduleValue("22");
    setScheduleTime("08:00");
    setScheduleDays(["monday", "tuesday", "wednesday", "thursday", "friday"]);
    setScheduleEnabled(true);
    setScheduleDescription("");
  };
  
  const weekDays = [
    { id: "monday", label: "Mon" },
    { id: "tuesday", label: "Tue" },
    { id: "wednesday", label: "Wed" },
    { id: "thursday", label: "Thu" },
    { id: "friday", label: "Fri" },
    { id: "saturday", label: "Sat" },
    { id: "sunday", label: "Sun" }
  ];
  
  const toggleDay = (day: string) => {
    if (scheduleDays.includes(day)) {
      setScheduleDays(scheduleDays.filter(d => d !== day));
    } else {
      setScheduleDays([...scheduleDays, day]);
    }
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Create New Schedule</CardTitle>
          <CardDescription>Schedule automatic device setpoints</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
        <CardFooter>
          <Skeleton className="h-10 w-24" />
        </CardFooter>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Schedule</CardTitle>
        <CardDescription>Schedule automatic device setpoints</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="device">Device</Label>
            <Select value={selectedDevice || ""} onValueChange={setSelectedDevice}>
              <SelectTrigger id="device">
                <SelectValue placeholder="Select a device" />
              </SelectTrigger>
              <SelectContent>
                {devices?.map(device => (
                  <SelectItem key={device.id} value={device.id}>
                    {device.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="register">Register to Control</Label>
            <Select 
              value={selectedRegister || ""} 
              onValueChange={setSelectedRegister}
              disabled={!selectedDevice}
            >
              <SelectTrigger id="register">
                <SelectValue placeholder="Select a register" />
              </SelectTrigger>
              <SelectContent>
                {selectedDevice && getRegistersForDevice(selectedDevice).map(register => (
                  <SelectItem key={register} value={register}>
                    {register}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="value">Value</Label>
            <Input 
              id="value" 
              type="number" 
              value={scheduleValue} 
              onChange={e => setScheduleValue(e.target.value)} 
              step="0.5"
            />
          </div>
          
          <div className="grid gap-2">
            <Label>Time</Label>
            <TimePicker value={scheduleTime} onChange={setScheduleTime} />
          </div>
          
          <div className="grid gap-2">
            <Label>Days</Label>
            <div className="flex flex-wrap gap-2">
              {weekDays.map(day => (
                <Button 
                  key={day.id} 
                  type="button" 
                  variant={scheduleDays.includes(day.id) ? "default" : "outline"} 
                  className="h-9 w-12"
                  onClick={() => toggleDay(day.id)}
                >
                  {day.label}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Input 
              id="description" 
              value={scheduleDescription} 
              onChange={e => setScheduleDescription(e.target.value)} 
              placeholder="e.g., Morning heating schedule"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Switch 
              checked={scheduleEnabled} 
              onCheckedChange={setScheduleEnabled} 
              id="enabled"
            />
            <Label htmlFor="enabled">Enable Schedule</Label>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSaveSchedule} className="w-full">
          <Save className="mr-2 h-4 w-4" />
          Save Schedule
        </Button>
      </CardFooter>
    </Card>
  );
}

// Component to display a list of existing schedules
function SchedulesList() {
  // Mock data - in a real app this would come from an API
  const schedules: Schedule[] = [
    {
      id: "1",
      deviceId: "680bc3eaa014fd63ac35ba54",
      registerName: "setpoint",
      value: 22.5,
      time: "08:00",
      days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
      enabled: true,
      description: "Weekday morning temperature"
    },
    {
      id: "2",
      deviceId: "680bc3eaa014fd63ac35ba54",
      registerName: "setpoint",
      value: 18.0,
      time: "22:30",
      days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
      enabled: true,
      description: "Weekday night setback"
    },
    {
      id: "3",
      deviceId: "680c98a9b268c52449210cdc",
      registerName: "setpoint",
      value: 24.0,
      time: "14:00",
      days: ["saturday", "sunday"],
      enabled: false,
      description: "Weekend afternoon boost"
    }
  ];
  
  // Mock function to get device name by ID
  const getDeviceName = (id: string) => {
    const deviceMap: Record<string, string> = {
      "680bc3eaa014fd63ac35ba54": "Circutor",
      "680c98a9b268c52449210cdc": "Test Device"
    };
    return deviceMap[id] || "Unknown Device";
  };
  
  const formatDays = (days: string[]) => {
    if (days.length === 7) return "Every day";
    if (days.length === 5 && 
        days.includes("monday") && 
        days.includes("tuesday") && 
        days.includes("wednesday") && 
        days.includes("thursday") && 
        days.includes("friday")) {
      return "Weekdays";
    }
    if (days.length === 2 && days.includes("saturday") && days.includes("sunday")) {
      return "Weekends";
    }
    
    const shortDays = days.map(day => day.substring(0, 3).charAt(0).toUpperCase() + day.substring(1, 3));
    return shortDays.join(", ");
  };
  
  const handleDeleteSchedule = (id: string) => {
    // In a real app, this would delete from the API
    console.log("Delete schedule:", id);
    toast({
      title: "Schedule Deleted",
      description: "The schedule has been removed",
    });
  };
  
  const handleToggleSchedule = (id: string, currentStatus: boolean) => {
    // In a real app, this would update the API
    console.log("Toggle schedule:", id, "to", !currentStatus);
    toast({
      title: `Schedule ${currentStatus ? "Disabled" : "Enabled"}`,
      description: `The schedule is now ${currentStatus ? "disabled" : "enabled"}`,
    });
  };
  
  if (schedules.length === 0) {
    return (
      <Card className="h-[300px] flex items-center justify-center">
        <CardContent className="text-center p-6">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
          <h3 className="text-lg font-medium mb-2">No Schedules Found</h3>
          <p className="text-muted-foreground mb-4">
            You haven't created any schedules yet.
          </p>
          <Button variant="outline">Create Your First Schedule</Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <ScrollArea className="h-[500px]">
      <div className="space-y-4 p-1">
        {schedules.map(schedule => (
          <Card key={schedule.id} className={cn(
            "transition-all duration-200 hover:shadow-md",
            !schedule.enabled && "opacity-70"
          )}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-primary" />
                    {schedule.time} - {getDeviceName(schedule.deviceId)}
                  </h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    Set {schedule.registerName} to {schedule.value} on {formatDays(schedule.days)}
                  </p>
                  {schedule.description && (
                    <p className="text-sm mt-2">{schedule.description}</p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Switch 
                    checked={schedule.enabled} 
                    onCheckedChange={() => handleToggleSchedule(schedule.id, schedule.enabled)}
                  />
                  <Button variant="destructive" size="icon" onClick={() => handleDeleteSchedule(schedule.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-secondary/40">
                  {schedule.registerName}
                </Badge>
                <Badge variant="outline" className="bg-secondary/40">
                  {schedule.value}
                </Badge>
                <Badge variant={schedule.enabled ? "default" : "outline"} className={schedule.enabled ? "" : "text-muted-foreground"}>
                  {schedule.enabled ? "Active" : "Disabled"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}

export default function Schedules() {
  return (
    <div className="container py-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Device Schedules</h1>
        <p className="text-muted-foreground mt-1">
          Automate your devices by scheduling setpoint changes at specific times
        </p>
      </div>
      
      <Tabs defaultValue="current" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="current">Current Schedules</TabsTrigger>
          <TabsTrigger value="new">Create Schedule</TabsTrigger>
        </TabsList>
        
        <TabsContent value="current">
          <SchedulesList />
        </TabsContent>
        
        <TabsContent value="new">
          <NewScheduleForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}