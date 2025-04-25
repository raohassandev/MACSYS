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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

// Form schema for device creation
const deviceSchema = z.object({
  name: z.string().min(1, "Device name is required"),
  ipAddress: z.string()
    .min(1, "IP address is required")
    .regex(/^(\d{1,3}\.){3}\d{1,3}$/, "Invalid IP address format"),
  port: z.string().transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0 && val <= 65535, "Port must be between 1 and 65535"),
  slaveId: z.string().transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0, "Slave ID must be a positive number"),
  deviceType: z.enum(["PLC", "RTU"]),
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
    },
  });
  
  const onSubmit = async (data: DeviceFormValues) => {
    try {
      data.deviceType = deviceType;
      
      // Submit to the API
      await apiRequest("POST", "/api/devices", data);
      
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
        description: "Failed to add the device. Please try again.",
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
