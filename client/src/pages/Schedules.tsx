import React, { useState } from "react";
import { useDevices } from "../hooks/useDevices";
import { useSchedules, type Schedule as ApiSchedule } from "../hooks/useSchedules"; 
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

// Component for creating a new schedule
function NewScheduleForm() {
  const { data: devices, isLoading: devicesLoading } = useDevices();
  const { createSchedule, isPending } = useSchedules();
  
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [selectedRegister, setSelectedRegister] = useState<string>("");
  const [scheduleValue, setScheduleValue] = useState<string>("22");
  const [scheduleTime, setScheduleTime] = useState<string>("08:00");
  const [scheduleDays, setScheduleDays] = useState<string[]>(["monday", "tuesday", "wednesday", "thursday", "friday"]);
  const [scheduleEnabled, setScheduleEnabled] = useState<boolean>(true);
  const [scheduleDescription, setScheduleDescription] = useState<string>("");
  
  // Function to get registers for selected device
  const getRegistersForDevice = (deviceId: string) => {
    const device = devices?.find(d => d.id === deviceId);
    if (!device || !device.registers) return [];
    return device.registers.map(r => r.name);
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
    
    createSchedule({
      deviceId: selectedDevice,
      registerName: selectedRegister,
      value: parseFloat(scheduleValue),
      time: scheduleTime,
      days: scheduleDays,
      enabled: scheduleEnabled,
      description: scheduleDescription || undefined
    });
    
    // Reset form
    setSelectedDevice("");
    setSelectedRegister("");
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
  
  if (devicesLoading) {
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
            <Select value={selectedDevice} onValueChange={setSelectedDevice}>
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
              value={selectedRegister} 
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
        <Button onClick={handleSaveSchedule} className="w-full" disabled={isPending}>
          {isPending ? (
            <>
              <span className="mr-2 h-4 w-4 animate-spin">⏳</span>
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Schedule
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

// Component to display a list of existing schedules
function SchedulesList() {
  const { schedules, isLoading, deleteSchedule, toggleSchedule } = useSchedules();
  const { data: devices } = useDevices();
  
  const getDeviceName = (id: string) => {
    const device = devices?.find(d => d.id === id);
    return device?.name || "Unknown Device";
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
    if (confirm("Are you sure you want to delete this schedule?")) {
      deleteSchedule(id);
    }
  };
  
  const handleToggleSchedule = (id: string, currentStatus: boolean) => {
    toggleSchedule(id);
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Schedules</CardTitle>
          <CardDescription>Your automated device control schedules</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!schedules || schedules.length === 0) {
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
    <Card>
      <CardHeader>
        <CardTitle>Schedules</CardTitle>
        <CardDescription>Your automated device control schedules</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[460px] pr-4">
          <div className="space-y-4">
            {schedules.map(schedule => (
              <Card key={schedule._id} className={cn(
                "border-l-4",
                schedule.enabled ? "border-l-green-500" : "border-l-orange-400 opacity-70"
              )}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-base">
                        {getDeviceName(schedule.deviceId)}: {schedule.registerName}
                      </h3>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-3.5 w-3.5 mr-1" />
                        {schedule.time} - {formatDays(schedule.days)}
                      </div>
                    </div>
                    <Badge variant={schedule.enabled ? "default" : "outline"}>
                      {schedule.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="text-sm bg-muted px-2 py-1 rounded-md font-mono">
                      Value: {schedule.value}
                    </div>
                    {schedule.description && (
                      <div className="text-sm text-muted-foreground italic">
                        {schedule.description}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleSchedule(schedule._id, schedule.enabled)}
                        title={schedule.enabled ? "Disable" : "Enable"}
                      >
                        <Switch checked={schedule.enabled} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteSchedule(schedule._id)}
                        className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default function Schedules() {
  return (
    <div className="container py-6 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Device Scheduling</h1>
      
      <Tabs defaultValue="list" className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="list">Schedules</TabsTrigger>
          <TabsTrigger value="create">Create New</TabsTrigger>
        </TabsList>
        <TabsContent value="list">
          <SchedulesList />
        </TabsContent>
        <TabsContent value="create">
          <NewScheduleForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}