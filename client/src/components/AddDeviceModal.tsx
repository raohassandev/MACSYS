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
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

// Schema for a register
const registerSchema = z.object({
  name: z.string().min(1, "Register name is required"),
  address: z.string().transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val >= 0, "Address must be a non-negative number"),
  length: z.string().transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0, "Length must be a positive number"),
  dataType: z.string().optional(),
  byteOrder: z.string().optional()
});

// Form schema for device creation
const deviceSchema = z.object({
  name: z.string().min(1, "Device name is required"),
  ipAddress: z.string()
    .min(1, "IP address is required")
    .regex(/^(\d{1,3}\.){3}\d{1,3}$/, "Invalid IP address format"),
  port: z.string(),
  slaveId: z.string(),
  deviceType: z.enum(["PLC", "RTU"]),
  setpointAddress: z.string(),
  setpointLength: z.string(),
  setpointByteOrder: z.string().optional(),
});

type DeviceFormValues = z.infer<typeof deviceSchema>;

interface AddDeviceModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AddDeviceModal({ open, onClose }: AddDeviceModalProps) {
  const { toast } = useToast();
  const [deviceType, setDeviceType] = useState<"PLC" | "RTU">("PLC");
  
  const form = useForm<DeviceFormValues>({
    resolver: zodResolver(deviceSchema),
    defaultValues: {
      name: "",
      ipAddress: "192.168.1.",
      port: "502",
      slaveId: "1",
      deviceType: "PLC",
      setpointAddress: "1013",
      setpointLength: "2",
      setpointByteOrder: "AB CD",
    },
  });
  
  const onSubmit = async (data: DeviceFormValues) => {
    try {
      data.deviceType = deviceType;
      
      // Convert device frontend model to backend model
      const deviceData = {
        name: data.name,
        // Map ipAddress to ip for the backend
        ip: data.ipAddress,
        port: data.port,
        slaveId: data.slaveId,
        deviceType: data.deviceType,
        enabled: true,
        control: 'central',
        status: false,
        // Add the required Setpoint register to satisfy validation
        registers: [{
          name: "Setpoint",
          address: data.setpointAddress,
          length: data.setpointLength,
          byteOrder: data.setpointByteOrder || "AB CD",
          dataType: "float"
        }]
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
      
      // Reset the form
      form.reset();
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
      <DialogContent className="bg-card">
        <DialogHeader>
          <DialogTitle>Add New Device</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
            
            <FormField
              control={form.control}
              name="ipAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>IP Address</FormLabel>
                  <FormControl>
                    <Input placeholder="192.168.1.x" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
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
            
            <FormItem>
              <FormLabel>Device Type</FormLabel>
              <div className="flex">
                <Button
                  type="button"
                  variant={deviceType === "PLC" ? "default" : "outline"}
                  className="flex-1 mr-2"
                  onClick={() => setDeviceType("PLC")}
                >
                  PLC
                </Button>
                <Button
                  type="button"
                  variant={deviceType === "RTU" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setDeviceType("RTU")}
                >
                  RTU
                </Button>
              </div>
            </FormItem>
            
            <div className="border rounded-md p-4 space-y-4 mt-4">
              <h3 className="text-lg font-medium mb-2">Setpoint Register (Required)</h3>
              <FormDescription>
                Every device must have at least one register named "Setpoint"
              </FormDescription>
              
              <FormField
                control={form.control}
                name="setpointAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Setpoint Address</FormLabel>
                    <FormControl>
                      <Input placeholder="1013" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="setpointLength"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Setpoint Length</FormLabel>
                    <FormControl>
                      <Input placeholder="2" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="setpointByteOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Byte Order</FormLabel>
                    <FormControl>
                      <Input placeholder="AB CD" {...field} />
                    </FormControl>
                    <FormDescription>
                      For Circutor devices, use "AB CD"
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Add Device</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
