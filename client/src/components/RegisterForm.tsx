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
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Form schema for register
const registerSchema = z.object({
  name: z.string().min(1, "Register name is required"),
  address: z.string().transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val >= 0, "Address must be a non-negative number"),
  length: z.string().transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0, "Length must be a positive number"),
  scaleFactor: z.string().transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val), "Scale factor must be a number").optional(),
  decimalPoint: z.string().transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val >= 0, "Decimal point must be a non-negative number").optional(),
  dataType: z.string().optional(),
  byteOrder: z.string().optional(),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  open: boolean;
  onClose: () => void;
  deviceId: string;
  existingRegister?: RegisterFormValues;
  isEdit?: boolean;
}

export default function RegisterForm({ 
  open, 
  onClose, 
  deviceId, 
  existingRegister,
  isEdit = false 
}: RegisterFormProps) {
  const { toast } = useToast();
  
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: existingRegister || {
      name: "",
      address: "0",
      length: "2",
      scaleFactor: "1",
      decimalPoint: "2",
      dataType: "float",
      byteOrder: "AB CD",
    },
  });
  
  const onSubmit = async (data: RegisterFormValues) => {
    try {
      // Prepare the register data
      const registerData = {
        name: data.name,
        address: data.address,
        length: data.length,
        scaleFactor: data.scaleFactor,
        decimalPoint: data.decimalPoint,
        dataType: data.dataType || "float",
        byteOrder: data.byteOrder || "AB CD"
      };
      
      // If this is an edit, we need to update the register
      if (isEdit && existingRegister) {
        await apiRequest("PUT", `/api/devices/${deviceId}/registers/${existingRegister.name}`, registerData);
        
        toast({
          title: "Register Updated",
          description: `${data.name} has been updated successfully.`,
        });
      } else {
        // Otherwise, create a new register
        await apiRequest("POST", `/api/devices/${deviceId}/registers`, registerData);
        
        toast({
          title: "Register Added",
          description: `${data.name} has been added to the device.`,
        });
      }
      
      // Invalidate queries to refresh device list and register list
      queryClient.invalidateQueries({ queryKey: ["/api/devices"] });
      queryClient.invalidateQueries({ queryKey: [`/api/devices/${deviceId}/registers`] });
      
      // Close the modal
      onClose();
      
      // Reset the form
      form.reset();
    } catch (error) {
      console.error("Error saving register:", error);
      toast({
        title: "Error",
        description: "Failed to save the register. Please check the form and try again.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit" : "Add"} Register</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Register Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Temperature" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="0" {...field} />
                  </FormControl>
                  <FormDescription>
                    The memory address of the register in the device
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="length"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Length</FormLabel>
                  <FormControl>
                    <Input placeholder="2" {...field} />
                  </FormControl>
                  <FormDescription>
                    Number of registers to read (2 for float values)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="scaleFactor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Scale Factor</FormLabel>
                  <FormControl>
                    <Input placeholder="1" {...field} />
                  </FormControl>
                  <FormDescription>
                    Value will be multiplied by this factor
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="decimalPoint"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Decimal Point</FormLabel>
                  <FormControl>
                    <Input placeholder="2" {...field} />
                  </FormControl>
                  <FormDescription>
                    Number of decimal places to display
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="dataType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select data type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="float">Float</SelectItem>
                      <SelectItem value="int16">Int16</SelectItem>
                      <SelectItem value="uint16">UInt16</SelectItem>
                      <SelectItem value="int32">Int32</SelectItem>
                      <SelectItem value="uint32">UInt32</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The data type of the register value
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="byteOrder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Byte Order</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select byte order" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="AB CD">AB CD</SelectItem>
                      <SelectItem value="CD AB">CD AB</SelectItem>
                      <SelectItem value="BA DC">BA DC</SelectItem>
                      <SelectItem value="DC BA">DC BA</SelectItem>
                      <SelectItem value="big">Big Endian</SelectItem>
                      <SelectItem value="little">Little Endian</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    For Circutor devices, use "AB CD"
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">{isEdit ? "Update" : "Add"} Register</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}