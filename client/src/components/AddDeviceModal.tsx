import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { X } from "lucide-react";

// Schema for a register
const registerSchema = z.object({
  name: z.string().min(1, "Register name is required"),
  address: z.string()
    .refine((val) => !isNaN(parseInt(val, 10)), "Address must be a number")
    .refine((val) => parseInt(val, 10) >= 0, "Address must be a non-negative number"),
  length: z.string()
    .refine((val) => !isNaN(parseInt(val, 10)), "Length must be a number")
    .refine((val) => parseInt(val, 10) > 0, "Length must be a positive number"),
  scaleFactor: z.string()
    .refine((val) => !isNaN(parseInt(val, 10)), "Scale factor must be a number"),
  decimalPoint: z.string()
    .refine((val) => !isNaN(parseInt(val, 10)), "Decimal point must be a number")
    .refine((val) => parseInt(val, 10) >= 0, "Decimal point must be a non-negative number"),
  byteOrder: z.string().default("AB CD"),
  dataType: z.string().default("float")
});

// Form schema for device creation
const deviceSchema = z.object({
  name: z.string().min(1, "Device name is required"),
  ipAddress: z.string()
    .min(1, "IP address is required")
    .regex(/^(\d{1,3}\.){3}\d{1,3}$/, "Invalid IP address format"),
  port: z.string()
    .refine((val) => !isNaN(parseInt(val, 10)), "Port must be a number")
    .refine((val) => parseInt(val, 10) > 0, "Port must be a positive number"),
  slaveId: z.string()
    .refine((val) => !isNaN(parseInt(val, 10)), "Slave ID must be a number")
    .refine((val) => parseInt(val, 10) > 0, "Slave ID must be a positive number"),
  deviceType: z.enum(["tcp", "rtu"]).default("tcp"),
  enabled: z.boolean().default(true),
});

type DeviceFormValues = z.infer<typeof deviceSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

interface AddDeviceModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AddDeviceModal({ open, onClose }: AddDeviceModalProps) {
  const { toast } = useToast();
  const [deviceType, setDeviceType] = useState<"tcp" | "rtu">("tcp");
  const [registers, setRegisters] = useState<RegisterFormValues[]>([
    {
      name: "Setpoint", // Setpoint register is required for device control
      address: "1013",
      length: "2",
      scaleFactor: "1",
      decimalPoint: "2",
      byteOrder: "AB CD",
      dataType: "float"
    },
    {
      name: "Temperature",
      address: "2613",
      length: "2",
      scaleFactor: "1",
      decimalPoint: "2",
      byteOrder: "AB CD",
      dataType: "float"
    }
  ]);
  const [enabled, setEnabled] = useState(true);
  
  const form = useForm<DeviceFormValues>({
    resolver: zodResolver(deviceSchema),
    defaultValues: {
      name: "",
      ipAddress: "192.168.1.100",
      port: "502",
      slaveId: "1",
      deviceType: "tcp",
      enabled: true
    },
  });
  
  const addRegister = () => {
    // Define common register types for Circutor devices
    const registerTemplates = [
      {
        name: "Temperature",
        address: "2613",
        length: "2",
        scaleFactor: "1",
        decimalPoint: "2",
        byteOrder: "AB CD",
        dataType: "float"
      },
      {
        name: "Humidity",
        address: "2615",
        length: "2",
        scaleFactor: "1",
        decimalPoint: "2",
        byteOrder: "AB CD",
        dataType: "float"
      },
      {
        name: "Power",
        address: "2713",
        length: "2",
        scaleFactor: "1",
        decimalPoint: "2",
        byteOrder: "AB CD",
        dataType: "float"
      },
      {
        name: "Energy",
        address: "2715",
        length: "2",
        scaleFactor: "1",
        decimalPoint: "2",
        byteOrder: "AB CD",
        dataType: "float"
      }
    ];
    
    // Get a template that isn't already in the registers array
    let template = registerTemplates.find(t => 
      !registers.some(r => r.name.toLowerCase() === t.name.toLowerCase())
    );
    
    // If all templates are used, default to temperature with modified name
    if (!template) {
      const usedCount = registers.filter(r => 
        r.name.toLowerCase().includes('temperature')
      ).length;
      
      template = {
        name: `Temperature ${usedCount + 1}`,
        address: "2613",
        length: "2",
        scaleFactor: "1",
        decimalPoint: "2",
        byteOrder: "AB CD",
        dataType: "float"
      };
    }
    
    setRegisters([...registers, template]);
  };
  
  const removeRegister = (index: number) => {
    const updatedRegisters = [...registers];
    updatedRegisters.splice(index, 1);
    setRegisters(updatedRegisters);
  };
  
  const updateRegister = (index: number, field: keyof RegisterFormValues, value: string) => {
    const updatedRegisters = [...registers];
    updatedRegisters[index] = {
      ...updatedRegisters[index],
      [field]: value
    };
    setRegisters(updatedRegisters);
  };
  
  // Check if a register named 'setpoint' exists in the registers array
  const hasSetpointRegister = () => {
    return registers.some(reg => 
      reg.name.toLowerCase().trim() === 'setpoint'
    );
  };
  
  // Validate that all registers must have the required fields filled
  const validateRegisters = () => {
    if (registers.length === 0) {
      return "At least one register is required";
    }
    
    if (!hasSetpointRegister()) {
      return "A register named 'setpoint' is required for device control";
    }
    
    for (const reg of registers) {
      if (!reg.name || reg.name.trim() === '') {
        return "All registers must have a name";
      }
      if (!reg.address || reg.address.trim() === '') {
        return "All registers must have an address";
      }
      if (!reg.length || reg.length.trim() === '') {
        return "All registers must have a length";
      }
    }
    
    return null;
  };
  
  const onSubmit = async (data: DeviceFormValues) => {
    try {
      // Validate registers
      const validationError = validateRegisters();
      if (validationError) {
        toast({
          title: "Validation Error",
          description: validationError,
          variant: "destructive",
        });
        return;
      }
      
      // Convert registers to the correct format
      const formattedRegisters = registers.map(register => ({
        name: register.name,
        address: parseInt(register.address, 10),
        length: parseInt(register.length, 10),
        scaleFactor: parseInt(register.scaleFactor, 10),
        decimalPoint: parseInt(register.decimalPoint, 10),
        byteOrder: register.byteOrder,
        dataType: register.dataType
      }));
      
      // Convert device frontend model to backend model
      const deviceData = {
        name: data.name,
        // Map ipAddress to ip for the backend
        ip: data.ipAddress,
        ipAddress: data.ipAddress, // Include both for compatibility
        port: parseInt(data.port, 10),
        slaveId: parseInt(data.slaveId, 10),
        deviceType: data.deviceType,
        enabled: enabled,
        control: 'central',
        status: false,
        registers: formattedRegisters
      };
      
      // Submit to the API
      await apiRequest("POST", "/api/devices", deviceData);
      
      // Show success message
      toast({
        title: "Device Added",
        description: `${data.name} has been added successfully.`,
      });
      
      // Invalidate queries to refresh device list
      queryClient.invalidateQueries({ queryKey: ["/api/devices"] });
      
      // Close the modal
      onClose();
      
      // Reset the form and state
      form.reset();
      setRegisters([
        {
          name: "Setpoint", // Setpoint register is required for device control
          address: "1013",
          length: "2",
          scaleFactor: "1",
          decimalPoint: "2",
          byteOrder: "AB CD",
          dataType: "float"
        },
        {
          name: "Temperature",
          address: "2613",
          length: "2",
          scaleFactor: "1",
          decimalPoint: "2",
          byteOrder: "AB CD",
          dataType: "float"
        }
      ]);
      setEnabled(true);
    } catch (error) {
      console.error("Error adding device:", error);
      toast({
        title: "Error",
        description: "Failed to add the device. Please check the form and try again.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card max-w-4xl">
        <DialogHeader>
          <DialogTitle>Add New Device</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Device Type Selection - RadioGroup */}
            <div className="flex items-center justify-end space-x-2">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <input 
                    type="radio" 
                    id="tcp" 
                    name="deviceType"
                    checked={deviceType === "tcp"}
                    onChange={() => setDeviceType("tcp")}
                  />
                  <Label htmlFor="tcp">Modbus TCP</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input 
                    type="radio" 
                    id="rtu" 
                    name="deviceType"
                    checked={deviceType === "rtu"}
                    onChange={() => setDeviceType("rtu")}
                  />
                  <Label htmlFor="rtu">Modbus RTU</Label>
                </div>
              </div>
            </div>
            
            {/* Basic Device Info - Grid Layout */}
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-1">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Device Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter device name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="col-span-1">
                <FormField
                  control={form.control}
                  name="slaveId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slave ID</FormLabel>
                      <FormControl>
                        <Input placeholder="1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="col-span-1">
                <FormField
                  control={form.control}
                  name="ipAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IP Address</FormLabel>
                      <FormControl>
                        <Input placeholder="192.168.1.191" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="col-span-1">
                <FormField
                  control={form.control}
                  name="port"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Port</FormLabel>
                      <FormControl>
                        <Input placeholder="502" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            {/* Register Settings Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-medium">Register Settings</h3>
                <Button 
                  type="button" 
                  onClick={addRegister}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  Add Register
                </Button>
              </div>
              
              {/* Register Table Header */}
              <div className="grid grid-cols-7 gap-2 mb-2 text-sm font-medium">
                <div className="col-span-1">Name</div>
                <div className="col-span-1">Address</div>
                <div className="col-span-1">Length</div>
                <div className="col-span-1">Scale Factor</div>
                <div className="col-span-1">Decimal Point</div>
                <div className="col-span-1">Byte Order</div>
                <div className="col-span-1">Action</div>
              </div>
              
              {/* Register Rows */}
              {registers.map((register, index) => (
                <div key={index} className="grid grid-cols-7 gap-2 mb-2">
                  <div className="col-span-1">
                    <Input
                      value={register.name}
                      onChange={(e) => updateRegister(index, 'name', e.target.value)}
                      placeholder="Temperature"
                    />
                  </div>
                  <div className="col-span-1">
                    <Input
                      value={register.address}
                      onChange={(e) => updateRegister(index, 'address', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="col-span-1">
                    <Input
                      value={register.length}
                      onChange={(e) => updateRegister(index, 'length', e.target.value)}
                      placeholder="1"
                    />
                  </div>
                  <div className="col-span-1">
                    <Input
                      value={register.scaleFactor}
                      onChange={(e) => updateRegister(index, 'scaleFactor', e.target.value)}
                      placeholder="1"
                    />
                  </div>
                  <div className="col-span-1">
                    <Input
                      value={register.decimalPoint}
                      onChange={(e) => updateRegister(index, 'decimalPoint', e.target.value)}
                      placeholder="2"
                    />
                  </div>
                  <div className="col-span-1">
                    <Select
                      value={register.byteOrder}
                      onValueChange={(value) => updateRegister(index, 'byteOrder', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select byte order" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AB CD">AB CD</SelectItem>
                        <SelectItem value="CD AB">CD AB</SelectItem>
                        <SelectItem value="BA DC">BA DC</SelectItem>
                        <SelectItem value="DC BA">DC BA</SelectItem>
                        <SelectItem value="big">Big Endian</SelectItem>
                        <SelectItem value="little">Little Endian</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-1">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      className="text-red-500 hover:text-red-700 p-2 h-10"
                      onClick={() => removeRegister(index)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Enable Device Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="enableDevice" 
                checked={enabled}
                onCheckedChange={(checked) => setEnabled(checked as boolean)}
              />
              <label
                htmlFor="enableDevice"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Enable device
              </label>
            </div>
            
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-500 hover:bg-blue-600">
                Save Device
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
