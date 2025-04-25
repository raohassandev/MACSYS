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
import { Device } from "@shared/schema";

// Form schema for writing to a register
const writeRegisterSchema = z.object({
  newValue: z.string().min(1, "Value is required"),
});

type WriteRegisterFormValues = z.infer<typeof writeRegisterSchema>;

interface WriteRegisterModalProps {
  device: Device;
  register: string;
  address: number;
  currentValue: string;
  onClose: () => void;
}

export default function WriteRegisterModal({
  device,
  register,
  address,
  currentValue,
  onClose,
}: WriteRegisterModalProps) {
  const { toast } = useToast();
  
  const form = useForm<WriteRegisterFormValues>({
    resolver: zodResolver(writeRegisterSchema),
    defaultValues: {
      newValue: currentValue.toString().replace(/[^0-9.-]/g, ''), // Strip units to get numeric value
    },
  });
  
  const onSubmit = async (data: WriteRegisterFormValues) => {
    try {
      // Submit to the API
      await apiRequest("POST", "/api/devices/write", {
        device: device.name,
        register,
        value: data.newValue,
      });
      
      // Show success message
      toast({
        title: "Value Written",
        description: `Successfully wrote ${data.newValue} to ${register} on device ${device.name}`,
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/devices/${device.id}/latest`] });
      
      // Close the modal
      onClose();
    } catch (error) {
      console.error("Error writing to register:", error);
      toast({
        title: "Error",
        description: "Failed to write the value. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-card">
        <DialogHeader>
          <DialogTitle>Write to Register</DialogTitle>
        </DialogHeader>
        
        <div className="mb-4">
          <p className="text-gray-400 text-sm">
            Device: <span className="text-foreground">{device.name}</span>
          </p>
          <p className="text-gray-400 text-sm">
            Register: <span className="text-foreground">{register} ({address})</span>
          </p>
          <p className="text-gray-400 text-sm">
            Current Value: <span className="text-foreground">{currentValue}</span>
          </p>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="newValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Value</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter new value" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Write Value</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
